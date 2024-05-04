import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'  

import { player } from '../constants/player.js'
import { worldCamera, chunkData } from '../constants/world.js';

export class Player {
  #worldVelocity = new THREE.Vector3();

  constructor({ scene, gui }) {
    this.scene = scene
    this.gui = gui
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 100)
    this.controls = new PointerLockControls(this.camera, document.body)
    this.input = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.cameraHelper = new THREE.CameraHelper(this.camera)

    // sizes
    this.radius= player.radius
    this.height = player.height
    this.jumpSpeed = player.jumpSpeed
    this.maxSpeed = player.maxSpeed
    this.onGround = false

    this.setupCamera()
    this.addEventListeners()
    this.addBounds()
    this.addGui()
  }
  setupCamera() {
    this.camera.position.set(chunkData.width / 2, chunkData.height + 1, chunkData.width / 2)
    this.scene.add(this.camera)
    this.cameraHelper.visible = false
    this.scene.add(this.cameraHelper)
  }

  addBounds() {
    const geometry = new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16)
    const material = new THREE.MeshLambertMaterial({ color: 0x222222, wireframe: true })
    this.boundsHelper = new THREE.Mesh(geometry, material)
    this.scene.add(this.boundsHelper)
  }

  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.position)
    this.boundsHelper.position.y -= this.height / 2
  }

  
  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  addEventListeners() {
    document.addEventListener('keydown', this.onKeyDown.bind(this))
    document.addEventListener('keyup', this.onKeyUp.bind(this))
  }

  onKeyDown(event) {
    if(!this.controls.isLocked) {
      this.controls.lock()
    }

    switch(event.code) {
      case 'KeyW':
        this.input.z = player.maxSpeed
        break
      case 'KeyS':
        this.input.z = -player.maxSpeed
        break
      case 'KeyA':	
        this.input.x = -player.maxSpeed
        break
      case 'KeyD':
        this.input.x = player.maxSpeed
        break
      case 'Space':
        if(this.onGround) {
          this.velocity.y += player.jumpSpeed
          this.onGround = false
        }
        break
    }
  }

  onKeyUp(event) {
    switch(event.code) {
      case 'KeyW':
        this.input.z = 0
        break
      case 'KeyS':
        this.input.z = 0
        break
      case 'KeyA':	
        this.input.x = 0
        break
      case 'KeyD':
        this.input.x = 0
        break
    }
  }

  applyInputs(deltaTime) {
    if(!this.controls.isLocked) return;
    this.velocity.x = this.input.x
    this.velocity.z = this.input.z
    this.controls.moveRight(this.velocity.x * deltaTime)
    this.controls.moveForward(this.velocity.z * deltaTime)
    this.position.y += this.velocity.y * deltaTime

    if (this.position.y < 0) {
      this.position.y = 0;
      this.velocity.y = 0;
    }

    document.querySelector('#player-position').innerHTML = this.toString()
  }

  get position() {
    return this.camera.position
  }

  addGui() {
    const guiPlayer = this.gui.addFolder('Player').close()
    const guiCamera = guiPlayer.addFolder('Camera').close()
    guiCamera.add(this.cameraHelper, 'visible').name('Show player camera')

    guiCamera.add(this.camera, 'fov', 20, 140, 1).name('Field of view')
    guiCamera.add(this.camera, 'near', 0.001, 3, 0.01).name('Near draw distance')
    guiCamera.add(this.camera, 'far', 0, 100, 0.1).name('Far draw distance')
    guiCamera.onChange(() => this.camera.updateProjectionMatrix())

    const guiMovement = guiPlayer.addFolder('Movement').close()
    guiMovement.add(player, 'maxSpeed', 1, 100, 1).name('Max Speed')
  }

  toString() {
    let string = ''
    string += `X: ${this.position.x.toFixed(2)}\n `;
    string += `Y: ${this.position.y.toFixed(2)}\n `;
    string += `Z: ${this.position.z.toFixed(2)}\n`;
    return string
  }

  updateSize(){
    this.camera.aspect = worldCamera.aspectRatio
    this.camera.updateProjectionMatrix()
  }
}

export default Player
