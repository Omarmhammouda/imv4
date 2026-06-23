"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import styles from "./FloatingInquire.module.css";

// Always-visible CTA to the intake form. Hidden on the contact page itself,
// while the menu is open, and on the home title screen until the user enters.
export default function FloatingInquire() {
  const pathname = usePathname();
  const started = useExperience((s) => s.started);
  const menuOpen = useExperience((s) => s.menuOpen);

  const onContact = pathname === "/contact";
  const onHome = pathname === "/";
  const hidden = onContact || menuOpen || (onHome && !started);

  return (
    <Link
      href="/contact"
      className={styles.fab}
      data-hidden={hidden || undefined}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      data-cursor="link"
      data-cursor-label="Inquire"
      onMouseEnter={() => sfx.hover()}
      onClick={() => sfx.select()}
    >
      <span className={styles.label}>Inquire</span>
      <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    </Link>
  );
}
