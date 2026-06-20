"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { mq } from "@/lib/motion";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  // 1. Enable only on fine-pointer (non-touch) devices.
  useEffect(() => {
    if (!mq.isTouch()) setEnabled(true);
  }, []);

  // 2. Wire everything up AFTER the cursor elements are actually in the DOM.
  //    (Runs when `enabled` flips true, so the refs are populated.)
  useEffect(() => {
    if (!enabled) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label) return;

    document.body.classList.add("cursor-custom");

    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });

    let visible = false;
    const reveal = () => {
      if (visible) return;
      visible = true;
      gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3 });
    };

    const onMove = (e: MouseEvent) => {
      reveal();
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]") as
        | HTMLElement
        | null;
      ring.dataset.state = target?.dataset.cursor ?? "default";
      const text = target?.dataset.cursorLabel ?? "";
      label.textContent = text;
      ring.dataset.hasLabel = text ? "true" : "false";
    };

    const onDown = () => (ring.dataset.pressed = "true");
    const onUp = () => (ring.dataset.pressed = "false");
    const onEnterWindow = (e: MouseEvent) => onMove(e);
    const onLeaveWindow = () => {
      visible = false;
      gsap.to([ring, dot], { autoAlpha: 0, duration: 0.2 });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseenter", onEnterWindow);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseenter", onEnterWindow);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.body.classList.remove("cursor-custom");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={styles.wrap} aria-hidden="true">
      <div ref={ringRef} className={styles.ring} data-state="default">
        <span ref={labelRef} className={styles.label} />
      </div>
      <div ref={dotRef} className={styles.dot} />
    </div>
  );
}
