"use client";

import { usePathname } from "next/navigation";
import { useExperience } from "@/lib/store";
import { sfx } from "@/lib/sound";
import styles from "./FloatingContact.module.css";

export default function FloatingContact() {
  const started = useExperience((s) => s.started);
  const pathname = usePathname();
  const visible = pathname !== "/" || started;

  return (
    <a
      href="https://wa.me/10000000000?text=Hi%20Insomnia%20Murals%2C%20I%27d%20like%20to%20talk%20about%20a%20mural."
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.fab} ${visible ? styles.show : ""}`}
      data-cursor="link"
      aria-label="Message Insomnia Murals on WhatsApp"
      onMouseEnter={() => sfx.hover()}
      onClick={() => sfx.select()}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
        <path
          fill="currentColor"
          d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.03 8.03 0 0 1 2.37 5.73c0 4.46-3.63 8.09-8.1 8.09-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.04 8.04 0 0 1-1.23-4.27c0-4.46 3.63-8.09 8.1-8.09Zm-2.7 4.34c-.13 0-.34.05-.52.24-.18.2-.69.67-.69 1.64s.71 1.9.81 2.04c.1.13 1.39 2.12 3.37 2.97 1.65.71 1.99.57 2.35.54.36-.03 1.16-.47 1.32-.93.16-.46.16-.85.11-.93-.05-.08-.18-.13-.38-.23-.2-.1-1.16-.57-1.34-.64-.18-.07-.31-.1-.44.1-.13.2-.5.64-.62.77-.11.13-.23.15-.43.05-.2-.1-.84-.31-1.6-.99-.59-.53-.99-1.18-1.11-1.38-.11-.2-.01-.31.09-.41.09-.09.2-.23.3-.35.1-.12.13-.2.2-.34.07-.13.03-.25-.02-.35-.05-.1-.43-1.08-.6-1.48-.16-.39-.32-.34-.44-.34l-.37-.01Z"
        />
      </svg>
      <span className={styles.label}>Chat</span>
    </a>
  );
}
