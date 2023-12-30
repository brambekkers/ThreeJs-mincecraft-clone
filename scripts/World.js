import * as THREE from 'three'
import { SimplexNoise as Noise } from 'three/examples/jsm/math/SimplexNoise.js'

import RNG from './RNG.js'

import { noiseParams } from '../constants/noise.js'
import { blocks, resources } from '../constants/blocks.js'
import { worldSize } from '../constants/world.js'

const geometry = new THREE.BoxGeometry(1, 1, 1)

export class World extends THREE.Group {
  data = []
  constructor({ scene, gui}) {
    super()
    this.scene = scene
    this.gui = gui
    this.blockOptions = {
      isWireFrame: false
    }
    this.size = worldSize
    this.world = []
    

    this.generate()
    this.addGui()
    this.scene.add(this)
  }

  generate() {
    const seed = new RNG(noiseParams.seed)
    this.initializeTerrain()
    this.generateResources(seed)
    this.generateTerrain(seed)
    this.generateMeshes()
  }

  initializeTerrain() {
    this.data = []
    for (let x = 0; x < this.size.x; x++) {
      this.data[x] = []
      for (let y = 0; y < this.size.y; y++) {
        this.data[x][y] = []
        for (let z = 0; z < this.size.z; z++) {
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
      for (let x = 0; x < this.size.x; x++) {
        for (let y = 0; y < this.size.y; y++) {
          for (let z = 0; z < this.size.z; z++) {
            const value = simplex.noise3d(x / resource.scale.x, y / resource.scale.y, z / resource.scale.z)
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
    for (let x = 0; x < this.size.x; x++) {
      for (let z = 0; z < this.size.z; z++) {
        // Calculate the noise value
        const value = simplex.noise(x / noiseParams.terrain.scale, z / noiseParams.terrain.scale)
        // Scale the noise value based on the terrain magnitude and offset
        const scaledNoise = noiseParams.terrain.magnitude + noiseParams.terrain.offset * value

        // Calculate the terrain height
        // clamp the height between 0 and the max height
        let height = Math.floor(this.size.y * scaledNoise)
        height = Math.max(0, Math.min(height, this.size.y - 1))

        // Fill in all blocks at or below the terrain height
        for (let y = 0; y < this.size.y; y++) {
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
    const maxMeshCount = this.size.x * this.size.y * this.size.z

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
    for (let x = 0; x < this.size.x; x++) {
      for (let y = 0; y < this.size.y; y++) {
        for (let z = 0; z < this.size.z; z++) {
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
    return x >= 0 && x < this.size.x && y >= 0 && y < this.size.y && z >= 0 && z < this.size.z
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

  addGui() {
    const guiWorld = this.gui.addFolder('World')
    // Wireframe
    guiWorld
      .add(this.blockOptions, 'isWireFrame')
      .name('Wireframe')
      .onChange((val) => {
        this.children.forEach((mesh) => {
          mesh.material.wireframe = val
        })
      })

    // Size
    const guiSize = guiWorld.addFolder('Size').close()
    guiSize.add(this.size, 'x', 10, this.size.x * 3, 1).name('Width')
    guiSize.add(this.size, 'z', 10, this.size.z * 3, 1).name('Depth')
    guiSize.add(this.size, 'y', 2, this.size.y * 3, 1).name('Height')
    guiSize.onChange(() => {
      this.generate()
    })

    const guiTerrain = guiWorld.addFolder('Terrain')
    guiTerrain.add(noiseParams, 'seed').name('Seed')
    guiTerrain.add(noiseParams.terrain, 'scale', 1, 100, 1).name('Scale')
    guiTerrain.add(noiseParams.terrain, 'magnitude', 0, 1, 0.01).name('Magnitude')
    guiTerrain.add(noiseParams.terrain, 'offset', 0, 2, 0.01).name('Offset')
    guiTerrain.onChange(() => {
      this.generate()
    })

    const guiResources = guiWorld.addFolder(`Resources`)
    resources.forEach((resource) => {
      const guiResource = guiResources.addFolder(`Resource: ${resource.name}`).close()
      guiResource.add(resource, 'scarcity', 0, 1).name('Scarcity')

      const guiResourceScale = guiResource.addFolder('Resources')
      guiResourceScale.add(resource.scale, 'x', 10, 100).name('X Scale')
      guiResourceScale.add(resource.scale, 'y', 10, 100).name('Y Scale')
      guiResourceScale.add(resource.scale, 'z', 10, 100).name('Z Scale')

      guiResources.onChange(() => {
        this.generate()
      })
    })

    // Terrain Roughness
    guiWorld.add(this, 'generate').name('Generate')
  }
}

export default World
