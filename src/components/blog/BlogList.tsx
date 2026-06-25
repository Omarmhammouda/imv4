"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/content";
import { sfx } from "@/lib/sound";
import { withBase } from "@/lib/asset";
import { formatDate } from "@/lib/date";
import styles from "./BlogList.module.css";

function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`${styles.card} ${featured ? styles.featured : ""}`}
      data-cursor="link"
      data-cursor-label="Read"
      onMouseEnter={() => sfx.hover()}
      onClick={() => sfx.select()}
    >
      <div className={styles.media}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.cover} src={withBase(post.cover)} alt="" loading="lazy" />
        {post.category && <span className={styles.cat}>{post.category}</span>}
      </div>
      <div className={styles.info}>
        <p className={styles.date}>{formatDate(post.date)}</p>
        <h3 className={styles.title}>{post.title}</h3>
        {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}
        {featured && <span className={styles.readMore}>Read the post →</span>}
      </div>
    </Link>
  );
}

export default function BlogList({ posts }: { posts: Post[] }) {
  const [filter, setFilter] = useState("all");

  if (posts.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No posts yet.</p>
        <p className={styles.emptyText}>New writing is on its way — check back soon.</p>
      </div>
    );
  }

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));
  const featured = posts[0];
  const gridPosts = filter === "all" ? posts.slice(1) : posts.filter((p) => p.category === filter);

  const pick = (c: string) => {
    setFilter(c);
    sfx.select();
  };

  return (
    <div>
      {categories.length > 1 && (
        <div className={styles.filters} aria-label="Filter posts by topic">
          <button
            type="button"
            className={`${styles.chip} ${filter === "all" ? styles.chipActive : ""}`}
            onClick={() => pick("all")}
            onMouseEnter={() => sfx.hover()}
            data-cursor="link"
            aria-pressed={filter === "all"}
          >
            All <span className={styles.chipCount}>{posts.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.chip} ${filter === c ? styles.chipActive : ""}`}
              onClick={() => pick(c)}
              onMouseEnter={() => sfx.hover()}
              data-cursor="link"
              aria-pressed={filter === c}
            >
              {c} <span className={styles.chipCount}>{posts.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>
      )}

      {filter === "all" && featured && <PostCard post={featured} featured />}

      <div className={styles.grid} key={filter}>
        {gridPosts.map((p) => (
          <PostCard key={p.slug} post={p} />
        ))}
      </div>
    </div>
  );
}
