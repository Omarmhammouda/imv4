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

  useEffect(() => {
    if (mq.isTouch()) return;
    setEnabled(true);
    document.body.classList.add("cursor-custom");

    const ring = ringRef.current!;
    const dot = dotRef.current!;
    const label = labelRef.current!;

    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });

    let visible = false;
    const onMove = (e: MouseEvent) => {
      if (!visible) {
        visible = true;
        gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3 });
      }
      ringX(e.clientX);
      ringY(e.clientY);
      dotX(e.clientX);
      dotY(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.("[data-cursor]") as
        | HTMLElement
        | null;
      const mode = target?.dataset.cursor;
      ring.dataset.state = mode ?? "default";
      const text = target?.dataset.cursorLabel ?? "";
      label.textContent = text;
      ring.dataset.hasLabel = text ? "true" : "false";
    };

    const onDown = () => (ring.dataset.pressed = "true");
    const onUp = () => (ring.dataset.pressed = "false");
    const onLeaveWindow = () => {
      visible = false;
      gsap.to([ring, dot], { autoAlpha: 0, duration: 0.2 });
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.body.classList.remove("cursor-custom");
    };
  }, []);

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
