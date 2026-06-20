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
  email: "hello@insomniamurals.studio",
  phone: "+1 (000) 000-0000",
  whatsapp: "10000000000",
  instagramUrl: "https://instagram.com",
  behanceUrl: "https://behance.net",
  addressLine1: "Unit 7, The Coil Works",
  addressLine2: "14 Lantern Lane",
  addressNote: "Night entrance off the alley",
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
    const mappedSettings: Settings = s
      ? {
          studioName: String(s.studio_name ?? fallbackSettings.studioName),
          tagline: String(s.tagline ?? fallbackSettings.tagline),
          email: String(s.email ?? fallbackSettings.email),
          phone: String(s.phone ?? fallbackSettings.phone),
          whatsapp: String(s.whatsapp ?? fallbackSettings.whatsapp),
          instagramUrl: String(s.instagram_url ?? fallbackSettings.instagramUrl),
          behanceUrl: String(s.behance_url ?? fallbackSettings.behanceUrl),
          addressLine1: String(s.address_line1 ?? fallbackSettings.addressLine1),
          addressLine2: String(s.address_line2 ?? fallbackSettings.addressLine2),
          addressNote: String(s.address_note ?? fallbackSettings.addressNote),
          hours: String(s.hours ?? fallbackSettings.hours),
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
