import * as THREE from "three";
import { DrawLineHelper } from "../lib/drawLineHelper";
import { Store3D } from "../three";
import { generateUUID } from "three/src/math/MathUtils";

export class TestHelper {
  /**
   * @param {Store3D} param
   */
  constructor(param) {
    // 测试平面
    this.plane = createPlane();
    param.scene.add(this.plane);

    param.addMousedownListener();
    param.addMousemoveListener();

    this.helper = new DrawLineHelper();
    param.scene.add(this.helper.line, this.helper.moveLine);

    this.mousemove_uuid = generateUUID();
    this.mouseup_uuid = generateUUID();
    param.onmousemoveQueue.set(this.mousemove_uuid, this.onmousemove.bind(this));
    param.onmouseupQueue.set(this.mouseup_uuid, this.onmouseup.bind(this));

    // lkaiqi
  }

  onmousemove(event, param) {
    const intersections = this.getIntersection(param.raycaster, this.plane);
    if (intersections.length) {
      this.select = intersections[0].point;
      this.helper.updateMoveLine(this.select);
    } else {
      this.select = null;
    }
  }

  onmouseup(event, param) {
    if (this.select) {
      this.helper.addPoint(this.select);
    }
  }

  /**
   * @description
   * @param { THREE.Object3D[] | THREE.Object3D } object - 射线检测对象
   * @returns { THREE.Intersection[] }
   */
  getIntersection(raycaster, object) {
    if (Array.isArray(object)) {
      return raycaster.intersectObjects(object);
    } else {
      return raycaster.intersectObject(object);
    }
  }
}

function createPlane() {
  const geometry = new THREE.PlaneGeometry(100, 100);
  geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  return new THREE.Mesh(geometry, material);
}
