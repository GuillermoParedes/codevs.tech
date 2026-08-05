---
name: nuevo-post
description: Crea un artículo nuevo del blog en src/content/blog con frontmatter válido según el schema Zod, estructura optimizada para SEO y, si el tema lo pide, andamiaje de demo interactiva. Úsalo cuando el usuario diga "nuevo post", "escribir un artículo", "crear entrada del blog" o dé un tema para publicar.
---

# Crear un artículo nuevo

## 1. Reúne lo mínimo

Necesitas **tema** y **keyword principal**. Si el usuario solo dio el tema, deriva la keyword tú y
dilo; no bloquees por eso. Pregunta solo si el tema es ambiguo entre dos artículos muy distintos.

Deriva el resto:

- **slug**: kebab-case, en español o inglés según el término técnico dominante, sin stopwords.
  Debe ser único — comprueba `src/content/blog/` antes.
- **tags**: reutiliza los que ya existen en el blog. Lístalos primero con
  `rg -h '^\s+- ' src/content/blog/*.md` o leyendo los frontmatter. Inventar tags nuevos fragmenta
  `/tags` y diluye el enlazado interno; añade uno nuevo solo si de verdad no encaja ninguno.
- **pubDatetime**: fecha/hora actual en ISO UTC con `Z`.

## 2. Escribe el archivo

Ruta: `src/content/blog/<slug>.md`.

```yaml
---
title: <título, ≤60 caracteres, con la keyword al principio>
author: Codevs
pubDatetime: <ISO UTC con Z>
slug: <slug>
featured: false
draft: false
tags:
  - <Tag1>
  - <Tag2>
description: "<120–158 caracteres, con la keyword, que prometa un resultado concreto>"
---
```

Cuerpo:

- Si el artículo supera ~800 palabras, primera línea `## Table of contents` (remark-toc lo rellena
  y remark-collapse lo colapsa).
- Nunca uses `#` — el `<h1>` lo pone el layout. Empieza en `##`.
- Jerarquía de headings sin saltos (`##` → `###`, nunca `##` → `####`).
- Todo bloque de código con lenguaje declarado: ` ```typescript `, ` ```bash `, ` ```astro `.
- **Enlaza 2–3 artículos existentes** del blog con rutas relativas (`/posts/<slug>`). Es el enlazado
  interno que hoy le falta al sitio.
- Cierra con una llamada a la acción hacia la captación de clientes (contacto / servicios), no con
  un "gracias por leer" vacío.

## 3. Si el artículo es "interactivo"

El blog está pensado para desarrollo interactivo. Para embeber una demo ejecutable:

1. Comprueba si `@astrojs/mdx` está instalado (`ls node_modules/@astrojs/`). **Hoy no lo está** — si
  hace falta, dilo y propón instalarlo antes de seguir; no lo instales sin confirmar.
2. Con MDX: el archivo pasa a `.mdx`, el componente demo va en `src/components/demos/<Nombre>.tsx`
   y se monta con `client:visible` (nunca `client:load` — penaliza el LCP).
3. Sin MDX: la alternativa barata es un bloque de código + un enlace a StackBlitz/CodeSandbox, o un
   componente `.astro` con `<script>` vanilla. Prefiere esto para demos simples.

Toda demo React debe ser autocontenida, sin dependencias nuevas, y usar los tokens `skin-*` para
respetar el modo oscuro.

## 4. Verifica

```bash
npm run build      # astro check valida el frontmatter contra el schema Zod
npm run format
npm run lint
```

Si el schema falla, el error apunta al campo exacto — corrígelo, no relajes el schema.

## 5. Reporta

Di al usuario: ruta del archivo, título, slug, tags usados, número de enlaces internos añadidos, y
si quedó pendiente algo (MDX no instalado, imagen OG por definir).
