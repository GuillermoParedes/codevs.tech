# CLAUDE.md

Guía para trabajar en `codevs.tech`. Léela antes de tocar código.

## Qué es este proyecto

Blog técnico personal/de marca de **Codevs** (Guillermo David Paredes Torrez), en español.
Basado en el tema **AstroPaper v4.5** (Astro 4.15). Repo: `GuillermoParedes/codevs.tech`.

Tres objetivos activos — toda decisión técnica se justifica contra ellos:

1. **Blog de desarrollo interactivo** — artículos con demos ejecutables, no solo bloques de código.
2. **Captación de clientes** — el blog es el canal; el sitio debe convertir lector → lead.
3. **SEO + performance** — Core Web Vitals verdes y páginas indexables/ricas en schema.

El estado actual cubre (1) parcialmente y (2) nada. Ver `docs/ROADMAP.md`.

## Stack

| Pieza | Versión / detalle |
|---|---|
| Framework | Astro 4.15 (`output` estático por defecto) |
| UI islands | React 18 (`@astrojs/react`) — solo donde hace falta interactividad |
| Estilos | Tailwind 3.4 + `@tailwindcss/typography`, `applyBaseStyles: false` |
| Contenido | Content Layer **experimental** (`experimental.contentLayer: true`), colección `blog` vía `glob()` |
| Markdown | `remark-toc` + `remark-collapse`, Shiki (`min-light` / `night-owl`) |
| SEO base | `@astrojs/sitemap`, `robots.txt.ts`, OG images generadas con Satori + resvg |
| Búsqueda | `fuse.js` (isla React en `/search`) |
| Deploy | Vercel |
| Calidad | ESLint 9 (flat config), Prettier + plugins astro/tailwind, `astro check` |

## Comandos

```bash
npm run dev           # dev server
npm run build         # astro check && astro build  ← esto es lo que corre CI
npm run preview       # sirve dist/
npm run lint          # eslint .
npm run format        # prettier --write
npm run format:check  # lo que valida CI
```

CI (`.github/workflows/ci.yml`) corre en PR: `lint` → `format:check` → `build`. **Antes de dar por
terminado un cambio, corre los tres.** No hay suite de tests todavía.

## Mapa del código

```
src/
├── config.ts               # SITE, LOCALE (es-ES), LOGO_IMAGE, SOCIALS  ← fuente única de verdad
├── types.ts                # Site, SocialObjects
├── content/
│   ├── config.ts           # schema Zod de la colección `blog`
│   └── blog/*.md           # los artículos
├── layouts/
│   ├── Layout.astro        # <head>: meta, OG, Twitter, JSON-LD, fuentes, ViewTransitions
│   ├── PostDetails.astro   # página de artículo
│   ├── Posts.astro / TagPosts.astro / Main.astro / AboutLayout.astro
├── pages/
│   ├── index.astro         # home: hero + posts recientes
│   ├── posts/[slug]/       # index.astro (artículo) + index.png.ts (OG dinámico)
│   ├── posts/[...page].astro, [page].astro   # listado paginado
│   ├── tags/               # índice de tags y listados por tag
│   ├── search.astro, 404.astro, about.md
│   ├── rss.xml.ts, robots.txt.ts, og.png.ts
├── components/             # .astro estáticos; .tsx solo Card, Datetime, Search
├── utils/                  # getSortedPosts, getPostsByTag, getUniqueTags, postFilter,
│                           # slugify, generateOgImages + og-templates/
└── styles/base.css         # variables CSS de tema (light/dark) + capa .prose
```

Alias de TS (definidos en `tsconfig.json`, `baseUrl: src`): `@config`, `@components/*`,
`@layouts/*`, `@pages/*`, `@utils/*`, `@assets/*`, `@content/*`, `@styles/*`.
**Úsalos siempre**, nunca rutas relativas largas.

## Convenciones

- **Idioma**: contenido y UI en **español** (`LOCALE.lang = "es"`). Los nombres de código en inglés.
- **Astro primero**: un componente nuevo es `.astro` salvo que necesite estado o eventos. Si necesita
  React, usa la directiva de cliente más barata (`client:visible` > `client:idle` > `client:load`).
- **Nada de CSS suelto**: usa Tailwind con los tokens `skin-*` (`bg-skin-fill`, `text-skin-base`,
  `text-skin-accent`…) definidos en `tailwind.config.cjs` sobre las variables de `base.css`.
  Un color hardcodeado rompe el modo oscuro.
- **Config centralizada**: título, dominio, autor, paginación y redes van en `src/config.ts`.
- **Commits**: convencionales, en el estilo ya usado en el historial (`imp:`, `upd:`, `fix:`, `feat:`).
- **TypeScript strict** (`astro/tsconfigs/strict`): `astro check` es parte del build, no lo saltes.

## Artículos

Van en `src/content/blog/<slug>.md`. Frontmatter validado por Zod — campos:

```yaml
---
title: string              # obligatorio
description: string        # obligatorio — es la meta description y el snippet de Google
pubDatetime: 2024-11-02T09:00:01Z   # obligatorio, ISO con Z
modDatetime:               # opcional; ponlo al editar un post ya publicado
author: Codevs
slug: mi-slug              # opcional; si falta se deriva del nombre de archivo
featured: false
draft: false               # true = no se publica
tags: [NextJS, TypeScript] # obligatorio de facto; genera /tags/<tag>
ogImage:                   # opcional; si falta se genera dinámicamente (≥1200x630 si la pones)
canonicalURL:              # solo si el artículo se republicó desde otro sitio
---
```

Reglas de contenido:

- Empieza con `## Table of contents` si el artículo es largo — `remark-toc` + `remark-collapse` lo
  expanden y colapsan solos.
- Un solo `<h1>` lo pone el layout; en el markdown arranca en `##`.
- Los bloques de código llevan lenguaje (` ```typescript `) — Shiki lo necesita para colorear.
- `description` entre 120 y 158 caracteres, con la keyword principal.
- Usa `/nuevo-post` para generar el andamiaje correcto.

## Cosas que ya sabemos (no las re-descubras)

- `astro.config.ts` **importa `@astrojs/vercel/serverless` pero nunca lo usa** — el sitio se compila
  estático. Si algún día necesitas SSR (formularios, API routes), hay que añadir
  `adapter: vercel()` + `output: "server"` o `"hybrid"`. Hoy no está.
- `Layout.astro` inyecta JSON-LD de tipo **`BlogPosting` en todas las páginas**, incluidas home,
  `/search` y `/404`. Es un defecto de SEO conocido y pendiente (ver roadmap).
- Las fuentes se cargan desde Google Fonts por red en `Layout.astro` — coste de LCP pendiente de
  resolver con self-hosting.
- La identidad visual es propia (paleta verde/ámbar sobre azul-negro, display en IBM Plex Mono
  pesada y en versalitas, ventana de terminal en los bloques de código). No es AstroPaper de fábrica:
  antes de "arreglar" un estilo que parezca raro, mira `.display`, `.code-window` y `.prompt` en
  `src/styles/base.css`.
- **MDX no está instalado.** Para artículos con componentes interactivos embebidos hay que añadir
  `@astrojs/mdx` primero.
- No hay tests ni Lighthouse en CI.
- `public/` guarda el CV en PDF y assets de marca; `astropaper-og.jpg` sigue siendo el OG por defecto
  del tema, no de Codevs.

## Skills del proyecto

- `/nuevo-post` — crea un artículo con frontmatter válido y checklist de SEO.
- `/seo-check` — audita meta tags, schema, sitemap, headings y enlaces internos.
- `/perf-check` — build + análisis de peso, islas React, imágenes y fuentes.

## Antes de terminar cualquier cambio

1. `npm run lint`
2. `npm run format:check`
3. `npm run build` (incluye `astro check`)
4. Si tocaste el `<head>`, layouts o contenido: pasa `/seo-check`.
5. Si tocaste componentes, imágenes o dependencias: pasa `/perf-check`.
