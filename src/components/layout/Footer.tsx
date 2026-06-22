"use client";

import Link from "next/link";
import { Cta } from "@/components/ui/Cta";
import { sfx } from "@/lib/sound";
import type { Settings } from "@/lib/content";
import styles from "./Footer.module.css";

export default function Footer({
  settings,
  recentWorks = [],
}: {
  settings: Settings;
  recentWorks?: { title: string; href: string }[];
}) {
  const COLUMNS = [
    {
      title: "Studio",
      links: [
        { label: "About", href: "/about" },
        { label: "Process", href: "/process" },
        { label: "Services", href: "/services" },
      ],
    },
    {
      title: "Recent work",
      links: [
        ...recentWorks.map((w) => ({ label: w.title, href: w.href })),
        { label: "All murals", href: "/work" },
      ],
    },
    {
      title: "Connect",
      links: [
        { label: settings.email, href: `mailto:${settings.email}` },
        ...(settings.instagramUrl
          ? [{ label: "Instagram", href: settings.instagramUrl }]
          : []),
        ...(settings.behanceUrl
          ? [{ label: "Behance", href: settings.behanceUrl }]
          : []),
      ],
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.call}>
          <h2 className={styles.callTitle}>
            Let&rsquo;s paint something
            <br />
            that outlives us.
          </h2>
          <Cta href="/contact" variant="solid" size="lg">
            Inquire now
          </Cta>
        </div>

        <nav className={styles.cols} aria-label="Footer">
          {COLUMNS.map((col) => (
            <div key={col.title} className={styles.col}>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <ul>
                {col.links.map((l) => {
                  const external = l.href.startsWith("http") || l.href.startsWith("mailto");
                  return (
                    <li key={l.label}>
                      {external ? (
                        <a
                          href={l.href}
                          className={styles.link}
                          data-cursor="link"
                          target={l.href.startsWith("http") ? "_blank" : undefined}
                          rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          onMouseEnter={() => sfx.hover()}
                        >
                          {l.label}
                        </a>
                      ) : (
                        <Link
                          href={l.href}
                          className={styles.link}
                          data-cursor="link"
                          onMouseEnter={() => sfx.hover()}
                        >
                          {l.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          {settings.studioName}
        </span>
        <span className={styles.fine}>Nocturnal studio · Est. {settings.foundingYear}</span>
        <span className={styles.fine}>© {new Date().getFullYear()} {settings.studioName}. All rights reserved.</span>
      </div>
    </footer>
  );
}
