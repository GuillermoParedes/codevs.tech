import type { APIRoute } from "astro";
import { SITE } from "@config";

/**
 * Agentes declarados por nombre. No cambian el resultado efectivo — el grupo
 * `*` ya permite todo — pero un `robots.txt` es también la documentación de
 * una decisión, y esta conviene tenerla escrita: los crawlers de IA se
 * dividen en dos familias con consecuencias muy distintas.
 *
 * Cuidado con la semántica del formato: un agente que encuentra un grupo con
 * su nombre usa SOLO ese grupo e ignora `*`. Por eso cada uno lleva su
 * `Allow` explícito; heredar no hereda nada.
 */

/** Recuperan en vivo y citan con enlace: es el canal que trae tráfico. */
const RETRIEVAL_AGENTS = [
  "OAI-SearchBot", // índice de ChatGPT Search
  "ChatGPT-User", // navegación disparada por el usuario
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
];

/**
 * Alimentan entrenamiento. No citan ni enlazan; el retorno es a largo plazo y
 * no medible: que el modelo acabe reconociendo "Codevs" como entidad.
 *
 * `Google-Extended` NO controla la indexación ni las AI Overviews —eso
 * depende de Googlebot— sino el uso del contenido en Gemini.
 */
const TRAINING_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "CCBot",
  "meta-externalagent",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "MistralAI-User",
];

const group = (agent: string) => `User-agent: ${agent}\nAllow: /`;

/* El `Disallow: /nogooglebot/` que traía la plantilla apuntaba a una ruta que
   no existe, y al abrir un grupo propio para Googlebot lo sacaba del grupo
   `*`. Fuera. */
const robots = `
User-agent: *
Allow: /

# --- IA: recuperación en vivo (citan con enlace) ---

${RETRIEVAL_AGENTS.map(group).join("\n\n")}

# --- IA: entrenamiento (sin cita, alcance a largo plazo) ---

${TRAINING_AGENTS.map(group).join("\n\n")}

Sitemap: ${new URL("sitemap-index.xml", SITE.website).href}
`.trim();

export const GET: APIRoute = () =>
  new Response(robots, {
    headers: { "Content-Type": "text/plain" },
  });
