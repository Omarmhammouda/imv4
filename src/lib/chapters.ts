/**
 * The six cinematic "chapters" — the spine of the home experience.
 * Each is a full-screen beat with a one-word label, a multi-line editorial
 * headline, a short paragraph, a CTA, and a full-bleed motion background.
 */

export interface Chapter {
  id: string;
  index: number; // 1-based
  label: string; // one-word HUD label
  /** Headline broken across lines for the editorial treatment. */
  lines: string[];
  /** Index of the line whose key word carries the red emphasis (optional). */
  emphasis?: { line: number; word: string };
  body: string;
  cta: { label: string; href: string };
  /** Background video + poster (live in /public). */
  video: string;
  poster: string;
  /** Text alignment side for layout rhythm. */
  align: "left" | "right";
}

export const chapters: Chapter[] = [
  {
    id: "vision",
    index: 1,
    label: "Vision",
    lines: ["We paint", "the walls", "of tomorrow"],
    emphasis: { line: 2, word: "tomorrow" },
    body: "Insomnia Murals is a nocturnal studio for large-scale murals and brand identity. We turn blank concrete into landmarks: work that draws a city's eye and holds it.",
    cta: { label: "Enter the studio", href: "/about" },
    video: "/videos/vision.mp4",
    poster: "/posters/vision.jpg",
    align: "left",
  },
  {
    id: "craft",
    index: 2,
    label: "Craft",
    lines: ["Every wall", "tells", "a story"],
    emphasis: { line: 2, word: "story" },
    body: "From the first sketch to the last coat, we obsess over line, scale and surface. Hand-cut stencils, free-hand aerosol, brushwork: the right tool for the wall in front of us.",
    cta: { label: "See the process", href: "/process" },
    video: "/videos/craft.mp4",
    poster: "/posters/craft.jpg",
    align: "right",
  },
  {
    id: "scale",
    index: 3,
    label: "Scale",
    lines: ["From a sketch", "to", "the skyline"],
    emphasis: { line: 2, word: "skyline" },
    body: "A napkin idea becomes a ten-story statement. We plan, permit and produce murals at architectural scale, engineered to survive weather, light and time.",
    cta: { label: "Browse the work", href: "/work" },
    video: "/videos/scale.mp4",
    poster: "/posters/scale.jpg",
    align: "left",
  },
  {
    id: "collaboration",
    index: 4,
    label: "Collaboration",
    lines: ["Artists, brands", "& cities", "in concert"],
    emphasis: { line: 2, word: "concert" },
    body: "We bring artists, brands and city programs into one room. Clear briefs, shared authorship, and murals that serve the neighborhood as much as the logo.",
    cta: { label: "Our services", href: "/services" },
    video: "/videos/collaboration.mp4",
    poster: "/posters/collaboration.jpg",
    align: "right",
  },
  {
    id: "impact",
    index: 5,
    label: "Impact",
    lines: ["Color that", "changes", "a place"],
    emphasis: { line: 1, word: "changes" },
    body: "A wall can shift how a street feels: slowing traffic, drawing footfall, giving a block its name back. We measure success in the life that gathers around the work.",
    cta: { label: "Start a project", href: "/contact" },
    video: "/videos/impact.mp4",
    poster: "/posters/impact.jpg",
    align: "left",
  },
  {
    id: "legacy",
    index: 6,
    label: "Legacy",
    lines: ["And leaves", "a mark", "that lasts"],
    emphasis: { line: 2, word: "lasts" },
    body: "Paint fades; landmarks don't. We document, protect and maintain every mural so the work keeps speaking long after the lift drives away.",
    cta: { label: "Inquire", href: "/contact" },
    video: "/videos/legacy.mp4",
    poster: "/posters/legacy.jpg",
    align: "right",
  },
];

export const chapterCount = chapters.length;
