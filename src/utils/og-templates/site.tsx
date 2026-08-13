import satori from "satori";
import { SITE } from "@config";
import loadGoogleFonts, { type FontOptions } from "../loadGoogleFont";
import { BRAND, LOGO_DATA_URI, logoSize } from "./brand";

/* Tarjeta social por defecto (home, listados, /search, /404). El lockup manda
   y la descripción acompaña: aquí lo que se comparte es la marca, no un
   artículo concreto. */
export default async () => {
  const logo = logoSize(520);
  const domain = new URL(SITE.website).hostname;

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
        {/* En flujo y no en absoluto: ver la nota en `post.tsx`. */}
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
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "56px 72px",
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
              marginTop: 30,
              width: 120,
              height: 6,
              background: BRAND.orange,
            }}
          />

          <div
            style={{
              display: "flex",
              marginTop: 30,
              maxWidth: 880,
              fontSize: 26,
              lineHeight: 1.45,
              textAlign: "center",
              color: BRAND.white,
            }}
          >
            {SITE.desc}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingBottom: 34,
            fontSize: 22,
            letterSpacing: 4,
            color: BRAND.peach,
          }}
        >
          {domain.toUpperCase()}
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: (await loadGoogleFonts(
        SITE.title + SITE.desc + domain + domain.toUpperCase()
      )) as FontOptions[],
    }
  );
};
