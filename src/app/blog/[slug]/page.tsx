import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CtaBand from "@/components/site/CtaBand";
import { getPosts, getPostBySlug } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { withBase } from "@/lib/asset";
import { formatDate } from "@/lib/date";
import styles from "./article.module.css";

// Prerender every post at build time (required for `output: export`).
export async function generateStaticParams() {
  const posts = await getPosts();
  const params = posts.map((p) => ({ slug: p.slug }));
  // `output: export` errors on a dynamic route with zero params. When the
  // Journal is empty (no posts due yet), emit one placeholder slug that simply
  // renders 404 — so the build still succeeds and no real post is shown.
  return params.length > 0 ? params : [{ slug: "__none__" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Journal" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body);

  return (
    <article>
      <header className={styles.hero}>
        <div className={styles.heroMedia} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.cover} src={withBase(post.cover)} alt="" />
          <div className={styles.overlay} />
        </div>
        <div className={`container ${styles.heroInner}`}>
          <Link href="/blog" className={styles.back} data-cursor="link">
            ← The Journal
          </Link>
          {post.category && <span className={styles.eyebrow}>{post.category}</span>}
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.meta}>
            {[post.author, formatDate(post.date, true)].filter(Boolean).join("  ·  ")}
          </p>
        </div>
      </header>

      <div className="container">
        <div
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <CtaBand
        title="Like how we think? Let's make something."
        ctaLabel="Start a project"
        ctaHref="/contact"
      />
    </article>
  );
}
