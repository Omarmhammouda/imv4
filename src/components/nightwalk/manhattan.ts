// The home page street: a Manhattan block, built in code.
//
// Everything here is generated (no downloaded model), so it stays light:
// facades are painted to canvases once and shared, and repeated things
// (windows, cars, lamps, crosswalk bars…) are merged or instanced so the whole
// city is a few dozen draw calls.
//
// Layout (metres): the walk goes down −z along the middle of an avenue.
//   road   |x| < ROAD        two lanes + a parking lane each side
//   kerb   |x| = ROAD
//   walk   ROAD … FACE       sidewalk
//   face   |x| = FACE        building line
// Every mural stands in an open lot on its side of the street; cross streets
// cut through every third wall.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const ROAD = 5.4;
export const FACE = 9.5;
const KERB = 0.16;
const DEEP = 27.5; // building depth back from the face
const TW = 11.4, TH = 25.6; // metres covered by one facade texture tile
const FLOOR = 3.2, GROUND = 4.2;
const COLS = 6, ROWS = 8;

type Kind = "brick" | "brown" | "lime" | "iron" | "glass";
const KINDS: Kind[] = ["brick", "brown", "lime", "iron", "glass"];

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/* ------------------------------------------------------------ facades */
function winRect(kind: Kind, c: number, r: number, cw: number, ch: number): [number, number, number, number] {
  const x0 = c * cw, y0 = r * ch;
  switch (kind) {
    case "brick": return [x0 + (cw - 38) / 2, y0 + 34, 38, 70];
    case "brown": return [x0 + (cw - 34) / 2, y0 + 24, 34, 86];
    case "lime": return [x0 + (cw - 44) / 2, y0 + 30, 44, 74];
    case "iron": return [x0 + (cw - 58) / 2, y0 + 18, 58, 98];
    case "glass": return [x0 + 3, y0 + 3, cw - 6, ch - 34];
  }
}

function facadeTex(kind: Kind, seed: number) {
  const W = 512, H = 1024, cw = W / COLS, ch = H / ROWS;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(seed);
  const base = { brick: "#8a4a3c", brown: "#6b4a3a", lime: "#c6baa3", iron: "#d8d2c4", glass: "#2c4257" }[kind];
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  if (kind === "brick") {
    for (let y = 0; y < H; y += 4) {
      g.fillStyle = "rgba(40,20,14,.28)";
      g.fillRect(0, y, W, 1);
      for (let x = (y / 4) % 2 ? 0 : 6; x < W; x += 12) {
        g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 180 : 0},${r() > 0.5 ? 150 : 0},${r() * 0.1})`;
        g.fillRect(x, y + 1, 11, 3);
        g.fillStyle = "rgba(40,20,14,.22)";
        g.fillRect(x, y, 1, 4);
      }
    }
  } else if (kind === "brown") {
    for (let y = 0; y < H; y += 32) { g.fillStyle = "rgba(30,18,12,.25)"; g.fillRect(0, y, W, 2); }
  } else if (kind === "lime") {
    for (let y = 0; y < H; y += 16) { g.fillStyle = "rgba(70,60,45,.18)"; g.fillRect(0, y, W, 1); }
    for (let rr = 0; rr < ROWS; rr++) { g.fillStyle = "rgba(255,250,235,.25)"; g.fillRect(0, rr * ch + 4, W, 7); g.fillStyle = "rgba(60,50,40,.3)"; g.fillRect(0, rr * ch + 11, W, 2); }
  } else if (kind === "iron") {
    for (let rr = 0; rr < ROWS; rr++) {
      g.fillStyle = "#c2bbab"; g.fillRect(0, rr * ch, W, 12);
      g.fillStyle = "rgba(50,45,35,.35)"; g.fillRect(0, rr * ch + 12, W, 2);
    }
    for (let cc = 0; cc <= COLS; cc++) {
      const x = cc * cw;
      g.fillStyle = "#e6e1d4"; g.fillRect(x - 8, 0, 16, H);
      g.fillStyle = "rgba(50,45,35,.3)"; g.fillRect(x - 9, 0, 1, H); g.fillRect(x + 8, 0, 1, H);
    }
  } else {
    for (let rr = 0; rr < ROWS; rr++) { g.fillStyle = "#1f3040"; g.fillRect(0, rr * ch + ch - 28, W, 28); }
  }
  // grime
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = `rgba(${r() > 0.6 ? 255 : 0},${r() > 0.6 ? 245 : 0},${r() > 0.6 ? 230 : 0},${r() * 0.05})`;
    g.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3);
  }

  for (let rr = 0; rr < ROWS; rr++)
    for (let cc = 0; cc < COLS; cc++) {
      const [x, y, w, h] = winRect(kind, cc, rr, cw, ch);
      if (kind !== "glass") {
        // lintel + sill
        g.fillStyle = kind === "iron" ? "#bdb6a5" : "#cfc6b4";
        g.fillRect(x - 5, y - 8, w + 10, 7);
        g.fillRect(x - 6, y + h, w + 12, 6);
        g.fillStyle = "rgba(0,0,0,.35)";
        g.fillRect(x - 6, y + h + 6, w + 12, 2);
        // frame
        g.fillStyle = kind === "brown" ? "#2a2320" : "#e9e6de";
        g.fillRect(x - 2, y - 2, w + 4, h + 4);
      }
      const gl = g.createLinearGradient(x, y, x + w * 0.4, y + h);
      const v = 40 + (r() * 30) | 0;
      gl.addColorStop(0, `rgb(${v + 62},${v + 84},${v + 104})`);
      gl.addColorStop(1, `rgb(${v - 14},${v - 2},${v + 14})`);
      g.fillStyle = gl;
      if (kind === "iron") {
        g.beginPath();
        g.moveTo(x, y + h); g.lineTo(x, y + w / 2);
        g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
        g.lineTo(x + w, y + h); g.closePath(); g.fill();
      } else g.fillRect(x, y, w, h);

      if (kind === "glass") {
        g.fillStyle = "rgba(10,18,26,.7)";
        g.fillRect(x + w / 2 - 1, y, 2, h);
        continue;
      }
      const roll = r();
      if (roll < 0.3) { // curtains
        g.fillStyle = `rgba(${200 + r() * 40 | 0},${190 + r() * 40 | 0},${170 + r() * 40 | 0},.75)`;
        g.fillRect(x, y, w * 0.3, h); g.fillRect(x + w * 0.7, y, w * 0.3, h);
      } else if (roll < 0.5) { // blinds
        for (let b = y; b < y + h * (0.3 + r() * 0.5); b += 4) { g.fillStyle = "rgba(225,220,205,.7)"; g.fillRect(x, b, w, 2); }
      }
      g.fillStyle = kind === "brown" ? "#2a2320" : "#e9e6de";
      g.fillRect(x, y + h / 2 - 1, w, 3); // meeting rail
      if (kind !== "iron" && r() < 0.16) { // window AC unit
        g.fillStyle = "#b9b9b4"; g.fillRect(x + 3, y + h - 20, w - 6, 20);
        g.fillStyle = "rgba(40,40,40,.5)";
        for (let b = y + h - 17; b < y + h - 2; b += 3) g.fillRect(x + 6, b, w - 12, 1);
      }
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Same grid as the facade, black except for the rooms with a light on. */
function litTex(kind: Kind, seed: number) {
  const W = 256, H = 512, cw = W / COLS, ch = H / ROWS, k = 0.5;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(seed);
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  for (let rr = 0; rr < ROWS; rr++)
    for (let cc = 0; cc < COLS; cc++) {
      if (r() > (kind === "glass" ? 0.38 : 0.24)) continue;
      const [fx, fy, fw, fh] = winRect(kind, cc, rr, cw / k, ch / k);
      const x = fx * k, y = fy * k, w = fw * k, h = fh * k;
      const tv = r() < 0.12;
      g.fillStyle = tv ? `hsl(${205 + r() * 20},60%,${50 + r() * 15}%)` : `hsl(${28 + r() * 16},${60 + r() * 25}%,${48 + r() * 22}%)`;
      g.fillRect(x, y, w, h);
      if (r() < 0.4) { g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(x, y, w, h * (0.25 + r() * 0.4)); }
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ------------------------------------------------------------ storefronts */
const SHOPS: [string, string, string][] = [
  ["DELI & GROCERY", "#1d5c3a", "#f4e9c9"], ["99¢ PIZZA", "#b3261e", "#fff3d6"], ["BAGELS", "#e0a526", "#2a1c0a"],
  ["LAUNDROMAT", "#2b63a8", "#ffffff"], ["COFFEE", "#2a2320", "#e9d8b8"], ["RECORDS", "#111114", "#ff4a3d"],
  ["FLOWERS", "#35664a", "#ffe9ef"], ["BARBER SHOP", "#f1ede4", "#1c2c5a"], ["HARDWARE", "#c9461f", "#fff2dc"],
  ["BOOKS", "#3d2a4d", "#f0e2c0"], ["DINER", "#9c1b2b", "#ffe9b0"], ["TATTOO", "#16161a", "#e9e6de"],
];

function shopTex(i: number) {
  const [name, bg, fg] = SHOPS[i % SHOPS.length];
  const W = 512, H = 256;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(101 + i * 17);
  g.fillStyle = "#1b1b1e"; g.fillRect(0, 0, W, H);
  // sign band
  g.fillStyle = bg; g.fillRect(0, 0, W, 66);
  g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(0, 62, W, 4);
  g.fillStyle = fg;
  g.font = `800 44px "Arial Narrow", "Helvetica Neue", Arial, sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(name, W / 2, 34, W - 40);
  // shop window with a lit interior
  const door = i % 2 === 0 ? 392 : 24;
  const wx = door === 392 ? 20 : 138, ww = 354;
  const inside = g.createLinearGradient(0, 80, 0, 220);
  inside.addColorStop(0, "#f2c98a"); inside.addColorStop(1, "#8a5a2c");
  g.fillStyle = inside; g.fillRect(wx, 82, ww, 136);
  for (let s = 0; s < 3; s++) { // shelves of stock
    const y = 112 + s * 34;
    g.fillStyle = "rgba(50,30,15,.6)"; g.fillRect(wx + 8, y + 22, ww - 16, 3);
    for (let x = wx + 12; x < wx + ww - 20; x += 10 + r() * 10) {
      g.fillStyle = `hsl(${r() * 360},${40 + r() * 40}%,${35 + r() * 30}%)`;
      const h = 8 + r() * 14; g.fillRect(x, y + 22 - h, 6 + r() * 6, h);
    }
  }
  g.fillStyle = "rgba(255,255,255,.12)"; // glass reflection
  g.beginPath(); g.moveTo(wx + 30, 82); g.lineTo(wx + 110, 82); g.lineTo(wx + 40, 218); g.lineTo(wx, 218); g.lineTo(wx, 150); g.closePath(); g.fill();
  g.strokeStyle = "#0e0e10"; g.lineWidth = 5; g.strokeRect(wx, 82, ww, 136);
  g.fillRect(wx + ww / 2 - 2, 82, 4, 136);
  // door
  g.fillStyle = "#3a2c1c"; g.fillRect(door, 82, 96, 174);
  g.fillStyle = "#d9a865"; g.fillRect(door + 12, 96, 72, 110);
  g.strokeStyle = "#0e0e10"; g.strokeRect(door, 82, 96, 174);
  g.fillStyle = "#e5352b"; g.font = `700 16px Arial, sans-serif`; g.fillText("OPEN", door + 48, 120);
  // bulkhead
  g.fillStyle = bg; g.globalAlpha = 0.55; g.fillRect(wx, 222, ww, 34); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ------------------------------------------------------------ small textures */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const asphaltTex = () => canvasTex(512, 512, (g) => {
  const r = rng(3);
  g.fillStyle = "#3a3b3f"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 26000; i++) {
    const v = r() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${r() * 0.07})`;
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 5; i++) { // patches
    g.fillStyle = `rgba(20,20,22,${0.18 + r() * 0.15})`;
    g.fillRect(r() * 400, r() * 400, 60 + r() * 120, 40 + r() * 90);
  }
  g.strokeStyle = "rgba(12,12,14,.6)"; g.lineWidth = 2; // tar snakes
  for (let i = 0; i < 7; i++) {
    g.beginPath(); let x = r() * 512, y = r() * 512; g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 120; y += (r() - 0.5) * 120; g.lineTo(x, y); }
    g.stroke();
  }
}, true);

const pavementTex = () => canvasTex(256, 256, (g) => {
  const r = rng(5);
  g.fillStyle = "#9b978f"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 7000; i++) {
    const v = r() > 0.5 ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${r() * 0.06})`;
    g.fillRect(r() * 256, r() * 256, 2, 2);
  }
  for (let i = 0; i < 14; i++) { g.fillStyle = "rgba(25,25,25,.5)"; g.beginPath(); g.arc(r() * 256, r() * 256, 1.5 + r() * 2.5, 0, 7); g.fill(); } // gum
  g.fillStyle = "rgba(40,38,34,.55)"; // slab joints
  g.fillRect(0, 0, 256, 2); g.fillRect(0, 0, 2, 256); g.fillRect(127, 0, 2, 256);
}, true);

const fireEscapeTex = () => canvasTex(256, 512, (g) => {
  g.clearRect(0, 0, 256, 512);
  g.strokeStyle = g.fillStyle = "#141416";
  for (let f = 0; f < 2; f++) {
    const y0 = f * 256;
    g.fillRect(0, y0 + 244, 256, 12); // platform
    g.fillRect(0, y0 + 150, 256, 5); // top rail
    g.fillRect(0, y0 + 196, 256, 3);
    for (let x = 2; x < 256; x += 13) g.fillRect(x, y0 + 150, 3, 96); // balusters
    g.lineWidth = 6; // stair to the floor above
    const a = f ? 40 : 216, b = f ? 216 : 40;
    g.beginPath(); g.moveTo(a, y0 + 246); g.lineTo(b, y0 - 10); g.stroke();
    g.beginPath(); g.moveTo(a + (f ? 22 : -22), y0 + 246); g.lineTo(b + (f ? 22 : -22), y0 - 10); g.stroke();
    g.lineWidth = 3;
    for (let s = 0; s < 12; s++) {
      const x = a + ((b - a) * s) / 12, y = y0 + 246 - (256 * s) / 12;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (f ? 22 : -22), y); g.stroke();
    }
  }
}, true);

const signTex = (text: string, bg: string, fg = "#fff") => canvasTex(512, 96, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, 512, 96);
  g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(5, 5, 502, 86);
  g.fillStyle = fg; g.font = `700 54px "Helvetica Neue", Arial, sans-serif`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 256, 50, 470);
});

const oneWayTex = () => canvasTex(512, 160, (g) => {
  g.fillStyle = "#0c0c0e"; g.fillRect(0, 0, 512, 160);
  g.fillStyle = "#fff";
  g.beginPath(); g.moveTo(30, 52); g.lineTo(380, 52); g.lineTo(380, 20); g.lineTo(490, 80); g.lineTo(380, 140); g.lineTo(380, 108); g.lineTo(30, 108); g.closePath(); g.fill();
  g.fillStyle = "#0c0c0e"; g.font = `800 44px Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("ONE WAY", 215, 82);
});

const steamStackTex = () => canvasTex(64, 128, (g) => {
  for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#f1ede4" : "#e8641b"; g.fillRect(0, i * 22, 64, 22); }
});

const softTex = () => canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,.9)"); gr.addColorStop(0.5, "rgba(255,255,255,.3)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

/* ------------------------------------------------------------ geometry helpers */
function tint(g: THREE.BufferGeometry, col: THREE.Color | ((i: number) => THREE.Color)) {
  const n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const c = typeof col === "function" ? col(i) : col;
    a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3));
  return g;
}

/** A building: box with facade UVs in real metres so every wall shares one texture. */
function building(dx: number, h: number, dz: number, cx: number, cz: number, col: THREE.Color, r: () => number) {
  const g = new THREE.BoxGeometry(dx, h, dz);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const uOff = Math.floor(r() * COLS) / COLS, vOff = Math.floor(r() * ROWS) / ROWS;
  for (let i = 0; i < 24; i++) {
    const len = i < 8 ? dz : dx;
    uv.setXY(i, (uv.getX(i) * len) / TW + uOff, (uv.getY(i) * h - GROUND) / TH + vOff);
  }
  tint(g, col);
  g.translate(cx, h / 2, cz);
  return g;
}

function flat(w: number, d: number, cx: number, cz: number, y: number, scale: number) {
  const g = new THREE.PlaneGeometry(w, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < 4; i++) uv.setXY(i, (uv.getX(i) * w) / scale, (uv.getY(i) * d) / scale);
  g.rotateX(-Math.PI / 2);
  g.translate(cx, y, cz);
  return g;
}

/** Subtract gaps from [a, b]; returns what's left as [lo, hi] pairs. */
function subtract(a: number, b: number, gaps: [number, number][]) {
  let out: [number, number][] = [[a, b]];
  for (const [g0, g1] of gaps) {
    const next: [number, number][] = [];
    for (const [lo, hi] of out) {
      if (g1 <= lo || g0 >= hi) { next.push([lo, hi]); continue; }
      if (g0 > lo) next.push([lo, g0]);
      if (g1 < hi) next.push([g1, hi]);
    }
    out = next;
  }
  return out.filter(([lo, hi]) => hi - lo > 3.5);
}

/* ------------------------------------------------------------ the city */
export interface City {
  /** Per frame. D: 0 night … 1 day. */
  update(D: number, time: number, camera: THREE.Camera, horizon: THREE.Color): void;
}

export function buildManhattan(
  scene: THREE.Scene,
  o: { N: number; spacing: number; narrow: boolean; reduce: boolean; keep: <T extends { dispose(): void }>(x: T) => T },
): City {
  const { N, spacing, narrow, reduce, keep } = o;
  const r = rng(20261120);
  const wallZ = (i: number) => -10 - i * spacing;
  const wallSide = (i: number) => (i % 2 === 0 ? -1 : 1);
  const zStart = 34, zEnd = wallZ(N - 1) - 70;

  const crossZ: number[] = [];
  for (let i = 2; i < N - 1; i += 3) crossZ.push(wallZ(i) - spacing / 2);
  const crossGaps = crossZ.map((c) => [c - 6, c + 6] as [number, number]);
  const lotGaps = (s: number) =>
    Array.from({ length: N }, (_, i) => i).filter((i) => wallSide(i) === s).map((i) => [wallZ(i) - 8, wallZ(i) + 8] as [number, number]);
  /** Keep kerb-side things out of the sight line between the walker and a mural. */
  const clear = (s: number, z: number) => {
    for (let i = 0; i < N; i++) if (wallSide(i) === s && z > wallZ(i) - 10 && z < wallZ(i) + 12) return false;
    return !crossZ.some((c) => Math.abs(z - c) < 9);
  };

  const add = <T extends THREE.Object3D>(m: T) => (scene.add(m), m);
  const std = (p: THREE.MeshStandardMaterialParameters) => keep(new THREE.MeshStandardMaterial(p));
  const dummy = new THREE.Object3D();
  type Tf = { p: [number, number, number]; s?: [number, number, number]; ry?: number; rz?: number; c?: THREE.ColorRepresentation };
  const inst = (geo: THREE.BufferGeometry, mat: THREE.Material, tfs: Tf[]) => {
    const m = new THREE.InstancedMesh(keep(geo), mat, Math.max(1, tfs.length));
    m.count = tfs.length;
    const col = new THREE.Color();
    tfs.forEach((t, i) => {
      dummy.position.set(...t.p);
      dummy.scale.set(...(t.s ?? [1, 1, 1]));
      dummy.rotation.set(0, t.ry ?? 0, t.rz ?? 0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      if (t.c !== undefined) m.setColorAt(i, col.set(t.c));
    });
    m.frustumCulled = false;
    return add(m);
  };
  const merged = (geos: THREE.BufferGeometry[], mat: THREE.Material | THREE.Material[]) => {
    if (!geos.length) return null;
    const g = keep(mergeGeometries(geos, false)!);
    geos.forEach((x) => x.dispose());
    const m = new THREE.Mesh(g, mat);
    m.frustumCulled = false;
    return add(m);
  };

  /* ---------- buildings ---------- */
  const geos: Record<Kind, THREE.BufferGeometry[]> = { brick: [], brown: [], lime: [], iron: [], glass: [] };
  const shopGeos: THREE.BufferGeometry[][] = SHOPS.map(() => []);
  const awnings: Tf[] = [], cornices: Tf[] = [], escapes: THREE.BufferGeometry[] = [], platforms: Tf[] = [];
  const tanks: Tf[] = [], shopGlow: Tf[] = [];
  const TINTS: Record<Kind, number[]> = {
    brick: [0xffffff, 0xe8d0c8, 0xd9b8a8, 0xfff0e0, 0xc9a08e],
    brown: [0xffffff, 0xe6d6c8, 0xd0c0b4],
    lime: [0xffffff, 0xf0e8dc, 0xdcd8d0],
    iron: [0xffffff, 0xe8ecf0, 0xf2e6d8, 0xd8dcd4],
    glass: [0xffffff, 0xd8e8f0, 0xc8d0dc],
  };
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const tintOf = (k: Kind) => new THREE.Color(pick(TINTS[k]));
  let shopN = 0;

  for (const s of [-1, 1]) {
    for (const [lo, hi] of subtract(zEnd, zStart, [...crossGaps, ...lotGaps(s)])) {
      const n = Math.max(1, Math.round((hi - lo) / 12));
      const L = (hi - lo) / n;
      for (let k = 0; k < n; k++) {
        const zc = lo + L * (k + 0.5);
        const kind = pick<Kind>(["brick", "brick", "brown", "lime", "iron", "iron"]);
        const floors = kind === "lime" ? 8 + Math.floor(r() * 7) : 4 + Math.floor(r() * 4);
        const h = GROUND + floors * FLOOR;
        geos[kind].push(building(DEEP, h, L - 0.04, s * (FACE + DEEP / 2), zc, tintOf(kind), r));
        cornices.push({ p: [s * (FACE - 0.2), h - 0.3, zc], s: [0.7, 0.6, L], c: kind === "brick" || kind === "brown" ? 0x4a3a30 : 0xbdb6a5 });
        // ground-floor shops with awnings
        const shops = Math.max(1, Math.round(L / 7)), sw = L / shops;
        for (let j = 0; j < shops; j++) {
          const v = shopN++ % SHOPS.length, sz = lo + L * k + sw * (j + 0.5);
          const g = new THREE.PlaneGeometry(sw - 0.3, 3.9);
          g.rotateY((-s * Math.PI) / 2);
          g.translate(s * (FACE - 0.05), 1.95 + KERB, sz);
          shopGeos[v].push(g);
          awnings.push({ p: [s * (FACE - 0.62), 3.15, sz], s: [1, 1, sw * 0.82], rz: s * 0.38, c: SHOPS[v][1] });
          shopGlow.push({ p: [s * (FACE - 2.2), KERB + 0.03, sz], s: [5.5, 1, sw * 0.9], c: 0xffc98a });
        }
        // fire escape down the street face
        if ((kind === "brick" || kind === "brown") && L > 6) {
          const fz = zc + (r() - 0.5) * (L - 5), fw = 3.4, fh = floors * FLOOR;
          const g = new THREE.PlaneGeometry(fw, fh);
          const uv = g.attributes.uv as THREE.BufferAttribute;
          for (let i = 0; i < 4; i++) uv.setY(i, (uv.getY(i) * floors) / 2);
          g.rotateY((-s * Math.PI) / 2);
          g.translate(s * (FACE - 0.9), GROUND + fh / 2, fz);
          escapes.push(g);
          for (let f = 0; f < floors; f++) platforms.push({ p: [s * (FACE - 0.45), GROUND + f * FLOOR + 0.1, fz], s: [0.9, 0.07, fw] });
        }
        if (r() < 0.55) tanks.push({ p: [s * (FACE + 3 + r() * 3), h, zc + (r() - 0.5) * L * 0.4], s: [1, 0.9 + r() * 0.3, 1] });
      }
    }
    // the buildings behind each mural's lot
    for (const [l0, l1] of lotGaps(s))
      for (const [lo, hi] of subtract(l0, l1, crossGaps)) {
        const kind = pick<Kind>(["brick", "brown", "lime"]);
        const h = GROUND + (6 + Math.floor(r() * 6)) * FLOOR;
        geos[kind].push(building(15, h, hi - lo - 0.04, s * (22 + 7.5), (lo + hi) / 2, tintOf(kind), r));
        if (r() < 0.6) tanks.push({ p: [s * 25, h, (lo + hi) / 2], s: [1, 1, 1] });
      }
    // buildings down each cross street
    for (const c of crossZ)
      for (const zs of [-1, 1]) {
        let x = FACE + DEEP;
        while (x < 110) {
          const dx = 10 + r() * 8, kind = pick<Kind>(["brick", "brown", "lime", "iron", "glass"]);
          const h = GROUND + (4 + Math.floor(r() * (kind === "glass" ? 22 : 8))) * FLOOR;
          geos[kind].push(building(dx - 0.04, h, 16, s * (x + dx / 2), c + zs * 14, tintOf(kind), r));
          x += dx;
        }
      }
    // towers a block back, for the skyline
    const towers = narrow ? 8 : 16;
    for (let i = 0; i < towers; i++) {
      const z = zStart - ((zStart - zEnd) * (i + r())) / towers;
      if (crossZ.some((c) => Math.abs(z - c) < 26)) continue;
      const kind = r() < 0.65 ? "glass" : "lime";
      const h = GROUND + (16 + Math.floor(r() * 30)) * FLOOR, dx = 14 + r() * 8;
      geos[kind].push(building(dx, h, 14 + r() * 10, s * (FACE + DEEP + 4 + dx / 2 + r() * 26), z, tintOf(kind), r));
    }
  }

  const lit: THREE.MeshStandardMaterial[] = [];
  KINDS.forEach((k, i) => {
    const mat = std({
      map: keep(facadeTex(k, 11 + i * 7)), vertexColors: true,
      roughness: k === "glass" ? 0.25 : 0.92, metalness: k === "glass" ? 0.5 : 0,
      emissive: 0xffffff, emissiveMap: keep(litTex(k, 51 + i * 13)), emissiveIntensity: 0,
    });
    lit.push(mat);
    merged(geos[k], mat);
  });
  const shopMats = SHOPS.map((_, i) => {
    const t = keep(shopTex(i));
    const m = std({ map: t, roughness: 0.6, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0 });
    merged(shopGeos[i], m);
    return m;
  });
  const unit = new THREE.BoxGeometry(1, 1, 1);
  inst(new THREE.BoxGeometry(1.25, 0.1, 1), std({ roughness: 0.85 }), awnings);
  inst(unit.clone(), std({ roughness: 0.9 }), cornices);
  const iron = std({ color: 0x141416, roughness: 0.7, metalness: 0.4 });
  inst(unit.clone(), iron, platforms);
  merged(escapes, std({ map: keep(fireEscapeTex()), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.3 }));
  { // rooftop water tanks
    const wood = new THREE.Color(0x6b5240), dark = new THREE.Color(0x2a2420);
    const parts: THREE.BufferGeometry[] = [
      tint(new THREE.CylinderGeometry(1.5, 1.5, 2.8, 14).translate(0, 4.2, 0), wood),
      tint(new THREE.ConeGeometry(1.7, 1, 14).translate(0, 6.1, 0), dark),
    ];
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(tint(new THREE.CylinderGeometry(0.07, 0.07, 2.8, 5).translate(x, 1.4, z), dark));
    const g = mergeGeometries(parts.map((p) => p.toNonIndexed()), false)!;
    parts.forEach((p) => p.dispose());
    inst(g, std({ vertexColors: true, roughness: 0.9 }), tanks);
  }

  /* ---------- ground ---------- */
  const len = zStart - zEnd, zMid = (zStart + zEnd) / 2;
  const roadGeos = [flat(ROAD * 2, len, 0, zMid, 0, 8)];
  for (const c of crossZ) for (const s of [-1, 1]) roadGeos.push(flat(110, 8, s * (ROAD + 55), c, 0, 8));
  const road = std({ map: keep(asphaltTex()), roughness: 0.9, metalness: 0 });
  merged(roadGeos, road);

  const paveGeos: THREE.BufferGeometry[] = [], kerbs: Tf[] = [];
  const crossRoad = crossZ.map((c) => [c - 4, c + 4] as [number, number]);
  for (const s of [-1, 1]) {
    for (const [lo, hi] of subtract(zEnd, zStart, crossRoad)) {
      paveGeos.push(flat(40 - ROAD, hi - lo, s * (ROAD + (40 - ROAD) / 2), (lo + hi) / 2, KERB, 3));
      kerbs.push({ p: [s * (ROAD + 0.12), KERB / 2, (lo + hi) / 2], s: [0.24, KERB, hi - lo] });
    }
    for (const c of crossZ) for (const zs of [-1, 1]) {
      paveGeos.push(flat(80, 2, s * 80, c + zs * 5, KERB, 3));
      kerbs.push({ p: [s * ((ROAD + 114) / 2), KERB / 2, c + zs * 4.12], s: [114 - ROAD, KERB, 0.24] });
    }
  }
  merged(paveGeos, std({ map: keep(pavementTex()), roughness: 0.95 }));
  inst(unit.clone(), std({ color: 0x8d8a84, roughness: 0.8 }), kerbs);

  // paint: lane dashes, parking lines, stop bars, crosswalks
  const paint: Tf[] = [];
  const P = 0.022;
  for (const [lo, hi] of subtract(zEnd, zStart, crossZ.map((c) => [c - 9, c + 9] as [number, number]))) {
    for (let z = hi - 2; z > lo + 2; z -= 9) paint.push({ p: [0, P, z], s: [0.14, 1, 3] });
    for (const s of [-1, 1]) paint.push({ p: [s * 3.25, P, (lo + hi) / 2], s: [0.1, 1, hi - lo - 1] });
  }
  for (const c of crossZ) {
    paint.push({ p: [0, P, c + 8.4], s: [6.4, 1, 0.45] });
    for (const zs of [-1, 1]) for (let x = -4.6; x <= 4.6; x += 1.15) paint.push({ p: [x, P, c + zs * 5.9], s: [0.55, 1, 3] });
    for (const s of [-1, 1]) for (let z = -3.2; z <= 3.2; z += 1.15) paint.push({ p: [s * (ROAD + 2.2), P, c + z], s: [3, 1, 0.55] });
  }
  inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), std({ color: 0xd9d6cc, roughness: 0.75, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), paint);

  /* ---------- street furniture ---------- */
  const poles: Tf[] = [], arms: Tf[] = [], heads: Tf[] = [], glows: Tf[] = [...shopGlow];
  const hydrants: Tf[] = [], bins: Tf[] = [], boxes: Tf[] = [], trees: Tf[] = [], cars: Tf[] = [], taxiSigns: Tf[] = [];
  const CAR = [0xf7b500, 0xf7b500, 0x1c1d21, 0xd9d9d6, 0x6d7278, 0x7a1f1f, 0x1f3a5f, 0xf7b500, 0xe9e6de];
  const LEAF = [0x5f7f3a, 0x8a8f36, 0xc98a2b, 0xb5622a, 0x6f8a44];
  for (const s of [-1, 1]) {
    let k = 0;
    for (let z = zStart - 3; z > zEnd + 4; z -= 5.6) {
      k++;
      if (!clear(s, z)) continue;
      const col = CAR[Math.floor(r() * CAR.length)];
      if (r() < 0.72) {
        cars.push({ p: [s * (ROAD - 1.1), 0, z], ry: Math.PI / 2, c: col });
        if (col === 0xf7b500) taxiSigns.push({ p: [s * (ROAD - 1.1), 1.58, z], s: [0.5, 0.17, 0.26] });
      }
      const kx = s * (ROAD + 0.75);
      if (k % 4 === 0) { // cobra-head street lamp
        poles.push({ p: [kx, 4.2, z + 2.6], s: [1, 8.4, 1] });
        arms.push({ p: [kx - s * 1.2, 8.3, z + 2.6], s: [2.5, 0.1, 0.1] });
        heads.push({ p: [kx - s * 2.5, 8.22, z + 2.6], s: [0.8, 0.14, 0.34] });
        glows.push({ p: [kx - s * 2.6, 0.04, z + 2.6], s: [13, 1, 13], c: 0xffd8a0 });
      } else if (k % 4 === 2 && !narrow) trees.push({ p: [kx + s * 0.3, KERB, z + 2.6], s: [1, 0.9 + r() * 0.5, 1], ry: r() * 6, c: pick(LEAF) });
      const roll = r();
      if (roll < 0.14) hydrants.push({ p: [kx, KERB, z] });
      else if (roll < 0.3) bins.push({ p: [kx, KERB + 0.45, z] });
      else if (roll < 0.42) boxes.push({ p: [kx, KERB + 0.55, z], s: [0.5, 1.1, 0.5], c: pick([0x1f4f9c, 0xb3261e, 0xe0a526, 0x2a7a4a]) });
    }
  }
  inst(new THREE.CylinderGeometry(0.09, 0.12, 1, 8), iron, poles);
  inst(unit.clone(), iron, arms);
  const lampHead = keep(new THREE.MeshBasicMaterial({ color: 0x77736c }));
  inst(unit.clone(), lampHead, heads);
  const soft = keep(softTex());
  const glowMat = keep(new THREE.MeshBasicMaterial({ map: soft, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  const glowMesh = inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), glowMat, glows);
  glowMesh.renderOrder = 2;
  { // hydrant
    const g = mergeGeometries([
      new THREE.CylinderGeometry(0.13, 0.16, 0.62, 10).translate(0, 0.31, 0),
      new THREE.SphereGeometry(0.14, 10, 6).translate(0, 0.64, 0),
      new THREE.CylinderGeometry(0.07, 0.07, 0.42, 8).rotateZ(Math.PI / 2).translate(0, 0.42, 0),
    ].map((p) => p.toNonIndexed()), false)!;
    inst(g, std({ color: 0xa3261e, roughness: 0.6, metalness: 0.2 }), hydrants);
  }
  inst(new THREE.CylinderGeometry(0.34, 0.27, 0.9, 12, 1, true), std({ color: 0x1f4d3a, roughness: 0.8, side: THREE.DoubleSide }), bins);
  inst(unit.clone(), std({ roughness: 0.6 }), boxes);
  { // street tree: trunk + clumps of leaves (leaf colour per tree)
    const trunk = new THREE.Color(0.32, 0.25, 0.2), leaf = new THREE.Color(1, 1, 1);
    const parts = [
      tint(new THREE.CylinderGeometry(0.1, 0.16, 3.4, 6).translate(0, 1.7, 0), trunk),
      tint(new THREE.IcosahedronGeometry(1.5, 1).translate(0, 4.4, 0), leaf),
      tint(new THREE.IcosahedronGeometry(1.1, 1).translate(0.9, 3.8, 0.4), leaf),
      tint(new THREE.IcosahedronGeometry(1.0, 1).translate(-0.8, 3.9, -0.5), leaf),
    ];
    const g = mergeGeometries(parts.map((p) => p.toNonIndexed()), false)!;
    parts.forEach((p) => p.dispose());
    g.computeVertexNormals();
    inst(g, std({ vertexColors: true, roughness: 1, flatShading: true }), trees);
  }
  // cars: body takes the per-car colour; glass and tyres stay dark
  const carGeo = (() => {
    const body = new THREE.Color(1, 1, 1), glass = new THREE.Color(0.2, 0.25, 0.3), tyre = new THREE.Color(0.04, 0.04, 0.04), trim = new THREE.Color(0.12, 0.12, 0.13);
    const cabin = new THREE.BoxGeometry(2.7, 0.5, 1.66);
    const cp = cabin.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < cp.count; i++) if (cp.getY(i) > 0) cp.setXYZ(i, cp.getX(i) * 0.66, cp.getY(i), cp.getZ(i) * 0.88); // raked glass
    const parts = [
      tint(new THREE.BoxGeometry(4.5, 0.5, 1.8).translate(0, 0.72, 0), body),
      tint(new THREE.BoxGeometry(4.6, 0.22, 1.84).translate(0, 0.42, 0), trim),
      tint(cabin.translate(-0.2, 1.22, 0), glass),
      tint(new THREE.BoxGeometry(1.75, 0.05, 1.44).translate(-0.2, 1.49, 0), body),
    ];
    for (const [x, z] of [[-1.45, -0.86], [1.45, -0.86], [-1.45, 0.86], [1.45, 0.86]])
      parts.push(tint(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 12).rotateX(Math.PI / 2).translate(x, 0.34, z), tyre));
    const g = mergeGeometries(parts.map((p) => p.toNonIndexed()), false)!;
    parts.forEach((p) => p.dispose());
    return g;
  })();
  const carMat = std({ vertexColors: true, roughness: 0.35, metalness: 0.45 });
  inst(carGeo, carMat, cars);
  const taxiSign = keep(new THREE.MeshBasicMaterial({ color: 0x8a7a50 }));
  inst(unit.clone(), taxiSign, taxiSigns);

  // cross traffic
  const movers = new THREE.InstancedMesh(carGeo, carMat, Math.max(1, crossZ.length * 2));
  movers.frustumCulled = false;
  const moverCol = new THREE.Color();
  for (let i = 0; i < crossZ.length * 2; i++) movers.setColorAt(i, moverCol.set(i % 2 ? pick(CAR) : 0xf7b500));
  add(movers);

  /* ---------- intersections: signals, signs, steam ---------- */
  const housings: Tf[] = [], reds: Tf[] = [], ambers: Tf[] = [], greens: Tf[] = [];
  const CROSS_NAMES = ["Prince St", "Spring St", "Broome St", "Grand St", "Canal St"];
  const blade = new THREE.PlaneGeometry(1.7, 0.32);
  keep(blade);
  const avenue = std({ map: keep(signTex("Broadway", "#1a6b3c")), roughness: 0.5 });
  const oneWay = std({ map: keep(oneWayTex()), side: THREE.DoubleSide, roughness: 0.5 });
  crossZ.forEach((c, ci) => {
    const zs = c - 6.6; // far side of the crossing, facing the walker
    // one mast per crossing, on the side away from the mural that stands just past it
    const nextWall = Array.from({ length: N }, (_, i) => i).find((i) => wallZ(i) < c);
    for (const s of [nextWall === undefined ? 1 : -wallSide(nextWall)]) {
      const px = s * (ROAD + 0.7);
      const pole = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.1, 0.13, 6.6, 8)), iron);
      pole.position.set(px, 3.3, zs);
      const arm = new THREE.Mesh(keep(new THREE.BoxGeometry(4.6, 0.12, 0.12)), iron);
      arm.position.set(px - s * 2.3, 6.3, zs);
      add(pole); add(arm);
      for (const hx of [px - s * 4.3, px - s * 0.45]) {
        const hy = hx === px - s * 4.3 ? 5.6 : 3.4;
        housings.push({ p: [hx, hy, zs + 0.05], s: [0.36, 1.12, 0.3] });
        reds.push({ p: [hx, hy + 0.34, zs + 0.21] });
        ambers.push({ p: [hx, hy, zs + 0.21] });
        greens.push({ p: [hx, hy - 0.34, zs + 0.21] });
      }
      const name = new THREE.Mesh(blade, std({ map: keep(signTex(CROSS_NAMES[ci % CROSS_NAMES.length], "#1a6b3c")), side: THREE.DoubleSide, roughness: 0.5 }));
      name.position.set(px + s * 0.95, 4.5, zs);
      const ave = new THREE.Mesh(blade, avenue);
      ave.position.set(px, 4.9, zs + 0.95);
      ave.rotation.y = Math.PI / 2;
      const ave2 = ave.clone();
      ave2.rotation.y = -Math.PI / 2;
      add(name); add(ave); add(ave2);
      const ow = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.0, 0.31)), oneWay);
      ow.position.set(px + s * 0.6, 3.9, zs);
      add(ow);
    }
  });
  inst(unit.clone(), std({ color: 0xd4a017, roughness: 0.6 }), housings);
  const bulbGeo = () => new THREE.CircleGeometry(0.11, 14);
  const red = keep(new THREE.MeshBasicMaterial({ color: 0x400808 }));
  const amber = keep(new THREE.MeshBasicMaterial({ color: 0x3a2a05 }));
  const green = keep(new THREE.MeshBasicMaterial({ color: 0x063a1c }));
  inst(bulbGeo(), red, reds); inst(bulbGeo(), amber, ambers); inst(bulbGeo(), green, greens);

  // steam stacks (the orange-and-white chimneys over Con Ed street vents)
  const puffs: { sp: THREE.Sprite; x: number; z: number; ph: number }[] = [];
  const stackMat = std({ map: keep(steamStackTex()), roughness: 0.8 });
  const stackGeo = keep(new THREE.CylinderGeometry(0.2, 0.26, 2.6, 12));
  const stackAt: [number, number][] = [];
  for (let i = 1; i < N; i += narrow ? 4 : 2) stackAt.push([wallSide(i) * -2.6, wallZ(i) + 7]);
  for (const [x, z] of stackAt) {
    const st = new THREE.Mesh(stackGeo, stackMat);
    st.position.set(x, 1.3, z);
    add(st);
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: soft, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })));
      add(sp);
      puffs.push({ sp, x, z, ph: k / 5 });
    }
  }

  /* ---------- skyline backdrop: an Art Deco tower down the avenue ---------- */
  const tower = new THREE.Group();
  const towerBody = keep(new THREE.MeshBasicMaterial({ fog: false }));
  const towerCrown = keep(new THREE.MeshBasicMaterial({ fog: false }));
  const tiers: [number, number, number][] = [[30, 0, 34], [22, 34, 30], [15, 64, 22], [10, 86, 9]];
  for (const [w, y, h] of tiers) {
    const m = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, w * 0.7)), towerBody);
    m.position.y = y + h / 2;
    tower.add(m);
  }
  const cap = new THREE.Mesh(keep(new THREE.CylinderGeometry(1.6, 4.5, 9, 8)), towerCrown);
  cap.position.y = 99.5;
  const spire = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.25, 0.9, 18, 6)), towerCrown);
  spire.position.y = 113;
  tower.add(cap, spire);
  add(tower);

  const NIGHT_TOWER = new THREE.Color(0x16181f), DAY_TOWER = new THREE.Color(0x8f98a6);
  const NIGHT_CROWN = new THREE.Color(0xf4f1e6), DAY_CROWN = new THREE.Color(0xa3a9b3);
  const tmp = new THREE.Color();
  const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  return {
    update(D, time, camera, horizon) {
      const night = 1 - smooth(0.25, 0.75, D);
      for (const m of lit) m.emissiveIntensity = 0.95 * night;
      for (const m of shopMats) m.emissiveIntensity = 0.8 * night;
      glowMat.opacity = 0.5 * night;
      lampHead.color.setHex(0x77736c).lerp(tmp.setHex(0xfff0d0), night);
      taxiSign.color.setHex(0x8a7a50).lerp(tmp.setHex(0xffe9a0), night);
      road.roughness = 0.9 - 0.42 * night; // rain-slick at night
      road.metalness = 0.22 * night;

      // signals: green → amber → red on a 14 s loop
      const ph = time % 14;
      green.color.setHex(ph < 6 ? 0x2dff7a : 0x063a1c);
      amber.color.setHex(ph >= 6 && ph < 8 ? 0xffc21a : 0x3a2a05);
      red.color.setHex(ph >= 8 ? 0xff2a1a : 0x400808);

      // cross traffic
      for (let i = 0; i < crossZ.length * 2; i++) {
        const dir = i % 2 ? 1 : -1;
        const x = reduce ? dir * 60 : dir * (((time * 9 + i * 37) % 160) - 80);
        dummy.position.set(x, 0, crossZ[i >> 1] + dir * 1.9);
        dummy.rotation.set(0, dir > 0 ? 0 : Math.PI, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        movers.setMatrixAt(i, dummy.matrix);
      }
      movers.instanceMatrix.needsUpdate = true;

      for (const p of puffs) {
        const a = reduce ? p.ph : (time * 0.16 + p.ph) % 1;
        p.sp.position.set(p.x + Math.sin(a * 5 + p.ph * 9) * 0.5 * a, 2.7 + a * 5.5, p.z);
        const sc = 0.9 + a * 4;
        p.sp.scale.set(sc, sc, 1);
        (p.sp.material as THREE.SpriteMaterial).opacity = Math.sin(a * Math.PI) * (0.3 + 0.12 * night);
        (p.sp.material as THREE.SpriteMaterial).color.setHex(0xd9d6d0).lerp(tmp.setHex(0xffe2c0), night * 0.5);
      }

      tower.position.set(0, 0, camera.position.z - 330);
      towerBody.color.lerpColors(NIGHT_TOWER, DAY_TOWER, D).lerp(horizon, 0.45);
      towerCrown.color.lerpColors(NIGHT_CROWN, DAY_CROWN, D).lerp(horizon, 0.15 + 0.3 * D);
    },
  };
}
