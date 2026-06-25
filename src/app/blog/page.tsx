import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import CtaBand from "@/components/site/CtaBand";
import BlogList from "@/components/blog/BlogList";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Field notes from a nocturnal mural studio — process, craft, and the thinking behind the walls.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHero
        eyebrow="The Journal"
        title={["Notes from", "after dark"]}
        lead="Process, craft and the thinking behind the walls — dispatches from the studio between coats."
      />

      <section className="section container" aria-label="Journal posts">
        <BlogList posts={posts} />
      </section>

      <CtaBand title="Got a wall in mind?" ctaLabel="Start a project" ctaHref="/contact" />
    </>
  );
}
