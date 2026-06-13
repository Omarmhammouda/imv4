import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import Reveal from "@/components/ui/Reveal";
import s from "@/components/site/sections.module.css";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Mural design & painting, brand identity, environmental graphics, art direction and mural care — from a single studio.",
};

const SERVICES = [
  {
    k: "01",
    title: "Mural Design & Painting",
    body: "The flagship. Concept, sketch and full production at any scale — free-hand aerosol, hand-cut stencils and brushwork, on lifts or rope access.",
    tags: ["Concept", "Stencil", "Free-hand", "Rigging"],
    aside: "Flagship",
  },
  {
    k: "02",
    title: "Brand Identity",
    body: "Logos, type systems and guidelines built to live as big as a building. We design the wall and everything the brand touches around it.",
    tags: ["Logo", "Typography", "Guidelines", "Collateral"],
    aside: "Studio",
  },
  {
    k: "03",
    title: "Environmental & Wayfinding",
    body: "Supergraphics, signage and wayfinding that turn lobbies, car parks and campuses into places people can read at a glance.",
    tags: ["Supergraphics", "Signage", "Wayfinding"],
    aside: "Spatial",
  },
  {
    k: "04",
    title: "Art Direction & Curation",
    body: "Festival walls and multi-artist programs. We write the brief, curate the line-up and keep a coherent vision across many hands.",
    tags: ["Briefs", "Curation", "Festivals"],
    aside: "Programs",
  },
  {
    k: "05",
    title: "Care & Restoration",
    body: "Anti-graffiti coatings, scheduled re-coats and full documentation so the work stays sharp for years, not seasons.",
    tags: ["Coatings", "Re-coats", "Archive"],
    aside: "Aftercare",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="What we do"
        title={["Murals.", "Identity.", "Everything", "in between."]}
        lead="Five ways we work — usually in combination. Most projects start with a wall and end up reshaping the whole brand."
      />

      <section className="section container">
        <ul className={s.numbered}>
          {SERVICES.map((item) => (
            <Reveal as="li" key={item.k}>
              <div className={s.numItem}>
                <span className={s.numIndex}>{item.k}</span>
                <div className={s.numMain}>
                  <h2 className={s.numTitle}>{item.title}</h2>
                  <p className={s.numBody}>{item.body}</p>
                  <div className={s.tags}>
                    {item.tags.map((t) => (
                      <span key={t} className={s.tag}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={s.numAside}>{item.aside}</span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* engagement */}
      <section className="section container">
        <div className={s.split}>
          <Reveal as="h2" className={s.splitTitle}>
            How an engagement runs.
          </Reveal>
          <Reveal as="div" className={s.splitBody}>
            <p>
              Most projects are fixed-scope with milestone billing: discovery, design,
              production, care. Bigger programs run on a retainer.
            </p>
            <p>
              We&rsquo;re happiest brought in early — before the scaffolding is booked — so
              the wall and the brand can be designed as one thing.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand
        eyebrow="Scope a project"
        title="Tell us what the wall needs to say."
        ctaLabel="Start a project"
        ctaHref="/contact"
      />
    </>
  );
}
