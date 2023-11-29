import * as THREE from "three";
import Store3D from "../homeIndex";
import MemoryManager from "../lib/memoryManager";
import { deepDispose } from "../lib/deepDispose";

import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

import { createCSS2DObject, createDom } from "../lib/CSSObject";

export default class MeasureDistance {
  /**
   * @param {Store3D} param
   */
  constructor(param) {
    this.scene = param.scene;
    this.domElement = param.domElement;
    this.raycaster = param.raycaster;
    this.getIntersection = param.getIntersection;

    this.memoryManager = new MemoryManager();
  }
  load(isActive) {
    if (!isActive) {
      this.dispose();
      return;
    }

    document.body.style.cursor = "crosshair";

    this.label = null;
    this.points = [];
    this.distance = 0;
    this.totalDistance = 0;
    this.dashLine = null;
    this.line = null;
    this.nextPoint = null;
    this.canDrawLine = true;

    this.bindMousedown = this.onMousedown.bind(this);
    this.bindMousemove = this.onMousemove.bind(this);
    this.bindKeydown = this.onKeydown.bind(this);
    this.domElement.addEventListener("mousemove", this.bindMousemove);
    this.domElement.addEventListener("mousedown", this.bindMousedown);
    document.addEventListener("keydown", this.bindKeydown);
  }
  onKeydown(event) {
    if (event.key === "Escape") {
      this.dispose();
      this.load(true);
    }
  }
  onMousedown(event) {
    //
    if (!this.intersectObjects) return;

    //
    if (!this.canDrawLine) return;

    // 右键结束绘制
    if (event.button === 2) {
      if (this.points.length === 0) return;
      document.body.style.cursor = "auto";
      this.canDrawLine = false;
    }

    //
    if (this.points.length > 0 && this.canDrawLine) {
      this.totalDistance += this.distance;
      this.distance = 0;
    }

    //
    let intersects;
    if (Array.isArray(this.intersectObjects)) {
      intersects = this.raycaster.intersectObjects(this.intersectObjects);
    } else {
      intersects = this.raycaster.intersectObject(this.intersectObjects);
    }

    if (intersects.length === 0) return;

    let point = intersects[0].point;

    // 判断是否绘制完成
    if (this.canDrawLine) this.points.push(point);

    // 创建显示距离的DOM元素
    if (!this.label) {
      this.createLabel();
    }

    // 更新测距线段
    if (this.points.length > 1) {
      this.updateLine();
    }

    if (!this.canDrawLine) {
      this.scene.remove(this.dashLine);
      return;
    }

    // 虚线
    if (this.dashLine) {
      this.updateDashLine(point);
    } else {
      this.createDashLine(point);
    }
  }

  onMousemove(event) {
    event.preventDefault();

    if (!this.canDrawLine) return;
    if (!this.intersectObjects) return;

    let intersects;
    if (Array.isArray(this.intersectObjects)) {
      intersects = this.raycaster.intersectObjects(this.intersectObjects);
    } else {
      intersects = this.raycaster.intersectObject(this.intersectObjects);
    }
    if (intersects.length === 0) return;

    this.nextPoint = intersects[0].point;

    if (this.points.length > 0) {
      const pre = this.points[this.points.length - 1];
      const v0 = new THREE.Vector3(pre.x, pre.y, pre.z);
      const v1 = new THREE.Vector3(this.nextPoint.x, this.nextPoint.y, this.nextPoint.z);
      this.distance = v0.distanceTo(v1);
    }

    if (!this.dashLine) return;
    this.updateDashLine(this.nextPoint);
  }

  updateLine() {
    if (this.line) {
      deepDispose(this.line);
      this.scene.remove(this.line);
    }
    this.line = this.createLine(this.points);
    this.scene.add(this.line);
    this.memoryManager.track(this.line);
  }

  updateDashLine(point) {
    const { x, y, z } = point;
    const positions = this.dashLine.geometry.attributes.instanceStart.data.array;
    this.dashLine.geometry.setPositions([positions[3], positions[4], positions[5], x, y, z]);
  }

  createLabel() {
    const dom = createDom({ innerText: "0m", id: "dis_label" });
    const obj2d = createCSS2DObject(dom, "CSS2DObject");

    this.label = new THREE.Object3D();
    this.label.position.copy(point);
    this.label.add(obj2d);
    this.scene.add(this.label);
    this.memoryManager.track(this.label);

    this.resultDom = dom;
  }
  createDashLine(point) {
    const geometry = new LineGeometry().setPositions([point.x, point.y, point.z, point.x, point.y, point.z]);
    const material = new LineMaterial({
      color: 0xff5fff,
      linewidth: 5,
      transparent: true,
      depthTest: false,
    });

    material.resolution.set(window.innerWidth, window.innerHeight);

    this.dashLine = new Line2(geometry, material);

    this.dashLine.frustumCulled = false;
    this.dashLine.renderOrder = 10;
    this.scene.add(this.dashLine);
    this.memoryManager.track(this.dashLine);
  }
  createLine(points) {
    let positions = [];
    for (let i = 0; i < points.length; i++) {
      positions.push(points[i].x, points[i].y, points[i].z);
    }

    // const geometry = new THREE.BufferGeometry().setFromPoints([...points]);
    const geometry_ = new LineGeometry().setPositions(positions);
    const material = new LineMaterial({
      color: 0xfff000,
      linewidth: 5,
      transparent: true,
      depthTest: false,
    });

    material.resolution.set(window.innerWidth, window.innerHeight);
    const line = new Line2(geometry_, material);

    line.onBeforeRender = () => {
      if (this.label) {
        let p = new THREE.Vector3().copy(points[points.length - 1]);
        p.y += 20;
        this.label.position.copy(p);
        this.resultDom.innerText = this.totalDistance.toFixed(2) + "m";
      }
    };
    return line;
  }

  dispose() {
    if (!this.memoryManager) return;
    this.resultDom &&
      Store3D.css2dRenderer.domElement.hasChildNodes(this.resultDom) &&
      Store3D.css2dRenderer.domElement.removeChild(this.resultDom);

    this.domElement.removeEventListener("mousedown", this.bindMousedown);
    this.domElement.removeEventListener("mousemove", this.bindMousemove);
    document.removeEventListener("keydown", this.bindKeydown);

    this.memoryManager.dispose();

    this.memoryManager = null;
    this.scene = null;
    this.domElement = null;
    this.intersectObjects = null;
    this.raycaster = null;
    this.points = null;
    this.distance = null;
    this.totalDistance = null;
    this.dashLine = null;
    this.line = null;
    this.nextPoint = null;
    this.canDrawLine = null;
    this.bindMousemove = null;
    this.bindMousedown = null;
    this.bindKeydown = null;
    this.label = null;
    this.resultDom = null;

    document.body.style.cursor = "auto";
  }
}
