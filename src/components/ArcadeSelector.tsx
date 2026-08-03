import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import Card from "@components/Card";
import { difficultyStars } from "@utils/arcade";
import type { SelectorItem } from "@utils/arcade";

export interface Props {
  items: SelectorItem[];
  /** Rótulo de la pantalla: "Select your level", "All levels"… */
  heading?: string;
  /** Los títulos de la home van en <h3> porque la sección ya tiene su <h2>. */
  secHeading?: boolean;
}

type Direction = "left" | "right" | "up" | "down" | "";

/** Umbral de inclinación a partir del cual la palanca "hace clic". */
const GATE = 0.45;
/** Repetición mientras se mantiene la palanca, como en una recreativa. */
const REPEAT_MS = 260;

export default function ArcadeSelector({
  items,
  heading = "Select your level",
  secHeading = true,
}: Props) {
  const [selected, setSelected] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);

  const selectedRef = useRef(0);
  const colsRef = useRef(1);
  /** El selector sólo escucha el teclado si está a la vista. */
  const visibleRef = useRef(false);
  /** No se roba el foco hasta que la persona interactúa de verdad. */
  const engagedRef = useRef(false);
  const holdRef = useRef<{ dir: Direction; timer: number | null }>({
    dir: "",
    timer: null,
  });

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  /* El grid es de 1 columna en móvil y 2 en sm: ↑/↓ tienen que saltar
     tantas casillas como columnas haya en ese momento. */
  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const sync = () => {
      colsRef.current = query.matches ? 2 : 1;
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      entries => {
        visibleRef.current = entries.some(
          entry => entry.isIntersecting && entry.intersectionRatio > 0.25
        );
      },
      { threshold: [0, 0.25, 0.6] }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /* Mover la selección mueve el foco: así ENTER funciona nativamente sobre el
     enlace y los lectores de pantalla anuncian el nivel elegido. */
  useEffect(() => {
    if (!engagedRef.current) return;
    gridRef.current
      ?.querySelector<HTMLAnchorElement>(`a[data-level-index="${selected}"]`)
      ?.focus({ preventScroll: true });
  }, [selected]);

  const step = useCallback(
    (dir: Direction) => {
      const total = items.length;
      if (!total || !dir) return false;

      const current = selectedRef.current;
      let next = current;

      if (dir === "left" || dir === "right") {
        next = (current + (dir === "right" ? 1 : -1) + total) % total;
      } else {
        const candidate =
          current + (dir === "down" ? 1 : -1) * colsRef.current;
        // Fuera de rango: no hay fila a la que ir, se deja pasar el gesto.
        if (candidate < 0 || candidate >= total) return false;
        next = candidate;
      }

      engagedRef.current = true;
      setSelected(next);
      return true;
    },
    [items.length]
  );

  /* ===== Teclado ===== */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!visibleRef.current) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;

      const dir: Direction =
        event.key === "ArrowLeft"
          ? "left"
          : event.key === "ArrowRight"
            ? "right"
            : event.key === "ArrowUp"
              ? "up"
              : event.key === "ArrowDown"
                ? "down"
                : "";
      if (!dir) return;

      // preventDefault sólo si el movimiento existe: si no hay otra fila,
      // ↑/↓ deben seguir haciendo scroll de la página con normalidad.
      if (step(dir)) {
        event.preventDefault();
        setTilt({
          x: dir === "left" ? -1 : dir === "right" ? 1 : 0,
          y: dir === "up" ? -1 : dir === "down" ? 1 : 0,
        });
        window.setTimeout(() => setTilt({ x: 0, y: 0 }), 140);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [step]);

  /* ===== Palanca ===== */
  const releaseHold = useCallback(() => {
    if (holdRef.current.timer !== null) {
      window.clearInterval(holdRef.current.timer);
    }
    holdRef.current = { dir: "", timer: null };
  }, []);

  const driveTo = useCallback(
    (x: number, y: number) => {
      const dir: Direction =
        Math.abs(x) > Math.abs(y)
          ? x > GATE
            ? "right"
            : x < -GATE
              ? "left"
              : ""
          : y > GATE
            ? "down"
            : y < -GATE
              ? "up"
              : "";

      if (dir === holdRef.current.dir) return;
      releaseHold();
      if (!dir) return;

      holdRef.current.dir = dir;
      step(dir);
      holdRef.current.timer = window.setInterval(() => step(dir), REPEAT_MS);
    },
    [releaseHold, step]
  );

  const readTilt = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width / 2;
    const x = (event.clientX - (rect.left + radius)) / radius;
    // El pivote está en la base de la palanca, no en el centro de la caja.
    const y = (event.clientY - (rect.top + rect.height * 0.62)) / radius;
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const next = readTilt(event);
    setTilt(next);
    driveTo(next.x, next.y);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = readTilt(event);
    setTilt(next);
    driveTo(next.x, next.y);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    releaseHold();
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => releaseHold, [releaseHold]);

  if (!items.length) return null;

  const active = items[Math.min(selected, items.length - 1)];

  const goRandom = () => {
    const pool = items.filter((_, index) => index !== selectedRef.current);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? active;
    window.location.href = pick.href;
  };

  return (
    <div ref={rootRef} className="arcade-selector">
      <div className="pixel mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[0.6rem]">
        <span className="neon">&#9654; {heading}</span>
        <span className="opacity-50">
          {items.length} {items.length === 1 ? "level" : "levels"}
        </span>
      </div>

      <ul ref={gridRef} className="grid gap-4 sm:grid-cols-2">
        {items.map((item, index) => (
          <Card
            key={item.href}
            href={item.href}
            frontmatter={item.frontmatter}
            level={item.level}
            index={index}
            selected={index === selected}
            tabIndex={index === selected ? 0 : -1}
            secHeading={secHeading}
          />
        ))}
      </ul>

      {/* ===== Panel de control ===== */}
      <div className="arcade-panel mt-6 flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div
          className="joystick"
          aria-hidden="true"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <span className="joystick-gate" />
          <span className="joystick-plate" />
          <span
            className="joystick-shaft"
            style={{
              transform: `translateX(-50%) rotateZ(${tilt.x * 20}deg) rotateX(${
                tilt.y * -20
              }deg)`,
            }}
          >
            <span className="joystick-ball" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="pixel flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.55rem] leading-none">
            <span className="text-skin-accent">Level {active.level.label}</span>
            <span className="text-skin-accent2">
              {difficultyStars(active.level.difficulty)}
            </span>
            <span className="opacity-50">{active.level.minutes} min</span>
          </p>

          <p className="font-display mt-3 truncate text-lg font-bold uppercase leading-tight tracking-tight">
            {active.frontmatter.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm opacity-70">
            {active.frontmatter.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href={active.href} className="arcade-btn arcade-btn-a">
              &#9654; Start
            </a>
            <button
              type="button"
              onClick={goRandom}
              className="arcade-btn arcade-btn-b"
            >
              Random
            </button>
            <span className="pixel hidden text-[0.5rem] opacity-40 sm:inline">
              &larr; &rarr; mover &middot; enter jugar
            </span>
          </div>
        </div>
      </div>

      <p className="sr-only">
        Usa las flechas del teclado para moverte entre los niveles y Enter para
        abrir el seleccionado. También puedes hacer clic en cualquier nivel.
      </p>
    </div>
  );
}
