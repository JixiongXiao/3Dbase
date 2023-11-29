import { Scene, Camera, WebGLRenderer } from "three";
import {
  EffectPass,
  SelectiveBloomEffect,
  EffectComposer,
  RenderPass,
  BlendFunction,
  OutlineEffect,
  HueSaturationEffect,
  BrightnessContrastEffect,
} from "postprocessing";

export class Postprocessing {
  #renderer;
  #scene;
  #camera;
  /**
   * @param { WebGLRenderer } render
   * @param { Scene } scene
   * @param { Camera } camera
   */
  constructor(renderer, scene, camera) {
    this.#renderer = renderer;
    this.#scene = scene;
    this.#camera = camera;
    this.bloomArr = [];
    this.outlineArr1 = [];
    this.outlineArr2 = [];
    this.#init();
  }

  resize = (width, height) => {
    this.composer.setSize(width, height, true);
  };

  #init() {
    this.#initComposer();
    this.#initRenderPass();
    this.#initBloomEffect();
    this.#initOutLineEffect1();
    this.#initOutLineEffect2();
    this.#initEffectPass();
  }

  #initComposer() {
    // msaa anti-aliasing 多重采样抗锯齿
    const multisampling = this.#renderer.capabilities.maxSamples;
    this.composer = new EffectComposer(this.#renderer, { multisampling });
  }

  #initRenderPass() {
    this.renderPass = new RenderPass(this.#scene, this.#camera);
    this.composer.addPass(this.renderPass);
  }

  #initBloomEffect() {
    this.bloomEffect = new SelectiveBloomEffect(this.#scene, this.#camera, {
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.01,
      luminanceSmoothing: 0.6,
      intensity: 0.9,
    });
    this.bloomEffect.inverted = false;
    this.bloomEffect.ignoreBackground = true;
    this.bloomEffect.selection.set([]);
  }

  #initOutLineEffect1() {
    this.outlineEffect1 = new OutlineEffect(this.#scene, this.#camera, {
      blendFunction: BlendFunction.ADD,
      edgeStrength: 3,
      pulseSpeed: 0,
      visibleEdgeColor: 0x00ced1,
      hiddenEdgeColor: 0x00ced1,
      blur: false,
      xRay: true,
      usePatternTexture: false,
    });
  }

  #initOutLineEffect2() {
    this.OutlineEffect2 = new OutlineEffect(this.#scene, this.#camera, {
      blendFunction: BlendFunction.ADD,
      edgeStrength: 4,
      patternScale: 12,
      pulseSpeed: 0.2,
      visibleEdgeColor: 0x00ced1,
      hiddenEdgeColor: 0x00ced1,
      blur: true,
      xRay: true,
      usePatternTexture: false,
    });
  }

  #initEffectPass() {
    // 色调通道
    this.hueSaturationEffect = new HueSaturationEffect({ saturation: 0.18 });
    this.brightnessContrastEffect = new BrightnessContrastEffect({
      contrast: 0.2,
    });
    // 创建通道
    const effectPass = new EffectPass(
      this.#camera,
      this.bloomEffect,
      this.outlineEffect1,
      this.OutlineEffect2,
      this.hueSaturationEffect,
      this.brightnessContrastEffect,
    );
    this.composer.addPass(effectPass);
  }
  addBloom(mesh) {
    if (this.bloomArr.includes(mesh)) return;
    this.bloomArr.push(mesh);
    this.bloomEffect.selection.set(this.bloomArr);
  }
  clearBloom(mesh) {
    for (let i = 0; i < this.bloomArr.length; i++) {
      if (mesh.uuid === this.bloomArr[i].uuid) {
        this.bloomArr.splice(i, 1);
      }
    }
    this.bloomEffect.selection.set(this.bloomArr);
  }
  addOutline(mesh, channel = 1) {
    let arr = channel === 1 ? this.outlineArr1 : this.outlineArr2;
    let pass = channel === 1 ? this.outlineEffect1 : this.OutlineEffect2;

    if (arr.includes(mesh)) return;
    arr.push(mesh);
    pass.selection.set(arr);
  }
  clearOutline(mesh, channel = 1) {
    let arr = channel === 1 ? this.outlineArr1 : this.outlineArr2;
    let pass = channel === 1 ? this.outlineEffect1 : this.OutlineEffect2;
    for (let i = 0; i < arr.length; i++) {
      if (mesh.uuid === arr[i].uuid) {
        arr.splice(i, 1);
      }
    }
    pass.selection.set(arr);
  }
}
