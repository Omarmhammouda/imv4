"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperience } from "@/lib/store";
import { mq } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  // animations intentionally target elements that mount/unmount across routes
  // and Strict-Mode double effects; the null-target warning is just noise.
  gsap.config({ nullTargetWarn: false });
}

interface LenisContextValue {
  lenis: Lenis | null;
  scrollTo: (
    target: number | string | HTMLElement,
    opts?: { offset?: number; duration?: number; immediate?: boolean },
  ) => void;
  stop: () => void;
  start: () => void;
}

const LenisContext = createContext<LenisContextValue>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useLenis = () => useContext(LenisContext);

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const reduced = mq.prefersReducedMotion();
    useExperience.getState().setReducedMotion(reduced);

    const instance = new Lenis({
      duration: reduced ? 0 : 1.15,
      easing: (t) => 1 - Math.pow(1 - t, 3.2), // weighty ease-out
      smoothWheel: !reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
      lerp: reduced ? 1 : 0.1,
    });
    lenisRef.current = instance;
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Keep ScrollTrigger in sync with late-loading assets / fonts.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(raf);
      instance.destroy();
      lenisRef.current = null;
    };
  }, []);

  // React to media-query changes for reduced motion at runtime.
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => useExperience.getState().setReducedMotion(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  const value: LenisContextValue = {
    lenis,
    scrollTo: (target, opts) =>
      lenisRef.current?.scrollTo(target, {
        offset: opts?.offset ?? 0,
        duration: opts?.duration ?? (mq.prefersReducedMotion() ? 0 : 1.4),
        immediate: opts?.immediate ?? false,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      }),
    stop: () => lenisRef.current?.stop(),
    start: () => lenisRef.current?.start(),
  };

  return <LenisContext.Provider value={value}>{children}</LenisContext.Provider>;
}
