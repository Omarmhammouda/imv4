"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/lib/store";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { sfx } from "@/lib/sound";
import { mq } from "@/lib/motion";
import styles from "./Preloader.module.css";

const SESSION_KEY = "im-intro-played";

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const barFill = useRef<HTMLSpanElement>(null);
  const startBtn = useRef<HTMLButtonElement>(null);

  const setProgress = useExperience((s) => s.setProgress);
  const setReady = useExperience((s) => s.setReady);
  const ready = useExperience((s) => s.ready);
  const start = useExperience((s) => s.start);
  const fireSpray = useExperience((s) => s.fireSpray);
  const { stop, start: startScroll } = useLenis();

  const [done, setDone] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const startedRef = useRef(false);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const handleStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    sfx.unlock();
    sfx.start();

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {}

    const reduced = mq.prefersReducedMotion();
    const tl = gsap.timeline({
      onComplete: () => {
        start();
        startScroll();
        fireSpray();
        setDone(true);
      },
    });
    tl.to(`.${styles.fadeOut}`, {
      autoAlpha: 0,
      y: -24,
      duration: reduced ? 0.2 : 0.5,
      ease: "power2.in",
      stagger: 0.04,
    });
    tl.to(
      root.current,
      {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: reduced ? 0.3 : 1,
        ease: "power4.inOut",
      },
      reduced ? "-=0.1" : "-=0.2",
    );
  }, [start, startScroll, fireSpray]);

  // Skip the intro entirely if already played this session.
  useEffect(() => {
    let already = false;
    try {
      already = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}
    if (already) {
      startedRef.current = true;
      start();
      startScroll();
      setDone(true);
      return;
    }

    stop(); // lock scroll while loading
    const reduced = mq.prefersReducedMotion();

    const state = { v: 0 };
    tweenRef.current = gsap.to(state, {
      v: 100,
      duration: reduced ? 0.6 : 2.4,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = Math.round(state.v);
        if (counter.current) counter.current.textContent = String(v).padStart(3, "0");
        if (barFill.current) barFill.current.style.transform = `scaleX(${state.v / 100})`;
        setProgress(state.v / 100);
      },
      onComplete: () => {
        setReady(true);
        setShowReady(true);
        sfx.transition();
      },
    });

    return () => {
      tweenRef.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reveal the "press start" affordance
  useEffect(() => {
    if (!showReady) return;
    gsap.fromTo(
      startBtn.current,
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" },
    );
    startBtn.current?.focus();
  }, [showReady]);

  // keyboard: Enter / Space to start once ready
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if ((e.key === "Enter" || e.key === " ") && ready) {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, done, handleStart]);

  const handleSkip = () => {
    if (!ready) {
      // fast-forward the counter, then start
      tweenRef.current?.progress(1);
      setReady(true);
    }
    handleStart();
  };

  if (done) return null;

  return (
    <div
      ref={root}
      className={styles.overlay}
      role="dialog"
      aria-label="Loading Insomnia Murals"
      aria-busy={!ready}
    >
      <div className={styles.scanlines} aria-hidden="true" />

      <button
        type="button"
        className={`${styles.skip} ${styles.fadeOut}`}
        onClick={handleSkip}
        data-cursor="link"
      >
        Skip intro
      </button>

      <div className={`${styles.brand} ${styles.fadeOut}`}>
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandName}>Insomnia Murals</span>
        <span className={styles.brandTag}>Nocturnal studio</span>
      </div>

      <div className={styles.center}>
        <div className={`${styles.counterWrap} ${styles.fadeOut}`}>
          <span ref={counter} className={styles.counter} aria-hidden="true">
            000
          </span>
          <span className={styles.pct} aria-hidden="true">
            %
          </span>
        </div>

        <div className={`${styles.bar} ${styles.fadeOut}`} aria-hidden="true">
          <span ref={barFill} className={styles.barFill} />
        </div>

        <p className={styles.status} aria-live="polite">
          {ready ? "Ready to Explore" : "Loading content"}
        </p>
      </div>

      <button
        ref={startBtn}
        type="button"
        className={styles.start}
        onClick={handleStart}
        style={{ opacity: 0, pointerEvents: showReady ? "auto" : "none" }}
        data-cursor="link"
        aria-hidden={!showReady}
      >
        <span className={styles.startInner}>
          <span className={styles.startIcon} aria-hidden="true">
            ▶
          </span>
          Press Start
        </span>
      </button>
    </div>
  );
}
