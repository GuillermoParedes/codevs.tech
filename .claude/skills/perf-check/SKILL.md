---
name: perf-check
description: Audita el performance web de codevs.tech — peso del bundle, hidratación de islas React, fuentes, imágenes y Core Web Vitals. Úsalo tras añadir dependencias, componentes React o imágenes, o cuando el usuario pida "revisar performance", "optimizar velocidad" o "mejorar Lighthouse".
---

# Auditoría de performance

Skill de **diagnóstico + optimización**. Mide antes de proponer; nada de optimizaciones a ciegas.

## 1. Mide

```bash
npm run build
du -sh dist
find dist -name '*.js'  -exec du -h {} + | sort -rh | head -20
find dist -name '*.css' -exec du -h {} + | sort -rh | head -10
find dist \( -name '*.png' -o -name '*.jpg' -o -name '*.webp' -o -name '*.svg' \) -exec du -h {} + | sort -rh | head -20
```

Si hay Chrome disponible, corre Lighthouse contra `npm run preview` (móvil, throttling por defecto)
y quédate con LCP, CLS, INP, TBF y peso total. Si no lo hay, dilo — no inventes puntuaciones.

## 2. Revisa por orden de impacto

### Fuentes — el mayor coste hoy

`Layout.astro` carga IBM Plex Mono desde `fonts.googleapis.com` con el patrón
`rel="preload" as="style" onload="this.rel='stylesheet'"`. Eso son dos conexiones externas en la
ruta crítica y un riesgo de FOUT/CLS. Corrección: self-hostear la fuente en `public/fonts/`
(subconjunto latin, `.woff2`), declararla con `@font-face` + `font-display: swap` en `base.css`, y
precargar solo el peso usado above-the-fold. Elimina los `preconnect` a Google.

### Islas React

```bash
rg 'client:(load|idle|visible|only|media)' src/
```

- `client:load` solo se justifica si el componente es interactivo antes del primer scroll.
  `Search.tsx` sí; casi nada más.
- `Card.tsx` y `Datetime.tsx` son React pero **no tienen estado** — son candidatos a convertirse en
  `.astro` puro y bajar JS a cero en home y listados. Es la mejora de TBT más barata disponible.
- Cualquier componente nuevo: `client:visible` por defecto.

### Imágenes

- `public/astropaper-og.jpg` pesa ~149 KB y es el OG por defecto del tema, no de Codevs.
- `public/assets/dev.svg` (23 KB) y `forrest-gump-quote.webp` (27 KB): comprueba si se sirven en la
  ruta crítica.
- Los assets de `public/` **no** pasan por el pipeline de optimización de Astro. Lo que deba
  optimizarse (redimensionado, AVIF/WebP, `srcset`) va en `src/assets/` y se usa con
  `<Image />` de `astro:assets`.
- Todo `<img>`: `width`, `height` y `loading="lazy"` salvo el LCP, que lleva `fetchpriority="high"`.

### CSS y JS

- Tailwind purga por `content` en `tailwind.config.cjs` — verifica que cubre `.astro`, `.tsx` y
  `.md`, o se cuelan clases muertas.
- `/search` carga `fuse.js` **y** el índice completo de posts. Con el catálogo actual da igual;
  a partir de ~50 artículos hay que cargarlo bajo demanda.
- `public/toggle-theme.js` es `is:inline async` — correcto, pero valida que no cause flash de tema.

### Red y cache

- Deploy en Vercel: los assets con hash deben ir con `Cache-Control: immutable`. El HTML no.
- Sin adapter SSR configurado, todo es estático — aprovecha eso, no lo rompas sin motivo.

## 3. Presupuestos

Objetivos para este sitio (estático, contenido en texto):

| Métrica | Presupuesto |
|---|---|
| JS por página (home / artículo) | < 30 KB comprimido |
| CSS total | < 25 KB comprimido |
| LCP móvil | < 2.0 s |
| CLS | < 0.05 |
| Lighthouse Performance móvil | ≥ 95 |

Un cambio que empeore cualquiera de estos necesita justificación explícita.

## 4. Reporta

Tabla **métrica · valor medido · presupuesto · veredicto**, seguida de las correcciones ordenadas
por (impacto ÷ esfuerzo). Indica siempre cuáles mediste de verdad y cuáles son estimación.
