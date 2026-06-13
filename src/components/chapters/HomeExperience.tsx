"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperience } from "@/lib/store";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { chapters } from "@/lib/chapters";
import { sfx } from "@/lib/sound";
import Preloader from "@/components/preloader/Preloader";
import VideoStage from "./VideoStage";
import Chapter from "./Chapter";
import ChapterNav from "./ChapterNav";
import MediaControls from "./MediaControls";
import styles from "./HomeExperience.module.css";

// 3D layer is client-only (no SSR of WebGL)
const HeroScene = dynamic(() => import("@/components/hero/HeroScene"), {
  ssr: false,
});

export default function HomeExperience() {
  const wrap = useRef<HTMLDivElement>(null);
  const layers = useRef<HTMLDivElement>(null);
  const active = useExperience((s) => s.activeChapter);
  const started = useExperience((s) => s.started);
  const setActiveChapter = useExperience((s) => s.setActiveChapter);
  const setScrollProgress = useExperience((s) => s.setScrollProgress);
  const setPointer = useExperience((s) => s.setPointer);
  const fireSpray = useExperience((s) => s.fireSpray);
  const { scrollTo } = useLenis();
  const [outro, setOutro] = useState(false);
  const prevActive = useRef(0);

  // pointer parallax (rAF-throttled, written straight to the store)
  useEffect(() => {
    let raf = 0;
    const pending = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      pending.x = (e.clientX / window.innerWidth) * 2 - 1;
      pending.y = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          setPointer({ x: pending.x, y: pending.y });
          raf = 0;
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [setPointer]);

  // scroll progress + active-chapter detection + outro fade
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: wrap.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setScrollProgress(self.progress),
      });

      chapters.forEach((c, i) => {
        ScrollTrigger.create({
          trigger: `#chapter-${i + 1}`,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) setActiveChapter(i);
          },
        });
      });

      // fade the fixed hero layers + hide nav as the footer approaches
      ScrollTrigger.create({
        trigger: wrap.current,
        start: "bottom bottom",
        end: "bottom top",
        onEnter: () => setOutro(true),
        onLeaveBack: () => setOutro(false),
      });
    });

    // ensure positions are correct once everything has painted
    const refresh = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      clearTimeout(refresh);
      ctx.revert();
    };
  }, [setActiveChapter, setScrollProgress]);

  // fade fixed layers on outro
  useEffect(() => {
    gsap.to(layers.current, {
      autoAlpha: outro ? 0 : 1,
      duration: 0.8,
      ease: "power2.out",
    });
  }, [outro]);

  // money shot: spray + sound on chapter change
  useEffect(() => {
    if (!started) return;
    if (active !== prevActive.current) {
      prevActive.current = active;
      fireSpray();
      sfx.transition();
    }
  }, [active, started, fireSpray]);

  // keyboard chapter nav (←/→) — leaves ↑/↓ for normal scrolling
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useExperience.getState().menuOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") {
        const i = Math.min(chapters.length - 1, useExperience.getState().activeChapter + 1);
        scrollTo(`#chapter-${i + 1}`);
      } else if (e.key === "ArrowLeft") {
        const i = Math.max(0, useExperience.getState().activeChapter - 1);
        scrollTo(`#chapter-${i + 1}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollTo]);

  return (
    <>
      <Preloader />

      <div ref={layers} className={styles.layers}>
        <VideoStage />
        <HeroScene />
      </div>

      <div ref={wrap} className={styles.chapters}>
        {chapters.map((c) => (
          <Chapter key={c.id} chapter={c} />
        ))}
      </div>

      <div
        className={`${styles.hint} ${started && active === 0 && !outro ? styles.hintShow : ""}`}
        aria-hidden="true"
      >
        <span>Scroll to explore</span>
        <span className={styles.hintLine} />
      </div>

      <MediaControls />
      <ChapterNav />
    </>
  );
}
