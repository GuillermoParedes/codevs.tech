import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://codevs.tech/", // replace this with your deployed domain
  author: "Codevs",
  profile: "https://codevs.tech/",
  desc: "Blog de Codevs sobre desarrollo frontend, Claude Code e IA aplicada al día a día de un ingeniero de software: React, Next.js, Angular, Docker y automatización.",
  title: "Codevs",
  /* Tarjeta generada por `src/pages/og.png.ts` con la marca de Codevs. Antes
     apuntaba al `astropaper-og.jpg` de fábrica del tema. */
  ogImage: "og.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};

export const LOCALE = {
  lang: "es", // html lang code. Set this empty and default will be "en"
  langTag: ["es-ES"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

/* Lockup horizontal del manual de marca (viewBox 1091×212 → ratio 5.15).
   Las dos variantes (color sobre claro, 2white sobre oscuro) las conmuta el
   CSS de Header.astro, no este objeto. */
export const LOGO_IMAGE = {
  enable: true,
  svg: true,
  width: 175,
  height: 34,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/GuillermoParedes",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/guillermo-david-paredes-torrez/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:hi.codevs@gmail.com",
    linkTitle: `Envia un email a ${SITE.title}`,
    active: true,
  },
];
