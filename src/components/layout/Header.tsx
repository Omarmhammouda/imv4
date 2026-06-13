"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import { Cta } from "@/components/ui/Cta";
import Magnetic from "@/components/ui/Magnetic";
import SoundToggle from "./SoundToggle";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();
  const started = useExperience((s) => s.started);
  const menuOpen = useExperience((s) => s.menuOpen);
  const setMenuOpen = useExperience((s) => s.setMenuOpen);
  const ref = useRef<HTMLElement>(null);

  const onHome = pathname === "/";
  const visible = !onHome || started;

  useEffect(() => {
    gsap.to(ref.current, {
      autoAlpha: visible ? 1 : 0,
      y: visible ? 0 : -20,
      duration: 0.8,
      ease: "power3.out",
    });
  }, [visible]);

  return (
    <header ref={ref} className={styles.header} style={{ opacity: 0 }}>
      <div className={styles.inner}>
        <Magnetic strength={0.25}>
          <Link
            href="/"
            className={styles.logo}
            data-cursor="link"
            aria-label="Insomnia Murals — home"
            onMouseEnter={() => sfx.hover()}
          >
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoText}>
              Insomnia<span className={styles.logoSub}>Murals</span>
            </span>
          </Link>
        </Magnetic>

        <div className={styles.actions}>
          <SoundToggle />
          <Cta href="/contact" variant="outline" size="sm" className={styles.inquire}>
            Inquire
          </Cta>
          <button
            type="button"
            className={styles.menuBtn}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            data-cursor="link"
            onMouseEnter={() => sfx.hover()}
            onClick={() => {
              sfx.select();
              setMenuOpen(!menuOpen);
            }}
          >
            <span className={styles.menuLabel}>{menuOpen ? "Close" : "Menu"}</span>
            <span className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ""}`}>
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
