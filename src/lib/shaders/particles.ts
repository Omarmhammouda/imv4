/** Ambient atomized paint/dust field drifting through the void. */

export const ambientVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDrift;
  attribute float aScale;
  attribute float aSeed;
  varying float vSeed;
  varying float vDepth;

  void main() {
    vSeed = aSeed;
    vec3 p = position;
    float t = uTime * uDrift;
    float s = aSeed * 6.2831853;
    p.x += sin(t * 0.6 + s) * 0.5;
    p.y += cos(t * 0.45 + s * 1.3) * 0.4;
    // slow vertical rise that wraps within the volume
    p.y = mod(p.y + t * 0.12 + aSeed * 8.0 + 4.0, 8.0) - 4.0;
    p.z += sin(t * 0.5 + s * 0.7) * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / -mv.z);
  }
`;

export const ambientFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vSeed;
  varying float vDepth;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    // rare red motes
    vec3 col = vSeed > 0.93 ? uAccent : uColor;
    // fade with distance for depth
    float depthFade = smoothstep(14.0, 3.0, vDepth);
    gl_FragColor = vec4(col, a * uOpacity * depthFade);
  }
`;
