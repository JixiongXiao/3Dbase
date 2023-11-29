import * as THREE from "three";
import { DAY } from "../components/weather";

const vertexShader = `
varying vec3 vPosition;
varying vec2 vUv;
void main() {
   vPosition = position;
   vUv = uv;
   vec4 modelPosition = modelMatrix * vec4 ( position, 1.0);
   gl_Position = projectionMatrix * viewMatrix * modelPosition;
}
`;

const fragmentShader = `
varying vec2 vUv;
      uniform sampler2D bg;
      uniform float opacity;
      void main() {
          vec4 col=texture2D(bg, vUv);
          gl_FragColor = vec4(col.xyz, col.a*opacity);
      }
`;
const bgFragment = `
varying vec2 vUv;
uniform vec3 uColor;
uniform float uStyle;
void main() {
vec2 uv=(vUv-vec2(0.5))*2.0;
float dis = length(uv);
float al = 1.0 - dis ;
if(uStyle == 2.0){
  al = 0.0;
}
gl_FragColor = vec4(uColor, al);
}
`;
export class PlatformCircle extends THREE.Group {
  #geometry;
  constructor() {
    super();
    this.style = DAY;
    this.uStyle = { value: DAY };

    this.#geometry = new THREE.PlaneGeometry(2000, 2000, 126, 126);
    this.#geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    this.createChild_1();
    this.createChild_2();
  }

  createChild_1() {
    const textureLoader = new THREE.TextureLoader();
    const bg = textureLoader.load("./textures/bg.png");
    bg.colorSpace = THREE.SRGBColorSpace;

    this.shaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uElapseTime: this.elapsedTime,
        glowFactor: {
          value: 1.0, // 扩撒圈的明暗程度
        },
        uColor: {
          value: new THREE.Color("#60C6FF"),
        },
        flowColor: {
          value: new THREE.Color("#EEF5F5"),
        },
        bg: {
          value: bg,
        },
        speed: {
          value: 0.8,
        },
        opacity: {
          value: 0.4,
        },
        alpha: {
          value: 2.5,
        },
      },
      vertexShader,
      fragmentShader,
    });

    this.children.push(new THREE.Mesh(this.#geometry, this.shaderMaterial));
  }

  createChild_2() {
    const bgShaderMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uColor: {
          value: new THREE.Color("#323F54"),
        },
        uStyle: this.uStyle,
      },
      vertexShader,
      fragmentShader: bgFragment,
    });
    const mesh = new THREE.Mesh(this.#geometry, bgShaderMaterial);
    mesh.position.set(0, -5, 0);
    this.children.push(mesh);
  }

  update(style, elapsedTime) {
    this.uStyle.value = style;
    // this.elapsedTime = elapsedTime;
  }
}
