import { DEFAULT_LOCALE, type Locale } from "./config";

/**
 * Cadenas de interfaz.
 *
 * Qué entra aquí y qué no: entra la prosa y TODO lo accesible (`aria-label`,
 * `title`, `sr-only`). No entra el chrome de arcade en inglés —"Insert coin",
 * "Game over", "Press start", "Level 03"— porque es identidad visual, no
 * texto: funciona igual que el logo y traducirlo rompería el gabinete. Está
 * decorativo o marcado `aria-hidden` en el markup, y donde no lo está lleva
 * su equivalente traducido en `sr-only`.
 *
 * El tipo `UIStrings` es lo que impide que un idioma se quede a medias: si
 * falta una clave en `fr`, `astro check` falla en el build.
 */
export interface UIStrings {
  /** Meta description del sitio. Se traduce: es el snippet de la SERP. */
  siteDesc: string;

  nav: {
    posts: string;
    series: string;
    tags: string;
    about: string;
    search: string;
    skipToContent: string;
    openMenu: string;
    closeMenu: string;
    mainNav: string;
    toggleTheme: string;
  };

  language: {
    /** `aria-label` del selector. */
    switcher: string;
    /** Aviso cuando el artículo no existe en ese idioma. */
    unavailable: string;
  };

  home: {
    heroLine1: string;
    heroLine2: string;
    heroAccent: string;
    ctaTalk: string;
    ctaLevels: string;
    lede: string;
    cvBefore: string;
    cvLink: string;
    cvAfter: string;
    socials: string;
    recentHeading: string;
    allLevels: string;
  };

  postsPage: {
    title: string;
    eyebrow: (current: number, last: number) => string;
    desc: string;
  };

  tagsPage: {
    title: string;
    heading: string;
    desc: string;
    levelCount: (count: number) => string;
  };

  tagPage: {
    title: (tag: string) => string;
    heading: string;
    desc: (tag: string) => string;
  };

  seriesPage: {
    title: string;
    heading: string;
    desc: string;
    metaDesc: string;
    empty: string;
    partCount: (count: number) => string;
  };

  searchPage: {
    title: string;
    heading: string;
    desc: string;
    placeholder: string;
    inputLabel: string;
    noMatch: string;
    resultCount: (count: number) => string;
  };

  notFound: {
    title: string;
    lede: string;
    ctaHome: string;
    ctaLevels: string;
  };

  post: {
    difficulty: (level: number) => string;
    readingTime: (minutes: number) => string;
    exit: string;
    tagsLabel: string;
    endOfPost: string;
    endLede: string;
    backToTop: string;
    adjacentLevels: string;
    prevLevel: string;
    nextLevel: string;
    copy: string;
    copied: string;
  };

  datetime: {
    updated: string;
    published: string;
    at: string;
  };

  pagination: {
    label: string;
    prev: string;
    next: string;
  };

  breadcrumbs: {
    label: string;
    home: string;
    page: (n: number) => string;
  };

  series: {
    eyebrow: string;
    progress: (current: number, total: number) => string;
    youAreHere: string;
    continueLabel: string;
  };

  share: {
    intro: string;
    whatsapp: string;
    facebook: string;
    twitter: string;
    telegram: string;
    pinterest: string;
    mail: string;
  };

  selector: {
    defaultHeading: string;
    hint: string;
    instructions: string;
    start: string;
    random: string;
  };

  footer: {
    coinLede: string;
    coinCta: string;
  };
}

const es: UIStrings = {
  siteDesc:
    "Blog de Codevs sobre desarrollo frontend, Claude Code e IA aplicada al día a día de un ingeniero de software: React, Next.js, Angular, Docker y automatización.",

  nav: {
    posts: "Articulos",
    series: "Series",
    tags: "Etiquetas",
    about: "Sobre mi",
    search: "Buscar",
    skipToContent: "Saltar al contenido",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    mainNav: "Principal",
    toggleTheme: "Cambiar entre tema claro y oscuro",
  },

  language: {
    switcher: "Cambiar de idioma",
    unavailable: "Este artículo todavía no está disponible en este idioma.",
  },

  home: {
    heroLine1: "Construyo",
    heroLine2: "software",
    heroAccent: "que vende.",
    ctaTalk: "Hablemos",
    ctaLevels: "Ver niveles",
    lede: "Bienvenidos a mi espacio donde exploramos el apasionante mundo de la ingeniería de software. Aquí encontrarás artículos y tutoriales sobre JavaScript, Angular, Node.js, TypeScript, y NestJS, además de análisis sobre plataformas en la nube como Digital Ocean y mucho más. Compartiré soluciones, mejores prácticas y novedades tecnológicas para desarrolladores, abarcando desde el backend hasta el frontend. Ya sea que estés comenzando o buscando optimizar tus habilidades, este blog es el lugar para crecer juntos en el desarrollo de software moderno.",
    cvBefore: "Puedes descargar mi CV realizando ",
    cvLink: "click acá",
    cvAfter: ", si estás interesado en algún proyecto juntos.",
    socials: "Redes sociales:",
    recentHeading: "Ultimos niveles",
    allLevels: "Todos los niveles",
  },

  postsPage: {
    title: "Articulos",
    eyebrow: (current, last) => `Stage select · pagina ${current} de ${last}`,
    desc: "Todos los articulos publicados. Mueve la palanca para elegir.",
  },

  tagsPage: {
    title: "Etiquetas",
    heading: "Mundos",
    desc: "Cada etiqueta es un mundo. Elige por dónde quieres entrar.",
    levelCount: count => (count === 1 ? " nivel" : " niveles"),
  },

  tagPage: {
    title: tag => `Tag: ${tag}`,
    heading: "Mundo: ",
    desc: tag => `Todos los niveles del mundo "${tag}".`,
  },

  seriesPage: {
    title: "Series",
    heading: "Series",
    desc: "Artículos encadenados que se leen en orden. Empieza por la parte 01 y sigue el hilo.",
    metaDesc:
      "Series de artículos de Codevs pensadas para leerse en orden, de principio a fin.",
    empty: "Todavía no hay ninguna serie publicada.",
    partCount: count => (count === 1 ? " parte" : " partes"),
  },

  searchPage: {
    title: "Busqueda",
    heading: "Buscar nivel",
    desc: "Escribe el nombre o el tema del nivel que buscas.",
    placeholder: "escribe para buscar...",
    inputLabel: "Buscar articulos",
    noMatch: "No match",
    resultCount: count => (count === 1 ? "level" : "levels"),
  },

  notFound: {
    title: "404 Pagina no encontrada",
    lede: "Esa pantalla no existe. Puede que el nivel se haya movido o que la URL tenga una errata.",
    ctaHome: "Continue",
    ctaLevels: "Ver niveles",
  },

  post: {
    difficulty: level => `Dificultad ${level} de 5`,
    readingTime: minutes => `${minutes} minutos de lectura`,
    exit: "Salir",
    tagsLabel: "Etiquetas",
    endOfPost: "Fin del articulo",
    endLede: "¿Te sirvió? Compártelo y sigue con el siguiente nivel.",
    backToTop: "Volver arriba",
    adjacentLevels: "Niveles adyacentes",
    prevLevel: "Nivel anterior",
    nextLevel: "Nivel siguiente",
    copy: "copiar",
    copied: "copiado",
  },

  datetime: {
    updated: "Actualizado:",
    published: "Publicado:",
    at: "a las",
  },

  pagination: {
    label: "Paginacion",
    prev: "Pagina anterior",
    next: "Pagina siguiente",
  },

  breadcrumbs: {
    label: "Migas de pan",
    home: "Inicio",
    page: n => `pagina ${n}`,
  },

  series: {
    eyebrow: "Serie",
    progress: (current, total) => `Parte ${current} de ${total}`,
    youAreHere: " (estás aquí)",
    continueLabel: "Continuar con la siguiente parte",
  },

  share: {
    intro: "Comparte este articulo en:",
    whatsapp: "Comparte este articulo por WhatsApp",
    facebook: "Comparte este articulo en Facebook",
    twitter: "Comparte este articulo en Twitter",
    telegram: "Comparte este articulo por Telegram",
    pinterest: "Comparte este articulo en Pinterest",
    mail: "Comparte este articulo por correo",
  },

  selector: {
    defaultHeading: "Select your level",
    hint: "mover · enter jugar",
    instructions:
      "Usa las flechas del teclado para moverte entre los niveles y Enter para abrir el seleccionado. También puedes hacer clic en cualquier nivel.",
    start: "Abrir el nivel seleccionado",
    random: "Abrir un nivel al azar",
  },

  footer: {
    coinLede: "¿Tienes un proyecto en mente? Empecemos la partida.",
    coinCta: "Hablemos",
  },
};

const en: UIStrings = {
  siteDesc:
    "Codevs' blog on frontend development, Claude Code and AI applied to a software engineer's daily work: React, Next.js, Angular, Docker and automation.",

  nav: {
    posts: "Articles",
    series: "Series",
    tags: "Tags",
    about: "About",
    search: "Search",
    skipToContent: "Skip to content",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainNav: "Main",
    toggleTheme: "Toggle light and dark theme",
  },

  language: {
    switcher: "Change language",
    unavailable: "This article is not available in this language yet.",
  },

  home: {
    heroLine1: "I build",
    heroLine2: "software",
    heroAccent: "that sells.",
    ctaTalk: "Let's talk",
    ctaLevels: "Browse levels",
    lede: "Welcome to my corner of the internet, where we dig into software engineering. You'll find articles and tutorials on JavaScript, Angular, Node.js, TypeScript and NestJS, plus deep dives into cloud platforms like Digital Ocean and much more. I share solutions, best practices and the tooling news that actually matters to developers, from the backend all the way to the frontend. Whether you're just starting out or sharpening skills you already have, this blog is a place to grow together in modern software development.",
    cvBefore: "You can download my CV ",
    cvLink: "right here",
    cvAfter: " if you're interested in working together.",
    socials: "Social links:",
    recentHeading: "Latest levels",
    allLevels: "All levels",
  },

  postsPage: {
    title: "Articles",
    eyebrow: (current, last) => `Stage select · page ${current} of ${last}`,
    desc: "Every published article. Move the stick to pick one.",
  },

  tagsPage: {
    title: "Tags",
    heading: "Worlds",
    desc: "Every tag is a world. Choose where you want to start.",
    levelCount: count => (count === 1 ? " level" : " levels"),
  },

  tagPage: {
    title: tag => `Tag: ${tag}`,
    heading: "World: ",
    desc: tag => `Every level in the "${tag}" world.`,
  },

  seriesPage: {
    title: "Series",
    heading: "Series",
    desc: "Articles chained together, meant to be read in order. Start at part 01 and follow the thread.",
    metaDesc:
      "Article series from Codevs, written to be read in order from start to finish.",
    empty: "No series published yet.",
    partCount: count => (count === 1 ? " part" : " parts"),
  },

  searchPage: {
    title: "Search",
    heading: "Find a level",
    desc: "Type the name or the topic of the level you're looking for.",
    placeholder: "type to search...",
    inputLabel: "Search articles",
    noMatch: "No match",
    resultCount: count => (count === 1 ? "level" : "levels"),
  },

  notFound: {
    title: "404 Not Found",
    lede: "That screen doesn't exist. The level may have moved, or the URL has a typo.",
    ctaHome: "Continue",
    ctaLevels: "Browse levels",
  },

  post: {
    difficulty: level => `Difficulty ${level} of 5`,
    readingTime: minutes => `${minutes} minute read`,
    exit: "Exit",
    tagsLabel: "Tags",
    endOfPost: "End of article",
    endLede: "Did it help? Share it and move on to the next level.",
    backToTop: "Back to top",
    adjacentLevels: "Adjacent levels",
    prevLevel: "Previous level",
    nextLevel: "Next level",
    copy: "copy",
    copied: "copied",
  },

  datetime: {
    updated: "Updated:",
    published: "Published:",
    at: "at",
  },

  pagination: {
    label: "Pagination",
    prev: "Previous page",
    next: "Next page",
  },

  breadcrumbs: {
    label: "Breadcrumb",
    home: "Home",
    page: n => `page ${n}`,
  },

  series: {
    eyebrow: "Series",
    progress: (current, total) => `Part ${current} of ${total}`,
    youAreHere: " (you are here)",
    continueLabel: "Continue to the next part",
  },

  share: {
    intro: "Share this article on:",
    whatsapp: "Share this article via WhatsApp",
    facebook: "Share this article on Facebook",
    twitter: "Share this article on Twitter",
    telegram: "Share this article via Telegram",
    pinterest: "Share this article on Pinterest",
    mail: "Share this article via email",
  },

  selector: {
    defaultHeading: "Select your level",
    hint: "move · enter play",
    instructions:
      "Use the arrow keys to move between levels and Enter to open the selected one. You can also click any level.",
    start: "Open the selected level",
    random: "Open a random level",
  },

  footer: {
    coinLede: "Got a project in mind? Let's start the game.",
    coinCta: "Let's talk",
  },
};

const fr: UIStrings = {
  siteDesc:
    "Le blog de Codevs sur le développement frontend, Claude Code et l'IA appliquée au quotidien d'un ingénieur logiciel : React, Next.js, Angular, Docker et l'automatisation.",

  nav: {
    posts: "Articles",
    series: "Séries",
    tags: "Étiquettes",
    about: "À propos",
    search: "Rechercher",
    skipToContent: "Aller au contenu",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    mainNav: "Principale",
    toggleTheme: "Basculer entre le thème clair et sombre",
  },

  language: {
    switcher: "Changer de langue",
    unavailable: "Cet article n'est pas encore disponible dans cette langue.",
  },

  home: {
    heroLine1: "Je conçois",
    heroLine2: "des logiciels",
    heroAccent: "qui vendent.",
    ctaTalk: "Discutons",
    ctaLevels: "Voir les niveaux",
    lede: "Bienvenue dans mon espace, où l'on explore le monde passionnant du génie logiciel. Vous y trouverez des articles et des tutoriels sur JavaScript, Angular, Node.js, TypeScript et NestJS, ainsi que des analyses de plateformes cloud comme Digital Ocean et bien plus encore. Je partage des solutions, des bonnes pratiques et les nouveautés techniques qui comptent vraiment pour les développeurs, du backend jusqu'au frontend. Que vous débutiez ou que vous cherchiez à affiner vos compétences, ce blog est fait pour progresser ensemble dans le développement logiciel moderne.",
    cvBefore: "Vous pouvez télécharger mon CV ",
    cvLink: "juste ici",
    cvAfter: " si un projet commun vous intéresse.",
    socials: "Réseaux sociaux :",
    recentHeading: "Derniers niveaux",
    allLevels: "Tous les niveaux",
  },

  postsPage: {
    title: "Articles",
    eyebrow: (current, last) => `Stage select · page ${current} sur ${last}`,
    desc: "Tous les articles publiés. Bougez le manche pour choisir.",
  },

  tagsPage: {
    title: "Étiquettes",
    heading: "Mondes",
    desc: "Chaque étiquette est un monde. Choisissez par où entrer.",
    levelCount: count => (count === 1 ? " niveau" : " niveaux"),
  },

  tagPage: {
    title: tag => `Étiquette : ${tag}`,
    heading: "Monde : ",
    desc: tag => `Tous les niveaux du monde « ${tag} ».`,
  },

  seriesPage: {
    title: "Séries",
    heading: "Séries",
    desc: "Des articles enchaînés qui se lisent dans l'ordre. Commencez par la partie 01 et suivez le fil.",
    metaDesc:
      "Séries d'articles de Codevs pensées pour être lues dans l'ordre, du début à la fin.",
    empty: "Aucune série publiée pour le moment.",
    partCount: count => (count === 1 ? " partie" : " parties"),
  },

  searchPage: {
    title: "Recherche",
    heading: "Trouver un niveau",
    desc: "Tapez le nom ou le sujet du niveau que vous cherchez.",
    placeholder: "tapez pour rechercher...",
    inputLabel: "Rechercher des articles",
    noMatch: "No match",
    resultCount: count => (count === 1 ? "level" : "levels"),
  },

  notFound: {
    title: "404 Page introuvable",
    lede: "Cet écran n'existe pas. Le niveau a peut-être été déplacé, ou l'URL contient une faute.",
    ctaHome: "Continue",
    ctaLevels: "Voir les niveaux",
  },

  post: {
    difficulty: level => `Difficulté ${level} sur 5`,
    readingTime: minutes => `${minutes} minutes de lecture`,
    exit: "Sortir",
    tagsLabel: "Étiquettes",
    endOfPost: "Fin de l'article",
    endLede: "Ça vous a servi ? Partagez-le et passez au niveau suivant.",
    backToTop: "Retour en haut",
    adjacentLevels: "Niveaux adjacents",
    prevLevel: "Niveau précédent",
    nextLevel: "Niveau suivant",
    copy: "copier",
    copied: "copié",
  },

  datetime: {
    updated: "Mis à jour :",
    published: "Publié :",
    at: "à",
  },

  pagination: {
    label: "Pagination",
    prev: "Page précédente",
    next: "Page suivante",
  },

  breadcrumbs: {
    label: "Fil d'Ariane",
    home: "Accueil",
    page: n => `page ${n}`,
  },

  series: {
    eyebrow: "Série",
    progress: (current, total) => `Partie ${current} sur ${total}`,
    youAreHere: " (vous êtes ici)",
    continueLabel: "Continuer avec la partie suivante",
  },

  share: {
    intro: "Partagez cet article sur :",
    whatsapp: "Partager cet article via WhatsApp",
    facebook: "Partager cet article sur Facebook",
    twitter: "Partager cet article sur Twitter",
    telegram: "Partager cet article via Telegram",
    pinterest: "Partager cet article sur Pinterest",
    mail: "Partager cet article par e-mail",
  },

  selector: {
    defaultHeading: "Select your level",
    hint: "déplacer · enter jouer",
    instructions:
      "Utilisez les flèches du clavier pour naviguer entre les niveaux et Entrée pour ouvrir celui qui est sélectionné. Vous pouvez aussi cliquer sur n'importe quel niveau.",
    start: "Ouvrir le niveau sélectionné",
    random: "Ouvrir un niveau au hasard",
  },

  footer: {
    coinLede: "Un projet en tête ? Lançons la partie.",
    coinCta: "Discutons",
  },
};

export const UI: Record<Locale, UIStrings> = { es, en, fr };

/** Diccionario del idioma pedido, con caída al idioma por defecto. */
export const useTranslations = (locale: Locale | undefined): UIStrings =>
  UI[locale ?? DEFAULT_LOCALE] ?? UI[DEFAULT_LOCALE];
