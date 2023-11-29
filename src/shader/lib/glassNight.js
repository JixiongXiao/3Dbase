export const glassNightChunk = /*glsl*/ `
      vec4 tColor = gl_FragColor;
      vec4 z = diffuseColor;
      if(uStyle == NIGHT) {
       // gl_FragColor.xyz = vec3(1.0,1.0,1.0);
        float q = pow(z.r-z.g,2.0)  + pow(z.r-z.b,2.0) + pow(z.g-z.b,2.0);
        float i = step(q,0.01); //q大于0.01时,i为0,反之为1
        float o = step(pow(z.r,2.0),(z.b,2.0));
        vec3 newC = vec3 (0.75, 0.75,0.55);
        gl_FragColor = mix(vec4( newC, 1.0),tColor, i*o);
      }
        `;
