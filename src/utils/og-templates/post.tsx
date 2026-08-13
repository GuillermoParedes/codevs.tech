import satori from "satori";
import type { CollectionEntry } from "astro:content";
import { LOCALE, SITE } from "@config";
import loadGoogleFonts, { type FontOptions } from "../loadGoogleFont";
import { BRAND, LOGO_DATA_URI, logoSize } from "./brand";

/* Tarjeta social de un artículo. Repite la gramática del sitio —pantalla de
   gabinete sobre el negro de marca, barra de acento naranja y el lockup
   abajo— para que el enlace compartido se reconozca antes de leerlo. */
export default async (post: CollectionEntry<"blog">) => {
  const logo = logoSize(224);

  const kicker = (post.data.tags ?? []).slice(0, 3).join(" · ").toUpperCase();

  const published = post.data.pubDatetime.toLocaleDateString(
    LOCALE.langTag?.[0] ?? "es-ES",
    { year: "numeric", month: "short", day: "numeric" }
  );

  /* Satori no ajusta el cuerpo al contenedor: un titular largo desbordaría en
     silencio. Se escalona el tamaño por longitud, que es lo que hace la
     maquetación a mano. */
  const titleSize =
    post.data.title.length > 80 ? 50 : post.data.title.length > 48 ? 60 : 72;

  return satori(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BRAND.black,
        padding: 28,
        fontFamily: "IBM Plex Mono",
      }}
    >
      {/* Pantalla del gabinete: marco doble y una línea de acento arriba. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: BRAND.screen,
          border: `2px solid ${BRAND.line}`,
        }}
      >
        {/* La barra va en flujo y no en absoluto: Satori resuelve el `width`
            de un absoluto contra la caja de contenido, así que con padding en
            el panel la barra se quedaría corta por la derecha. Como hijo
            directo de una columna flex, el `stretch` por defecto la lleva de
            borde a borde. */}
        <div
          style={{
            display: "flex",
            height: 8,
            flexShrink: 0,
            background: BRAND.orange,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "44px 52px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                letterSpacing: 4,
                color: BRAND.peach,
              }}
            >
              {kicker || SITE.title.toUpperCase()}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 26,
                fontFamily: "Quicksand",
                fontWeight: 700,
                fontSize: titleSize,
                lineHeight: 1.1,
                letterSpacing: -1,
                color: BRAND.white,
                maxHeight: 340,
                overflow: "hidden",
              }}
            >
              {post.data.title}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 28,
                width: 120,
                height: 6,
                background: BRAND.orange,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <img
              src={LOGO_DATA_URI}
              width={logo.width}
              height={logo.height}
              alt={SITE.title}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontSize: 22,
                color: BRAND.gray,
              }}
            >
              <span style={{ color: BRAND.white }}>{post.data.author}</span>
              <span style={{ marginTop: 6 }}>{published}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: (await loadGoogleFonts(
        post.data.title + post.data.author + SITE.title + kicker + published
      )) as FontOptions[],
    }
  );
};
