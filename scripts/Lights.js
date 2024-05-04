import * as THREE from 'three'

export class Lights {
  constructor({ scene }) {
    this.scene = scene
    this.sun = new THREE.DirectionalLight()

    this.sunPosition = new THREE.Vector3(50, 50, 50)
  }

  setupLights() {
    this.sun.position.set(this.sunPosition)
    this.sun.castShadow = true
    this.sun.shadow.camera.top = 100
    this.sun.shadow.camera.bottom = -100
    this.sun.shadow.camera.left = -100
    this.sun.shadow.camera.right = 100
    this.sun.shadow.camera.near = 0.1
    this.sun.shadow.camera.far = 200

    this.sun.shadow.bias = -0.0005

    this.sun.shadow.mapSize = new THREE.Vector2(2048, 2048)
    this.scene.add(this.sun)
    this.scene.add(this.sun.target)

    // const shadowHelper = new THREE.CameraHelper(sun.shadow.camera)
    // this.scene.add(shadowHelper)

    const ambient = new THREE.AmbientLight()
    ambient.intensity = 0.1
    this.scene.add(ambient)
  }

  update(player) {
    this.sun.position.copy(player.position)
    this.sun.position.add(this.sunPosition)
    this.sun.target.position.copy(player.position)

  }
}

export default Lights
