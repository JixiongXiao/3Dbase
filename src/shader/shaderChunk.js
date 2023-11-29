import { fresnelChunk } from "./lib/fresnel";
import { brightnessUniform, brightnessChunk } from "./lib/brightness";
import { borderFadeChunk } from "./lib/borderFade";
import { glassNightChunk } from "./lib/glassNight";
import { pipeFlowChunk, pipeFlowUniform } from "./lib/pipeFlow";
import { noiseA } from "./lib/noise";
import { flowTime, glassTime, SHADER_END, SHADER_UNIFORM, DIFFUSE_END } from "./paramaters";

export default (function () {
  let shaderChunk = {
    fresnel(shader) {
      fragReplace(shader, SHADER_END, fresnelChunk);
    },
    brightness(shader, param) {
      shader.uniforms.uIntensity = { value: param.intensity };
      fragReplace(shader, SHADER_UNIFORM, brightnessUniform);
      fragReplace(shader, SHADER_END, brightnessChunk);
    },
    borderFade(shader) {
      fragReplace(shader, SHADER_END, borderFadeChunk);
    },
    glassNight(shader) {
      fragReplace(shader, SHADER_END, glassNightChunk);
    },
    pipeFlow(shader) {
      shader.uniforms.uFlowTime = flowTime;
      fragReplace(shader, SHADER_UNIFORM, pipeFlowUniform);
      fragReplace(shader, SHADER_UNIFORM, noiseA);
      fragReplace(shader, SHADER_END, pipeFlowChunk);
    },
  };

  /**
   * @function fragReplace 片元着色器修改函数
   * @function vertexReplace 顶点着色器修改函数
   */
  function fragReplace(shader, start, chunk) {
    shader.fragmentShader = shader.fragmentShader.replace(
      start,
      `
  ${chunk}
  ${start}
  `,
    );
  }
  function vertexReplace(shader, start, chunk) {
    shader.vertexShader = shader.vertexShader.replace(
      start,
      `
  ${chunk}
  ${start}
  `,
    );
  }

  return shaderChunk;
})();
