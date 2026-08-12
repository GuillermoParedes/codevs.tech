import { SITE } from "@config";
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content_layer",
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message: "OpenGraph image must be at least 1200 X 630 pixels!",
        })
        .or(z.string())
        .optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      /* Serie a la que pertenece el artículo. El nombre es la clave: dos
         artículos con la misma cadena forman una serie. */
      series: z.string().optional(),
      /* Posición dentro de la serie, empezando en 1. Si falta, el artículo se
         ordena por fecha detrás de los que sí la declaran. */
      seriesOrder: z.number().int().positive().optional(),
      /* Clave que une las traducciones de un mismo artículo. El original no la
         declara (se deriva de su slug); la traducción sí, apuntando al slug del
         original. La consume `getTranslationKey` en `@utils/posts`. */
      translationKey: z.string().optional(),
    }),
});

export const collections = { blog };
