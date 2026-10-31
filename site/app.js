import * as THREE from '/vendor/three.module.js';

const ALL = window.WORKS;
const WALLS = ALL.filter(w => w.photo);          // works that get a wall on the street
const N = WALLS.length;
const S = 15;                                     // distance between walls
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');

/* ---------------- archive list ---------------- */
$('sCount').textContent = ALL.length;
const list = $('list');
ALL.forEach((w, i) => {
  const el = document.createElement(w.photo ? 'button' : 'div');
  el.className = 'item';
  el.innerHTML = `<small>${pad(i + 1)}</small><span class="t">${w.title}</span>
    <small>${[w.client, w.place].filter(Boolean).join(' · ')}</small>
    <small>${[w.year, w.size].filter(Boolean).join(' · ')}</small>
    <span class="go">${w.photo ? 'View →' : ''}</span>`;
  if (w.photo) el.addEventListener('click', () => openOv(WALLS.indexOf(w)));
  list.appendChild(el);
});

/* ---------------- photo overlay ---------------- */
const ov = $('ov'); let ovIdx = 0, lastFocus = null;
function metaRows(w) {
  return [['Client', w.client], ['Location', w.place], ['Year', w.year], ['Size', w.size]].filter(r => r[1]);
}
function fillOv(i) {
  ovIdx = (i + N) % N; const w = WALLS[ovIdx];
  $('oImg').src = `/img/photo-${w.photo}.jpg`;
  $('oImg').alt = `${w.title} — mural by Insomnia Murals${w.place ? ', ' + w.place : ''}`;
  $('oNum').textContent = `Wall ${pad(ovIdx + 1)} / ${pad(N)}`;
  $('oTitle').textContent = w.title;
  $('oDl').innerHTML = metaRows(w).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}
function openOv(i) { lastFocus = document.activeElement; fillOv(i); ov.classList.add('open'); $('oClose').focus(); }
function closeOv() { ov.classList.remove('open'); lastFocus && lastFocus.focus(); }
$('oClose').onclick = closeOv;
$('oPrev').onclick = () => fillOv(ovIdx - 1);
$('oNext').onclick = () => fillOv(ovIdx + 1);
ov.addEventListener('click', e => { if (e.target === ov || e.target.tagName === 'FIGURE') closeOv(); });
addEventListener('keydown', e => {
  if (!ov.classList.contains('open')) return;
  if (e.key === 'Escape') closeOv();
  if (e.key === 'ArrowRight') fillOv(ovIdx + 1);
  if (e.key === 'ArrowLeft') fillOv(ovIdx - 1);
});

/* ---------------- WebGL check / fallback ---------------- */
function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (!webglOK()) {
  document.body.classList.add('fallback');
  $('fbgrid').innerHTML = WALLS.map((w, i) =>
    `<button data-i="${i}"><img src="/img/photo-${w.photo}.jpg" alt="${w.title}" loading="lazy"></button>`).join('');
  $('fbgrid').onclick = e => { const b = e.target.closest('button'); b && openOv(+b.dataset.i); };
  $('loader').classList.add('done');
} else {
  start();
}

/* ---------------- textures ---------------- */
function rand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// Brick wall with the mural painted onto it
function paintWall(img, wallW, wallH, seed) {
  const cw = 1600, ch = Math.round(cw * wallH / wallW);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d'); const r = rand(seed * 977 + 13);
  const pxU = cw / wallW, bh = 0.2 * pxU, bw = 0.52 * pxU, m = Math.max(2, bh * 0.12);

  // mortar + bricks
  g.fillStyle = '#2a201b'; g.fillRect(0, 0, cw, ch);
  for (let y = 0, row = 0; y < ch; y += bh, row++) {
    for (let x = (row % 2 ? -bw / 2 : 0); x < cw; x += bw) {
      const v = 0.75 + r() * 0.35;
      g.fillStyle = `rgb(${92 * v | 0},${58 * v | 0},${44 * v | 0})`;
      g.fillRect(x + m / 2, y + m / 2, bw - m, bh - m);
    }
  }
  // mural, inset from the edges
  const inset = 0.35 * pxU;
  const mw = cw - inset * 2, mh = ch - inset * 2;
  g.save();
  g.globalAlpha = 0.97;
  g.drawImage(img, inset, inset, mw, mh);
  g.restore();
  // brick texture showing through the paint
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55;
  for (let y = 0, row = 0; y < ch; y += bh, row++) {
    g.fillStyle = '#5a4a40'; g.fillRect(0, y, cw, m);
    for (let x = (row % 2 ? -bw / 2 : 0); x < cw; x += bw) g.fillRect(x, y, m, bh);
  }
  g.restore();
  // grime: darker at the base, a few stains
  const gr = g.createLinearGradient(0, ch * 0.7, 0, ch);
  gr.addColorStop(0, 'rgba(10,8,6,0)'); gr.addColorStop(1, 'rgba(10,8,6,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
  for (let k = 0; k < 40; k++) {
    g.fillStyle = `rgba(20,15,10,${0.04 + r() * 0.06})`;
    g.beginPath(); g.ellipse(r() * cw, r() * ch, 20 + r() * 120, 10 + r() * 60, r() * 3, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function concreteTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); const r = rand(7);
  g.fillStyle = '#1a1714'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${r() > .5 ? 255 : 0},${r() > .5 ? 240 : 0},220,${r() * .05})`; g.fillRect(r() * 256, r() * 256, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}

function windowsTex(seed) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const g = c.getContext('2d'); const r = rand(seed);
  g.fillStyle = '#0d0b0a'; g.fillRect(0, 0, 128, 256);
  for (let y = 12; y < 250; y += 22) for (let x = 10; x < 120; x += 26) {
    const lit = r() < 0.1;
    g.fillStyle = lit ? `rgba(255,${190 + r() * 40 | 0},120,${0.55 + r() * 0.4})` : 'rgba(40,36,34,.6)';
    g.fillRect(x, y, 14, 12);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------------- scene ---------------- */
async function start() {
  const narrow = innerWidth < 720;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, narrow ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  $('stage').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0908);
  scene.fog = new THREE.FogExp2(0x0b0908, 0.04);

  const camera = new THREE.PerspectiveCamera(narrow ? 72 : 55, innerWidth / innerHeight, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0x46506e, 0x0b0908, 0.5));
  const moon = new THREE.DirectionalLight(0x8090c0, 0.25); moon.position.set(-10, 20, 10); scene.add(moon);

  // wet street
  const len = N * S + 80;
  const street = new THREE.Mesh(
    new THREE.PlaneGeometry(60, len),
    new THREE.MeshStandardMaterial({ color: 0x0f0d0c, roughness: 0.38, metalness: 0.35 })
  );
  street.rotation.x = -Math.PI / 2; street.position.z = -len / 2 + 30; scene.add(street);
  // sidewalk curbs
  const curbMat = new THREE.MeshStandardMaterial({ color: 0x1b1816, roughness: .9 });
  [-1, 1].forEach(s => {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(5, 0.18, len), curbMat);
    curb.position.set(s * 8.5, 0.09, -len / 2 + 30); scene.add(curb);
  });

  // dark buildings behind the walls, with a few lit windows
  const conc = concreteTex();
  for (let i = -2; i < N + 4; i++) {
    [-1, 1].forEach((s, k) => {
      const h = 10 + ((i * 7 + k * 3) % 5) * 3;
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(9, h, 12),
        [new THREE.MeshStandardMaterial({ map: windowsTex(i * 31 + k), emissive: 0xffffff, emissiveMap: windowsTex(i * 31 + k), emissiveIntensity: .32, roughness: 1 }),
         new THREE.MeshStandardMaterial({ map: windowsTex(i * 31 + k + 5), emissive: 0xffffff, emissiveMap: windowsTex(i * 31 + k + 5), emissiveIntensity: .32, roughness: 1 }),
         new THREE.MeshStandardMaterial({ map: conc }), new THREE.MeshStandardMaterial({ map: conc }),
         new THREE.MeshStandardMaterial({ map: conc }), new THREE.MeshStandardMaterial({ map: conc })]
      );
      b.position.set(s * 16, h / 2, -i * S - 4);
      scene.add(b);
    });
  }

  // the mural walls
  const walls = []; const hit = [];
  const wallX = narrow ? 5 : 6.3;
  let loaded = 0;
  const imgs = await Promise.all(WALLS.map(w => loadImg(`/img/wall-${w.photo}.jpg`).then(img => {
    loaded++; $('lbar').style.width = (loaded / N * 100) + '%'; return img;
  })));

  const edgeMat = new THREE.MeshStandardMaterial({ map: conc, color: 0x6a5a50, roughness: .95 });
  WALLS.forEach((w, i) => {
    const img = imgs[i]; const a = img.width / img.height;
    let ww = 5.6 * a, wh = 5.6;
    if (ww > 13) { ww = 13; wh = 13 / a; }
    if (ww < 4.2) { ww = 4.2; wh = 4.2 / a; }
    if (wh > 7.2) { wh = 7.2; ww = 7.2 * a; }
    ww += 0.7; wh += 0.7;                                    // brick border around the paint
    const side = i % 2 === 0 ? -1 : 1;
    const front = new THREE.MeshStandardMaterial({ map: paintWall(img, ww, wh, i + 1), roughness: 0.82, metalness: 0 });
    const wall = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, 0.5), [edgeMat, edgeMat, edgeMat, edgeMat, front, edgeMat]);
    const g = new THREE.Group();
    g.position.set(side * (wallX + ww * 0.25), wh / 2 + 0.18, -10 - i * S);
    g.rotation.y = side < 0 ? 0.62 : -0.62;
    g.add(wall);

    // lamp arm + bulb + spotlight washing the wall
    const lampY = wh / 2 + 0.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0x111 }));
    arm.position.set(0, lampY, 0.9); g.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
    bulb.position.set(0, lampY - 0.1, 1.55); g.add(bulb);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc27a, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(2.2, 2.2, 1); glow.position.copy(bulb.position); g.add(glow);
    const spot = new THREE.SpotLight(0xffc68c, 0, 22, 0.95, 0.65, 1.3);
    spot.position.set(0, lampY - 0.1, 2.2); spot.target.position.set(0, -wh * 0.15, 0);
    g.add(spot); g.add(spot.target);

    scene.add(g);
    wall.userData.i = i;
    walls.push({ g, spot, glow, side, w }); hit.push(wall);
  });

  function glowTex() {
    if (glowTex.t) return glowTex.t;
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,220,170,.4)'); gr.addColorStop(1, 'rgba(255,200,140,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (glowTex.t = new THREE.CanvasTexture(c));
  }

  // drifting dust in the lamp light
  const DUST = narrow ? 350 : 800;
  const dp = new Float32Array(DUST * 3);
  for (let k = 0; k < DUST; k++) { dp[k * 3] = (Math.random() - .5) * 18; dp[k * 3 + 1] = Math.random() * 8; dp[k * 3 + 2] = 10 - Math.random() * (N * S + 20); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xe8c48a, size: 0.035, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  /* -------- scroll track, HUD, rail -------- */
  $('flight').style.height = `${(N - 1) * 100 + 70}vh`;
  const rail = $('rail');
  WALLS.forEach((w, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Wall ${i + 1}: ${w.title}`);
    b.onclick = () => scrollTo({ top: (i + 1) * innerHeight, behavior: reduce ? 'auto' : 'smooth' });
    rail.appendChild(b);
  });
  const railBtns = [...rail.children];

  let cur = -1, hudIdx = -1;
  function setHud(i) {
    if (i === hudIdx) return; hudIdx = i;
    const hud = $('hud'); hud.classList.add('swap');
    setTimeout(() => {
      const w = WALLS[i];
      $('hNum').textContent = `Wall ${pad(i + 1)} / ${pad(N)}`;
      $('hTitle').textContent = w.title;
      $('hMeta').innerHTML = [w.client && `<b>${w.client}</b>`, w.place, w.year, w.size].filter(Boolean).join(' · ');
      hud.classList.remove('swap');
    }, 220);
    railBtns.forEach((b, k) => b.classList.toggle('on', k === i));
  }
  $('hView').onclick = () => openOv(hudIdx < 0 ? 0 : hudIdx);

  const targetT = () => {
    const t = scrollY / innerHeight - 1;
    return Math.max(-1, Math.min(N - 1 + 0.35, t));
  };
  let t = targetT();

  /* -------- pointer: parallax + click a wall -------- */
  const mouse = new THREE.Vector2(), ptr = { x: 0, y: 0 }; const ray = new THREE.Raycaster();
  addEventListener('pointermove', e => {
    ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight * 2 - 1);
    mouse.set(ptr.x, ptr.y);
    if (!document.body.classList.contains('flying')) return;
    ray.setFromCamera(mouse, camera);
    renderer.domElement.style.cursor = ray.intersectObjects(hit).length ? 'pointer' : '';
  });
  // the canvas sits under the scroll track, so listen on window and ignore UI clicks
  addEventListener('click', e => {
    if (e.target.closest('a,button,.ov,main,footer,header,.hud')) return;
    mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1));
    ray.setFromCamera(mouse, camera);
    const h = ray.intersectObjects(hit)[0];
    if (h) openOv(h.object.userData.i);
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* -------- frame loop -------- */
  const look = new THREE.Vector3(), tmp = new THREE.Vector3(), clock = new THREE.Clock();
  const sm = (a, b, x) => { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
    t += (targetT() - t) * (reduce ? 1 : 1 - Math.pow(0.0008, dt));

    const i = Math.max(0, Math.min(N - 1, Math.round(t)));
    const near = 1 - sm(0.15, 0.5, Math.abs(t - i));         // 1 when parked at a wall
    const side = walls[i].side;

    // walk down the street, drifting to the side opposite the wall you're looking at
    const camZ = -10 - t * S + 9.5;
    const camX = -side * 1.6 * near + (reduce ? 0 : ptr.x * 0.35);
    const camY = 2.3 + (reduce ? 0 : ptr.y * 0.15 + Math.sin(time * 1.4) * 0.03 * (1 - near));
    camera.position.set(camX, camY, camZ);

    walls[i].g.getWorldPosition(tmp); tmp.y = Math.max(2.4, tmp.y * 0.85);
    look.set(0, 2.3, camZ - 12).lerp(tmp, near * 0.9);
    camera.lookAt(look);

    // lights come on as you approach each wall
    walls.forEach((w, k) => {
      const d = Math.abs(t - k);
      const on = 1 - sm(0.6, 2.2, d);
      w.spot.intensity = 42 * (0.18 + 0.82 * on) * (1 + (reduce ? 0 : Math.sin(time * 9 + k) * 0.015));
      w.glow.material.opacity = 0.25 + 0.4 * on;
    });

    if (!reduce) { dust.rotation.y = Math.sin(time * .05) * .02; dust.position.y = Math.sin(time * .3) * .15; }

    const flying = t > -0.55 && scrollY < $('track').offsetHeight - innerHeight * 0.55;
    document.body.classList.toggle('flying', flying);
    if (flying) setHud(i);

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
  setTimeout(() => $('loader').classList.add('done'), 250);
}
