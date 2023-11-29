import { Scene, AxesHelper } from "three";
import { ambientLight, directionalLight } from "./light";
import { loadTexture } from "../utils/texture";
import MemoryManager from "../lib/memoryManager";

export class Scene2 extends Scene {
  constructor() {
    super();

    this.memoryManager = new MemoryManager();

    this.add(directionalLight.clone(), ambientLight.clone());
    this.add(new AxesHelper(100));
    this.background = loadTexture("./textures/sky/sunny.jpg");
  }

  loadModel(url) {}

  disposeModel() {
    this.memoryManager.dispose();
    this.memoryManager.clear();
  }
}
