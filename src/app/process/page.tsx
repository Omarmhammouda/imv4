import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import Reveal from "@/components/ui/Reveal";
import s from "@/components/site/sections.module.css";

export const metadata: Metadata = {
  title: "Process",
  description:
    "From blank wall to landmark — our six-phase process: discovery, concept, approvals, production, reveal and care.",
};

const STEPS = [
  {
    k: "01",
    title: "Discovery & brief",
    body: "We walk the wall, meet the stakeholders and pin down the one thing it has to say. Site survey, light study, constraints.",
    aside: "Week 1",
  },
  {
    k: "02",
    title: "Concept & sketch",
    body: "Two or three distinct directions, rendered in situ so you can see them at true scale before a drop of paint is mixed.",
    aside: "Weeks 2–3",
  },
  {
    k: "03",
    title: "Approvals & permits",
    body: "We handle landlords, councils and heritage where needed — access plans, method statements, insurance, the lot.",
    aside: "Weeks 3–5",
  },
  {
    k: "04",
    title: "Production",
    body: "Lifts go up, the grid goes on, and the wall comes to life. Nocturnal shifts where the site allows for cleaner light.",
    aside: "Weeks 5–8",
  },
  {
    k: "05",
    title: "Reveal & launch",
    body: "Photography, film and a launch moment — plus the brand assets so the mural lives online as loudly as it does on the street.",
    aside: "Week 8",
  },
  {
    k: "06",
    title: "Care & documentation",
    body: "Anti-graffiti coatings, a maintenance schedule and a full archive so the work stays sharp for years.",
    aside: "Ongoing",
  },
];

export default function ProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={["From blank wall", "to landmark"]}
        lead="A repeatable six-phase process that keeps big, public work calm, on-budget and on-brief — without flattening the art."
      />

      <section className="section container">
        <ol className={s.numbered}>
          {STEPS.map((step) => (
            <Reveal as="li" key={step.k}>
              <div className={s.numItem}>
                <span className={s.numIndex}>{step.k}</span>
                <div className={s.numMain}>
                  <h2 className={s.numTitle}>{step.title}</h2>
                  <p className={s.numBody}>{step.body}</p>
                </div>
                <span className={s.numAside}>{step.aside}</span>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      <CtaBand
        eyebrow="Ready when you are"
        title="Start at phase one with us."
        ctaLabel="Begin a project"
        ctaHref="/contact"
      />
    </>
  );
}
