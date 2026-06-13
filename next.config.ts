import type { NextConfig } from "next";

/**
 * Static-export config for GitHub Pages is gated on `GITHUB_PAGES=true` so that
 * local dev (`npm run dev`) and a normal `npm run build` are unaffected and
 * still serve from the root. The CI workflow sets GITHUB_PAGES + the base path.
 */
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      basePath,
      assetPrefix: basePath || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
