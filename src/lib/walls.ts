import type { Mural } from "./content";

/**
 * The night-walk on the home page: one lit wall per mural.
 *
 * `wall` is the mural cropped tight so it covers the whole wall face;
 * `photo` is the full on-site shot opened in the lightbox.
 * Details are overridden by the Work data (Supabase) whenever a title matches,
 * so editing a mural there updates its wall too.
 */
export interface Wall {
  title: string;
  client: string;
  place: string;
  year: string;
  size: string;
  wall: string;
  photo: string;
  /** Every photo of the mural for the lightbox (first = `photo`). */
  photos?: string[];
}

const w = (n: number) => ({ wall: `/murals/wall-${n}.jpg`, photo: `/murals/photo-${n}.jpg` });

export const baseWalls: Wall[] = [
  { title: "Istanbul Bazaar", client: "Istanbul Bazaar", place: "Staten Island", year: "2023", size: "40ft x 20ft", ...w(1) },
  { title: "IL Leone", client: "IL Leone Restaurant", place: "Central Jersey", year: "2024", size: "15ft x 12ft", ...w(3) },
  { title: "A Piece of Philly Pride", client: "Brooklyn Dumpling Shop", place: "South Philly", year: "2022", size: "20ft x 7ft", ...w(5) },
  { title: "Groove", client: "Reverie Room NYC", place: "Manhattan", year: "2026", size: "13ft x 8ft", ...w(7) },
  { title: "Ciao Bella, Signorina Lady Justice!", client: "Gelatoville", place: "Manhattan", year: "2025", size: "4ft x 3ft", ...w(9) },
  { title: "Wings on Fire", client: "Wings on Fire", place: "", year: "", size: "", ...w(6) },
  { title: "Pizza Shack", client: "Pizza Shack", place: "", year: "", size: "", ...w(2) },
  { title: "Surf City", client: "Surf City", place: "", year: "", size: "", ...w(4) },
  { title: "Hibernica", client: "Hibernica", place: "", year: "", size: "", ...w(8) },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function buildWalls(murals: Mural[]): Wall[] {
  return baseWalls.map((b) => {
    const m = murals.find((x) => norm(x.title) === norm(b.title));
    if (!m) return b;
    return {
      ...b,
      title: m.title,
      client: m.client || b.client,
      place: m.regionName || b.place,
      year: m.year ? String(m.year) : b.year,
      size: m.size || b.size,
    };
  });
}

/** Shape a wall as a Mural so the Work page's lightbox can open it. */
export function wallAsMural(x: Wall): Mural {
  return {
    title: x.title,
    client: x.client,
    year: Number(x.year) || 0,
    size: x.size,
    regionName: x.place,
    regionSlug: "",
    images: x.photos?.length ? x.photos : [x.photo],
    video: "",
    cover: x.photo,
  };
}
