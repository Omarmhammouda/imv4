import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/contact/ContactForm";
import c from "@/components/contact/contact.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a mural or brand project with Insomnia Murals. Tell us about the wall. We reply within two working days.",
};

const TIPS = [
  "Location and rough wall size (a photo helps).",
  "Any deadline or launch date.",
  "A budget range, even loose.",
  "References or a mood you're chasing.",
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Inquire"
        title={["Let's make", "a landmark"]}
        lead="Tell us about the wall and what it needs to say. The more you share, the sharper our first reply."
      />

      <section className="section container">
        <div className={c.layout}>
          <Reveal as="div">
            <ContactForm />
          </Reveal>

          <Reveal as="aside" className={c.details}>
            <div className={c.block}>
              <span className={c.blockLabel}>Email</span>
              <a className={`${c.blockValue} ${c.link}`} href="mailto:hello@insomniamurals.studio" data-cursor="link">
                hello@insomniamurals.studio
              </a>
            </div>
            <div className={c.block}>
              <span className={c.blockLabel}>WhatsApp</span>
              <a
                className={`${c.blockValue} ${c.link}`}
                href="https://wa.me/10000000000"
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
              >
                Message the studio
              </a>
            </div>
            <div className={c.block}>
              <span className={c.blockLabel}>Studio</span>
              <span className={c.blockValue}>
                Unit 7, The Coil Works
                <br />
                14 Lantern Lane
              </span>
              <span className="caption">Night entrance off the alley</span>
            </div>
            <div className={c.block}>
              <span className={c.blockLabel}>Hours</span>
              <span className={c.blockValue}>We answer noon&ndash;midnight</span>
            </div>
            <div className={c.block}>
              <span className={c.blockLabel}>What to include</span>
              <ul className={c.tips}>
                {TIPS.map((t) => (
                  <li key={t} className={c.tip}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className={c.block}>
              <span className={c.blockLabel}>Follow</span>
              <span className={c.blockValue}>
                <a className={c.link} href="https://instagram.com" target="_blank" rel="noopener noreferrer" data-cursor="link">Instagram</a>
                {" · "}
                <a className={c.link} href="https://behance.net" target="_blank" rel="noopener noreferrer" data-cursor="link">Behance</a>
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
