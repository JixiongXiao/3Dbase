export const borderFadeChunk = /* glsl */ `
  vec2 v = st.xy - 0.5;
  float s = 0.20; // 虚化宽度
  float t = 0.30; // 非虚化区域 // s+t相加最好不大于模型2分之一的长度
  float x = abs(v.x);
  float y = abs(v.y);
  if(x > t) gl_FragColor.a *= pow((0.5-x) / s,2.0) ;
  if(y > t) gl_FragColor.a *= pow((0.5-y) / s,2.0) ;
`;
