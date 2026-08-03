import type { CollectionEntry } from "astro:content";

type Post = CollectionEntry<"blog">;

/** Palabras por minuto de un lector técnico leyendo en pantalla. */
const WORDS_PER_MINUTE = 190;

export interface LevelMeta {
  /** Número de nivel mostrado en el HUD, ya formateado a dos dígitos. */
  label: string;
  level: number;
  minutes: number;
  /** 1–5, derivada del tiempo de lectura. */
  difficulty: number;
  /** Etiqueta principal del artículo: el "mundo" al que pertenece el nivel. */
  world: string;
}

export const formatLevel = (level: number) => String(level).padStart(2, "0");

export const getReadingMinutes = (post: Post) => {
  const words = post.body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
};

export const getDifficulty = (minutes: number) => {
  if (minutes <= 3) return 1;
  if (minutes <= 6) return 2;
  if (minutes <= 10) return 3;
  if (minutes <= 16) return 4;
  return 5;
};

/** Dificultad como estrellas llenas/vacías, listo para pintar en el HUD. */
export const difficultyStars = (difficulty: number) =>
  "★★★★★".slice(0, difficulty) + "☆☆☆☆☆".slice(0, 5 - difficulty);

/**
 * Mapa `slug → número de nivel` para toda la colección.
 *
 * La numeración se asigna por orden cronológico ASCENDENTE (el artículo más
 * viejo es el nivel 01) a propósito: así publicar uno nuevo añade un nivel al
 * final en vez de renumerar todos los anteriores, y el "LEVEL 03" que alguien
 * comparte hoy sigue siendo el mismo dentro de un año.
 */
export const getLevelMap = (posts: Post[]) => {
  const chronological = [...posts].sort(
    (a, b) =>
      new Date(a.data.pubDatetime).getTime() -
      new Date(b.data.pubDatetime).getTime()
  );
  return new Map(chronological.map((post, index) => [post.slug, index + 1]));
};

export const getLevelMeta = (
  post: Post,
  levelMap: Map<string, number>
): LevelMeta => {
  const minutes = getReadingMinutes(post);
  const level = levelMap.get(post.slug) ?? 1;

  return {
    label: formatLevel(level),
    level,
    minutes,
    difficulty: getDifficulty(minutes),
    world: (post.data.tags[0] ?? "otros").toUpperCase(),
  };
};

/**
 * Lo que la isla del selector recibe por nivel. Se arma en build: al cliente
 * no viaja el cuerpo de los artículos, sólo el frontmatter y el HUD.
 */
export interface SelectorItem {
  href: string;
  frontmatter: Post["data"];
  level: LevelMeta;
}

export const toSelectorItem = (
  post: Post,
  levelMap: Map<string, number>
): SelectorItem => ({
  href: `/posts/${post.slug}/`,
  frontmatter: post.data,
  level: getLevelMeta(post, levelMap),
});
