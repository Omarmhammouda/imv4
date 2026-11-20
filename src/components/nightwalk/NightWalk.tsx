"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import MuralLightbox from "@/components/work/MuralLightbox";
import { Cta } from "@/components/ui/Cta";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { withBase } from "@/lib/asset";
import { wallAsMural, type Wall } from "@/lib/walls";
import type { Mural } from "@/lib/content";
import { daylight } from "@/lib/daylight";
import { buildManhattan } from "./manhattan";
import styles from "./NightWalk.module.css";

const SPACING = 15; // street distance between walls
const pad = (n: number) => String(n).padStart(2, "0");

/* ------------------------------------------------------------ textures */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function loadImg(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous"; // walls may be hosted on Supabase Storage (WebGL needs CORS)
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** The mural photo, colour-accurate (sRGB, mip-mapped, sharp at an angle). */
function paintedWall(img: HTMLImageElement) {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/**
 * The painted face of a wall. Not a lit PBR surface: the photo already *is* the
 * mural, so we show its true colours and only shape the light over it —
 * at night a soft pool from the lamp above (never brighter than the photo
 * itself, so nothing washes out), by day even daylight. Skips tone mapping on
 * purpose; that's what was flattening and bleaching the paint before.
 */
function muralMaterial(map: THREE.Texture) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: {
      map: { value: map },
      uLamp: { value: 1 },
      uDay: { value: 0 },
      fogColor: { value: new THREE.Color() },
      fogDensity: { value: 0 },
      fogNear: { value: 1 },
      fogFar: { value: 2000 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float uLamp; // 0..1 how lit the nearby lamp is
      uniform float uDay;  // 0 night .. 1 day
      varying vec2 vUv;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        vec3 paint = texture2D(map, vUv).rgb;

        // night: pool of light from the lamp at the top centre of the wall
        float px = (vUv.x - 0.5) * 2.0;
        float py = 1.0 - vUv.y;
        float pool = exp(-(px * px * 0.55 + py * py * 0.85));
        float lamp = 0.16 + 0.84 * pool * mix(0.35, 1.0, uLamp);
        vec3 night = vec3(lamp) * mix(vec3(1.0), vec3(1.0, 0.95, 0.88), pool * uLamp * 0.6);

        // day: even, true-colour daylight with a soft shade at the foot of the wall
        float foot = 0.8 + 0.2 * smoothstep(0.0, 0.12, vUv.y);
        vec3 day = vec3((0.94 + 0.06 * vUv.y) * foot);

        gl_FragColor = vec4(paint * mix(night, day, uDay), 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}

/** Big gradient dome for the sky; colours are blended between night and day. */
function skyDome() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(150, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() } },
      vertexShader: /* glsl */ `
        varying float vH;
        void main() {
          vH = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop; uniform vec3 uHorizon;
        varying float vH;
        void main() {
          gl_FragColor = vec4(mix(uHorizon, uTop, smoothstep(0.0, 0.55, vH)), 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
}

/* night ↔ day palette */
const NIGHT = {
  skyTop: new THREE.Color(0x060609), horizon: new THREE.Color(0x0b0b0e), fog: 0.022,
  hemiSky: new THREE.Color(0x56608a), hemiGround: new THREE.Color(0x15141a), hemi: 1.0,
  sun: new THREE.Color(0x8a94c0), sunI: 0.55,
  street: new THREE.Color(0x0e0e11), streetRough: 0.38, streetMetal: 0.35,
  curb: new THREE.Color(0x1a1a1e), edge: new THREE.Color(0x2a2a30), bulb: new THREE.Color(0xfff2dc),
  exposure: 1.1,
};
const DAY = {
  skyTop: new THREE.Color(0x5f97cf), horizon: new THREE.Color(0xd7e2ec), fog: 0.011,
  hemiSky: new THREE.Color(0xe6eef8), hemiGround: new THREE.Color(0x8a8174), hemi: 1.5,
  sun: new THREE.Color(0xfff1dc), sunI: 2.4,
  street: new THREE.Color(0x55565a), streetRough: 0.92, streetMetal: 0.02,
  curb: new THREE.Color(0xa29d95), edge: new THREE.Color(0x9a958d), bulb: new THREE.Color(0x6f6c68),
  exposure: 0.95,
};

function glowTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.3, "rgba(255,236,210,.4)");
  gr.addColorStop(1, "rgba(255,230,200,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const smooth = (a: number, b: number, x: number) => {
  x = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/* ------------------------------------------------------------ component */
export default function NightWalk({ walls }: { walls: Wall[] }) {
  const N = walls.length;
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [flying, setFlying] = useState(false);
  const [open, setOpen] = useState<Mural | null>(null);
  const [noGL, setNoGL] = useState(false);
  const [isDay, setIsDay] = useState(false);
  useEffect(() => {
    const check = () => setIsDay(daylight() > 0.5);
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);
  const openRef = useRef(setOpen);
  const { scrollTo, start: startScroll } = useLenis();
  const startSite = useExperience((s) => s.start);

  // no loading screen: reveal the header and unlock scrolling right away
  useEffect(() => {
    startSite();
    startScroll();
  }, [startSite, startScroll]);

  const openWall = useCallback((i: number) => setOpen(wallAsMural(walls[i])), [walls]);
  openRef.current = (m) => setOpen(m);

  useEffect(() => {
    const host = stage.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const narrow = innerWidth < 720;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setNoGL(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, narrow ? 1.5 : 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = NIGHT.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const disposables: { dispose(): void }[] = [];
    const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2(0x0b0b0e, NIGHT.fog);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(narrow ? 72 : 55, innerWidth / innerHeight, 0.1, 400);

    const sky = skyDome();
    keep(sky.geometry); keep(sky.material);
    const skyU = (sky.material as THREE.ShaderMaterial).uniforms;
    sky.renderOrder = -1;
    scene.add(sky);

    const hemi = new THREE.HemisphereLight(0x4a5070, 0x0b0b0e, NIGHT.hemi);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0x8a94c0, NIGHT.sunI); // the moon at night
    sun.position.set(-10, 20, 10);
    scene.add(sun);

    // the street itself: a Manhattan avenue (see manhattan.ts)
    const city = buildManhattan(scene, { N, spacing: SPACING, narrow, reduce, keep });

    const glow = keep(glowTex());
    const edgeMat = keep(new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 }));
    const lamps: { spot: THREE.SpotLight; halo: THREE.Sprite; bulb: THREE.MeshBasicMaterial; group: THREE.Group; side: number }[] = [];
    const hits: THREE.Mesh[] = [];
    const fronts: THREE.ShaderMaterial[] = [];
    const wallX = narrow ? 7.6 : 9; // each mural stands in an open lot, clear of the sidewalk

    // dust in the lamp light
    const DUST = narrow ? 350 : 800;
    const dp = new Float32Array(DUST * 3);
    for (let k = 0; k < DUST; k++) {
      dp[k * 3] = (Math.random() - 0.5) * 18;
      dp[k * 3 + 1] = Math.random() * 8;
      dp[k * 3 + 2] = 10 - Math.random() * (N * SPACING + 20);
    }
    const dg = keep(new THREE.BufferGeometry());
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(
      dg,
      keep(new THREE.PointsMaterial({ color: 0xf0e6dc, size: 0.035, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })),
    );
    scene.add(dust);

    let alive = true;
    let ready = false;

    // the mural walls — each one sized to its photo so the paint covers it all
    Promise.all(walls.map((w) => loadImg(withBase(w.wall)))).then((imgs) => {
      if (!alive) return;
      imgs.forEach((img, i) => {
        const a = img.width / img.height;
        let wh = 6.2, ww = wh * a;
        if (ww > 13) { ww = 13; wh = ww / a; }
        if (ww < 3.6) { ww = 3.6; wh = ww / a; }
        if (wh > 7.4) { wh = 7.4; ww = wh * a; }
        const side = i % 2 === 0 ? -1 : 1;
        const tex = keep(paintedWall(img));
        const front = keep(muralMaterial(tex));
        fronts.push(front);
        const wall = new THREE.Mesh(keep(new THREE.BoxGeometry(ww, wh, 0.45)), [edgeMat, edgeMat, edgeMat, edgeMat, front, edgeMat]);
        wall.userData.i = i;
        const g = new THREE.Group();
        g.position.set(side * (wallX + ww * 0.25), wh / 2 + 0.18, -10 - i * SPACING);
        g.rotation.y = side < 0 ? 0.42 : -0.42;
        g.add(wall);

        const lampY = wh / 2 + 0.6;
        const arm = new THREE.Mesh(keep(new THREE.BoxGeometry(0.08, 0.08, 1.4)), keep(new THREE.MeshStandardMaterial({ color: 0x111114 })));
        arm.position.set(0, lampY, 0.9);
        const bulbMat = keep(new THREE.MeshBasicMaterial({ color: 0xfff2dc }));
        const bulb = new THREE.Mesh(keep(new THREE.SphereGeometry(0.11, 16, 12)), bulbMat);
        bulb.position.set(0, lampY - 0.1, 1.55);
        const halo = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glow, color: 0xffe6c4, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })));
        halo.scale.set(2.2, 2.2, 1);
        halo.position.copy(bulb.position);
        const spot = new THREE.SpotLight(0xffe8cc, 0, 16, 0.9, 0.7, 1.4);
        spot.position.set(0, lampY - 0.1, 2.2);
        spot.target.position.set(0, -wh * 0.15, 0);
        g.add(arm, bulb, halo, spot, spot.target);
        scene.add(g);
        lamps.push({ spot, halo, bulb: bulbMat, group: g, side });
        hits.push(wall);
      });
      ready = true;
    }).catch(() => setNoGL(true));

    /* scroll → position along the street */
    const targetT = () => {
      const top = track.current!.getBoundingClientRect().top;
      return Math.max(-1, Math.min(N - 1 + 0.35, -top / innerHeight - 1));
    };
    let t = targetT();
    let lastI = -1, lastFly: boolean | null = null;

    const ptr = { x: 0, y: 0 };
    const mouse = new THREE.Vector2();
    const ray = new THREE.Raycaster();
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / innerWidth) * 2 - 1;
      ptr.y = -((e.clientY / innerHeight) * 2 - 1);
      if (!ready || lastFly !== true) return;
      mouse.set(ptr.x, ptr.y);
      ray.setFromCamera(mouse, camera);
      document.documentElement.classList.toggle(styles.overWall, ray.intersectObjects(hits).length > 0);
    };
    const onClick = (e: MouseEvent) => {
      if (!ready || lastFly !== true) return;
      if ((e.target as HTMLElement).closest("a,button,[role=dialog],header,footer,nav")) return;
      mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
      ray.setFromCamera(mouse, camera);
      const h = ray.intersectObjects(hits)[0];
      if (h) openRef.current(wallAsMural(walls[h.object.userData.i as number]));
    };
    const onResize = () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener("pointermove", onMove);
    addEventListener("click", onClick);
    addEventListener("resize", onResize);

    // daylight: target from the clock (re-checked every minute), eased so dusk/dawn glides
    let dayTarget = daylight(), day = dayTarget, dayTex: boolean | null = null;
    const dayTimer = setInterval(() => { dayTarget = daylight(); }, 60_000);
    const edgeCol = edgeMat.color;

    const look = new THREE.Vector3(), tmp = new THREE.Vector3();
    const clock = new THREE.Clock();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;
      t += (targetT() - t) * (reduce ? 1 : 1 - Math.pow(0.0008, dt));

      const i = Math.max(0, Math.min(N - 1, Math.round(t)));
      const near = 1 - smooth(0.15, 0.5, Math.abs(t - i));
      const side = i % 2 === 0 ? -1 : 1;
      const camZ = -10 - t * SPACING + 9.5;
      camera.position.set(
        side * 0.5 * near + (reduce ? 0 : ptr.x * 0.3),
        2.3 + (reduce ? 0 : ptr.y * 0.15 + Math.sin(time * 1.4) * 0.03 * (1 - near)),
        camZ,
      );
      look.set(0, 2.3, camZ - 12);
      if (lamps[i]) {
        lamps[i].group.getWorldPosition(tmp);
        tmp.y = Math.max(2.4, tmp.y * 0.9);
        look.lerp(tmp, near);
      }
      camera.lookAt(look);

      day += (dayTarget - day) * Math.min(1, dt * 0.8);
      const D = day, nightness = 1 - D;
      skyU.uTop.value.lerpColors(NIGHT.skyTop, DAY.skyTop, D);
      skyU.uHorizon.value.lerpColors(NIGHT.horizon, DAY.horizon, D);
      fog.color.copy(skyU.uHorizon.value);
      fog.density = THREE.MathUtils.lerp(NIGHT.fog, DAY.fog, D);
      sky.position.copy(camera.position);
      hemi.color.lerpColors(NIGHT.hemiSky, DAY.hemiSky, D);
      hemi.groundColor.lerpColors(NIGHT.hemiGround, DAY.hemiGround, D);
      hemi.intensity = THREE.MathUtils.lerp(NIGHT.hemi, DAY.hemi, D);
      sun.color.lerpColors(NIGHT.sun, DAY.sun, D);
      sun.intensity = THREE.MathUtils.lerp(NIGHT.sunI, DAY.sunI, D);
      sun.position.set(THREE.MathUtils.lerp(-10, 14, D), 20, THREE.MathUtils.lerp(10, 4, D));
      edgeCol.lerpColors(NIGHT.edge, DAY.edge, D);
      renderer.toneMappingExposure = THREE.MathUtils.lerp(NIGHT.exposure, DAY.exposure, D);
      city.update(D, time, camera, skyU.uHorizon.value);

      lamps.forEach((l, k) => {
        const on = 1 - smooth(0.6, 2.2, Math.abs(t - k));
        l.spot.intensity = 14 * (0.25 + 0.75 * on) * nightness;
        if (fronts[k]) {
          fronts[k].uniforms.uLamp.value = on;
          fronts[k].uniforms.uDay.value = D;
        }
        (l.halo.material as THREE.SpriteMaterial).opacity = (0.25 + 0.4 * on) * nightness;
        l.bulb.color.lerpColors(NIGHT.bulb, DAY.bulb, D);
      });
      (dust.material as THREE.PointsMaterial).opacity = 0.5 * nightness;
      if (!reduce) {
        dust.rotation.y = Math.sin(time * 0.05) * 0.02;
        dust.position.y = Math.sin(time * 0.3) * 0.15;
      }

      const fly = t > -0.55 && track.current!.getBoundingClientRect().bottom > innerHeight * 0.55;
      if (fly !== lastFly) { lastFly = fly; setFlying(fly); }
      if (i !== lastI) { lastI = i; setCurrent(i); }

      renderer.render(scene, camera);
    };
    frame();

    return () => {
      alive = false;
      clearInterval(dayTimer);
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      removeEventListener("click", onClick);
      removeEventListener("resize", onResize);
      document.documentElement.classList.remove(styles.overWall);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [walls, N]);

  const w = walls[current];
  const jump = (i: number) => {
    const top = track.current!.offsetTop + (i + 1) * innerHeight;
    scrollTo(top);
  };

  return (
    <>
      <div ref={stage} className={`${styles.stage} ${noGL ? styles.hidden : ""}`} aria-hidden="true" />
      <div className={`${styles.vignette} ${isDay ? styles.day : ""}`} aria-hidden="true" />

      <div ref={track} className={styles.track}>
        <section className={`${styles.hero} ${flying ? styles.away : ""}`}>
          <p className={styles.hud}>01 / Vision</p>
          <h1 className={styles.headline}>
            <span>We paint</span>
            <span>the walls</span>
            <span>of <em>tomorrow</em></span>
          </h1>
          <p className={styles.body}>
            Insomnia Murals is a nocturnal studio for large-scale murals and brand identity. Walk the
            street below: every wall on it is one we&apos;ve signed.
          </p>
          <div className={styles.ctas}>
            <Cta href="/work" variant="solid">View the work</Cta>
            <Cta href="/about" variant="outline">Enter the studio</Cta>
          </div>
          <div className={styles.cue}>
            <span>{isDay ? "Scroll to walk the street" : "Scroll to walk the night"}</span>
            <span className={styles.cueLine} />
          </div>
        </section>
        {!noGL && <div style={{ height: `${(N - 1) * 100 + 70}vh` }} />}
      </div>

      {noGL && (
        <section className={styles.fallback}>
          {walls.map((x, i) => (
            <button key={x.title} type="button" onClick={() => openWall(i)}>
              <img src={withBase(x.photo)} alt={`${x.title} mural`} loading="lazy" />
              <span>{x.title}</span>
            </button>
          ))}
        </section>
      )}

      {!noGL && (
        <>
          <div className={`${styles.wallHud} ${flying ? styles.show : ""}`} aria-live="polite">
            <p className={styles.hud}>
              Wall {pad(current + 1)} / {pad(N)}
            </p>
            <h2 className={styles.wallTitle}>{w.title}</h2>
            <p className={styles.meta}>
              {[w.client, w.place, w.year, w.size].filter(Boolean).join("  ·  ")}
            </p>
            <div className={styles.ctas}>
              <Cta variant="solid" size="sm" onClick={() => openWall(current)}>See the photo</Cta>
              <Cta href="/work" variant="outline" size="sm">All work</Cta>
            </div>
          </div>

          <nav className={`${styles.rail} ${flying ? styles.show : ""}`} aria-label="Jump to a wall">
            {walls.map((x, i) => (
              <button
                key={x.title}
                type="button"
                className={i === current ? styles.on : ""}
                aria-label={`Wall ${i + 1}: ${x.title}`}
                aria-current={i === current}
                onClick={() => jump(i)}
              />
            ))}
          </nav>
        </>
      )}

      <section className={styles.outro}>
        <p className={styles.hud}>06 / Legacy</p>
        <h2 className={styles.headline}>
          <span>And leaves</span>
          <span>a mark that <em>lasts</em></span>
        </h2>
        <p className={styles.body}>
          Paint fades; landmarks don&apos;t. We document, protect and maintain every mural so the
          work keeps speaking long after the lift drives away.
        </p>
        <div className={styles.ctas}>
          <Cta href="/contact" variant="solid">Start a project</Cta>
          <Cta href="/work" variant="outline">Every wall we&apos;ve signed</Cta>
        </div>
      </section>

      <MuralLightbox mural={open} onClose={() => setOpen(null)} />
    </>
  );
}
