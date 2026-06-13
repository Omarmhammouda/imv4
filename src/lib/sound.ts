"use client";

/**
 * Tiny synthesised UI sound engine — no audio files, no network.
 * Off by default; the user toggles it. Subtle, on-theme console-UI cues.
 */

import { useExperience } from "@/lib/store";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.18; // gentle overall ceiling
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  glideTo?: number;
};

function blip({ freq, dur, type = "sine", gain = 0.6, glideTo }: Tone) {
  const ac = ensureCtx();
  if (!ac || !master) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

function enabled() {
  return useExperience.getState().soundOn && !useExperience.getState().reducedMotion;
}

export const sfx = {
  /** light tick on hover of interactive elements */
  hover() {
    if (!enabled()) return;
    blip({ freq: 880, dur: 0.06, type: "triangle", gain: 0.25 });
  },
  /** confident select / click */
  select() {
    if (!enabled()) return;
    blip({ freq: 420, dur: 0.12, type: "square", gain: 0.3, glideTo: 660 });
  },
  /** chapter / mode transition whoosh */
  transition() {
    if (!enabled()) return;
    blip({ freq: 180, dur: 0.5, type: "sawtooth", gain: 0.22, glideTo: 70 });
    blip({ freq: 520, dur: 0.35, type: "sine", gain: 0.14, glideTo: 240 });
  },
  /** the "press start" confirm */
  start() {
    if (!enabled()) return;
    blip({ freq: 320, dur: 0.18, type: "sine", gain: 0.3, glideTo: 540 });
    setTimeout(() => blip({ freq: 540, dur: 0.4, type: "sine", gain: 0.26, glideTo: 720 }), 90);
  },
  /** unlock the audio context after a user gesture */
  unlock() {
    ensureCtx();
  },
};
