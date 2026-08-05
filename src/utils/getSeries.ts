import type { CollectionEntry } from "astro:content";
import { slugifyStr } from "./slugify";

type Post = CollectionEntry<"blog">;

export interface Series {
  name: string;
  slug: string;
  /** Artículos ya ordenados por `seriesOrder`. */
  posts: Post[];
}

/**
 * Orden dentro de una serie. Manda `seriesOrder`; los que no lo declaran caen
 * al final ordenados por fecha, para que una serie a medio etiquetar siga
 * mostrándose en un orden razonable en vez de romperse.
 */
const bySeriesOrder = (a: Post, b: Post) => {
  const orderA = a.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.data.seriesOrder ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return (
    new Date(a.data.pubDatetime).getTime() -
    new Date(b.data.pubDatetime).getTime()
  );
};

/**
 * Agrupa por serie los artículos recibidos.
 *
 * Espera una lista **ya filtrada** (`getSortedPosts`): así los borradores y los
 * programados no aparecen en el índice ni descuadran la numeración.
 */
export const getSeriesList = (posts: Post[]): Series[] => {
  const grouped = new Map<string, Post[]>();

  for (const post of posts) {
    const name = post.data.series;
    if (!name) continue;
    grouped.set(name, [...(grouped.get(name) ?? []), post]);
  }

  return [...grouped.entries()]
    .map(([name, entries]) => ({
      name,
      slug: slugifyStr(name),
      posts: [...entries].sort(bySeriesOrder),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
};

/** La serie de un artículo, o `null` si no pertenece a ninguna. */
export const getSeriesForPost = (post: Post, posts: Post[]): Series | null => {
  if (!post.data.series) return null;
  return (
    getSeriesList(posts).find(series => series.name === post.data.series) ??
    null
  );
};

export default getSeriesList;
