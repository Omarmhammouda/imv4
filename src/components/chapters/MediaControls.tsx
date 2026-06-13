"use client";

import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import styles from "./MediaControls.module.css";

export default function MediaControls() {
  const paused = useExperience((s) => s.videoPaused);
  const toggleVideo = useExperience((s) => s.toggleVideo);
  const started = useExperience((s) => s.started);

  return (
    <div className={`${styles.wrap} ${started ? styles.show : ""}`}>
      <button
        type="button"
        className={styles.btn}
        aria-pressed={paused}
        aria-label={paused ? "Play background video" : "Pause background video"}
        onClick={() => {
          sfx.select();
          toggleVideo();
        }}
        onMouseEnter={() => sfx.hover()}
        data-cursor="link"
      >
        <span className={styles.icon} aria-hidden="true">
          {paused ? (
            <svg viewBox="0 0 24 24"><path d="M7 5l13 7-13 7z" fill="currentColor" /></svg>
          ) : (
            <svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" fill="currentColor" /><rect x="14" y="5" width="4" height="14" fill="currentColor" /></svg>
          )}
        </span>
        <span className={styles.label}>{paused ? "Play" : "Pause"} bg</span>
      </button>
    </div>
  );
}
