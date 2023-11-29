export const fresnelChunk = /* glsl */ `
     vec3 viewDir = normalize(cameraPosition - mPosition.xyz);
     float intensity = 1.0 - dot( mNormal,viewDir);
    gl_FragColor = vec4(uColor,pow(intensity,1.5));
`;
