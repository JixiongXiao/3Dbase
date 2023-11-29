export const noiseA = /* glsl */ `

    float randomA(vec2 st){
      return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453);
    }
    float noiseA(vec2 st) {
    vec2 i = floor(st.xy);
    vec2 f = fract(st.xy);
    f = smoothstep(0.0,1.0,f);
    float a = randomA(i);
    float b = randomA(i + vec2(1.0,0.0));
    float c = randomA(i + vec2(0.0,1.0));
    float d = randomA(i + vec2(1.0,1.0));
    float mixN = mix(a,b,f.x); // 相当于a * (1.0 - f.x) + b * f.x
    float z = a * (1.0 - f.x) + b * f.x + (c - a) * f.y * (1.0 - f.x) + (d - b) * f.y * f.x;
    return z;
    }
    float fbmA(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 2.0;
    for(int i=0; i<6; i++) {
      value += amplitude*noiseA(st);
      st *= frequency;
      amplitude *= 0.5;
    }
    return value;
    }   
`;
