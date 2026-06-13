/**
 * Prefix a public asset path with the deploy base path.
 *
 * On GitHub Pages the site is served from a sub-path (e.g. /imv4), so raw
 * "/videos/..." references must be prefixed. `NEXT_PUBLIC_BASE_PATH` is inlined
 * at build time (empty for local dev / root deploys, "/imv4" on Pages).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string): string =>
  path.startsWith("/") ? `${BASE_PATH}${path}` : path;
