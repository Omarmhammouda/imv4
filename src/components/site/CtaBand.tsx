import Reveal from "@/components/ui/Reveal";
import { Cta } from "@/components/ui/Cta";
import styles from "./CtaBand.module.css";

export default function CtaBand({
  title,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="section">
      <div className="container">
        <Reveal as="div" className={styles.band}>
          <p className={styles.title}>{title}</p>
          <Cta href={ctaHref} variant="solid" size="lg">
            {ctaLabel}
          </Cta>
        </Reveal>
      </div>
    </section>
  );
}
