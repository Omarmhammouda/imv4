import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import Reveal from "@/components/ui/Reveal";
import { withBase } from "@/lib/asset";
import s from "@/components/site/sections.module.css";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Insomnia Murals is a nocturnal studio for large-scale murals and brand identity. Sleepless craft, fearless scale, colour with intent.",
};

const VALUES = [
  {
    title: "Nocturnal craft",
    body: "We do our best thinking after dark. Quiet streets, long exposures, and the patience a great wall demands.",
  },
  {
    title: "Scale without fear",
    body: "Ten storeys or ten feet. We plan, permit and produce work that holds up at architectural size.",
  },
  {
    title: "Colour with intent",
    body: "Mostly monochrome, one decisive accent. Restraint is what makes the red land.",
  },
  {
    title: "Built to last",
    body: "UV-stable systems, sealed surfaces, documented and maintained. Landmarks, not billboards.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="The Studio"
        title={["A studio that", "keeps the city", "awake"]}
        lead="Insomnia Murals began in a warehouse at 3 a.m. with one ladder, two cans and a wall nobody wanted. A decade later we paint landmarks, and build the brands behind them."
      />

      {/* manifesto */}
      <section className="section container">
        <div className={s.split}>
          <Reveal as="h2" className={s.splitTitle}>
            We turn blank concrete into the thing a city points at.
          </Reveal>
          <Reveal as="div" className={s.splitBody}>
            <p>
              We&rsquo;re a small, senior team of muralists, designers and producers. No
              account managers, no telephone game. You work with the people holding the
              cans.
            </p>
            <p>
              Half our work is paint and lifts; the other half is identity: the logo,
              type and system that lives on the wall and everywhere else the brand shows
              up. We think the two should be designed together.
            </p>
          </Reveal>
        </div>
      </section>

      {/* stats */}
      <section className="section container">
        <Reveal as="div" className={s.statRow} stagger={0.08}>
          <div className={s.stat}>
            <span className={s.statNum}>
              10<em>+</em>
            </span>
            <span className={s.statLabel}>Years sleepless</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>61</span>
            <span className={s.statLabel}>Murals delivered</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>
              14<em>k</em>
            </span>
            <span className={s.statLabel}>m² painted</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>
              9<em>×</em>
            </span>
            <span className={s.statLabel}>Design awards</span>
          </div>
        </Reveal>
      </section>

      {/* tools / feature */}
      <section className="section container">
        <div className={s.feature}>
          <Reveal as="div" className={s.featureMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={s.featureImg}
              src={withBase("/textures/can-cutout.png")}
              alt="The Insomnia Murals signature spray can: matte black body, white label, red cap."
              width={1120}
              height={1500}
              loading="lazy"
            />
          </Reveal>
          <Reveal as="div" className={s.featureText}>
            <h2 className={s.splitTitle} style={{ maxWidth: "14ch" }}>
              One can. The whole language.
            </h2>
            <p>
              Our house aerosol, matte black with a paper label and a single red cap, is
              the studio in miniature. High-pressure for fills, low for fades, and a steady
              hand for the line that makes it ours.
            </p>
          </Reveal>
        </div>
      </section>

      {/* values */}
      <section className="section container">
        <Reveal as="div" className={s.sectionHead}>
          <h2>Four things we refuse to compromise.</h2>
        </Reveal>
        <Reveal as="div" className={s.cards} stagger={0.08}>
          {VALUES.map((v) => (
            <div key={v.title} className={s.card}>
              <h3 className={s.cardTitle}>{v.title}</h3>
              <p className={s.cardBody}>{v.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <CtaBand
        title="Bring us your most impossible wall."
        ctaLabel="Inquire"
        ctaHref="/contact"
      />
    </>
  );
}
