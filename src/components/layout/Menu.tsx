"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/lib/store";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { sfx } from "@/lib/sound";
import type { Settings } from "@/lib/content";
import styles from "./Menu.module.css";

const NAV = [
  { label: "Home", href: "/", index: "01" },
  { label: "Work", href: "/work", index: "02" },
  { label: "Studio", href: "/about", index: "03" },
  { label: "Services", href: "/services", index: "04" },
  { label: "Process", href: "/process", index: "05" },
  { label: "Contact", href: "/contact", index: "06" },
];

export default function Menu({ settings }: { settings: Settings }) {
  const open = useExperience((s) => s.menuOpen);
  const setMenuOpen = useExperience((s) => s.setMenuOpen);
  const pathname = usePathname();
  const { stop, start } = useLenis();

  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLLIElement[]>([]);
  const tl = useRef<gsap.core.Timeline | null>(null);

  // build the timeline once
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(overlay.current, { autoAlpha: 0 });
      tl.current = gsap
        .timeline({ paused: true })
        .set(overlay.current, { autoAlpha: 1 })
        .fromTo(
          panel.current,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "power4.inOut" },
        )
        .fromTo(
          itemsRef.current,
          { yPercent: 120, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.06, ease: "power3.out" },
          "-=0.4",
        )
        .fromTo(
          `.${styles.meta}`,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
          "-=0.4",
        );
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!tl.current) return;
    if (open) {
      stop();
      tl.current.timeScale(1).play();
      sfx.transition();
    } else {
      tl.current.timeScale(1.6).reverse();
      start();
    }
  }, [open, stop, start]);

  // close on route change
  useEffect(() => {
    setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setMenuOpen]);

  return (
    <div
      ref={overlay}
      id="main-menu"
      className={styles.overlay}
      style={{ visibility: "hidden" }}
      aria-hidden={!open}
      inert={!open}
    >
      <div ref={panel} className={styles.panel}>
        <nav className={styles.nav} aria-label="Primary">
          <ul className={styles.list}>
            {NAV.map((item, i) => {
              const active = pathname === item.href;
              return (
                <li
                  key={item.href}
                  className={styles.item}
                  ref={(el) => {
                    if (el) itemsRef.current[i] = el;
                  }}
                >
                  <Link
                    href={item.href}
                    className={`${styles.link} ${active ? styles.active : ""}`}
                    data-cursor="link"
                    onMouseEnter={() => sfx.hover()}
                    onClick={() => {
                      sfx.select();
                      setMenuOpen(false);
                    }}
                  >
                    <span className={styles.index}>{item.index}</span>
                    <span className={styles.linkText}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.meta}>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>Studio</span>
            <a href={`mailto:${settings.email}`} data-cursor="link" className={styles.metaLink}>
              {settings.email}
            </a>
            {settings.phone && (
              <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} data-cursor="link" className={styles.metaLink}>
                {settings.phone}
              </a>
            )}
          </div>
          {(settings.instagramUrl || settings.behanceUrl) && (
            <div className={styles.metaCol}>
              <span className={styles.metaLabel}>Follow</span>
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" data-cursor="link" className={styles.metaLink}>Instagram</a>
              )}
              {settings.behanceUrl && (
                <a href={settings.behanceUrl} target="_blank" rel="noopener noreferrer" data-cursor="link" className={styles.metaLink}>Behance</a>
              )}
            </div>
          )}
          <p className={styles.metaTag}>{settings.tagline}.</p>
        </div>
      </div>
    </div>
  );
}
