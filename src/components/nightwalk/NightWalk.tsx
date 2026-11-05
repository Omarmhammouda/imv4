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

/** The mural photo as a clean wall face — no brick or texture over it. */
function paintedWall(img: HTMLImageElement) {
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function concreteTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = rng(7);
  g.fillStyle = "#18181b";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},255,${r() * 0.05})`;
    g.fillRect(r() * 256, r() * 256, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function windowsTex(seed: number) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const g = c.getContext("2d")!;
  const r = rng(seed);
  g.fillStyle = "#0b0b0e";
  g.fillRect(0, 0, 128, 256);
  for (let y = 12; y < 250; y += 22)
    for (let x = 10; x < 120; x += 26) {
      const lit = r() < 0.1;
      g.fillStyle = lit ? `rgba(255,${215 + r() * 30 | 0},170,${0.5 + r() * 0.4})` : "rgba(38,38,44,.6)";
      g.fillRect(x, y, 14, 12);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

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
    renderer.toneMappingExposure = 1.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0b0e);
    scene.fog = new THREE.FogExp2(0x0b0b0e, 0.022);
    const camera = new THREE.PerspectiveCamera(narrow ? 72 : 55, innerWidth / innerHeight, 0.1, 200);

    scene.add(new THREE.HemisphereLight(0x4a5070, 0x0b0b0e, 0.5));
    const moon = new THREE.DirectionalLight(0x8a94c0, 0.25);
    moon.position.set(-10, 20, 10);
    scene.add(moon);

    const disposables: { dispose(): void }[] = [];
    const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

    // wet street + curbs
    const len = N * SPACING + 80;
    const street = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(60, len)),
      keep(new THREE.MeshStandardMaterial({ color: 0x0e0e11, roughness: 0.38, metalness: 0.35 })),
    );
    street.rotation.x = -Math.PI / 2;
    street.position.z = -len / 2 + 30;
    scene.add(street);
    const curbMat = keep(new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.9 }));
    for (const s of [-1, 1]) {
      const curb = new THREE.Mesh(keep(new THREE.BoxGeometry(5, 0.18, len)), curbMat);
      curb.position.set(s * 8.5, 0.09, -len / 2 + 30);
      scene.add(curb);
    }

    // dark buildings behind the walls
    const conc = keep(concreteTex());
    const concMat = keep(new THREE.MeshStandardMaterial({ map: conc }));
    for (let i = -2; i < N + 4; i++) {
      [-1, 1].forEach((s, k) => {
        const h = 10 + (((i * 7 + k * 3) % 5) + 5) % 5 * 3;
        const win = (seed: number) => {
          const t = keep(windowsTex(seed));
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(1.5, h / 9); // keep windows window-sized on tall facades
          return keep(new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.32, roughness: 1 }));
        };
        const b = new THREE.Mesh(keep(new THREE.BoxGeometry(9, h, 12)), [
          win(i * 31 + k), win(i * 31 + k + 5), concMat, concMat, concMat, concMat,
        ]);
        b.position.set(s * 16, h / 2, -i * SPACING - 4);
        scene.add(b);
      });
    }

    const glow = keep(glowTex());
    const edgeMat = keep(new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 }));
    const lamps: { spot: THREE.SpotLight; halo: THREE.Sprite; group: THREE.Group; side: number }[] = [];
    const hits: THREE.Mesh[] = [];
    const fronts: THREE.MeshStandardMaterial[] = [];
    const wallX = narrow ? 5 : 6.3;

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
        const front = keep(new THREE.MeshStandardMaterial({
          map: tex, roughness: 0.82,
          emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.35,
        }));
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
        const bulb = new THREE.Mesh(keep(new THREE.SphereGeometry(0.11, 16, 12)), keep(new THREE.MeshBasicMaterial({ color: 0xfff2dc })));
        bulb.position.set(0, lampY - 0.1, 1.55);
        const halo = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glow, color: 0xffe6c4, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending })));
        halo.scale.set(2.2, 2.2, 1);
        halo.position.copy(bulb.position);
        const spot = new THREE.SpotLight(0xfff0dc, 0, 22, 0.95, 0.65, 1.3);
        spot.position.set(0, lampY - 0.1, 2.2);
        spot.target.position.set(0, -wh * 0.15, 0);
        g.add(arm, bulb, halo, spot, spot.target);
        scene.add(g);
        lamps.push({ spot, halo, group: g, side });
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
        -side * 2.2 * near + (reduce ? 0 : ptr.x * 0.3),
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

      lamps.forEach((l, k) => {
        const on = 1 - smooth(0.6, 2.2, Math.abs(t - k));
        l.spot.intensity = 55 * (0.2 + 0.8 * on);
        if (fronts[k]) fronts[k].emissiveIntensity = 0.12 + 0.55 * on;
        (l.halo.material as THREE.SpriteMaterial).opacity = 0.25 + 0.4 * on;
      });
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
      <div className={styles.vignette} aria-hidden="true" />

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
            <span>Scroll to walk the night</span>
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
