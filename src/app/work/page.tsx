import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import WorkGallery from "@/components/work/WorkGallery";
import CtaBand from "@/components/site/CtaBand";
import { getContent } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Every mural we've made — browse the work piece by piece and filter by neighborhood.",
};

export default async function WorkPage() {
  const { murals, regions, totalMurals, settings } = await getContent();
  return (
    <>
      <PageHero
        eyebrow="The Work"
        title={["Every wall", "we've signed"]}
        lead="The full wall, piece by piece. Browse every mural we've put up and filter by the neighborhood it lives in."
        meta={[
          { label: "Murals", value: String(totalMurals) },
          { label: "Regions", value: String(regions.length) },
          { label: "Since", value: String(settings.foundingYear) },
        ]}
      />

      <section className="section container" aria-label="All murals">
        <WorkGallery murals={murals} regions={regions} />
      </section>

      <CtaBand
        title="Got a wall in mind?"
        ctaLabel="Start a project"
        ctaHref="/contact"
      />
    </>
  );
}
