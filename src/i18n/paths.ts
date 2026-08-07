import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Traduce una ruta interna al idioma dado.
 *
 * El idioma por defecto no lleva prefijo (`prefixDefaultLocale: false`), así
 * que `localizePath("/posts/", "es") === "/posts/"`. Cualquier otro lo
 * antepone: `/en/posts/`.
 */
export const localizePath = (path: string, locale: Locale): string => {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}/` : `/${locale}${clean}`;
};

/** Quita el prefijo de idioma de una ruta ya localizada. */
export const stripLocale = (path: string): string => {
  const [, first, ...rest] = path.split("/");
  if (!isLocale(first)) return path;
  return `/${rest.join("/")}`;
};

/**
 * Idioma al que pertenece una ruta. Se usa en los componentes que sólo tienen
 * `Astro.url` a mano (migas de pan) en vez de una prop explícita.
 */
export const getLocaleFromPath = (path: string): Locale => {
  const first = path.split("/")[1];
  return isLocale(first) ? first : DEFAULT_LOCALE;
};

/** URL absoluta ya localizada, para canonicals, hreflang y JSON-LD. */
export const localizeUrl = (
  path: string,
  locale: Locale,
  site: string | URL
): string => new URL(localizePath(path, locale), site).href;
