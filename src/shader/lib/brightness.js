export const brightnessChunk = /* glsl */ `
 if(uStyle == SCIENCE){
 gl_FragColor = vec4(gl_FragColor.xyz*uIntensity, gl_FragColor.a);
 }
`;

export const brightnessUniform = /* glsl */ `
 uniform float uIntensity;
`;
