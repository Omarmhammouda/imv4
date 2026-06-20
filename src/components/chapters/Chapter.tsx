"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@/lib/useGSAP";
import type { Chapter as ChapterType } from "@/lib/chapters";
import { Cta } from "@/components/ui/Cta";
import styles from "./Chapter.module.css";

function Headline({ chapter }: { chapter: ChapterType }) {
  return (
    <h2 className={styles.headline}>
      {chapter.lines.map((line, i) => {
        const em = chapter.emphasis;
        const content =
          em && em.line === i ? (
            line.split(new RegExp(`(${em.word})`, "i")).map((part, k) =>
              part.toLowerCase() === em.word.toLowerCase() ? (
                <em key={k} className={styles.em}>
                  {part}
                </em>
              ) : (
                <span key={k}>{part}</span>
              ),
            )
          ) : (
            line
          );
        return (
          <span className={styles.lineMask} key={i}>
            <span className={styles.lineInner} data-line>
              {content}
            </span>
          </span>
        );
      })}
    </h2>
  );
}

export default function Chapter({
  chapter,
  total,
}: {
  chapter: ChapterType;
  total: number;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lines = root.current!.querySelectorAll("[data-line]");
        const reveal = root.current!.querySelectorAll("[data-reveal]");
        const ghost = root.current!.querySelector("[data-ghost]");

        gsap.from(lines, {
          yPercent: 118,
          duration: 1,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 72%" },
        });
        gsap.from(reveal, {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.08,
          delay: 0.15,
          scrollTrigger: { trigger: root.current, start: "top 70%" },
        });
        if (ghost) {
          gsap.to(ghost, {
            yPercent: -22,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }
        return () => ScrollTrigger.getAll().forEach((t) => t.kill());
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id={`chapter-${chapter.index}`}
      className={styles.chapter}
      data-align={chapter.align}
      aria-labelledby={`chapter-${chapter.index}-title`}
    >
      <span className={styles.ghost} data-ghost aria-hidden="true">
        {String(chapter.index).padStart(2, "0")}
      </span>

      <div className={styles.content}>
        <div className={styles.plate}>
          <div className={styles.meta} data-reveal>
            <span className={styles.index}>
              {String(chapter.index).padStart(2, "0")}
              <span className={styles.indexTotal}> / {String(total).padStart(2, "0")}</span>
            </span>
            <span className={styles.label}>{chapter.label}</span>
          </div>

          <div id={`chapter-${chapter.index}-title`}>
            <Headline chapter={chapter} />
          </div>

          <p className={styles.body} data-reveal>
            {chapter.body}
          </p>

          <div className={styles.ctaRow} data-reveal>
            {chapter.index === 1 && (
              <Cta href="/work" variant="solid" size="lg">
                View the work
              </Cta>
            )}
            <Cta href={chapter.cta.href} variant="outline" size="lg">
              {chapter.cta.label}
            </Cta>
          </div>
        </div>
      </div>
    </section>
  );
}
