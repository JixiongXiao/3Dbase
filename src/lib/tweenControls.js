import TWEEN from "three/examples/jsm/libs/tween.module";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Store3D from "../homeIndex";

const vec3$1 = new Vector3();

export class TweenControls {
  /** @param {Store3D} param*/
  constructor(param) {
    this.camera = param.camera;
    this.controls = param.controls;
  }

  lerpTo(position, distance = 100, time = 1000, offset = new THREE.Vector3()) {
    const _distance = this.camera.position.distanceTo(position);
    const alpha = (_distance - distance) / _distance;
    vec3$1.lerpVectors(this.camera.position, position, alpha);
    vec3$1.add(offset);
    this.changeTo({ start: this.camera.position, end: vec3$1, duration: time });
    this.changeTo({ start: this.controls.target, end: position, duration: time });
  }

  changeTo(options) {
    const { start, end, duration, onUpdate, onComplete, onStart } = options;

    if (!duration || !end || !start) return;

    return new TWEEN.Tween(start).to(end, duration).onStart(onStart).onUpdate(onUpdate).onComplete(onComplete).start();
  }
}
