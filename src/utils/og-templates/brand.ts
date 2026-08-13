import fs from "node:fs";
import path from "node:path";

/* Paleta del manual de marca (`src/assets/Style-Guide.jpg`). Las tarjetas OG
   se generan fuera del navegador, así que no pueden leer las variables CSS de
   `base.css`: estos valores son la copia canónica para Satori. Si cambia la
   paleta ahí, cambia también aquí. */
export const BRAND = {
  orange: "#FF6602",
  peach: "#FFCBAE",
  gray: "#737372",
  black: "#1A1A1A",
  screen: "#262626",
  line: "#4D4D4D",
  white: "#F2F2F2",
} as const;

/* El lockup horizontal en su versión 2white (naranja + blanco), la única que
   funciona sobre el negro de marca. Se lee del disco y se incrusta como data
   URI porque resvg no resuelve rutas relativas dentro del SVG que emite
   Satori.

   La ruta va contra `process.cwd()` y NO contra `import.meta.url`: al empaquetar,
   este módulo acaba en `dist/chunks/`, así que cualquier ruta relativa al
   módulo apunta dos niveles por encima de la raíz del proyecto. `cwd` es la
   raíz tanto en `astro dev` como en el build de Vercel. */
const logoPath = path.resolve(process.cwd(), "public/assets/brand/logo-og.png");

export const LOGO_DATA_URI = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

/* Proporción real del lockup (viewBox 1091×212). */
export const LOGO_RATIO = 1091 / 212;

export function logoSize(width: number) {
  return { width, height: Math.round(width / LOGO_RATIO) };
}
