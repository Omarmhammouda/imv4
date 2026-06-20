"use client";

import { useState } from "react";
import type { Mural } from "@/lib/content";
import type { Region } from "@/lib/projects";
import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { withBase } from "@/lib/asset";
import MuralLightbox from "./MuralLightbox";
import styles from "./WorkGallery.module.css";

function MuralCard({
  mural,
  index,
  reduced,
  onOpen,
}: {
  mural: Mural;
  index: number;
  reduced: boolean;
  onOpen: () => void;
}) {
  const photoCount = mural.images.length; // real photos
  const hasVideo = Boolean(mural.video) && !reduced;
  const clickable = photoCount > 0; // lightbox only when there are real photos
  const localVideo = mural.video.startsWith("/");

  const interactive = clickable
    ? {
        role: "button" as const,
        tabIndex: 0,
        "data-cursor": "link",
        "data-cursor-label": "View",
        onClick: () => {
          sfx.select();
          onOpen();
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            sfx.select();
            onOpen();
          }
        },
      }
    : {};

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
      aria-label={`${mural.title}, ${mural.regionName}${clickable ? ` — view ${photoCount} photo${photoCount > 1 ? "s" : ""}` : ""}`}
      onMouseEnter={() => sfx.hover()}
      {...interactive}
    >
      <div className={styles.media}>
        {hasVideo ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            className={styles.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={withBase(mural.cover)}
            aria-hidden="true"
          >
            {localVideo && (
              <source src={withBase(mural.video.replace(".mp4", ".webm"))} type="video/webm" />
            )}
            <source src={withBase(mural.video)} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.poster}
            src={withBase(mural.cover)}
            alt={`${mural.title} — mural for ${mural.client}`}
            loading="lazy"
          />
        )}
        <span className={styles.region}>{mural.regionName}</span>
        {photoCount > 1 && (
          <span className={styles.photoBadge} aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 7h11v11H4z M9 4h11v11" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
            {photoCount}
          </span>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{mural.title}</h3>
        <p className={styles.meta}>
          {[mural.client, mural.year, mural.size].filter(Boolean).join("  ·  ")}
        </p>
      </div>
    </article>
  );
}

export default function WorkGallery({
  murals,
  regions,
}: {
  murals: Mural[];
  regions: Region[];
}) {
  const reduced = useExperience((s) => s.reducedMotion);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Mural | null>(null);

  const shown = filter === "all" ? murals : murals.filter((m) => m.regionSlug === filter);

  const pick = (slug: string) => {
    setFilter(slug);
    sfx.select();
  };

  if (murals.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No murals here yet.</p>
        <p className={styles.emptyText}>
          The wall&rsquo;s still wet. New work is on its way.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.filters} aria-label="Filter murals by region">
        <button
          type="button"
          className={`${styles.chip} ${filter === "all" ? styles.chipActive : ""}`}
          onClick={() => pick("all")}
          onMouseEnter={() => sfx.hover()}
          data-cursor="link"
          aria-pressed={filter === "all"}
        >
          All <span className={styles.chipCount}>{murals.length}</span>
        </button>
        {regions.map((r) => {
          const n = murals.filter((m) => m.regionSlug === r.id).length;
          if (n === 0) return null;
          return (
            <button
              key={r.id}
              type="button"
              className={`${styles.chip} ${filter === r.id ? styles.chipActive : ""}`}
              onClick={() => pick(r.id)}
              onMouseEnter={() => sfx.hover()}
              data-cursor="link"
              aria-pressed={filter === r.id}
            >
              {r.name} <span className={styles.chipCount}>{n}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.resultCount} aria-live="polite">
        {shown.length} {shown.length === 1 ? "mural" : "murals"}
        {filter !== "all" && ` in ${regions.find((r) => r.id === filter)?.name}`}
      </p>

      <div className={styles.grid} key={filter}>
        {shown.map((m, i) => (
          <MuralCard
            key={`${m.title}-${i}`}
            mural={m}
            index={i}
            reduced={reduced}
            onOpen={() => setSelected(m)}
          />
        ))}
      </div>

      <MuralLightbox mural={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
