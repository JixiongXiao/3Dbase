import { Vector3, Vector2 } from "three";

import { vec3ToNum, checkLinesCross } from "../utils";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

const _geometry = new LineGeometry();
const material = new LineMaterial({ color: 0xff00ff, linewidth: 4, depthTest: true, transparent: true });
material.resolution.set(window.innerWidth, window.innerHeight);

/**
 * @description 画线辅助工具
 */
export class DrawLineHelper {
  points;
  line;
  moveLine;
  bindKeyup;
  count;

  constructor() {
    this.points = [];
    this.count = 0;
    this.line = new Line2(undefined, material);
    this.moveLine = new Line2(new LineGeometry().setPositions([0, 0, 0, 0, 0, 0]), material);
    this.moveLine.visible = false;

    this.addEvents();
  }

  /**
   * @description 开启监听事件
   */
  addEvents() {
    const scope = this;
    this.bindKeyup = this.onkeyup.bind(scope);
    document.body.addEventListener("keyup", this.bindKeyup);
  }

  /**
   * @description “Escape” 撤销上一步操作
   */
  onkeyup(event) {
    if (event.key === "Escape") {
      this.deletePoint();
      // this.dispose();
    }
  }

  /**
   * @description 添加坐标点
   * @param {Vector3} point
   */
  addPoint(point) {
    if (checkLinesCross(this.vec3ToVec2(this.points), this.vec3ToVec2(point))) {
      console.log("相交了,操作无效");
      return;
    }
    this.points.push(point);
    this.count++;
    this.updateLine();
    this.updateMoveLine(point);
  }

  /**
   * @description vector3[] => vector2[]
   * @param { Vector3[] } points - 输入数组
   * @returns { number[] }
   */
  vec3ToVec2(points) {
    if (Array.isArray(points)) {
      const results = [];
      points.forEach(point => results.push(new Vector2(point.x, point.z)));
      return results;
    } else {
      return new Vector2(points.x, points.z);
    }
  }

  deletePoint() {
    if (this.points.length) {
      this.points.pop();
      this.count--;
      this.updateLine();
      this.updateMoveLine();
    }
  }

  onmousemove(point) {
    if (!point) return;
    this.updateMoveLine(point);
  }

  onresize() {
    material.resolution.set(window.innerWidth, window.innerHeight);
  }

  updateMoveLine(point) {
    if (this.count) {
      const { x, y, z } = this.points[this.count - 1];
      if (point === undefined) {
        const positions = this.moveLine.geometry.attributes.instanceStart.data.array;
        this.moveLine.geometry.setPositions([x, y, z, positions[3], positions[4], positions[5]]);
      } else {
        this.moveLine.geometry.setPositions([x, y, z, point.x, point.y, point.z]);
        this.moveLine.visible = true;
      }
    } else {
      this.moveLine.visible = false;
    }
  }

  updateLine() {
    this.line.geometry.dispose();
    if (this.count >= 2) {
      const geometry = new LineGeometry().setPositions(vec3ToNum(this.points));
      this.line.geometry = geometry;
    } else {
      this.line.geometry = _geometry;
    }
  }

  dispose() {
    this.line.geometry.dispose();
    this.line.material.dispose();
    this.line.removeFromParent();

    this.moveLine.geometry.dispose();
    this.moveLine.material.dispose();
    this.moveLine.removeFromParent();

    this.count = 0;
    this.points.length = 0;

    // this.line = new Line2(undefined, material);
    // this.moveLine = new Line2(new LineGeometry().setPositions([0, 0, 0, 0, 0, 0]), material);
    // this.moveLine.visible = false;
  }

  close() {
    document.body.removeEventListener("keyup", this.bindKeyup);
    this.bindKeyup = null;
  }
}
