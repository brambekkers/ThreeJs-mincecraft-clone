import * as THREE from 'three'
import { SimplexNoise as Noise } from 'three/examples/jsm/math/SimplexNoise.js'

import RNG from './RNG.js'

import { blocks, resources } from '../constants/blocks.js'

const geometry = new THREE.BoxGeometry(1, 1, 1)

export class WorldChunk extends THREE.Group {
  data = []
  constructor({ chunkData, noiseParams, scene, blockOptions, userData}) {
    super()
    this.loaded = false
    this.scene = scene
    this.chunkData = chunkData
    this.noiseParams = noiseParams
    this.blockOptions = blockOptions
    this.userData = userData
    
    this.size = chunkData
    this.world = []
    

    this.generate()
    this.scene.add(this)
  }

  generate() {
    const seed = new RNG(this.noiseParams.seed)
    this.initializeTerrain()
    this.generateResources(seed)
    this.generateTerrain(seed)
    this.generateMeshes()
    this.loaded = true
  }

  initializeTerrain() {
    this.data = []
    for (let x = 0; x < this.size.width; x++) {
      this.data[x] = []
      for (let y = 0; y < this.size.height; y++) {
        this.data[x][y] = []
        for (let z = 0; z < this.size.width; z++) {
          this.data[x][y].push({
            id: blocks.empty.id,
            instanceId: null
          })
        }
      }
    }
  }

  generateResources(seed) {
    const simplex = new Noise(seed)
    resources.forEach((resource) => {
      for (let x = 0; x < this.size.width; x++) {
        for (let y = 0; y < this.size.height; y++) {
          for (let z = 0; z < this.size.width; z++) {
            const value = simplex.noise3d(
              (this.position.x + x) / resource.scale.x, 
              (this.position.y + y) / resource.scale.y, 
              (this.position.z + z) / resource.scale.z
            )
            if (value > resource.scarcity) {
              this.setBlockId({ x, y, z }, resource.id)
            }
          }
        }
      }
    })
  }

  generateTerrain(seed) {
    const simplex = new Noise(seed)
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {
        // Calculate the noise value
        const value = simplex.noise(
          (this.position.x + x) / this.noiseParams.terrain.scale, 
          (this.position.z + z) / this.noiseParams.terrain.scale
        )
        // Scale the noise value based on the terrain magnitude and offset
        const scaledNoise = this.noiseParams.terrain.magnitude + this.noiseParams.terrain.offset * value

        // Calculate the terrain height
        // clamp the height between 0 and the max height
        let height = Math.floor(this.size.height * scaledNoise)
        height = Math.max(0, Math.min(height, this.size.height - 1))

        // Fill in all blocks at or below the terrain height
        for (let y = 0; y < this.size.height; y++) {
          const blockId = this.getBlock({ x, y, z }).id
          const isEmpty = blockId === blocks.empty.id
          // If the block is empty and below the terrain height, fill it in with dirt
          if (y < height && isEmpty) this.setBlockId({ x, y, z }, blocks.dirt.id)
          // If the block is at the terrain height, fill it in with grass
          else if (y === height) this.setBlockId({ x, y, z }, blocks.grass.id)
          // If the block is above the terrain height, make it empty
          else if (y > height) this.setBlockId({ x, y, z }, blocks.empty.id)
        }
      }
    }
  }

  generateMeshes() {
    this.clear()
    const maxMeshCount = this.size.width * this.size.height * this.size.width

    // Create a lookup table where the key is the block id
    const meshes = {}
    Object.values(blocks)
      .filter(({ id }) => id !== blocks.empty.id)
      .forEach(({ material, name, id }) => {
        const mesh = new THREE.InstancedMesh(geometry, material, maxMeshCount)
        mesh.name = name
        mesh.count = 0
        mesh.castShadow = true
        mesh.receiveShadow = true
        meshes[id] = mesh
      })

    const matrix = new THREE.Matrix4()
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock({ x, y, z }).id
          const isEmpty = blockId === blocks.empty.id
          if (isEmpty) continue

          const mesh = meshes[blockId]
          const instanceId = mesh.count

          if (this.isBlockObstructed({ x, y, z })) continue
          matrix.setPosition(x, y, z)
          mesh.setMatrixAt(instanceId, matrix)
          this.setBlockInstanceId({ x, y, z }, instanceId)
          mesh.count++
        }
      }
    }
    this.add(...Object.values(meshes))
  }

  getBlock({ x, y, z }) {
    if (!this.inBounds({ x, y, z })) return null
    return this.data[x][y][z]
  }

  setBlockId({ x, y, z }, id) {
    if (!this.inBounds({ x, y, z })) return
    this.data[x][y][z].id = id
  }

  setBlockInstanceId({ x, y, z }, instanceId) {
    if (!this.inBounds({ x, y, z })) return
    this.data[x][y][z].instanceId = instanceId
  }

  inBounds({ x, y, z }) {
    return x >= 0 && x < this.size.width && y >= 0 && y < this.size.height && z >= 0 && z < this.size.width
  }

  isBlockObstructed({ x, y, z }) {
    const up = this.getBlock({ x, y: y + 1, z })?.id ?? blocks.empty.id
    const down = this.getBlock({ x, y: y - 1, z })?.id ?? blocks.empty.id
    const left = this.getBlock({ x: x - 1, y, z })?.id ?? blocks.empty.id
    const right = this.getBlock({ x: x + 1, y, z })?.id ?? blocks.empty.id
    const front = this.getBlock({ x, y, z: z + 1 })?.id ?? blocks.empty.id
    const back = this.getBlock({ x, y, z: z - 1 })?.id ?? blocks.empty.id

    return (
      up !== blocks.empty.id &&
      down !== blocks.empty.id &&
      left !== blocks.empty.id &&
      right !== blocks.empty.id &&
      front !== blocks.empty.id &&
      back !== blocks.empty.id
    )
  }


  disposeInstances() {
    this.traverse((block) => {
      if(block.dispose) block.dispose()
    })
    this.clear()
  }


}

export default WorldChunk
