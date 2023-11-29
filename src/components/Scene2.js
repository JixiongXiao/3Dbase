import * as THREE from "three";
import MemoryManager from "../lib/memoryManager";
import { PlatformCircle } from "../lib/PlatformCircle";
// import PlatformCircle from "./lib/PlatformCircle";

export class Scene2 extends THREE.Scene {
  #platform;
  constructor() {
    super();

    this.memoryManager = new MemoryManager();

    this.init();
  }

  init() {
    this.addLight();
    this.addTexture();
    this.addPlatForm();
    this.addAxesHelper();
  }

  addTexture() {
    const texture = new THREE.TextureLoader().load("./textures/sky/sunny.jpg");
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.background = texture;
  }
  addAxesHelper() {
    this.children.push(new THREE.AxesHelper(100));
  }

  addLight() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.children.push(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85);
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 3500;
    directionalLight.shadow.camera.right = 1500;
    directionalLight.shadow.camera.left = -1500;
    directionalLight.shadow.camera.top = 1500;
    directionalLight.shadow.camera.bottom = -1500;
    directionalLight.shadow.mapSize.width = 8192;
    directionalLight.shadow.mapSize.height = 8192;
    directionalLight.shadow.radius = 0.5;
    directionalLight.shadow.bias = -0.0003;
    directionalLight.position.set(800, 1300, 1000);
    directionalLight.castShadow = true;

    this.children.push(directionalLight);
  }

  addPlatForm() {
    this.#platform = new PlatformCircle();
    this.children.push(this.#platform);
  }

  addModel(url) {}

  disposeModel() {
    this.memoryManager.dispose();
  }

  update(style, elapsedTime) {
    this.#platform && this.#platform.update(style, elapsedTime);
  }
}
