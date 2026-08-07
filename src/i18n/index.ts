export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_META,
  PREFIXED_LOCALES,
  isLocale,
  type Locale,
  type LocaleMeta,
} from "./config";

export {
  localizePath,
  localizeUrl,
  stripLocale,
  getLocaleFromPath,
} from "./paths";

export { UI, useTranslations, type UIStrings } from "./ui";
