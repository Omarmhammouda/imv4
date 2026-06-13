/** Shared motion tokens so every animation pulls from one system. */

/** GSAP easing names (mirror the CSS easing tokens in feel). */
export const EASE = {
  outExpo: "expo.out",
  outQuart: "power4.out",
  inOutQuart: "power4.inOut",
  out: "power3.out",
  inOut: "power2.inOut",
} as const;

export const DUR = {
  fast: 0.4,
  base: 0.8,
  slow: 1.2,
  xslow: 1.8,
} as const;

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

/** Single source of truth for breakpoint checks outside CSS. */
export const mq = {
  isMobile: () => typeof window !== "undefined" && window.innerWidth < BREAKPOINTS.md,
  isTablet: () =>
    typeof window !== "undefined" &&
    window.innerWidth >= BREAKPOINTS.md &&
    window.innerWidth < BREAKPOINTS.lg,
  isTouch: () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: none), (pointer: coarse)").matches,
  prefersReducedMotion: () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin);
