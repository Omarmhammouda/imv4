import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/ui/Reveal";
import ContactForm from "@/components/contact/ContactForm";
import { getContent } from "@/lib/content";
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

export default async function ContactPage() {
  const { settings } = await getContent();
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
              <a className={`${c.blockValue} ${c.link}`} href={`mailto:${settings.email}`} data-cursor="link">
                {settings.email}
              </a>
            </div>
            {settings.whatsapp && (
              <div className={c.block}>
                <span className={c.blockLabel}>WhatsApp</span>
                <a
                  className={`${c.blockValue} ${c.link}`}
                  href={`https://wa.me/${settings.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="link"
                >
                  Message the studio
                </a>
              </div>
            )}
            {settings.addressLine1 && (
              <div className={c.block}>
                <span className={c.blockLabel}>Studio</span>
                <span className={c.blockValue}>
                  {settings.addressLine1}
                  {settings.addressLine2 && (
                    <>
                      <br />
                      {settings.addressLine2}
                    </>
                  )}
                </span>
                {settings.addressNote && <span className="caption">{settings.addressNote}</span>}
              </div>
            )}
            {settings.hours && (
              <div className={c.block}>
                <span className={c.blockLabel}>Hours</span>
                <span className={c.blockValue}>{settings.hours}</span>
              </div>
            )}
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
            {(settings.instagramUrl || settings.behanceUrl) && (
              <div className={c.block}>
                <span className={c.blockLabel}>Follow</span>
                <span className={c.blockValue}>
                  {settings.instagramUrl && (
                    <a className={c.link} href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" data-cursor="link">Instagram</a>
                  )}
                  {settings.instagramUrl && settings.behanceUrl && " · "}
                  {settings.behanceUrl && (
                    <a className={c.link} href={settings.behanceUrl} target="_blank" rel="noopener noreferrer" data-cursor="link">Behance</a>
                  )}
                </span>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
