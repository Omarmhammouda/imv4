import Reveal from "@/components/ui/Reveal";
import { Cta } from "@/components/ui/Cta";
import styles from "./CtaBand.module.css";

export default function CtaBand({
  eyebrow,
  title,
  ctaLabel,
  ctaHref,
}: {
  eyebrow?: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="section">
      <div className="container">
        <Reveal as="div" className={styles.band}>
          <div className={styles.text}>
            {eyebrow && <span className="hud accent">{eyebrow}</span>}
            <p className={styles.title}>{title}</p>
          </div>
          <Cta href={ctaHref} variant="solid" size="lg">
            {ctaLabel}
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
