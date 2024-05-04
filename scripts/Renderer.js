import * as THREE from 'three';
import { worldCamera } from '../constants/world';

export class Renderer extends THREE.WebGLRenderer {
  constructor({canvas}){
    super({ canvas });

    this.setSize(worldCamera.width, worldCamera.height)
    this.setPixelRatio(window.devicePixelRatio)
    this.setClearColor(0x80a0e0);
    this.shadowMap.enabled = true;
    this.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  updateSize(){
    this.setSize(worldCamera.width, worldCamera.height)
  }
}

export default Renderer;