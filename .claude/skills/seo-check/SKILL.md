---
name: seo-check
description: Audita el SEO técnico y on-page de codevs.tech — meta tags, Open Graph, JSON-LD, sitemap, robots, headings, enlazado interno y canonicals. Úsalo tras tocar layouts, el <head>, contenido nuevo, o cuando el usuario pida "revisar SEO", "auditar SEO" o "por qué no posiciona".
---

# Auditoría SEO

Es una skill de **diagnóstico**. Reporta hallazgos priorizados; arregla solo lo que el usuario
apruebe, salvo que te haya pedido explícitamente que corrijas.

## Alcance

Audita contra la build real cuando puedas: `npm run build` y luego inspecciona `dist/`. El HTML
generado es la verdad; el `.astro` es solo la intención.

## Checklist

### A. `<head>` — `src/layouts/Layout.astro`

- [ ] `<title>` único por página, ≤60 caracteres, sin duplicados entre rutas.
- [ ] `meta description` única por página, 120–158 caracteres. Verifica que las páginas de listado
      (`/posts`, `/tags/*`) no hereden todas la misma `SITE.desc`.
- [ ] `<link rel="canonical">` correcto — ojo con la barra final: `SITE.website` termina en `/`.
- [ ] `og:type` — **falta**. Debe ser `article` en posts y `website` en el resto.
- [ ] `og:locale` (`es_ES`) y `og:site_name` — **faltan**.
- [ ] `twitter:site` / `twitter:creator` — faltan si hay cuenta de X.
- [ ] `theme-color` sigue declarado para ambos esquemas y coincide con `--color-fill` de
      `base.css` (si cambia la paleta, hay que actualizarlo a mano).

### B. Datos estructurados (JSON-LD)

- [ ] **Defecto conocido**: `Layout.astro` emite `BlogPosting` en *todas* las páginas, incluidas
      home, `/search` y `/404`, con `datePublished: "undefined"` cuando no hay `pubDatetime`.
      Debe emitirse `BlogPosting` solo en artículos.
- [ ] Falta `Organization` (o `Person`) + `WebSite` con `SearchAction` en la home.
- [ ] Falta `BreadcrumbList` en artículos, aunque el componente `Breadcrumbs.astro` ya existe.
- [ ] Si se añade página de servicios: `Service` / `ProfessionalService` con área y oferta.
- [ ] Valida el JSON emitido: extrae los bloques `application/ld+json` de `dist/` y párselos.

### C. Indexabilidad

- [ ] `src/pages/robots.txt.ts` — la regla `Disallow: /nogooglebot/` es residuo de la plantilla.
- [ ] `sitemap-index.xml` existe en `dist/` y lista todas las rutas públicas.
- [ ] Los posts con `draft: true` **no** aparecen en sitemap ni RSS (comprueba `postFilter.ts`).
- [ ] `/404` no indexable.
- [ ] Sin cadenas de redirección ni rutas duplicadas (`/posts/1` vs `/posts`).

### D. Contenido y estructura

- [ ] Exactamente un `<h1>` por página; jerarquía de headings sin saltos.
- [ ] Toda `<img>` con `alt` descriptivo, `width`/`height` y `loading="lazy"` salvo la del LCP.
- [ ] Enlazado interno: cada artículo debería enlazar 2–3 artículos hermanos. **Hoy casi ninguno lo
      hace** — es la carencia on-page más grande del sitio.
- [ ] Páginas huérfanas (sin ningún enlace entrante desde el sitio).
- [ ] `lang="es"` en `<html>`; si algún día hay contenido en inglés, `hreflang`.

### E. Comercial (soporta el objetivo de captación)

- [ ] Existe una ruta de conversión: artículo → CTA → contacto/servicios.
- [ ] Las páginas de servicio/contacto tienen su propio `title`, `description` y schema.

## Cómo reportar

Tabla con: **hallazgo · severidad (alta/media/baja) · archivo:línea · corrección propuesta**,
ordenada por severidad. Nada de "considera mejorar" — di qué cambiar exactamente.
Si algo del checklist ya está correcto, no lo listes; el reporte es de problemas.
