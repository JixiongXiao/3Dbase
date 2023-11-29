import * as THREE from "three";
import * as TWEEN from "three/examples/jsm/libs/tween.module";
import MemoryManager from "../lib/memoryManager";
import Stats from "three/examples/jsm/libs/stats.module";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { Postprocessing } from "../components/postprocessing";
import { BLRaycaster } from "./raycaster/BLRaycaster";

import { directionalLight, ambientLight } from "./light";

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.Raycaster.prototype.firstHitOnly = true;

THREE.Object3D.prototype.deleteSelf = function () {
  const memory = new MemoryManager();
  memory.track(this);
  memory.dispose(true);
};

//
const { innerWidth, innerHeight, devicePixelRatio } = window;
//
const RendererParameters = {
  antialias: true,
  logarithmicDepthBuffer: true,
};
//
const CameraParameters = {
  fov: 50,
  aspect: innerWidth / innerHeight,
  near: 0.01,
  far: 10000,
};
// camera limit box
const CAMERA_BOX = new THREE.Box3(new THREE.Vector3(-5000, -5000, -5000), new THREE.Vector3(5000, 5000, 5000));
// controls limit box
const CONTROLS_BOX = new THREE.Box3(new THREE.Vector3(-4500, -4500, -4500), new THREE.Vector3(4500, 4500, 4500));
// camera position & controls target
const CAMERA_POSITION = new THREE.Vector3(-235.18943294822643, 259.3374469402037, -443.61372288008323);
const CONTROLS_TARGET = new THREE.Vector3(11.49594005870037, 15.170516119491515, -228.4356882305518);

const onmousedownVector = new THREE.Vector2();
const onmouseupVector = new THREE.Vector2();

export class Base extends THREE.EventDispatcher {
  /**@type { THREE.Scene } 场景 */
  #scene;
  /**@type { THREE.WebGLRenderer } 渲染器 */
  #renderer;
  /**@type { THREE.PerspectiveCamera } 相机 */
  #camera;
  /**@type { OrbitControls } 相机控制器 */
  #controls;
  /**@type { CSS2DRenderer } 2D渲染器 */
  #css2dRenderer;
  /**@type { CSS3DRenderer } 2D渲染器 */
  #css3dRenderer;
  /**@type { HTMLElement } DOM对象 */
  #domElement;
  /**@type { Postprocessing } 后处理 */
  #postprocessing;
  /**@type { THREE.Clock } 时钟 */
  #clock;
  /**@type { BLRaycaster } 射线 */
  #raycaster;
  /**@type { THREE.Vector2} 鼠标位置 */
  #mouse;
  /**@type { THREE.AmbientLight} 环境光 */
  #ambientLight;
  /**@type { THREE.DirectionalLight} 平行光 */
  #directionLight;
  /**@type { Stats} 性能监视器 */
  #stats;
  /**@type { Map<string, ( width: number, height: number ) => void>} 浏览器窗口尺寸发生改变时，执行的任务队列 */
  #onresizeQueue;
  /**@type { Map<string, (event:MouseEvent, param: this ) => void>} 鼠标点击事件发生时，执行的任务队列 */
  #onmousedownQueue;
  /**@type { Map<string, (event:MouseEvent, param: this ) => void>} 鼠标移动事件发生时，执行的任务队列 */
  #onmousemoveQueue;
  /**@type { Map<string, (event:MouseEvent, param: this ) => void>} 鼠标弹起事件发生时，执行的任务队列 */
  #onmouseupQueue;
  /**@type { Map<string, (event:MouseEvent, param: this ) => void>} 鼠标双击事件发生时，执行的任务队列 */
  #onDblClickQueue;
  /**@type { Map<string, ( param: this ) => void>} 渲染时，执行的任务队列 */
  #onRenderQueue;
  /**@type { Map<string, ( param: this ) => void>} 相机视角发生改变时，执行的任务队列 */
  #onCameraChangeQueue;
  #bindResize;
  /**@type { (  this: HTMLCanvasElement, event: MouseEvent ) => void  } */
  #bindMousemove;
  /**@type { (  this: HTMLCanvasElement, event: MouseEvent ) => void  } */
  #bindMousedown;
  /**@type { (  this: HTMLCanvasElement, event: MouseEvent ) => void  } */
  #bindDblclick;
  /**@type { ( event: any ) => void  } */
  #bindCameraChange;
  /**@type { Boolean } 是否正在监听鼠标点击事件 */
  #isListeningMousedown;
  /**@type { Boolean } 是否正在监听鼠标移动事件 */
  #isListeningMousemove;
  /**@type { Boolean } 是否正在监听相机视角改变事件 */
  #isListeningCamera;
  /**@type { Boolean } 是否正在监听鼠标双击事件 */
  #isListeningDblclick;
  /**@type {  Map<string, ( param: this ) => void>} 渲染时，执行的任务队列 */
  get onRenderQueue() {
    return this.#onRenderQueue;
  }

  get scene() {
    return this.#scene;
  }

  set scene(value) {
    if (!(value instanceof THREE.Scene)) return;
    this.#scene = value;

    if (this.#postprocessing) {
      this.#postprocessing.composer.setMainScene(value);
    }
  }

  get camera() {
    return this.#camera;
  }

  set camera(value) {
    if (!(value instanceof THREE.Camera)) return;
    this.#camera = value;

    if (this.#postprocessing) {
      this.#postprocessing.composer.setMainCamera(value);
    }
  }

  get renderer() {
    return this.#renderer;
  }

  get controls() {
    return this.#controls;
  }

  get domElement() {
    return this.#domElement;
  }

  get delta() {
    return this.#clock.getDelta();
  }

  get elapsedTime() {
    return {
      value: this.#clock.getElapsedTime(),
    };
  }

  get raycaster() {
    return this.#raycaster;
  }

  get mouse() {
    return this.#mouse;
  }

  get css2dRenderer() {
    return this.#css2dRenderer;
  }

  get ambientLight() {
    return this.#ambientLight;
  }

  get directionLight() {
    return this.#directionLight;
  }

  get onresizeQueue() {
    return this.#onresizeQueue;
  }

  get onmousedownQueue() {
    return this.#onmousedownQueue;
  }

  get onmouseupQueue() {
    return this.#onmouseupQueue;
  }

  get onDblClickQueue() {
    return this.#onDblClickQueue;
  }

  get onmousemoveQueue() {
    return this.#onmousemoveQueue;
  }

  get onCameraChangeQueue() {
    return this.#onCameraChangeQueue;
  }

  get postprocessing() {
    return this.#postprocessing;
  }

  get isListeningCamera() {
    return this.#isListeningCamera;
  }

  get isListeningMousedown() {
    return this.#isListeningMousedown;
  }

  get isListeningMousemove() {
    return this.#isListeningMousemove;
  }
  get isListeningDblclick() {
    return this.#isListeningDblclick;
  }
  constructor(id) {
    super();

    this.#clock = new THREE.Clock();

    this.#mouse = new THREE.Vector2();

    this.#onresizeQueue = new Map();
    this.#onRenderQueue = new Map();
    this.#onmousedownQueue = new Map();
    this.#onmousemoveQueue = new Map();
    this.#onmouseupQueue = new Map();
    this.#onCameraChangeQueue = new Map();
    this.#onDblClickQueue = new Map();

    this.#isListeningCamera = false;
    this.#isListeningMousedown = false;
    this.#isListeningMousemove = false;
    this.#isListeningDblclick = false;

    this.#domElement = document.getElementById(id);

    this.renderEnabled = true;

    this.#initCamera();
    this.#initScene();
    this.#initRenderer(RendererParameters);
    this.#initLight();
    this.#initControls();

    this.#raycaster = new BLRaycaster(this.#camera, this.#renderer.domElement);

    this.#addResizeListener();
  }

  #initCamera() {
    const { fov, aspect, near, far } = CameraParameters;
    this.#camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.#camera.position.copy(CAMERA_POSITION);
    this.#camera.updateProjectionMatrix();
  }

  #initScene() {
    this.#scene = new THREE.Scene();
  }

  #initRenderer(RendererParameters) {
    this.#renderer = new THREE.WebGLRenderer(RendererParameters);
    this.#renderer.setSize(innerWidth, innerHeight);
    this.#renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.#renderer.setPixelRatio(devicePixelRatio);
    this.#domElement.appendChild(this.#renderer.domElement);
    this.#renderer.domElement.removeAttribute("data-engine");
  }

  #initLight() {
    this.#ambientLight = ambientLight.clone();
    this.#scene.add(this.#ambientLight);

    this.#directionLight = directionalLight.clone();
    this.#scene.add(this.#directionLight);
  }

  #initControls() {
    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.target.copy(CONTROLS_TARGET);

    this.onRenderQueue.set("controls", param => param.controls.update());
  }

  initComposer() {
    this.#postprocessing = new Postprocessing(this.#renderer, this.#scene, this.#camera);

    this.#onresizeQueue.set("postprocessing", this.#postprocessing.resize);
  }

  initStats() {
    this.#stats = new Stats();
    document.body.appendChild(this.#stats.dom);

    this.onRenderQueue.set("stats", param => param.#stats.update());
  }
  initGridHelper() {
    const gridHelper = new THREE.GridHelper(100);
    this.#scene.add(gridHelper);
  }
  initAxesHelper() {
    const axesHelper = new THREE.AxesHelper(100);
    this.#scene.add(axesHelper);
  }
  initCSS2DRenderer() {
    const scope = this;

    this.#css2dRenderer = new CSS2DRenderer();
    this.#css2dRenderer.setSize(innerWidth, innerHeight);
    this.#css2dRenderer.domElement.id = "css2dRenderer";
    this.#domElement.appendChild(this.#css2dRenderer.domElement);
    this.onRenderQueue.set("css2dRenderer", param => param.#css2dRenderer.render(param.#scene, param.#camera));

    function onResize(width, height) {
      scope.#css2dRenderer.setSize(width, height);
      scope.#css2dRenderer.domElement.style.height = "0";
    }

    this.#onresizeQueue.set("css2dRenderer", onResize);
  }
  initCSS3DRenderer() {
    const scope = this;

    this.#css3dRenderer = new CSS3DRenderer();
    this.#css3dRenderer.setSize(window.innerWidth, window.innerHeight);
    this.#css3dRenderer.domElement.id = "css3dRenderer";
    this.#css3dRenderer.domElement.oncontextmenu = () => false;
    this.domElement.appendChild(this.#css3dRenderer.domElement);

    this.onRenderQueue.set("css3dRenderer", param => param.#css3dRenderer.render(param.#scene, param.#camera));

    function onResize(width, height) {
      scope.#css3dRenderer.setSize(width, height);
      scope.#css3dRenderer.domElement.style.height = "0";
    }
    this.#onresizeQueue.set("css3dRenderer", onResize);
  }

  #addResizeListener() {
    this.#bindResize = this.#onresize.bind(this);
    window.addEventListener("resize", this.#bindResize);
  }

  #removeResizeListener() {
    window.removeEventListener("resize", this.#bindResize);
    this.#bindResize = null;
  }

  #onresize() {
    const { innerWidth, innerHeight } = window;

    this.#camera.aspect = innerWidth / innerHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(innerWidth, innerHeight);

    this.#onresizeQueue.forEach(fn => fn(innerWidth, innerHeight));
  }

  addMousedownListener() {
    if (this.#isListeningMousedown) return;
    this.#isListeningMousedown = true;
    this.#bindMousedown = this.#onmousedown.bind(this);
    this.#domElement.addEventListener("mousedown", this.#bindMousedown);
  }

  removeMousedownListener() {
    if (!this.#isListeningMousedown) return;
    this.#isListeningMousedown = false;
    this.#domElement.removeEventListener("mousedown", this.#bindMousedown);
    this.#bindMousedown = null;
  }

  #onmousedown(event) {
    this.#computePosition(event, onmousedownVector);
    this.#onmousedownQueue.forEach(fn => fn(event, this));

    const scope = this;
    function onmouseup(event) {
      scope.#domElement.removeEventListener("mouseup", onmouseup);

      scope.#computePosition(event, onmouseupVector);

      if (!onmousedownVector.equals(onmouseupVector)) return;

      scope.#onmouseupQueue.forEach(fn => fn(event, scope));
    }
    this.#domElement.addEventListener("mouseup", onmouseup);
  }

  addMousemoveListener() {
    if (this.#isListeningMousemove) return;
    this.#isListeningMousedown = true;
    this.#bindMousemove = this.#onmousemove.bind(this);
    this.#domElement.addEventListener("mousemove", this.#bindMousemove);
  }

  removeMousemoveListener() {
    if (!this.#isListeningMousemove) return;
    this.#isListeningMousedown = false;
    this.#domElement.removeEventListener("mousemove", this.#bindMousemove);
    this.#bindMousemove = null;
  }

  #onmousemove(event) {
    // if ((this.elapsedTime.value * 10) & 1) return;
    this.#onmousemoveQueue.forEach(fn => fn(event, this));
  }

  addDblclickListener() {
    if (this.#isListeningDblclick) return;
    this.#isListeningDblclick = true;
    this.#bindDblclick = this.#onDblclick.bind(this);
    this.#domElement.addEventListener("dblclick", this.#bindDblclick);
  }

  removeDblclickListener() {
    if (!this.#isListeningDblclick) return;
    this.#isListeningDblclick = false;
    this.#domElement.removeEventListener("dblclick", this.#bindDblclick);
    this.#bindDblclick = null;
  }

  #onDblclick(event) {
    this.#onDblClickQueue.forEach(fn => fn(event, this));
  }

  addCameraListener() {
    if (this.#isListeningCamera) return;
    this.#isListeningCamera = true;
    this.#bindCameraChange = this.#onCameraChange.bind(this);
    this.#controls.addEventListener("change", this.#bindCameraChange);
  }

  #onCameraChange() {
    this.#onCameraChangeQueue.forEach(fn => fn(this));
  }
  removeCameraListener() {
    if (!this.#isListeningCamera) return;
    this.#isListeningCamera = false;
    this.#controls.removeEventListener("change", this.#bindCameraChange);
    this.#bindCameraChange = null;
  }
  /**
   * 根据鼠标在屏幕的位置计算相对 [-1,1] 的位置,赋值给target
   * @param {THREE.Vector2} target
   * @param {MouseEvent} event
   */
  #computePosition(event, target) {
    const { top, left, width, height } = this.#renderer.domElement.getBoundingClientRect();

    target.x = ((event.clientX - left) / width) * 2 - 1;
    target.y = -((event.clientY - top) / height) * 2 + 1;
    return target;
  }

  /**
   * @param {"click"|"dblclick"|"mousemove"} type
   * @param { THREE.Object3D | THREE.Object3D[]} object
   * @param {( intersects: THREE.import("three").Intersection[] ) => void  } callback
   * @returnsimport MemoryManager from './../lib/memoryManager';

   */
  raycast(type, object, callback) {
    return this.#raycaster.bindEvent(type, object, callback);
  }

  removeAllListener() {
    this.removeCameraListener();
    this.removeMousedownListener();
    this.removeMousemoveListener();
    this.removeDblclickListener();
    this.#removeResizeListener();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (!this.renderEnabled) return;

    TWEEN.update();

    this.onRenderQueue.forEach(fn => fn(this));

    // render
    this.render();
  }

  render() {
    if (this.#postprocessing) {
      this.#postprocessing.composer.render();
    } else {
      this.#renderer.render(this.#scene, this.#camera);
    }
  }

  stopRender() {
    this.renderEnabled = false;
    this.controls.enabled = false;
    this.removeAllListener();
  }
  beginRender() {
    this.controls.enabled = true;
    this.renderEnabled = true;

    if (!this.#bindResize) this.#addResizeListener();
  }

  // 限制相机
  cameraMoveLimit() {
    const position = this.#camera.position;
    const target = this.#controls.target;

    this.#controls.addEventListener("change", e => {
      target.clamp(CONTROLS_BOX.min, CONTROLS_BOX.max);
      position.clamp(CAMERA_BOX.min, CAMERA_BOX.max);
    });
  }
}
