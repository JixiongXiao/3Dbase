import * as TWEEN from "three/examples/jsm/libs/tween.module";
import shaderChunk from "./shaderChunk";
import {
  DAY,
  NIGHT,
  SCIENCE,
  lightingPattern,
  flowTime,
  glassTime,
  elapsedTime,
  SHADER_END,
  SHADER_UNIFORM,
  DIFFUSE_END,
} from "./paramaters";

// 风格参数
export function changeLightingPattern(pattern) {
  lightingPattern.value = pattern;
}
export function flowTimeUpdate(type) {
  if (type === 1) {
    const t = new TWEEN.Tween(flowTime).to({ value: 0.0 }, 5500).start();
  }
  if (type === 2) {
    flowTime.value = 1;
  }
}
// 时间参数
export function shaderUpdateTime(time) {
  elapsedTime.value = time;
}
// 玻璃时间参数更改
export function glassTimeUpdate(time) {
  if (time === DAY) {
    const t = new TWEEN.Tween(glassTime).to({ value: 0 }, 3500).start();
  }
  if (time === NIGHT) {
    const t = new TWEEN.Tween(glassTime).to({ value: 1 }, 2500).easing(TWEEN.Easing.Quadratic.In).start();
  }
}
/**
 * @function shaderModify 着色器主函数
 */
export function shaderModify(mesh, param = {}) {
  if (param.shader) {
    console.log("shader is undefined!");
    return;
  }
  mesh.material.onBeforeCompile = shader => {
    shader.uniforms.uStyle = lightingPattern; // 风格切换开关，1为白天，2为夜晚 3为科技风
    shader.uniforms.uElapseTime = elapsedTime;
    param.color && (shader.uniforms.uColor = { value: param.color });
    addUniform(shader, param);
    shaderChunk[param.shader](shader, param);
  };
}

function addUniform(shader, param) {
  shader.vertexShader = shader.vertexShader.replace(
    "#include <common>",
    `
    #include <common>
        #define DAY ${DAY}.0
        #define NIGHT ${NIGHT}.0
        #define SCIENCE ${SCIENCE}.0
        uniform float uElapseTime;
        varying vec4 mPosition;
        varying vec3 mNormal;
        varying vec2 st;
        ${SHADER_UNIFORM}
        `,
  );
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
        #include <begin_vertex>
        mNormal = normal;
        mPosition = modelMatrix * vec4( position, 1.0 );
        st = uv;
        `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <common>",
    `
    #include <common>
    #define DAY ${DAY}.0
    #define NIGHT ${NIGHT}.0
    #define SCIENCE ${SCIENCE}.0
    uniform float uStyle;
    uniform float uElapseTime;
    uniform vec3 uColor;
    varying vec4 mPosition;
    varying vec3 mNormal;
    varying vec2 st;
    ${SHADER_UNIFORM}
        `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <dithering_fragment>",
    `
    #include <dithering_fragment>
    ${SHADER_END}
     `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "vec4 diffuseColor = vec4( diffuse, opacity );",
    `
    vec4 diffuseColor = vec4( diffuse, opacity );
    ${DIFFUSE_END}
    `,
  );
}
