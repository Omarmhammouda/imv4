"use client";

import { useEffect, useRef, useState } from "react";
import type { Mural } from "@/lib/content";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { sfx } from "@/lib/sound";
import { withBase } from "@/lib/asset";
import styles from "./MuralLightbox.module.css";

export default function MuralLightbox({
  mural,
  onClose,
}: {
  mural: Mural | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const { stop, start } = useLenis();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setIndex(0), [mural]);

  useEffect(() => {
    if (!mural) return;
    stop();
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((p) => (p + 1) % mural.images.length);
      else if (e.key === "ArrowLeft")
        setIndex((p) => (p - 1 + mural.images.length) % mural.images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      start();
    };
  }, [mural, onClose, stop, start]);

  if (!mural) return null;
  const count = mural.images.length;
  const go = (d: number) => {
    sfx.hover();
    setIndex((p) => (p + d + count) % count);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${mural.title} — photos`}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
        data-cursor="link"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="square" fill="none" />
        </svg>
      </button>

      <div className={styles.stage} onClick={(e) => e.stopPropagation()}>
        <div className={styles.frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={index}
            className={styles.image}
            src={withBase(mural.images[index])}
            alt={`${mural.title} — photo ${index + 1} of ${count}`}
          />
          {count > 1 && (
            <>
              <button
                type="button"
                className={`${styles.nav} ${styles.prev}`}
                onClick={() => go(-1)}
                aria-label="Previous photo"
                data-cursor="link"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" /></svg>
              </button>
              <button
                type="button"
                className={`${styles.nav} ${styles.next}`}
                onClick={() => go(1)}
                aria-label="Next photo"
                data-cursor="link"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" /></svg>
              </button>
            </>
          )}
        </div>

        <div className={styles.caption}>
          <div className={styles.capText}>
            <span className={styles.region}>{mural.regionName}</span>
            <h2 className={styles.title}>{mural.title}</h2>
            <p className={styles.meta}>
              {[mural.client, mural.year, mural.size].filter(Boolean).join("  ·  ")}
            </p>
          </div>
          {count > 1 && (
            <span className={styles.counter} aria-live="polite">
              {index + 1} / {count}
            </span>
          )}
        </div>

        {count > 1 && (
          <div className={styles.thumbs}>
            {mural.images.map((src, k) => (
              <button
                key={src + k}
                type="button"
                className={`${styles.thumb} ${k === index ? styles.thumbActive : ""}`}
                onClick={() => setIndex(k)}
                aria-label={`Photo ${k + 1}`}
                data-cursor="link"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={withBase(src)} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
