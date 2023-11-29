/** @description 灯光风格控制器 4白天，8夜晚 16科技风 */
export const DAY = 4;
export const NIGHT = 8;
export const SCIENCE = 16;
export const lightingPattern = {
  value: DAY,
};
export const elapsedTime = {
  value: 0,
};
export const flowTime = {
  value: 1,
};
// 窗户玻璃动画时间
export const glassTime = {
  value: 0,
};
/**
 * @description 着色器定位锚点
 * @SHADER_END  着色器最终输出值处
 * @DIFFUSE_EN 着色器漫反射结束点
 * @SHADER_UNIFORM 着色器uniform添加处
 */
export const SHADER_END = "//#shader_end#";
export const SHADER_UNIFORM = "//#shader_uniform#";
export const DIFFUSE_END = "//#diffuse_end#";
