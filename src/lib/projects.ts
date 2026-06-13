/**
 * The Work "map" — murals organised by region, like a level/region select.
 * Mirrors the reference's regional list with counts. Hover plays the region
 * video; click opens the (placeholder) region page.
 */

export interface Project {
  title: string;
  client: string;
  year: number;
  size: string; // e.g. "24m × 18m"
}

export interface Region {
  id: string;
  name: string;
  count: number; // murals in region
  blurb: string;
  /** Reuse chapter footage as ambient hover backgrounds. */
  video: string;
  poster: string;
  featured: Project[];
}

export const regions: Region[] = [
  {
    id: "downtown",
    name: "Downtown Core",
    count: 14,
    blurb: "High-rise gable ends and transit hubs — the murals the whole city drives past.",
    video: "/videos/scale.mp4",
    poster: "/posters/scale.jpg",
    featured: [
      { title: "Sleepless Atlas", client: "Meridian Tower", year: 2024, size: "32m × 21m" },
      { title: "Neon Cartography", client: "City Transit Authority", year: 2023, size: "18m × 9m" },
      { title: "After Hours", client: "Lumen Hotels", year: 2022, size: "12m × 16m" },
    ],
  },
  {
    id: "harbor",
    name: "Harbor & Riverside",
    count: 9,
    blurb: "Warehouse facades and dock walls washed in salt light and slow water.",
    video: "/videos/scale.mp4",
    poster: "/posters/scale.jpg",
    featured: [
      { title: "Tide Memory", client: "Riverside Collective", year: 2024, size: "22m × 11m" },
      { title: "Saltwater Hymn", client: "Port Authority", year: 2023, size: "14m × 14m" },
    ],
  },
  {
    id: "northside",
    name: "Northside",
    count: 12,
    blurb: "Residential blocks and school yards — community walls painted with the people on them.",
    video: "/videos/craft.mp4",
    poster: "/posters/craft.jpg",
    featured: [
      { title: "Block Party", client: "Northside Council", year: 2024, size: "16m × 8m" },
      { title: "Recess", client: "Glenview School", year: 2023, size: "10m × 6m" },
      { title: "Family Tree", client: "Habitat Trust", year: 2022, size: "9m × 12m" },
    ],
  },
  {
    id: "oldtown",
    name: "Old Town",
    count: 7,
    blurb: "Heritage brick and tucked-away laneways — restraint, patina and detail.",
    video: "/videos/legacy.mp4",
    poster: "/posters/legacy.jpg",
    featured: [
      { title: "Patina", client: "Heritage Society", year: 2024, size: "8m × 5m" },
      { title: "The Long Now", client: "Old Town BID", year: 2022, size: "11m × 7m" },
    ],
  },
  {
    id: "industrial",
    name: "Industrial District",
    count: 11,
    blurb: "Raw concrete, silos and rail sidings — the biggest, boldest canvases we get.",
    video: "/videos/impact.mp4",
    poster: "/posters/impact.jpg",
    featured: [
      { title: "Foundry", client: "Ironworks Lofts", year: 2024, size: "28m × 19m" },
      { title: "Conveyor", client: "Rail Freight Co.", year: 2023, size: "40m × 7m" },
    ],
  },
  {
    id: "heights",
    name: "The Heights",
    count: 8,
    blurb: "Hillside neighbourhoods and lookout walls — murals that meet the horizon.",
    video: "/videos/vision.mp4",
    poster: "/posters/vision.jpg",
    featured: [
      { title: "Overlook", client: "Heights Association", year: 2024, size: "15m × 10m" },
      { title: "Skyward", client: "Summit Developments", year: 2023, size: "20m × 13m" },
    ],
  },
];

export const totalMurals = regions.reduce((n, r) => n + r.count, 0);
