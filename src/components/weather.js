import * as THREE from "three";
import MemoryManager from "../lib/memoryManager";
import TWEEN from "three/examples/jsm/libs/tween.module";
import { Rain, Snow } from "../lib/blMeshes";
import { Stars } from "../lib/stars";
import Store3D from "../homeIndex";
import { Postprocessing } from "./postprocessing";
import { changeLightingPattern } from "../shader/shaderModify";
import { loadTexture } from "../utils/texture";

const LEVEL = {
  1: 1000,
  2: 3000,
  3: 8000,
};

// weather
export const SUNNY = 0;
export const SNOW = 1;
export const RAIN = 2;

// lightingPattern
export const DAY = 4;
export const NIGHT = 8;
export const SCIENCE = 16;

const SUNNY_DAY = SUNNY | DAY;
const SUNNY_NIGHT = SUNNY | NIGHT;
const SNOW_DAY = SNOW | DAY;
const SNOW_NIGHT = SNOW | NIGHT;
const RAIN_DAY = RAIN | DAY;
const RAIN_NIGHT = RAIN | NIGHT;

const SunnyTexture = loadTexture("./textures/sky/sunny.jpg");
const NightCloudyTexture = loadTexture("./textures/sky/night_cloudy.jpg");
const NightTexture = loadTexture("./textures/sky/night.jpg");
const CloudyTexture = loadTexture("./textures/sky/cloudy.jpg");

const TexturesMap = {
  [SUNNY_DAY]: SunnyTexture,
  [SUNNY_NIGHT]: NightTexture,
  [SNOW_DAY]: CloudyTexture,
  [SNOW_NIGHT]: NightCloudyTexture,
  [RAIN_DAY]: CloudyTexture,
  [RAIN_NIGHT]: NightCloudyTexture,
  [SCIENCE]: null,
};

const LightIntensityMap = {
  [SUNNY_DAY]: { amb_light: 0.55, dir_light: 3 },
  [SUNNY_NIGHT]: { amb_light: 0.1, dir_light: 0.15 },
  [SNOW_DAY]: { amb_light: 0.35, dir_light: 0.3 },
  [SNOW_NIGHT]: { amb_light: 0.1, dir_light: 0.15 },
  [RAIN_DAY]: { amb_light: 0.35, dir_light: 0.1 },
  [RAIN_NIGHT]: { amb_light: 0.1, dir_light: 0.15 },
  [SCIENCE]: { amb_light: 0.05, dir_light: 0.25 },
};

const LightColorMap = {
  [DAY]: { amb_light: 0xffffff, dir_light: 0xffffff, saturation: 0.12, contrast: 0.15 },
  [NIGHT]: { amb_light: 0xffffff, dir_light: 0x79a7ff, saturation: 0.12, contrast: 0.15 },
  [SCIENCE]: { amb_light: 0xffffff, dir_light: 0xffffff, saturation: 0, contrast: 0 },
};

export class Weather {
  /** @param {Store3D} param */
  constructor(param) {
    /**@type {THREE.Scene} */
    this.scene = param.scene;

    /**@type {THREE.DirectionalLight} */
    this.directionLight = param.directionLight;

    /**@type {THREE.AmbientLight} */
    this.ambientLight = param.ambientLight;

    /**@type {Postprocessing} */
    this.postprocessing = param.postprocessing;

    /**@type {DAY|NIGHT|SCIENCE} */
    this.lightingPattern = DAY;

    this.rain = null;
    this.snow = null;

    this.box = new THREE.Box3(new THREE.Vector3(-200, 0, -600), new THREE.Vector3(300, 300, 200));

    this.memoryManager = new MemoryManager();
    this.bgMemoryManager = new MemoryManager();

    this.thunderA = null;
    this.thunderB = null;

    this.weather = SUNNY;

    this.level = 3;

    this.scene.background = SunnyTexture;

    param.onRenderQueue.set("weather", this.update);
  }

  /**
   * @param {SUNNY|SNOW|RAIN} weather
   * @param {Number} level
   */
  setWeather(weather, level) {
    if (this.equalWeather(weather, level)) return;
    if (this.lightingPattern === SCIENCE) return;

    this.dispose();
    this.weather = weather;
    this.level = level;

    const weatherBit = this.weather | this.lightingPattern;
    this.setBackground(TexturesMap[weatherBit]);
    this.changeLight(this.directionLight, weatherBit);

    if (weather === SNOW) {
      this.setSnowWeather(this.level);
    } else if (weather === SUNNY) {
      this.directionLight.castShadow = true;
    } else if (weather === RAIN) {
      this.setRainWeather(this.level);
      this.directionLight.castShadow = false;
    } else {
      console.error("不存在的天气");
    }
  }

  equalWeather(weather, level) {
    return this.weather === weather && this.level === level;
  }

  setSnowWeather(level) {
    const count = LEVEL[level];
    this.snow = new Snow(this.box, { count, speed: 0.2, size: 1 });
    this.memoryManager.track(this.snow);
    this.scene.add(this.snow);
  }

  setRainWeather(level) {
    if (level === 3) this.createThunder(this.ambientLight, 0.1);

    const count = LEVEL[level];
    this.rain = new Rain(this.box, { count, speed: 1, size: 1 });
    this.memoryManager.track(this.rain);
    this.scene.add(this.rain);
  }

  setBackground(img) {
    this.scene.background = img;
  }

  setStars() {
    const count = 2000;
    const range = new THREE.Box3(new THREE.Vector3(-4800, -4800, -4800), new THREE.Vector3(4800, 4800, 4800));
    this.stars = new Stars(count, range);
    this.bgMemoryManager.track(this.stars);
    this.scene.add(this.stars);
  }

  // 日夜景切换
  /**@param {DAY|NIGHT|SCIENCE} lightingPattern  */
  updateLightingPattern(lightingPattern) {
    if (this.lightingPattern === lightingPattern) return;

    const weatherBit = lightingPattern === SCIENCE ? SCIENCE : this.weather | lightingPattern;

    this.directionLight.castShadow = lightingPattern === DAY;
    if (lightingPattern === DAY || lightingPattern === NIGHT) {
      this.dispose();
      if (this.weather === RAIN) {
        this.setRainWeather(this.level);
      } else if (this.weather === SNOW) {
        this.setSnowWeather(this.level);
      }
    } else {
      this.dispose();
      this.setStars();
    }

    this.setBackground(TexturesMap[weatherBit]);
    this.changeLight(this.ambientLight, weatherBit);
    this.changeLight(this.directionLight, weatherBit);
    this.ambientLight.color.set(LightColorMap[lightingPattern].amb_light);
    this.directionLight.color.set(LightColorMap[lightingPattern].dir_light);
    this.postprocessing.hueSaturationEffect.saturation = LightColorMap[lightingPattern].saturation;
    this.postprocessing.brightnessContrastEffect.contrast = LightColorMap[lightingPattern].contrast;

    this.lightingPattern = lightingPattern;
    changeLightingPattern(lightingPattern);
  }

  changeLight(light, weatherBit) {
    if (light instanceof THREE.AmbientLight) {
      if (weatherBit === SCIENCE) {
        light.intensity = LightIntensityMap[SCIENCE].amb_light;
      } else {
        new TWEEN.Tween(light).to({ intensity: LightIntensityMap[weatherBit].amb_light }, 1000).start();
      }
    } else {
      if (weatherBit === SCIENCE) {
        light.intensity = LightIntensityMap[SCIENCE].dir_light;
      } else {
        new TWEEN.Tween(light).to({ intensity: LightIntensityMap[weatherBit].dir_light }, 1000).start();
      }
    }
  }

  createThunder(light, intensity) {
    this.cleanThunder();
    this.thunderA = new TWEEN.Tween(light)
      .to({ intensity: 3 }, 200)
      .repeat(2)
      .yoyo()
      .onComplete(() => {
        this.resetThunder(light, intensity);
      });
    this.thunderB = new TWEEN.Tween(light).to({ intensity: 3.5 }, 300).onComplete(() => {
      this.resetThunder(light, intensity);
    });
    this.timer = setTimeout(() => {
      if (this.thunderA) {
        this.thunderA.start();
      }
      clearTimeout(this.timer);
      this.timer = null;
    }, 5000);
  }

  resetThunder(light, intensity) {
    const t = new TWEEN.Tween(light).to({ intensity: intensity }, 1000).start();
    const num = Math.ceil(Math.random() * 10 + 20) * 1000;
    this.timer = setTimeout(() => {
      const d = Math.random();
      if (d > 0.5) {
        this.thunderB && this.thunderB.start();
      } else {
        this.thunderA && this.thunderA.start();
      }
      clearTimeout(this.timer);
      this.timer = null;
    }, num);
  }

  cleanThunder() {
    if (this.thunderA) {
      this.thunderA.stop();
      this.thunderA = null;
      this.thunderB.stop();
      this.thunderB = null;
    }
  }

  /**@param {Store3D} param */
  update = param => {
    this.rain && this.rain.update(param.delta, param.camera.position);
    this.snow && this.snow.update();
    this.stars && this.stars.update();
  };
  dispose() {
    this.memoryManager.dispose();
    this.bgDispose();
    this.cleanThunder();
    this.rain = null;
    this.snow = null;
  }
  bgDispose() {
    this.bgMemoryManager.dispose();
    this.stars = null;
  }
}
