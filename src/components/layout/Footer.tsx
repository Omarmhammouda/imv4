"use client";

import Link from "next/link";
import { Cta } from "@/components/ui/Cta";
import { sfx } from "@/lib/sound";
import styles from "./Footer.module.css";

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
    title: "Work",
    links: [
      { label: "All murals", href: "/work" },
      { label: "Downtown Core", href: "/work" },
      { label: "Industrial District", href: "/work" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "hello@insomniamurals.studio", href: "mailto:hello@insomniamurals.studio" },
      { label: "Instagram", href: "https://instagram.com" },
      { label: "Behance", href: "https://behance.net" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.call}>
          <span className="hud accent">Start a project</span>
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
          Insomnia Murals
        </span>
        <span className={styles.fine}>Nocturnal studio · Est. 2014</span>
        <span className={styles.fine}>© {new Date().getFullYear()} — All rights reserved</span>
      </div>
    </footer>
  );
}
