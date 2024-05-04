import * as THREE from 'three'

import WorldChunk from './WorldChunk.js'

import { chunkData } from '../constants/world.js'
import { noiseParams } from '../constants/noise.js'
import { resources } from '../constants/blocks.js'

export class World extends THREE.Group {
  constructor({ scene, gui }) {
    super()

    this.asyncLoad = true
    this.gui = gui
    this.scene = scene

    this.blockOptions = {
      isWireFrame: false
    }

    this.generate()
    this.addGui()
    this.scene.add(this)
  }

  generate() {
    this.disposeChunks()
    for (let x = -chunkData.drawDistance; x <= chunkData.drawDistance; x++) {
      for (let z = -chunkData.drawDistance; z <= chunkData.drawDistance; z++) {
        this.generateChunk({ x, z })
      }
    }
  }

  update(player) {
    const visibleChunks = this.getVisibleChunks(player)
    const chunksToAdd = this.getChunksToAdd(visibleChunks)
    this.removeUnusedChunks(visibleChunks)

    chunksToAdd.forEach((chunk) => {
      this.generateChunk(chunk)
    })
  }

  getVisibleChunks(player) {
    const visibleChunks = []
    const { chunk } = this.worldToChunkCoords(player.position)

    for (let x = chunk.x - chunkData.drawDistance; x <= chunk.x + chunkData.drawDistance; x++) {
      for (let z = chunk.z - chunkData.drawDistance; z <= chunk.z + chunkData.drawDistance; z++) {
        visibleChunks.push({ x, z })
      }
    }

    return visibleChunks
  }

  getChunksToAdd(visibleChunks) {
    return visibleChunks.filter((chunk) => {
      return !this.getChunk(chunk)
    })
  }

  removeUnusedChunks(visibleChunks) {
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData
      return !visibleChunks.find((visibleChunk) => visibleChunk.x === x && visibleChunk.z === z)
    })

    chunksToRemove.forEach((chunk) => {
      chunk.disposeInstances()
      this.remove(chunk)
    })
  }

  generateChunk({ x, z }) {
    const chunk = new WorldChunk({
      scene: this.scene,
      chunkData,
      noiseParams,
      blockOptions: this.blockOptions,
      userData: { x, z }
    })
    chunk.position.set(x * chunkData.width, 0, z * chunkData.width)

    if (this.asyncLoad) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 })
    } else chunk.generate()
    this.add(chunk)
  }

  getBlock({ x, y, z }) {
    const coords = this.worldToChunkCoords({ x, y, z })
    const chunk = this.getChunk(coords.chunk)
    if (!chunk || !chunk.loaded) return null
    return chunk.getBlock(coords.block)
  }

  worldToChunkCoords({ x, y, z }) {
    const chunkCoords = {
      x: Math.floor(x / chunkData.width),
      z: Math.floor(z / chunkData.width)
    }

    const blockCoords = {
      x: x - chunkData.width * chunkCoords.x,
      y,
      z: z - chunkData.width * chunkCoords.z
    }

    return { chunk: chunkCoords, block: blockCoords }
  }

  getChunk({ x, z }) {
    return this.children.find((chunk) => {
      return chunk.userData.x === x && chunk.userData.z === z
    })
  }

  disposeChunks() {
    this.traverse((chunk) => {
      if (!chunk.disposeInstances) return
      chunk.disposeInstances()
    })
    this.clear()
  }

  addGui() {
    const guiWorld = this.gui.addFolder('World')
    // Wireframe
    guiWorld
      .add(this.blockOptions, 'isWireFrame')
      .name('Wireframe')
      .onChange((val) => {
        this.traverse((chunk) => {
          chunk.traverse((mesh) => {
            mesh.material.wireframe = val
          })
        })
        // this.children.forEach((mesh) => {
        //   mesh.material.wireframe = val
        // })
      })

    // Size
    const guiSize = guiWorld.addFolder('Size').close()
    guiSize.add(chunkData, 'drawDistance', 0, 5, 1)

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
      guiResourceScale.add(resource.scale, 'x', 10, 100, 1).name('X Scale')
      guiResourceScale.add(resource.scale, 'y', 10, 100, 1).name('Y Scale')
      guiResourceScale.add(resource.scale, 'z', 10, 100, 1).name('Z Scale')

      guiResources.onChange(() => {
        this.generate()
      })
    })

    // Terrain Roughness
    guiWorld.add(this, 'generate').name('Generate')
  }
}

export default World
