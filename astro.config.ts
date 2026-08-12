import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,

  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    /* `mdx()` va DESPUÉS de todo lo que toque la config de markdown: hereda
       `markdown.remarkPlugins` y `shikiConfig` de abajo (extendMarkdownConfig
       por defecto), así que un .mdx sale con el mismo TOC y los mismos temas de
       Shiki que un .md. Sólo se usa en artículos con demo embebida. */
    mdx(),
    sitemap(),
  ],

  markdown: {
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      wrap: true,
    },
  },

  vite: {
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },

  scopedStyleStrategy: "where",

  experimental: {
    contentLayer: true,
  },
});
