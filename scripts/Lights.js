import * as THREE from 'three'

export class Lights {
  constructor({ scene }) {
    this.scene = scene
  }

  setupLights() {
    const sun = new THREE.DirectionalLight()
    sun.position.set(50, 50, 50)
    sun.castShadow = true
    sun.shadow.camera.top = 70
    sun.shadow.camera.bottom = -70
    sun.shadow.camera.left = -70
    sun.shadow.camera.right = 70

    sun.shadow.bias = -0.0005

    sun.shadow.mapSize = new THREE.Vector2(2048, 2048)
    this.scene.add(sun)

    // const shadowHelper = new THREE.CameraHelper(sun.shadow.camera)
    // this.scene.add(shadowHelper)

    const ambient = new THREE.AmbientLight()
    ambient.intensity = 0.1
    this.scene.add(ambient)
  }
}

export default Lights
