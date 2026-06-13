import Reveal from "@/components/ui/Reveal";
import styles from "./PageHero.module.css";

export default function PageHero({
  eyebrow,
  title,
  lead,
  meta,
}: {
  eyebrow: string;
  title: string[];
  lead?: string;
  meta?: { label: string; value: string }[];
}) {
  return (
    <header className={styles.hero}>
      <div className="container">
        <Reveal as="div" className={styles.eyebrowRow}>
          <span className={styles.mark} aria-hidden="true" />
          <span className="hud accent">{eyebrow}</span>
        </Reveal>

        <Reveal as="h1" className={styles.title} stagger={0.08}>
          {title.map((line, i) => (
            <span key={i} className={styles.line}>
              {line}
            </span>
          ))}
        </Reveal>

        {lead && (
          <Reveal as="p" className={styles.lead}>
            {lead}
          </Reveal>
        )}

        {meta && (
          <Reveal as="dl" className={styles.meta} stagger={0.06}>
            {meta.map((m) => (
              <div key={m.label} className={styles.metaItem}>
                <dt>{m.label}</dt>
                <dd>{m.value}</dd>
              </div>
            ))}
          </Reveal>
        )}
      </div>
    </header>
  );
}
