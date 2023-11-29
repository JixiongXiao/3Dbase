import { Vector3 } from "three";
import { Weather } from "../components/weather";
import { Base } from "./base";
import { Scene2 } from "./scene2";
import { TweenControls } from "../lib/tweenControls";
import { onLoaded } from "../message/postMessage";
import ModelManager from "./modelManager";
import { shaderUpdateTime } from "../shader/shaderModify";

export class Store3D extends Base {
  constructor(id) {
    super(id);

    this.scene2 = new Scene2();
    this.time = new Date().getTime();

    this.mainCamera = this.camera;
    this.mainScene = this.scene;

    this.firstLoad = true;
  }

  main() {
    // 添加CSS2DRenderer
    this.initCSS2DRenderer();

    // 添加后处理
    this.initComposer();

    // this.cameraMoveLimit();
    this._beginRender();
  }
  _beginRender() {
    if (this.firstLoad) {
      this.setClass();
      this.animate();
    }

    this.beginRender();
  }
  _stopRender() {
    this.stopRender();
  }

  changeScene(scene) {
    this.scene = scene;
  }

  setClass() {
    this.firstLoad = false;
    // this.initAxesHelper();

    // 天气系统
    this.weatherSystem = new Weather(this);

    // 模型
    this.modelManager = new ModelManager(this);
    this.modelManager.loadModel().then(this.afterLoaded.bind(this));

    // 相机控制
    this.tweenControl = new TweenControls(this);
  }

  changeWeather(param) {
    this.weatherSystem && this.weatherSystem.setWeather(param.type, param.level);
  }
  changeLighting(param) {
    this.weatherSystem && this.weatherSystem.updateLightingPattern(param);
  }
  setCameraState(param) {
    this.modelManager && this.modelManager.setCameraState(param);
  }

  afterLoaded() {
    console.log(`模型加载完毕:用时${(new Date().getTime() - this.time).toFixed(4) / 1000}s`);

    // postmessage onLoaded
    onLoaded();

    //
    const offset = new Vector3(0, 10, 0);
    const { clear, intersects } = this.raycast("dblclick", this.modelManager.dblclickArray, () => {
      if (intersects.length) {
        this.tweenControl.lerpTo(intersects[0].point, 50, 1000, offset);
      }
    });

    this.onRenderQueue.set("timeUpdate", scope => shaderUpdateTime(scope.elapsedTime.value));
  }
}
