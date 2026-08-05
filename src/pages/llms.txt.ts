import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "@config";
import getSortedPosts from "@utils/getSortedPosts";
import { getSeriesList } from "@utils/getSeries";

/**
 * `/llms.txt` — índice del sitio en markdown plano para modelos de lenguaje.
 *
 * Advertencia honesta: es una convención propuesta, no un estándar que ningún
 * proveedor haya confirmado consumir para recuperación. Se genera desde la
 * colección precisamente por eso — el coste de mantenerlo es cero, así que no
 * importa que tarde en rendir. Si algún día deja de tener sentido, se borra
 * este archivo y ya.
 *
 * Formato: H1 con el nombre, blockquote con el resumen, y secciones H2 con
 * listas `- [título](url): notas`.
 */

const url = (path: string) => new URL(path, SITE.website).href;

export const GET: APIRoute = async () => {
  const posts = getSortedPosts(await getCollection("blog"));
  const seriesList = getSeriesList(posts);

  /* Los artículos de una serie salen en su sección, en orden de lectura. El
     resto va a "Artículos sueltos" por fecha: si un post apareciera en ambas
     listas, un modelo lo leería dos veces y contaría doble. */
  const inSeries = new Set(
    seriesList.flatMap(series => series.posts.map(post => post.slug))
  );

  const entry = (post: (typeof posts)[number]) =>
    `- [${post.data.title}](${url(`/posts/${post.slug}/`)}): ${post.data.description}`;

  const seriesSections = seriesList.map(series =>
    [
      `## ${series.name}`,
      "",
      `Serie de ${series.posts.length} artículos pensada para leerse en orden.`,
      "",
      series.posts.map(entry).join("\n"),
      "", // separa la sección de la siguiente: sin esto el H2 queda pegado a la lista
    ].join("\n")
  );

  const standalone = posts.filter(post => !inSeries.has(post.slug));

  const body = [
    `# ${SITE.title}`,
    "",
    `> ${SITE.desc}`,
    "",
    `Escrito por ${SITE.author}. Todo el contenido está en español.`,
    "",
    ...seriesSections,
    ...(standalone.length
      ? ["## Artículos sueltos", "", standalone.map(entry).join("\n")]
      : []),
    "",
    "## Contacto",
    "",
    `- [Sobre mí](${url("/about")}): experiencia, stack y en qué trabajo.`,
    `- [Todos los artículos](${url("/posts/")}): listado completo.`,
    `- [RSS](${url("/rss.xml")}): feed de publicaciones.`,
  ].join("\n");

  return new Response(`${body}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
