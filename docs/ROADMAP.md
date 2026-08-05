# Roadmap — codevs.tech

Análisis del estado actual (2026-07-31) frente a los tres objetivos del proyecto, y el trabajo
pendiente ordenado por impacto. Documento vivo: al cerrar un punto, márcalo y anota el commit.

## Resumen del diagnóstico

El sitio es un **AstroPaper v4.5 sin personalizar más allá del contenido**. La base técnica es
buena (estático, Astro, Tailwind, sitemap, OG dinámicas), pero:

- Del objetivo **blog interactivo** solo existe la mitad estática: hay artículos con bloques de
  código, no hay ninguna pieza ejecutable ni el soporte (MDX) para tenerla.
- Del objetivo **captación de clientes** no existe nada: ni servicios, ni contacto, ni CTA, ni
  captura de correo. El único enlace comercial es un `mailto:` en el footer y un CV en PDF suelto
  en `public/`.
- **SEO** tiene los fundamentos del tema, pero con dos defectos reales (schema mal emitido,
  enlazado interno inexistente) que sí cuestan posiciones.
- **Performance** parte de una buena línea base estática, con tres fugas identificadas: fuentes
  remotas, islas React innecesarias y assets sin optimizar.

## 1. Blog de desarrollo interactivo

Estado: **parcial**. 6 artículos en `src/content/blog/`, pipeline Markdown con Shiki, TOC
colapsable, tags, RSS, búsqueda con Fuse.js, OG generadas por artículo. Todo eso funciona.

Falta:

- [ ] **Instalar `@astrojs/mdx`.** Es el bloqueante duro: sin MDX no se pueden embeber componentes
      dentro de un artículo. Los `.md` actuales siguen funcionando sin tocarlos.
- [ ] Directorio `src/components/demos/` con una convención para demos: autocontenidas, sin
      dependencias nuevas, montadas con `client:visible`, respetando los tokens `skin-*`.
- [ ] Componentes de artículo reutilizables: `<Callout>`, `<CodeCompare>` (antes/después),
      `<Terminal>` (salida simulada), `<Sandbox>` (embed diferido de StackBlitz).
- [x] Serie / artículos relacionados al pie de cada post — `series` + `seriesOrder` en el schema,
      `src/utils/getSeries.ts`, componente `SeriesNav.astro` al pie del artículo y página `/series`
      (pendiente de commit). Faltan aún los "relacionados" por tag, que es otro criterio.
- [ ] Tiempo de lectura y fecha de última actualización visibles (señal de frescura).
- [ ] Copiar-al-portapapeles en los bloques de código.

## 2. Captación de clientes

Estado: **inexistente**. Es el hueco más grande del proyecto.

Decisión de arquitectura pendiente y bloqueante para casi todo lo de abajo: **un formulario
necesita backend**. Hoy `astro.config.ts` importa el adapter de Vercel pero no lo usa, así que el
build es 100 % estático. Dos caminos:

| Opción | Coste | Implica |
|---|---|---|
| **A. Servicio externo** (Formspree, Resend + función Vercel suelta, Tally) | bajo | El sitio sigue estático. Recomendado para empezar. |
| **B. `output: "hybrid"` + `adapter: vercel()`** | medio | API routes propias, control total, pierde el "todo estático". |

Pendiente:

- [ ] **Decidir A o B** antes de escribir el formulario.
- [ ] Página `/servicios` — qué vendes, para quién, en qué formato, con prueba (casos, stack, plazos).
      Con schema `ProfessionalService`.
- [ ] Página `/contacto` — formulario (nombre, email, tipo de proyecto, presupuesto, mensaje) con
      validación cliente + servidor, honeypot antispam y estado de envío accesible.
- [ ] CTA al final de cada artículo, con contexto por tag (un post de Next.js → CTA de desarrollo
      frontend). Componente único reutilizado, no copiado en cada `.md`.
- [ ] Captura de correo (newsletter) — hoy solo hay RSS, que no da lista de contactos.
- [ ] `/about` → reescribir como página de marca personal con propuesta de valor, no como
      "sobre el tema AstroPaper".
- [ ] Analítica respetuosa con la privacidad (Vercel Analytics o Plausible) con eventos de
      conversión: envío de formulario, clic en CTA, alta de newsletter.
- [ ] Mover el CV de `public/` a un enlace desde `/about`, no como archivo suelto.

## 3. SEO

Estado: **base correcta, dos defectos reales**.

Ya funciona: sitemap, `robots.txt`, canonical, OG + Twitter cards, OG images dinámicas por
artículo, RSS, `lang="es"`, URLs limpias, breadcrumbs, páginas de tags.

- [ ] **JSON-LD mal emitido** (`src/layouts/Layout.astro:37`, inyectado en la línea 107). Se emite `BlogPosting` en
      *todas* las páginas — home, `/search`, `/404`, listados — y con `datePublished: "undefined"`
      cuando no hay fecha. Google lo lee como marcado inválido. Corrección: emitir `BlogPosting`
      solo en artículos, `WebSite` + `Organization` en la home, `BreadcrumbList` en artículos.
- [ ] **Enlazado interno casi nulo.** Los artículos no se enlazan entre sí. Es la mejora on-page
      con mejor relación impacto/esfuerzo del sitio.
- [ ] `og:type`, `og:locale` (`es_ES`) y `og:site_name` faltan en `Layout.astro`.
- [ ] `meta description` duplicada en las páginas de listado y de tag (todas heredan `SITE.desc`).
- [x] `theme-color` estaba vacío; ahora declara un color por esquema (claro/oscuro).
- [ ] `robots.txt.ts` arrastra `Disallow: /nogooglebot/` de la plantilla.
- [ ] `SITE.ogImage` sigue apuntando a `astropaper-og.jpg`, el arte del tema.
- [ ] Verificar que los posts `draft: true` quedan fuera de sitemap y RSS.
- [ ] Google Search Console: `PUBLIC_GOOGLE_SITE_VERIFICATION` ya está soportada en el layout;
      falta configurarla y dar de alta el sitemap.

Skill de apoyo: `/seo-check`.

## 4. Performance web

Estado: **buena línea base, tres fugas**.

- [ ] **Fuentes remotas.** IBM Plex Mono se carga desde `fonts.googleapis.com` en el `<head>`: dos
      conexiones externas en la ruta crítica + riesgo de FOUT. Self-hostear en `public/fonts/`
      (subconjunto latin, `.woff2`, `font-display: swap`) y quitar los `preconnect`.
- [ ] **Islas React innecesarias.** `Card.tsx` y `Datetime.tsx` no tienen estado y se usan en home
      y listados. Convertirlos a `.astro` deja esas páginas con 0 KB de JS.
- [ ] **Assets sin pipeline.** Todo lo de `public/` (incluido `astropaper-og.jpg`, ~149 KB) escapa
      a la optimización de Astro. Lo que deba servirse en página va a `src/assets/` con `<Image />`.
- [ ] Añadir Lighthouse CI al workflow de PR con los presupuestos de `/perf-check`.
- [ ] Revisar `/search`: carga Fuse.js + el índice completo. Irrelevante con 6 posts, hay que
      diferirlo a partir de ~50.
- [ ] Confirmar cabeceras de caché en Vercel (assets con hash `immutable`, HTML no).

Skill de apoyo: `/perf-check`.

## 5. Calidad e infraestructura

- [ ] **No hay tests.** Con la captación de clientes entra lógica real (validación de formulario,
      envío) que sí necesita cobertura. Vitest para utilidades + Playwright para el flujo de
      contacto.
- [ ] CI corre `lint`, `format:check` y `build`; falta `astro check` como paso propio (hoy va
      dentro de `build`) y Lighthouse.
- [ ] Node 18 en CI está en fin de vida — subir a 20 o 22.
- [ ] `astro.config.ts` importa `@astrojs/vercel/serverless` sin usarlo: o se conecta el adapter
      (si se elige la opción B de captación) o se borra el import muerto.
- [ ] `experimental.contentLayer` deja de ser experimental en Astro 5 — planear la actualización.

## Orden sugerido

1. **SEO defectos** (JSON-LD, og:type, descriptions) — barato, corrige daño activo.
2. **Fuentes self-hosted + Card/Datetime a `.astro`** — el grueso de la ganancia de performance.
3. **Decidir estático vs. híbrido** y montar `/servicios` + `/contacto` + CTA — desbloquea el
   objetivo comercial, que es el único que hoy vale cero.
4. **MDX + componentes de demo** — convierte el blog en "interactivo" de verdad.
5. **Enlazado interno y artículos relacionados** — compone con el punto 1 y con el 4.
6. **Tests + Lighthouse CI** — cuando ya haya lógica que proteger.
