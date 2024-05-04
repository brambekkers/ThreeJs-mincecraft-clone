import * as THREE from 'three'
import GUI from 'lil-gui'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { chunkData } from './constants/world.js'

// scripts
import Scene from './scripts/Scene.js'
import Camera from './scripts/Camera.js'
import Renderer from './scripts/Renderer.js'
import World from './scripts/World.js'
import Lights from './scripts/Lights.js'
import Player from './scripts/Player.js'
import Physics from './scripts/Physics.js'

import { worldCamera } from './constants/world.js'

// Debug
const gui = new GUI()
const stats = new Stats()
document.body.appendChild(stats.domElement)

const canvas = document.querySelector('#app')

// Create Scene, Camera, renderer
const scene = new Scene()

// Fog
const minFog = chunkData.width * chunkData.drawDistance - chunkData.width
const maxFog = chunkData.width * chunkData.drawDistance - (chunkData.width / 2)
scene.fog = new THREE.Fog(0x80a0e0, minFog, maxFog)
const orbitCamera = new Camera({ scene, gui })
const renderer = new Renderer({ canvas })
const lights = new Lights({ scene })
const player = new Player({ scene, gui })
const physics = new Physics({ scene, gui })

const world = new World({
  scene,
  gui
})

new OrbitControls(orbitCamera, renderer.domElement)

// Axes helper
const axesHelper = new THREE.AxesHelper(5)
scene.add(axesHelper)

// animation
let previousTime = performance.now()

function animate() {
  let currentTime = performance.now()
  let deltaTime = (currentTime - previousTime)  / 1000 // in seconds

  requestAnimationFrame(animate);

  // update
  physics.update(deltaTime, player, world)
  world.update(player)
  lights.update(player)

  const currentCamera = player.controls.isLocked ? player.camera : orbitCamera
  renderer.render(scene, currentCamera);
  stats.update()

  previousTime = currentTime
}

// resize
window.addEventListener('resize', () => {
  worldCamera.width = window.innerWidth
  worldCamera.height = window.innerHeight
  worldCamera.aspectRatio = window.innerWidth / window.innerHeight
  player.updateSize()

  orbitCamera.updateSize()
  renderer.updateSize()
})

// fullscreen
// window.addEventListener('dblclick', () => {
//   const fsElement = document.fullscreenElement || document.webkitFullscreenElement;
//   const requestFS = canvas.requestFullscreen || canvas.webkitRequestFullscreen;
//   const exitFS = document.exitFullscreen || document.webkitExitFullscreen;
//   !fsElement ? requestFS.call(canvas) : exitFS.call(document);
// });

lights.setupLights()
animate()
