# Insomnia Murals

A cinematic, "AAA game main-menu" website for a nocturnal mural + brand-identity studio.
Branded preloader → "Press Start", a sequence of full-screen chapters over generated motion
backgrounds, a WebGL hero spray-can that reacts to scroll + cursor, and a region "map" of the work.

Black & white with a single red accent. Built for spectacle **and** legibility (WCAG AA),
keyboard access, reduced-motion support, and fast loads.

## Stack

- **Next.js 16** (App Router) + **TypeScript**, statically generated
- **GSAP + ScrollTrigger** — chapter reveals, transitions, preloader
- **Lenis** — weighty smooth scroll, synced to GSAP's ticker + ScrollTrigger
- **Three.js / React-Three-Fiber + drei + postprocessing** — hero spray can, GPU particle
  fields, custom GLSL mist burst, bloom / DOF / grain / vignette / chromatic aberration
- **Zustand** — shared state between the React UI and the R3F frame loop (no per-frame re-renders)
- Plain CSS Modules on a design-token system (no UI framework)

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm run start
```

## Project shape

```
src/
  app/                     # routes: / (experience), /work /about /services /process /contact
  components/
    preloader/             # staged 0→100 loader → "Press Start" reveal
    hero/                  # R3F Canvas, SprayCan (GLB + procedural fallback), particles, FX, rig
    chapters/              # VideoStage, Chapter, ChapterNav, MediaControls, HomeExperience
    layout/                # Header, Menu, Footer, FloatingContact, SoundToggle
    cursor/ ui/ site/ work/ contact/
  lib/
    store.ts               # zustand experience store
    chapters.ts            # the 6 chapter beats (edit copy here)
    projects.ts            # the work regions + counts (edit portfolio here)
    shaders/               # GLSL for ambient dust + spray burst
    motion.ts useGSAP.ts sound.ts
public/
  videos/  posters/  models/spray-can.glb  textures/can-cutout.png
```

## Design tokens

Everything (colour, type scale, spacing/8pt grid, radius, motion easings, z-index) lives in
CSS custom properties at the top of `src/app/globals.css`. Change the brand there and it
propagates everywhere. Fonts: Syne (display), Inter (body), Space Mono (HUD).

## Generated assets

Backgrounds, the spray-can image and 3D model were generated with the Higgsfield MCP
(Seedance 2.0 video, nano-banana image, Meshy image-to-3D) and optimised locally:

- `scripts/loopify.sh` — crossfade-loops a clip, scales it, strips audio, emits `.mp4` + `.webm`
  + a poster JPG. Re-run it on any new source clip.
- The GLB was compressed with `@gltf-transform/cli optimize --compress meshopt
  --texture-compress webp --texture-size 1024` (11.8 MB → ~0.5 MB).

All chapter videos are muted, lazy-loaded, poster-framed, and pause when off-screen / on user
pause / under reduced motion.

## Accessibility & performance

- Semantic landmarks, skip link, visible focus rings, full keyboard nav (menu, ←/→ chapters,
  Enter/Space to start, Esc to close).
- Text always renders on a crisp DOM layer **above** the canvas post-processing, with a scrim/
  plate behind copy over busy footage. Red is never the sole carrier of meaning.
- `prefers-reduced-motion` pares back parallax, particle drift, autoplay and the preloader.
- Background video + WebGL are pausable; UI sound is opt-in. WebGL has a graceful no-canvas
  fallback; the spray can falls back to procedural geometry if the GLB fails to load.
- Lower DPR, fewer particles and a lighter post FX chain on small / portrait devices.
