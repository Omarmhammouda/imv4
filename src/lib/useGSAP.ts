"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

type Cleanup = void | (() => void);

/**
 * Minimal scoped GSAP hook: runs the callback inside a gsap.context bound to
 * `scope`, and reverts all animations (and any returned cleanup) on unmount /
 * dependency change. Keeps every component's animations self-contained.
 */
export function useGSAP(
  callback: () => Cleanup,
  options?: { scope?: RefObject<HTMLElement | null>; dependencies?: unknown[] },
) {
  const { scope, dependencies = [] } = options ?? {};
  useEffect(() => {
    let cleanup: Cleanup;
    const ctx = gsap.context(() => {
      cleanup = callback();
    }, scope?.current ?? undefined);
    return () => {
      if (typeof cleanup === "function") cleanup();
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
