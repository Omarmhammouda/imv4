"use client";

import { useState } from "react";
import { regions } from "@/lib/projects";
import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { withBase } from "@/lib/asset";
import styles from "./WorkMap.module.css";

export default function WorkMap() {
  const [activeId, setActiveId] = useState(regions[0].id);
  const reduced = useExperience((s) => s.reducedMotion);
  const active = regions.find((r) => r.id === activeId) ?? regions[0];

  return (
    <div className={styles.grid}>
      <ol className={styles.list}>
        {regions.map((r, i) => {
          const isActive = r.id === activeId;
          return (
            <li key={r.id} className={styles.item}>
              <button
                type="button"
                className={`${styles.row} ${isActive ? styles.rowActive : ""}`}
                onMouseEnter={() => {
                  setActiveId(r.id);
                  sfx.hover();
                }}
                onFocus={() => setActiveId(r.id)}
                onClick={() => {
                  setActiveId(r.id);
                  sfx.select();
                }}
                data-cursor="link"
                data-cursor-label="View"
                aria-expanded={isActive}
                aria-controls={`region-${r.id}`}
              >
                <span className={styles.rowIndex}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.rowName}>{r.name}</span>
                <span className={styles.rowCount}>
                  <span className={styles.countNum}>{r.count}</span> Murals
                </span>
                <span className={styles.rowArrow} aria-hidden="true">→</span>
              </button>

              {/* inline detail (mobile / stacked) */}
              <div id={`region-${r.id}`} className={styles.mobileDetail} hidden={!isActive}>
                <div className={styles.mobileMedia}>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    key={r.id}
                    className={styles.mobileVideo}
                    poster={withBase(r.poster)}
                    muted
                    loop
                    playsInline
                    autoPlay={!reduced}
                    preload="none"
                  >
                    <source src={withBase(r.video.replace(".mp4", ".webm"))} type="video/webm" />
                    <source src={withBase(r.video)} type="video/mp4" />
                  </video>
                </div>
                <p className={styles.mobileBlurb}>{r.blurb}</p>
                <ul className={styles.featList}>
                  {r.featured.map((p) => (
                    <li key={p.title} className={styles.feat}>
                      <span className={styles.featTitle}>{p.title}</span>
                      <span className={styles.featMeta}>
                        {p.client} · {p.year} · {p.size}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      {/* sticky preview (desktop) */}
      <aside className={styles.preview} aria-hidden="true">
        <div className={styles.previewInner}>
          <div className={styles.previewMedia}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              key={active.id}
              className={styles.previewVideo}
              poster={withBase(active.poster)}
              muted
              loop
              playsInline
              autoPlay={!reduced}
              preload="none"
            >
              <source src={withBase(active.video.replace(".mp4", ".webm"))} type="video/webm" />
              <source src={withBase(active.video)} type="video/mp4" />
            </video>
            <div className={styles.previewScrim} />
            <div className={styles.previewBadge}>
              <span className={styles.previewCount}>{active.count}</span>
              <span className={styles.previewCountLabel}>Murals</span>
            </div>
          </div>
          <div className={styles.previewBody}>
            <h2 className={styles.previewName}>{active.name}</h2>
            <p className={styles.previewBlurb}>{active.blurb}</p>
            <ul className={styles.featList}>
              {active.featured.map((p) => (
                <li key={p.title} className={styles.feat}>
                  <span className={styles.featTitle}>{p.title}</span>
                  <span className={styles.featMeta}>
                    {p.client} · {p.year} · {p.size}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}
