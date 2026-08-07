/**
 * Idiomas del sitio.
 *
 * Este archivo NO importa nada de `astro:*` a propósito: `astro.config.ts` lo
 * necesita para declarar `i18n` y el sitemap, y ahí todavía no existe el
 * runtime de Astro.
 */

export const LOCALES = ["es", "en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Idioma sin prefijo de ruta. Es español porque es donde está todo el
 * contenido y donde se publica primero; cambiarlo mueve las URLs de
 * `/posts/x` a `/es/posts/x` y exige 301 reales en `vercel.json`.
 */
export const DEFAULT_LOCALE: Locale = "es";

export interface LocaleMeta {
  code: Locale;
  /** BCP 47 completo. Alimenta formato de fechas, `inLanguage` y `hreflang`. */
  tag: string;
  /** `og:locale` usa guion bajo, no guion. */
  ogLocale: string;
  /** El nombre del idioma va SIEMPRE en ese idioma: un selector que dice
      "Spanish" no le sirve a quien no lee inglés. */
  label: string;
  /** Etiqueta de tres letras para el selector compacto de la cabecera. */
  short: string;
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  es: {
    code: "es",
    tag: "es-ES",
    ogLocale: "es_ES",
    label: "Español",
    short: "ES",
  },
  en: {
    code: "en",
    tag: "en-US",
    ogLocale: "en_US",
    label: "English",
    short: "EN",
  },
  fr: {
    code: "fr",
    tag: "fr-FR",
    ogLocale: "fr_FR",
    label: "Français",
    short: "FR",
  },
};

/** Los idiomas que llevan prefijo en la URL. */
export const PREFIXED_LOCALES = LOCALES.filter(
  locale => locale !== DEFAULT_LOCALE
);

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);
