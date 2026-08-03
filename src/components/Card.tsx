import { LOCALE } from "@config";
import { slugifyStr } from "@utils/slugify";
import { difficultyStars } from "@utils/arcade";
import type { LevelMeta } from "@utils/arcade";
import type { CollectionEntry } from "astro:content";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
  /** Metadatos de nivel. Sin ellos la casilla se pinta igual, sólo sin HUD. */
  level?: LevelMeta;
  /** Posición dentro del selector; la usa ArcadeSelector para enfocar. */
  index?: number;
  selected?: boolean;
  /** Roving tabindex: sólo la casilla seleccionada entra en el orden de tab. */
  tabIndex?: number;
}

export default function Card({
  href,
  frontmatter,
  secHeading = true,
  level,
  index,
  selected,
  tabIndex,
}: Props) {
  const { title, description, tags, pubDatetime, modDatetime } = frontmatter;

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className:
      "font-display text-base font-bold uppercase leading-tight tracking-tight transition-colors group-hover:text-skin-accent sm:text-lg",
  };

  const world = level?.world ?? tags[0]?.toUpperCase();
  const datetime = new Date(modDatetime ?? pubDatetime);
  const shortDate = datetime.toLocaleDateString(LOCALE.langTag, {
    year: "numeric",
    month: "short",
  });

  return (
    <li className="h-full">
      <a
        href={href}
        className="level-tile focus-outline group"
        data-selected={selected ? "true" : undefined}
        data-level-index={index}
        tabIndex={tabIndex}
      >
        <div className="pixel flex items-baseline justify-between gap-3 text-[0.6rem] leading-none">
          <span className="text-skin-accent">
            {level ? `Level ${level.label}` : "Level"}
          </span>
          {level && (
            <span
              className="text-skin-accent2"
              title={`Dificultad ${level.difficulty} de 5`}
            >
              {difficultyStars(level.difficulty)}
            </span>
          )}
        </div>

        {secHeading ? (
          <h2 {...headerProps}>{title}</h2>
        ) : (
          <h3 {...headerProps}>{title}</h3>
        )}

        <p className="text-sm opacity-75">{description}</p>

        <div className="pixel mt-auto flex items-center justify-between gap-3 border-t-2 border-skin-line pt-3 text-[0.5rem] leading-none opacity-60">
          <span className="truncate">{world ? `World ${world}` : ""}</span>
          <time dateTime={datetime.toISOString()} className="flex-none">
            {shortDate}
            {level ? ` · ${level.minutes} min` : ""}
          </time>
        </div>

        <span
          aria-hidden="true"
          className="pixel text-[0.55rem] leading-none text-skin-accent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-data-[selected=true]:opacity-100"
        >
          &#9654; Press start
        </span>
      </a>
    </li>
  );
}
