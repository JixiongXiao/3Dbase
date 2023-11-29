import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import { Lake } from "../lib/blMeshes";
import { merge } from "../lib/merge";
import { shaderModify } from "../shader/shaderModify";
import Store3D from "../homeIndex";
import { createInstanceMesh } from "../lib/InstanceMesh";

// 模型加载以及模型处理
export default class ModelManager {
  /** @param {Store3D} param*/
  constructor(param) {
    this.scene = param.scene;
    /**@type {THREE.PerspectiveCamera} */
    this.camera = param.camera;
    this.lightingPattern = param.weatherSystem.lightingPattern;
    this.onmousemoveQueue = param.onmousemoveQueue;
    this.onRenderQueue = param.onRenderQueue;
    this.onRenderQueue.set("modelUpdate", this.update.bind(this));
    this.main = param;

    this.loader = new GLTFLoader().setPath("./models/");

    this.modelList = [];
    this.otherModelList = [];

    this.needUpdate = [];
    this.dblclickArray = [];

    this.timer = null;

    if (!param.isListeningMousemove) param.addMousemoveListener();
  }

  loadModel() {
    /**@type {Promise[]} 记录每一个模型加载的promise回调 */
    const promises = [];
    const mergeArr = [];

    this.modelList.forEach(path => {
      const promise = this.loader.loadAsync(path).then(gltf => this.onLoaded(gltf, path));
      promises.push(promise);
    });

    Promise.all(promises).then(this.afterLoad.bind(this));
    return Promise.all(promises);
  }
  /** 模型加载完成，对模型进行处理
   * @param {import("three/examples/jsm/loaders/GLTFLoader").GLTF} gltf
   */
  onLoaded(gltf, path) {}
  afterLoad() {
    this.loadOther();
    // 模型测试代码 todo
    // this.test();
  }
  test() {
    const geometry = new THREE.PlaneGeometry(130, 130);
    const material = new THREE.MeshStandardMaterial({ color: 0xfff00, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    shaderModify(mesh, { shader: "pipeFlow", intensity: 3 });
    mesh.rotateX(-Math.PI / 2);
    this.scene.add(mesh);
  }
  /**
   * @param {THREE.Object3D} model
   * @param {()=>void} setAttribute 设置属性
   */
  loadInstancedModel(model, setAttribute, scale) {
    const group = new THREE.Group();

    const instanceMap = {};
    const instancePositionMap = {};
    const instanceRotationMap = {};

    const v = new THREE.Vector3();

    model.traverse(child => {
      if (child instanceof THREE.Group && child.name) {
        instanceMap[child.name] = child;
      } else if (child instanceof THREE.Mesh && child.parent.name === "") {
        if (!child.name.includes("_")) {
          instanceMap[child.name] = child;
        } else {
          child.getWorldPosition(v);
          const key = child.name.split("_")[0];
          instancePositionMap[key] = instancePositionMap[key] || [];
          instancePositionMap[key].push(v.clone());
          instanceRotationMap[key] = instanceRotationMap[key] || [];
          instanceRotationMap[key].push(child.rotation);
        }
      }
    });

    Object.keys(instanceMap).forEach(key => {
      const instance = instanceMap[key];
      const ins = createInstanceMesh(instance, instancePositionMap[key], instanceRotationMap[key], scale);
      group.add(ins);
      if (ins instanceof THREE.Group) {
        ins.traverse(setAttribute);
      } else {
        setAttribute(ins);
      }
    });
    return group;
  }

  loadOther() {
    this.otherModelList.forEach(path => {
      this.loader.loadAsync(path).then(gltf => this.onLoaded(gltf, path));
    });
  }

  /**@param {THREE.Material} material  */
  setTransparent(material) {
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.forceSinglePass = true;
    material.alphaTest = 0.4;
  }

  /**
   * @description 设置漫游相机的状态，true 开启漫游相机，false关闭漫游相机
   * @param {boolean} bool
   */
  setCameraState(bool) {
    if (!this.useCameraState) return;

    const { update, changeCameraState, uuid } = this.useCameraState();
    if (bool) {
      this.onRenderQueue.set(uuid, update);
      this.onmousemoveQueue.set(uuid, changeCameraState);
      changeCameraState(undefined, this.main);
    } else {
      this.onRenderQueue.delete(uuid);
      this.onmousemoveQueue.delete(uuid);
      changeCameraState(undefined, this.main);
      clearTimeout(this.timer);
    }
  }
  /**@param {Store3D} 如果有需要实时渲染的功能，传入主文件渲染函数进行渲染  */
  update(param) {
    this.needUpdate.forEach(e => e.update());
  }
}
