"use client";

import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import styles from "./SoundToggle.module.css";

export default function SoundToggle() {
  const soundOn = useExperience((s) => s.soundOn);
  const toggleSound = useExperience((s) => s.toggleSound);

  return (
    <button
      type="button"
      className={styles.btn}
      aria-pressed={soundOn}
      aria-label={soundOn ? "Mute interface sound" : "Enable interface sound"}
      data-cursor="link"
      onClick={() => {
        sfx.unlock();
        toggleSound();
        // play a confirmation once it's on
        if (!soundOn) setTimeout(() => sfx.select(), 0);
      }}
    >
      <span className={styles.bars} data-on={soundOn} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      <span className={styles.label}>{soundOn ? "Sound" : "Muted"}</span>
    </button>
  );
}
