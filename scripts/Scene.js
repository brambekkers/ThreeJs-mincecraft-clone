import * as THREE from 'three';

export class Scene extends THREE.Scene {
  constructor(){
    super();
    this.backgroundColor = 0xcccccc;
    this.setBackground(this.backgroundColor);
  }

  setBackground(color){
    this.background = new THREE.Color(color)
  }
}

export default Scene;