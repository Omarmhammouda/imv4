/**
 * Fallback Work data — used only when Supabase isn't configured / reachable.
 * Real murals live in Supabase (`projects` table). The regions below are a
 * starting taxonomy for the filter; `featured` is intentionally empty so no
 * placeholder murals ever ship in the code.
 */

export interface Project {
  title: string;
  client: string;
  year: number;
  size: string; // e.g. "24m × 18m"
  images?: string[]; // one or more photos (first = cover); falls back to placeholders
  video?: string; // optional hover clip (falls back to a rotating placeholder)
}

export interface Region {
  id: string;
  name: string;
  count: number; // murals in region
  blurb: string;
  video: string;
  poster: string;
  featured: Project[];
}

export const regions: Region[] = [
  { id: "downtown", name: "Downtown Core", count: 0, blurb: "", video: "/videos/scale.mp4", poster: "/posters/scale.jpg", featured: [] },
  { id: "harbor", name: "Harbor & Riverside", count: 0, blurb: "", video: "/videos/scale.mp4", poster: "/posters/scale.jpg", featured: [] },
  { id: "northside", name: "Northside", count: 0, blurb: "", video: "/videos/craft.mp4", poster: "/posters/craft.jpg", featured: [] },
  { id: "oldtown", name: "Old Town", count: 0, blurb: "", video: "/videos/legacy.mp4", poster: "/posters/legacy.jpg", featured: [] },
  { id: "industrial", name: "Industrial District", count: 0, blurb: "", video: "/videos/impact.mp4", poster: "/posters/impact.jpg", featured: [] },
  { id: "heights", name: "The Heights", count: 0, blurb: "", video: "/videos/vision.mp4", poster: "/posters/vision.jpg", featured: [] },
];

export const totalMurals = regions.reduce((n, r) => n + r.count, 0);
