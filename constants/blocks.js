import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader()

const loadTexture = (path) => {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

const textures = {
  grass: loadTexture('../images/minecraft/grass_block_top1.png'),
  grassSide: loadTexture('../images/minecraft/grass_block_side.png'),
  dirt: loadTexture('../images/minecraft/dirt.png'),
  stone: loadTexture('../images/minecraft/stone.png'),
  coalOre: loadTexture('../images/minecraft/coal_ore.png'),
  ironOre: loadTexture('../images/minecraft/iron_ore.png')
}

export const blocks = {
  empty: {
    id: 0,
    name: 'empty'
  },
  grass: {
    id: 1,
    name: 'grass',
    color: 0x559020,
    material: [
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // right
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // left
      new THREE.MeshLambertMaterial({ map: textures.grass }), // top
      new THREE.MeshLambertMaterial({ map: textures.dirt }), // bottom
      new THREE.MeshLambertMaterial({ map: textures.grassSide }), // front
      new THREE.MeshLambertMaterial({ map: textures.grassSide }) // back
    ]
  },
  dirt: {
    id: 2,
    name: 'dirt',
    color: 0x807020,
    material: new THREE.MeshLambertMaterial({ map: textures.dirt })
  },
  stone: {
    id: 3,
    name: 'stone',
    color: 0x808080,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.5,
    material: new THREE.MeshLambertMaterial({ map: textures.stone })

  },
  coalOre: {
    id: 4,
    name: 'coalOre',
    color: 0x202020,
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8,
    material: new THREE.MeshLambertMaterial({ map: textures.coalOre })

  },
  ironOre: {
    id: 5,
    name: 'ironOre',
    color: 0x806060,
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.9,
    material: new THREE.MeshLambertMaterial({ map: textures.ironOre })
  }
}

export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre]

export default blocks
