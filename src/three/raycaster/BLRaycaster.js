import { Raycaster, PerspectiveCamera, Object3D, Vector2 } from "three";

const mousedownVec2 = new Vector2();
const mouseupVec2 = new Vector2();

export class BLRaycaster {
  /**@type {Raycaster} THREE.raycaster */
  raycaster;
  /**@type {PerspectiveCamera} THREE.PerspectiveCamera */
  camera;
  /**@type {HTMLElement} THREE.PerspectiveCamera */
  element;
  /**@type {Vector2} THREE.Vector2 */
  mouse;
  /**@type {import("three").Intersection[]} THREE.import("three").Intersection[] */
  intersects;
  /**@type {Map<Object3D | Object3D[], ( intersects: import("three").Intersection[] ) => void>} 射线检测回调函数，参数为射线拾取结果 */
  callbackMap;

  /**
   * @param {PerspectiveCamera} camera
   * @param {HTMLElement} element
   */
  constructor(camera, element) {
    this.raycaster = new Raycaster();
    this.mouse = new Vector2();
    this.camera = camera;
    this.element = element;
    this.intersects = [];
    this.callbackMap = new Map();
  }
  /**
   * 设置相机和DOM对象，请在清除已存在的射线检测后调用此方法。
   * @param {PerspectiveCamera} camera
   * @param {HTMLElement} element
   */
  set(camera, element) {
    this.camera = camera;
    this.element = element;
  }

  /**
   * @param {"click"|"dblclick"|"mousemove"} type
   * @param { Object3D | Object3D[]} object
   * @param {( intersects: import("three").Intersection[] ) => void  } callback
   * @typedef {Object} result
   * @property {() => void} clear 在取消射线检测时，调用此函数
   * @property {import("three").Intersection[]} intersects 射线拾取结果数组
   * @returns {result}
   */
  bindEvent(type, object, callback) {
    let clear;
    if (type === "click") {
      clear = this.handleClick(object, callback);
    } else if (type === "dblclick") {
      clear = this.handleDblclick(object, callback);
    } else if (type === "mousemove") {
      clear = this.handleMousemove(object, callback);
    } else {
      console.error("射线检测只支持双击，单击，鼠标移动");
      return;
    }
    return {
      clear,
      intersects: this.intersects,
    };
  }

  /**
   * @param { Object3D | Object3D[]} object 检测对象
   * @param { (intersects: import("three").Intersection[] ) => void} callback 射线检测回调，参数为检测结果
   * @returns { ()=>void } clear 停止射线检测时，调用此方法
   */
  handleClick(object, callback) {
    if (callback) this.callbackMap.set(object, callback);
    const bindPointerup = event => this.onpointerup(event, object);

    this.element.addEventListener("pointerdown", this.onpointerdown);

    this.element.addEventListener("pointerup", bindPointerup);

    const clear = () => {
      this.element.removeEventListener("pointerdown", this.onpointerdown);
      this.element.removeEventListener("pointerup", bindPointerup);
      this.clear(object);
    };

    return clear;
  }

  /**
   * @param { Object3D | Object3D[]} object 检测对象
   * @param { (intersects: import("three").Intersection[] ) => void} callback 射线检测回调，参数为检测结果
   * @returns { ()=>void } clear 停止射线检测时，调用此方法
   */
  handleMousemove(object, callback) {
    if (callback) this.callbackMap.set(object, callback);
    const bindPointermove = event => this.getIntersects(event, object);
    this.element.addEventListener("pointermove", bindPointermove);

    const clear = () => {
      this.element.removeEventListener("pointermove", bindPointermove);
      this.clear(object);
    };

    return clear;
  }
  /**
   * @param { Object3D | Object3D[]} object 检测对象
   * @param { (intersects: import("three").Intersection[] ) => void} callback 射线检测回调，参数为检测结果
   * @returns { ()=>void } clear 停止射线检测时，调用此方法
   */
  handleDblclick(object, callback) {
    if (callback) this.callbackMap.set(object, callback);

    const bindDblclick = event => this.getIntersects(event, object);
    this.element.addEventListener("dblclick", bindDblclick);

    const clear = () => {
      this.element.removeEventListener("dblclick", bindDblclick);
      this.clear(object);
    };

    return clear;
  }

  onpointerdown(event) {
    mousedownVec2.set(event.screenX, event.screenY);
  }

  onpointerup(event, object) {
    mouseupVec2.set(event.screenX, event.screenY);
    this.intersects.length = 0;
    if (mousedownVec2.equals(mouseupVec2)) {
      this.getIntersects(event, object);
      this.callbackMap.get(object)(this.intersects);
    }
  }

  clear(object) {
    this.callbackMap.delete(object);
    this.intersects.length = 0;
  }

  getIntersects(event, object) {
    this.intersects.length = 0;
    const { left, top, width, height } = this.element.getBoundingClientRect();

    this.mouse.x = ((event.clientX - left) / width) * 2 - 1;
    this.mouse.y = -((event.clientY - top) / height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (Array.isArray(object)) {
      this.raycaster.intersectObjects(object, true, this.intersects);
    } else {
      this.raycaster.intersectObject(object, true, this.intersects);
    }
    this.callbackMap.get(object)(this.intersects);
  }
}
