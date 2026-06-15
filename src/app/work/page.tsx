import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import WorkMap from "@/components/work/WorkMap";
import CtaBand from "@/components/site/CtaBand";
import { totalMurals, regions } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Murals organised by region — a map of the walls we've made across the city. Downtown, harbour, industrial and beyond.",
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        eyebrow="The Map"
        title={["Murals,", "by region"]}
        lead="Every wall has a postcode. Browse the work the way the city sees it. Select a region to explore the murals that landed there."
        meta={[
          { label: "Total murals", value: `${totalMurals}+` },
          { label: "Regions", value: String(regions.length) },
          { label: "Since", value: "2014" },
          { label: "Cities", value: "1 (and counting)" },
        ]}
      />

      <section className="section container" aria-label="Mural regions">
        <WorkMap />
      </section>

      <CtaBand
        title="Got a wall in mind?"
        ctaLabel="Start a project"
        ctaHref="/contact"
      />
    </>
  );
}
