import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://codevs.tech/", // replace this with your deployed domain
  author: "Codevs",
  profile: "https://codevs.tech/",
  desc: "A blog from Codevs to coders and developers.",
  title: "Codevs",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};

export const LOCALE = {
  lang: "es", // html lang code. Set this empty and default will be "en"
  langTag: ["es-ES"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 216,
  height: 46,
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
  }
];
