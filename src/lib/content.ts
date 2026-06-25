import { cache } from "react";
import {
  chapters as fallbackChapters,
  type Chapter,
} from "./chapters";
import {
  regions as fallbackRegions,
  type Region,
  type Project,
} from "./projects";
import { getSupabase } from "./supabase";

export type { Chapter, Region, Project };

export interface Settings {
  studioName: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagramUrl: string;
  behanceUrl: string;
  addressLine1: string;
  addressLine2: string;
  addressNote: string;
  hours: string;
  foundingYear: number;
}

export interface Stat {
  value: string;
  label: string;
}

export const fallbackSettings: Settings = {
  studioName: "Insomnia Murals",
  tagline: "Nocturnal studio for large-scale murals & brand identity",
  email: "info@insomniamurals.com",
  // phone / address / socials intentionally empty — components hide empty fields
  phone: "",
  whatsapp: "",
  instagramUrl: "",
  behanceUrl: "",
  addressLine1: "",
  addressLine2: "",
  addressNote: "",
  hours: "We answer noon–midnight",
  foundingYear: 2014,
};

export const fallbackStats: Stat[] = [
  { value: "10+", label: "Years sleepless" },
  { value: "61", label: "Murals delivered" },
  { value: "14k", label: "m² painted" },
  { value: "9×", label: "Design awards" },
];

/** A single mural — the unit the Work page is built around. */
export interface Mural {
  title: string;
  client: string;
  year: number;
  size: string;
  regionName: string;
  regionSlug: string;
  images: string[]; // real photos only (may be empty) — drives the lightbox
  video: string; // real preview video, or "" — autoplays as the card cover
  cover: string; // poster image: first real photo, else a placeholder
}

// Rotating placeholder visuals so the gallery looks varied before real mural
// photos are added (a project's own `images`/`video` override these).
const ROTATION = ["vision", "craft", "scale", "collaboration", "impact", "legacy"];

// Treat empty / placeholder-ish text ("null", "NULL", "n/a", …) as not-set, so
// values typed into the Supabase Table Editor by hand don't become broken URLs.
function cleanStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (!s) return undefined;
  if (["null", "nil", "na", "n/a", "none", "undefined"].includes(s.toLowerCase()))
    return undefined;
  return s;
}

function buildMurals(regions: Region[]): Mural[] {
  const murals: Mural[] = [];
  let i = 0;
  for (const r of regions) {
    for (const p of r.featured) {
      const placeholders = [0, 1, 2].map(
        (k) => `/posters/${ROTATION[(i + k) % ROTATION.length]}.jpg`,
      );
      const realImages = (p.images ?? [])
        .map(cleanStr)
        .filter((x): x is string => Boolean(x));
      murals.push({
        title: p.title,
        client: p.client,
        year: p.year,
        size: p.size,
        regionName: r.name,
        regionSlug: r.id,
        images: realImages, // real photos only (drives lightbox)
        video: cleanStr(p.video) ?? "", // real preview video, else ""
        cover: realImages[0] ?? placeholders[0], // poster
      });
      i++;
    }
  }
  return murals;
}

export interface SiteContent {
  settings: Settings;
  chapters: Chapter[];
  regions: Region[];
  murals: Mural[];
  stats: Stat[];
  totalMurals: number;
}

const fallbackMurals = buildMurals(fallbackRegions);
const fallbackContent: SiteContent = {
  settings: fallbackSettings,
  chapters: fallbackChapters,
  regions: fallbackRegions,
  murals: fallbackMurals,
  stats: fallbackStats,
  totalMurals: fallbackMurals.length,
};

/**
 * Build-time content fetch. Pulls everything from Supabase when configured,
 * otherwise returns the bundled fallback so the site always builds & renders.
 */
export const getContent = cache(async (): Promise<SiteContent> => {
  const sb = getSupabase();
  if (!sb) return fallbackContent;

  try {
    const [settings, chapters, regions, projects, stats] = await Promise.all([
      sb.from("settings").select("*").eq("id", 1).single(),
      sb.from("chapters").select("*").order("sort"),
      sb.from("regions").select("*").order("sort"),
      sb.from("projects").select("*").order("sort"),
      sb.from("stats").select("*").order("sort"),
    ]);

    if (chapters.error || regions.error || projects.error || stats.error) {
      console.warn("[content] Supabase read error — using fallback content");
      return fallbackContent;
    }

    const mappedChapters: Chapter[] = (chapters.data ?? []).map(
      (c: Record<string, unknown>, i: number) => ({
        id: String(c.slug),
        index: Number(c.sort ?? i + 1),
        label: String(c.label),
        lines: [c.line1, c.line2, c.line3].filter(Boolean) as string[],
        emphasis:
          c.emphasis_word != null && c.emphasis_line != null
            ? { line: Number(c.emphasis_line), word: String(c.emphasis_word) }
            : undefined,
        body: String(c.body),
        cta: { label: String(c.cta_label), href: String(c.cta_href) },
        video: String(c.video),
        poster: String(c.poster),
        align: c.align === "right" ? "right" : "left",
      }),
    );

    const projByRegion = new Map<string, Project[]>();
    for (const p of (projects.data ?? []) as Record<string, unknown>[]) {
      const key = String(p.region_slug);
      const arr = projByRegion.get(key) ?? [];
      arr.push({
        title: String(p.title),
        client: String(p.client ?? ""),
        year: Number(p.year ?? 0),
        size: String(p.size ?? ""),
        images: Array.isArray(p.images)
          ? (p.images as unknown[]).map(String).filter(Boolean)
          : undefined,
        video: p.video ? String(p.video) : undefined,
      });
      projByRegion.set(key, arr);
    }

    const mappedRegions: Region[] = (regions.data ?? []).map(
      (r: Record<string, unknown>) => ({
        id: String(r.slug),
        name: String(r.name),
        count: Number(r.mural_count ?? 0),
        blurb: String(r.blurb ?? ""),
        video: String(r.video ?? ""),
        poster: String(r.poster ?? ""),
        featured: projByRegion.get(String(r.slug)) ?? [],
      }),
    );

    const s = settings.data as Record<string, unknown> | null;
    // cleanStr() turns empty / "null" / whitespace into undefined, so a field
    // cleared in Supabase becomes "" and the components hide it (rather than
    // leaking the fallback or a blank link).
    const mappedSettings: Settings = s
      ? {
          studioName: cleanStr(s.studio_name) ?? fallbackSettings.studioName,
          tagline: cleanStr(s.tagline) ?? fallbackSettings.tagline,
          email: cleanStr(s.email) ?? fallbackSettings.email,
          phone: cleanStr(s.phone) ?? "",
          whatsapp: cleanStr(s.whatsapp) ?? "",
          instagramUrl: cleanStr(s.instagram_url) ?? "",
          behanceUrl: cleanStr(s.behance_url) ?? "",
          addressLine1: cleanStr(s.address_line1) ?? "",
          addressLine2: cleanStr(s.address_line2) ?? "",
          addressNote: cleanStr(s.address_note) ?? "",
          hours: cleanStr(s.hours) ?? fallbackSettings.hours,
          foundingYear: Number(s.founding_year ?? fallbackSettings.foundingYear),
        }
      : fallbackSettings;

    const mappedStats: Stat[] = (stats.data ?? []).map(
      (st: Record<string, unknown>) => ({
        value: String(st.value),
        label: String(st.label),
      }),
    );

    const finalRegions = mappedRegions.length ? mappedRegions : fallbackRegions;
    const murals = buildMurals(finalRegions);
    return {
      settings: mappedSettings,
      chapters: mappedChapters.length ? mappedChapters : fallbackChapters,
      regions: finalRegions,
      murals,
      stats: mappedStats.length ? mappedStats : fallbackStats,
      totalMurals: murals.length,
    };
  } catch (e) {
    console.warn("[content] Supabase fetch failed — using fallback content", e);
    return fallbackContent;
  }
});

// ============================================================================
// BLOG / JOURNAL — posts live in the Supabase `posts` table (markdown body).
// ============================================================================
export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  body: string; // markdown
  category: string;
  author: string;
  cover: string; // image URL/path; falls back to a poster
  date: string; // ISO date (published_at)
}

const POST_FALLBACK_COVER = "/posters/craft.jpg";

export const fallbackPosts: Post[] = [
  {
    slug: "what-a-wall-can-say",
    title: "What a wall can say that a billboard can't",
    excerpt:
      "A mural isn't an ad you scroll past — it's a place. Here's how we think about giving a street its name back.",
    category: "Field notes",
    author: "Insomnia Murals",
    cover: "/posters/impact.jpg",
    date: "2026-05-12",
    body: "A billboard rents your attention for as long as the light is red. A mural earns it for years.\n\n## The difference is permanence\n\nWhen we paint a wall, we're not buying media — we're making a landmark. People give it a name, take photos against it, meet there. That's a different contract with a place.\n\n## How we approach it\n\n- **Start with the street, not the logo.** What does this block need?\n- **One decisive idea.** Restraint is what makes the red land.\n- **Built to last.** UV-stable systems, sealed and documented.\n\n> Paint fades; landmarks don't.\n\nThat's the whole brief, every time.",
  },
  {
    slug: "painting-after-dark",
    title: "Why we paint after dark",
    excerpt:
      "Quiet streets, cooler walls, and light you can actually control. A short note on the nocturnal craft.",
    category: "Process",
    author: "Insomnia Murals",
    cover: "/posters/vision.jpg",
    date: "2026-04-02",
    body: "The studio is called Insomnia for a reason.\n\nNight work isn't a gimmick — it's practical. Streets are quiet, so lifts and rigging go up without a crowd. Walls are cool, so paint behaves. And with the sun gone, **we control the light** ourselves, which means cleaner color and truer fades.\n\n## The trade-offs\n\nIt's slower to set up and harder on the team. But the work that comes off a wall at 3 a.m. holds a quality the daytime rush never quite matches.",
  },
];

export const getPosts = cache(async (): Promise<Post[]> => {
  const sb = getSupabase();
  if (!sb) return fallbackPosts;
  try {
    const { data, error } = await sb
      .from("posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false })
      .order("sort", { ascending: true });
    if (error || !data || data.length === 0) return fallbackPosts;
    return data.map((p: Record<string, unknown>) => ({
      slug: String(p.slug),
      title: String(p.title),
      excerpt: cleanStr(p.excerpt) ?? "",
      body: String(p.body ?? ""),
      category: cleanStr(p.category) ?? "",
      author: cleanStr(p.author) ?? "",
      cover: cleanStr(p.cover) ?? POST_FALLBACK_COVER,
      date: String(p.published_at ?? ""),
    }));
  } catch (e) {
    console.warn("[content] posts fetch failed — using fallback posts", e);
    return fallbackPosts;
  }
});

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
});
