import { getCollection, type CollectionEntry } from "astro:content";
import { DEFAULT_LOCALE, isLocale, LOCALES, type Locale } from "@i18n/config";
import { localizePath } from "@i18n/paths";
import getSortedPosts from "./getSortedPosts";
import postFilter from "./postFilter";

type Post = CollectionEntry<"blog">;

/**
 * El `id` de colección es `<idioma>/<slug>` — lo arma `generateId` en
 * `src/content/config.ts`. El idioma va delante porque el `id` tiene que ser
 * único en toda la colección y dos traducciones pueden compartir slug
 * (`claude-code-hooks` se llama igual en español y en inglés).
 *
 * El slug de URL, en cambio, sale del frontmatter y SÍ se traduce: es lo que
 * posiciona en cada idioma.
 */
export const parsePostId = (id: string): { locale: Locale; slug: string } => {
  const slash = id.indexOf("/");
  const head = slash === -1 ? "" : id.slice(0, slash);
  if (slash === -1 || !isLocale(head)) {
    // Un artículo suelto en la raíz de la colección: se trata como del idioma
    // por defecto en vez de romper el build.
    return { locale: DEFAULT_LOCALE, slug: id };
  }
  return { locale: head, slug: id.slice(slash + 1) };
};

export const getPostLocale = (post: Post): Locale =>
  parsePostId(post.id).locale;

export const getPostSlug = (post: Post): string => parsePostId(post.id).slug;

/** Ruta interna ya localizada del artículo: `/posts/x/` o `/en/posts/x/`. */
export const getPostPath = (post: Post): string => {
  const { locale, slug } = parsePostId(post.id);
  return localizePath(`/posts/${slug}/`, locale);
};

/**
 * Clave que une las traducciones de un mismo artículo.
 *
 * Por defecto es el slug del propio artículo, lo que hace que un original en
 * español no tenga que declarar nada. Las traducciones SÍ declaran
 * `translationKey` apuntando al slug del original, porque su propio slug está
 * traducido y no coincide.
 */
export const getTranslationKey = (post: Post): string =>
  post.data.translationKey ?? getPostSlug(post);

/** Los artículos publicados de un idioma, ya ordenados. */
export const getPostsByLocale = async (locale: Locale): Promise<Post[]> => {
  const posts = await getCollection(
    "blog",
    ({ id }) => parsePostId(id).locale === locale
  );
  return getSortedPosts(posts);
};

/**
 * Todos los artículos publicados de todos los idiomas. Se usa para resolver
 * traducciones y numeración de niveles, no para listar.
 */
export const getAllPosts = async (): Promise<Post[]> =>
  (await getCollection("blog")).filter(postFilter);

/**
 * `translationKey → { idioma: artículo }` sobre toda la colección.
 *
 * Es la estructura de la que salen el selector de idioma y los `hreflang`:
 * sin ella no hay forma de saber que `/posts/docker-databases` y
 * `/fr/posts/bases-de-donnees-docker` son la misma cosa.
 */
export const getTranslationIndex = (
  posts: Post[]
): Map<string, Partial<Record<Locale, Post>>> => {
  const index = new Map<string, Partial<Record<Locale, Post>>>();

  for (const post of posts) {
    const key = getTranslationKey(post);
    const group = index.get(key) ?? {};
    group[getPostLocale(post)] = post;
    index.set(key, group);
  }

  return index;
};

/**
 * Idiomas en los que existe realmente este artículo, con su ruta.
 *
 * Devuelve SÓLO las traducciones que existen. Emitir un `hreflang` hacia una
 * URL que no está publicada es peor que no emitirlo: Google lo trata como
 * enlace roto y descarta el grupo entero de alternates.
 */
export const getPostAlternates = (
  post: Post,
  index: Map<string, Partial<Record<Locale, Post>>>
): { locale: Locale; path: string }[] => {
  const group = index.get(getTranslationKey(post)) ?? {};
  return LOCALES.filter(locale => group[locale]).map(locale => ({
    locale,
    path: getPostPath(group[locale] as Post),
  }));
};

/**
 * Numeración de niveles compartida entre idiomas.
 *
 * Se calcula sobre el corpus del idioma por defecto y se indexa por
 * `translationKey`, no por slug: así el artículo que en español es "LEVEL 09"
 * también es "LEVEL 09" en inglés y en francés. Si cada idioma numerara su
 * propio conjunto, un artículo traducido a medias saldría con un número
 * distinto en cada versión y el HUD dejaría de significar nada.
 */
export const getSharedLevelMap = (allPosts: Post[]): Map<string, number> => {
  const canonical = allPosts.filter(
    post => getPostLocale(post) === DEFAULT_LOCALE
  );

  // Si todavía no hay nada en el idioma por defecto, numeramos con lo que haya
  // para que el sitio no se quede sin niveles.
  const source = canonical.length ? canonical : allPosts;

  const chronological = [...source].sort(
    (a, b) =>
      new Date(a.data.pubDatetime).getTime() -
      new Date(b.data.pubDatetime).getTime()
  );

  return new Map(
    chronological.map((post, index) => [getTranslationKey(post), index + 1])
  );
};
