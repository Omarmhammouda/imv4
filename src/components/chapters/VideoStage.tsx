"use client";

import { useEffect, useRef, useState } from "react";
import { chapters } from "@/lib/chapters";
import { useExperience } from "@/lib/store";
import styles from "./VideoStage.module.css";

/**
 * Full-bleed background video layer. Stacks one <video> per chapter and
 * crossfades (CSS opacity) to the active one. Only the active video plays;
 * the rest are paused. Sources load lazily (active + next). Reduced motion or
 * a user pause holds on the poster frame.
 */
export default function VideoStage() {
  const active = useExperience((s) => s.activeChapter);
  const paused = useExperience((s) => s.videoPaused);
  const reduced = useExperience((s) => s.reducedMotion);
  const started = useExperience((s) => s.started);

  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [loaded, setLoaded] = useState<Set<number>>(new Set([0]));

  // lazily flag which sources should mount
  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      next.add(active);
      next.add((active + 1) % chapters.length);
      return next;
    });
  }, [active]);

  // play active / pause the rest
  useEffect(() => {
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active && started && !paused && !reduced) {
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [active, paused, reduced, started, loaded]);

  return (
    <div className={styles.stage} aria-hidden="true" data-align={chapters[active]?.align}>
      {chapters.map((c, i) => (
        <video
          key={c.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={styles.video}
          style={{ opacity: i === active ? 1 : 0 }}
          poster={c.poster}
          muted
          loop
          playsInline
          preload={i === 0 ? "auto" : "none"}
        >
          {loaded.has(i) && (
            <>
              <source src={c.video.replace(".mp4", ".webm")} type="video/webm" />
              <source src={c.video} type="video/mp4" />
            </>
          )}
        </video>
      ))}
      <div className={styles.scrim} />
      <div className={styles.vignette} />
    </div>
  );
}
