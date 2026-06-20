import type { NextConfig } from "next";

/**
 * Static export is opt-in so local dev (`npm run dev`) and a normal
 * `npm run build` (+ `next start`) are unaffected and serve from the root.
 *   - Cloudflare Pages / any static host: `npm run build:export` (root, no basePath)
 *   - GitHub project page: the CI workflow sets GITHUB_PAGES + NEXT_PUBLIC_BASE_PATH=/imv4
 * The base path comes ONLY from NEXT_PUBLIC_BASE_PATH — leave it unset to serve
 * at a domain root (e.g. insomniamurals.com); set it for the /imv4 GitHub URL.
 */
const isExport =
  process.env.STATIC_EXPORT === "true" || process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = isExport
  ? {
      output: "export",
      basePath,
      assetPrefix: basePath || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
