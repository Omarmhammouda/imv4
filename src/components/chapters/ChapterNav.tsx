"use client";

import { useExperience } from "@/lib/store";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { chapters } from "@/lib/chapters";
import { sfx } from "@/lib/sound";
import styles from "./ChapterNav.module.css";

export default function ChapterNav() {
  const active = useExperience((s) => s.activeChapter);
  const started = useExperience((s) => s.started);
  const { scrollTo } = useLenis();

  const go = (i: number) => {
    const idx = Math.max(0, Math.min(chapters.length - 1, i));
    scrollTo(`#chapter-${idx + 1}`, { offset: 0 });
    sfx.select();
  };

  const atStart = active <= 0;
  const atEnd = active >= chapters.length - 1;

  return (
    <nav
      className={`${styles.nav} ${started ? styles.show : ""}`}
      aria-label="Chapter navigation"
    >
      <button
        type="button"
        className={styles.arrow}
        onClick={() => go(active - 1)}
        disabled={atStart}
        aria-label="Previous chapter"
        data-cursor="link"
        onMouseEnter={() => sfx.hover()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/></svg>
      </button>

      <div className={styles.center}>
        <span className={styles.now}>
          <span className={styles.nowIndex}>{String(active + 1).padStart(2, "0")}</span>
          <span className={styles.nowLabel}>{chapters[active]?.label}</span>
        </span>
        <ol className={styles.dots}>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                className={`${styles.dot} ${i === active ? styles.dotActive : ""}`}
                aria-label={`Go to chapter ${i + 1}: ${c.label}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => go(i)}
                onMouseEnter={() => sfx.hover()}
                data-cursor="link"
              >
                <span className={styles.dotInner} />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <button
        type="button"
        className={styles.arrow}
        onClick={() => go(active + 1)}
        disabled={atEnd}
        aria-label="Next chapter"
        data-cursor="link"
        onMouseEnter={() => sfx.hover()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"/></svg>
      </button>
    </nav>
  );
}
