import { useMemo, useState } from "react";

/**
 * Presupuesto de la ventana de contexto.
 *
 * La idea que tiene que quedar clara al usarlo: el contexto no es "memoria del
 * agente", es un presupuesto de tokens que se gasta ENTERO en cada turno. Los
 * números son estimaciones de orden de magnitud medidas en sesiones reales de
 * Claude Code — no pretenden ser exactas, y el componente lo dice.
 */

type Group = "base" | "config" | "trabajo" | "historial";

interface Item {
  id: string;
  label: string;
  hint: string;
  tokens: number;
  group: Group;
  /** Lo que no puedes apagar: viaja en cada petición, quieras o no. */
  fixed?: boolean;
}

const GROUPS: Record<Group, { name: string; bar: string; dot: string }> = {
  base: {
    name: "Fijo",
    bar: "bg-skin-base/30",
    dot: "bg-skin-base/30",
  },
  config: {
    name: "Configuración",
    bar: "bg-skin-accent2",
    dot: "bg-skin-accent2",
  },
  trabajo: {
    name: "Trabajo",
    bar: "bg-skin-neon",
    dot: "bg-skin-neon",
  },
  historial: {
    name: "Historial",
    bar: "bg-skin-accent",
    dot: "bg-skin-accent",
  },
};

const ITEMS: Item[] = [
  {
    id: "system",
    label: "Prompt de sistema + herramientas nativas",
    hint: "Read, Write, Edit, Bash, Grep… Sus descripciones viajan enteras en cada petición.",
    tokens: 12_000,
    group: "base",
    fixed: true,
  },
  {
    id: "reserva",
    label: "Reserva de autocompactación",
    hint: "Claude Code reserva un margen para poder resumir la sesión antes de quedarse sin espacio.",
    tokens: 20_000,
    group: "base",
    fixed: true,
  },
  {
    id: "claudemd",
    label: "CLAUDE.md del proyecto",
    hint: "Se carga completo al arrancar. Cada línea que añades la pagas en todos los turnos.",
    tokens: 3_500,
    group: "config",
  },
  {
    id: "mcp",
    label: "3 servidores MCP conectados",
    hint: "Lo caro no son las llamadas: son las definiciones de sus herramientas, siempre presentes.",
    tokens: 24_000,
    group: "config",
  },
  {
    id: "skills",
    label: "8 skills instaladas (solo descripciones)",
    hint: "El cuerpo de la skill no se carga hasta que se usa. Esto es progressive disclosure.",
    tokens: 1_200,
    group: "config",
  },
  {
    id: "archivos",
    label: "5 archivos leídos completos",
    hint: "Un componente React de 600 líneas ronda los 6.000 tokens. Y se queda ahí.",
    tokens: 28_000,
    group: "trabajo",
  },
  {
    id: "build",
    label: "Salida de build + tests",
    hint: "Ruido casi puro: lo miras una vez y ocupa espacio hasta el final de la sesión.",
    tokens: 18_000,
    group: "trabajo",
  },
  {
    id: "web",
    label: "3 páginas traídas de la web",
    hint: "Documentación en HTML convertida a markdown. Se infla más de lo que parece.",
    tokens: 22_000,
    group: "trabajo",
  },
  {
    id: "historial",
    label: "40 turnos de conversación",
    hint: "Todo lo que dijisteis tú y el agente, íntegro, reenviado en cada petición.",
    tokens: 45_000,
    group: "historial",
  },
];

const WINDOWS = [
  { label: "200K", value: 200_000, note: "Haiku 4.5" },
  { label: "1M", value: 1_000_000, note: "Opus 5, Sonnet 5" },
];

const fmt = new Intl.NumberFormat("es-ES");

const DEFAULT_ON = new Set([
  "system",
  "reserva",
  "claudemd",
  "mcp",
  "skills",
  "archivos",
  "historial",
]);

export default function ContextBudget() {
  const [active, setActive] = useState<Set<string>>(new Set(DEFAULT_ON));
  const [windowSize, setWindowSize] = useState(WINDOWS[0].value);

  const used = useMemo(
    () =>
      ITEMS.filter(item => item.fixed || active.has(item.id)).reduce(
        (sum, item) => sum + item.tokens,
        0
      ),
    [active]
  );

  const free = Math.max(0, windowSize - used);
  const pct = Math.min(100, (used / windowSize) * 100);
  const overflow = used > windowSize;

  const toggle = (id: string) =>
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* Segmentos del gráfico, en el mismo orden en que se llena el contexto. */
  const segments = ITEMS.filter(item => item.fixed || active.has(item.id)).map(
    item => ({
      ...item,
      width: Math.min(100, (item.tokens / windowSize) * 100),
    })
  );

  return (
    <div className="not-prose arcade-panel my-8 px-5 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="pixel text-[0.55rem] leading-none text-skin-accent">
          Context budget
        </p>
        <div className="flex items-center gap-2">
          {WINDOWS.map(w => (
            <button
              key={w.value}
              type="button"
              onClick={() => setWindowSize(w.value)}
              aria-pressed={windowSize === w.value}
              title={w.note}
              className={`border-2 px-3 py-1 text-xs uppercase tracking-widest transition-colors ${
                windowSize === w.value
                  ? "border-skin-accent text-skin-accent"
                  : "border-skin-line opacity-60 hover:opacity-100"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Barra ===== */}
      <div
        className="mt-5 flex h-8 w-full overflow-hidden border-2 border-skin-line"
        role="img"
        aria-label={`${fmt.format(used)} de ${fmt.format(windowSize)} tokens ocupados`}
      >
        {segments.map(seg => (
          <div
            key={seg.id}
            className={`${GROUPS[seg.group].bar} h-full transition-all duration-300`}
            style={{ width: `${seg.width}%` }}
            title={`${seg.label} — ${fmt.format(seg.tokens)} tokens`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm">
        <span>
          <span className="opacity-60">Ocupado</span>{" "}
          <strong className={overflow ? "text-skin-neon" : "text-skin-accent"}>
            {fmt.format(used)}
          </strong>{" "}
          <span className="opacity-40">/ {fmt.format(windowSize)}</span>{" "}
          <span className="opacity-60">({pct.toFixed(0)}%)</span>
        </span>
        <span>
          <span className="opacity-60">Libre para trabajar</span>{" "}
          <strong>{fmt.format(free)}</strong>
        </span>
      </div>

      {overflow && (
        <p className="mt-3 border-l-2 border-skin-neon pl-3 text-sm text-skin-neon">
          Te has pasado. Aquí el agente compacta: resume la conversación, tira
          los detalles y sigue con una versión empobrecida de lo que sabía.
        </p>
      )}

      {!overflow && pct > 70 && (
        <p className="mt-3 border-l-2 border-skin-accent2 pl-3 text-sm opacity-80">
          Por encima del 70% empieza a notarse: el modelo atiende peor a lo que
          quedó en mitad de la ventana. Tener espacio no es lo mismo que usarlo
          bien.
        </p>
      )}

      {/* ===== Leyenda ===== */}
      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
        {(Object.keys(GROUPS) as Group[]).map(key => (
          <li key={key} className="flex items-center gap-2 text-xs opacity-70">
            <span className={`inline-block h-3 w-3 ${GROUPS[key].dot}`} />
            {GROUPS[key].name}
          </li>
        ))}
      </ul>

      {/* ===== Controles ===== */}
      <ul className="mt-5 flex list-none flex-col gap-0 p-0">
        {ITEMS.map(item => {
          const on = item.fixed || active.has(item.id);
          return (
            <li
              key={item.id}
              className="border-t-2 border-skin-line py-3 first:border-t-0"
            >
              <label
                className={`flex items-start gap-3 ${
                  item.fixed ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  disabled={item.fixed}
                  onChange={() => toggle(item.id)}
                  className="mt-1 h-4 w-4 flex-none accent-current"
                />
                <span className="flex-1">
                  <span
                    className={`flex flex-wrap items-baseline justify-between gap-x-3 text-sm ${
                      on ? "" : "opacity-50"
                    }`}
                  >
                    <span>
                      {item.label}
                      {item.fixed && (
                        <span className="ml-2 text-[0.65rem] uppercase tracking-widest opacity-50">
                          no se apaga
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums opacity-60">
                      {fmt.format(item.tokens)}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs opacity-60">
                    {item.hint}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs opacity-50">
        Cifras estimadas a partir de sesiones reales, redondeadas. Sirven para
        entender proporciones, no para presupuestar una factura: para eso está
        el endpoint <code>count_tokens</code>.
      </p>
    </div>
  );
}
