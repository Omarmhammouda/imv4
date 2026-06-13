/** Spray-mist burst emitted from the nozzle at chapter transitions. */

export const burstVertex = /* glsl */ `
  uniform float uProgress;   // 0..1 life of the burst
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec3 aDir;
  attribute float aScale;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vSeed = aSeed;
    float p = clamp(uProgress, 0.0, 1.0);
    float e = 1.0 - pow(1.0 - p, 2.2); // ease-out spread

    vec3 pos = position;
    pos += aDir * e * (1.4 + aSeed * 1.8);
    pos.y += sin(p * 3.14159) * 0.15 * aSeed; // slight puff up
    pos.y -= e * e * 0.35 * (0.5 + aSeed);     // gentle settle

    // turbulence
    pos.x += sin(p * 6.2831 + aSeed * 10.0) * 0.06 * e;
    pos.z += cos(p * 6.2831 + aSeed * 8.0) * 0.06 * e;

    vAlpha = smoothstep(0.0, 0.08, p) * (1.0 - smoothstep(0.55, 1.0, p));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mv.z) * (0.5 + e * 1.4);
  }
`;

export const burstFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    vec3 col = mix(uColor, uColor2, vSeed); // red → warm white scatter
    gl_FragColor = vec4(col, a * vAlpha * 0.9);
  }
`;
