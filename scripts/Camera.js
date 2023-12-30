import * as THREE from 'three';

import { worldCamera } from '../constants/world';

export class Camera extends THREE.PerspectiveCamera {
  constructor({scene, gui }){
    super(worldCamera.fieldOfView, worldCamera.aspectRatio, 1, 1000);
    this.gui = gui
    this.scene = scene;

    this.toStartPosition()
    this.addGuiControls()
    this.scene.add(this)
  }

  toStartPosition(){
    this.position.z = 10
    this.position.y = 50
    this.position.x = 200
  }

  addGuiControls(){
    // add folder
    const controls = this.gui.addFolder('Camera').close()

    // add controls to folder
    const guiPosition = controls.addFolder('Position')
    guiPosition.add(this.position, 'x', -50, 500, 0.1).name('Position x')
    guiPosition.add(this.position, 'y', -50, 500, 0.1).name('Position y')
    guiPosition.add(this.position, 'z', -50, 500, 0.1).name('Position z')

    const guiRotation = controls.addFolder('Rotation')
    guiRotation.add(this.rotation, 'x', -Math.PI, Math.PI, 0.01).name('Rotation x')
    guiRotation.add(this.rotation, 'y', -Math.PI, Math.PI, 0.01).name('Rotation y')
    guiRotation.add(this.rotation, 'z', -Math.PI, Math.PI, 0.01).name('Rotation z')

    // These below don't work
    const guiView = controls.addFolder('View')
    guiView.add(this, 'fov', 0, 180, 0.1).name('Field of View')
    guiView.add(this, 'near', 0, 100, 0.1).name('Near')
    guiView.add(this, 'far', 0, 100, 0.1).name('Far')
    guiView.onChange(() => {
      this.updateProjectionMatrix()
    })
  }

  updateSize(){
    this.aspect = worldCamera.aspectRatio
    this.updateProjectionMatrix()
  }
}

export default Camera;