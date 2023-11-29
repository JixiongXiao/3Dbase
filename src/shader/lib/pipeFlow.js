export const pipeFlowUniform = /* glsl */ `

    uniform float uFlowTime;  
`;

export const pipeFlowChunk = /* glsl */ `
    vec2 newSt = vec2(2.0 * st.y - pow(st.y,2.0), st.x*50.0-(uElapseTime * 8.5));
    float z = fbmA(fbmA(newSt) + newSt);
    vec3 color = vec3(1.0);

   color = mix(
    vec3(0.081,0.519,0.966),
    vec3(0.8,0.8,0.891),
    clamp(z*z*z*1.2,0.0,1.0)
   );
  vec4 water = vec4(color*(z*z*z+0.6*z*z+0.5*z),0.65);
  float strength = step(st.x-uFlowTime,0.0001);
  gl_FragColor = vec4(mix(vec4(0.0,0.0,0.0,0.0),water,strength));
`;
