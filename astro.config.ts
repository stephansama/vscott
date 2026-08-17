import sitemap from "@astrojs/sitemap";
import { createIntegration as iconifySvgMap } from "@stephansama/astro-iconify-svgmap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://vernonscott.dev",
  integrations: [
    // Build-time Iconify SVG sprite. Icon packs are read from the
    // @iconify-json/* dependencies in package.json (see [[icons-iconify]]).
    // outDir "dist" writes the generated sprites straight into the build
    // output (build:done runs after Astro copies public/ → dist/, so writing
    // there is what lands in production); dev is served from middleware.
    iconifySvgMap({
      iconifyRootDirectory: new URL("./", import.meta.url),
      outDir: "dist",
    }),
    sitemap(),
  ],
});
