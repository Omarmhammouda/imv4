"use client";

import { create } from "zustand";

/**
 * Central experience store.
 *
 * High-frequency transient values (pointer, scrollProgress) are written with
 * `setState` but are intentionally NOT selected by any React component — the
 * R3F render loop reads them via `useExperience.getState()` each frame, so they
 * never trigger React re-renders. UI state (menu, settings, activeChapter) is
 * selected normally.
 */

export type Pointer = { x: number; y: number };

export interface ExperienceState {
  /* ---- lifecycle ---- */
  progress: number; // 0..1 preloader progress
  ready: boolean; // assets + min time elapsed → "Ready to Explore"
  started: boolean; // user pressed start → hero revealed, scroll unlocked

  /* ---- runtime (transient, read in rAF) ---- */
  activeChapter: number; // 0..N-1
  scrollProgress: number; // 0..1 across the chapter sequence
  pointer: Pointer; // normalised -1..1
  sprayTick: number; // increments to fire a spray burst in the 3D scene

  /* ---- settings ---- */
  reducedMotion: boolean;
  soundOn: boolean;
  videoPaused: boolean;
  menuOpen: boolean;
  canReady: boolean; // GLB / scene initialised

  /* ---- actions ---- */
  setProgress: (v: number) => void;
  setReady: (v: boolean) => void;
  start: () => void;
  setActiveChapter: (i: number) => void;
  setScrollProgress: (v: number) => void;
  setPointer: (p: Pointer) => void;
  fireSpray: () => void;
  setReducedMotion: (v: boolean) => void;
  toggleSound: () => void;
  toggleVideo: () => void;
  setMenuOpen: (v: boolean) => void;
  setCanReady: (v: boolean) => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  progress: 0,
  ready: false,
  started: false,

  activeChapter: 0,
  scrollProgress: 0,
  pointer: { x: 0, y: 0 },
  sprayTick: 0,

  reducedMotion: false,
  soundOn: false,
  videoPaused: false,
  menuOpen: false,
  canReady: false,

  setProgress: (v) => set({ progress: Math.max(0, Math.min(1, v)) }),
  setReady: (v) => set({ ready: v }),
  start: () => set({ started: true }),
  setActiveChapter: (i) => set({ activeChapter: i }),
  setScrollProgress: (v) => set({ scrollProgress: v }),
  setPointer: (p) => set({ pointer: p }),
  fireSpray: () => set((s) => ({ sprayTick: s.sprayTick + 1 })),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  toggleVideo: () => set((s) => ({ videoPaused: !s.videoPaused })),
  setMenuOpen: (v) => set({ menuOpen: v }),
  setCanReady: (v) => set({ canReady: v }),
}));
