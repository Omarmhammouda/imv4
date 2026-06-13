"use client";

import { useRef, useEffect, cloneElement, isValidElement } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/lib/store";
import { mq } from "@/lib/motion";

/**
 * Wraps a single element and gives it a subtle magnetic pull toward the cursor.
 * Desktop / fine-pointer only; no-ops under reduced motion or touch.
 */
export default function Magnetic({
  children,
  strength = 0.35,
}: {
  children: React.ReactElement;
  strength?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (mq.isTouch() || useExperience.getState().reducedMotion) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const relX = e.clientX - (r.left + r.width / 2);
      const relY = e.clientY - (r.top + r.height / 2);
      xTo(relX * strength);
      yTo(relY * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  if (!isValidElement(children)) return children;
  return cloneElement(children as React.ReactElement<{ ref?: React.Ref<HTMLElement> }>, {
    ref,
  });
}
