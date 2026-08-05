---
title: "CLAUDE.md: tu sistema de diseño como contrato"
author: Codevs
pubDatetime: 2026-08-04T09:00:00Z
slug: claude-md-frontend
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - Config
description: "Cómo escribir un CLAUDE.md que impida a Claude Code inventar colores, romper tu sistema de diseño o hidratar islas de más en un proyecto frontend."
series: "Claude Code para frontend engineers"
seriesOrder: 2
---

## Table of contents

## El error de tratar CLAUDE.md como un README

Casi todo el mundo escribe su primer `CLAUDE.md` como si fuera la portada del repositorio: qué hace el proyecto, cómo se instala, qué stack usa. Eso ya lo deduce Claude leyendo tu `package.json` en dos llamadas a herramientas. Estás gastando tokens en cada sesión para contarle algo que averigua solo.

El `CLAUDE.md` útil es el contrario: **la lista de decisiones que un desarrollador nuevo no puede adivinar leyendo el código**. En frontend eso casi siempre significa lo mismo — las convenciones que separan un componente que encaja de uno que hay que reescribir en el code review.

La forma práctica de saber qué va dentro: cada vez que corrijas lo mismo por segunda vez, esa corrección es una línea del archivo.

## Dónde vive y en qué orden se carga

No hay un único `CLAUDE.md`. Se cargan varios y se concatenan, del alcance más amplio al más específico:

| Alcance  | Ubicación                             | Para qué                                |
| -------- | ------------------------------------- | --------------------------------------- |
| Usuario  | `~/.claude/CLAUDE.md`                 | Tus preferencias en todos los proyectos |
| Proyecto | `./CLAUDE.md` o `./.claude/CLAUDE.md` | Convenciones del equipo, versionadas    |
| Local    | `./CLAUDE.local.md`                   | Tus notas privadas (va al `.gitignore`) |

Lo importante para un monorepo frontend: los archivos de directorios **por encima** del directorio de trabajo se cargan enteros al arrancar, y los de subdirectorios se cargan **bajo demanda**, cuando Claude lee un archivo de esa carpeta. Es decir, un `packages/design-system/CLAUDE.md` no cuesta contexto hasta que alguien toca el sistema de diseño.

Para comprobar qué se cargó de verdad en una sesión, `/context` lista los archivos de memoria activos. Si tu archivo no aparece ahí, Claude no lo está viendo y estás depurando el problema equivocado.

## Específico y verificable, no aspiracional

La documentación es tajante en un punto: el `CLAUDE.md` se entrega como contexto, no como configuración forzada. Una instrucción vaga se ignora con facilidad; una concreta, no. La diferencia en frontend es enorme:

```markdown
<!-- No sirve -->

- Cuida el estilo visual y respeta el sistema de diseño.
- Ten en cuenta la accesibilidad.
- No cargues JavaScript de más.

<!-- Sirve -->

- Nunca escribas un color literal (`#0f172a`, `rgb(...)`). Usa los tokens
  `bg-skin-fill`, `text-skin-base`, `text-skin-accent` de `tailwind.config.cjs`.
  Un hex hardcodeado rompe el modo oscuro.
- Todo control interactivo necesita nombre accesible: `aria-label` si no hay
  texto visible. Los `<div onClick>` se rechazan en review.
- Directiva de cliente por defecto: `client:visible`. `client:load` solo si
  el componente está sobre el pliegue y lo justificas en el PR.
```

La segunda versión es verificable: puedes mirar un diff y decir sí o no. La primera es un deseo.

Otro criterio que ahorra discusiones: **escribe el porqué junto a la regla**. "Un hex hardcodeado rompe el modo oscuro" no es decoración — es lo que hace que la regla se aplique también a los casos que no enumeraste.

## Mantenlo por debajo de 200 líneas

La recomendación oficial es no pasar de 200 líneas por archivo. No es un capricho de estilo: el archivo entra en el contexto en cada sesión, y cuanto más largo, menos se respeta cada instrucción individual. Es el mismo fenómeno que cuando marcas cinco cosas como "CRÍTICO" en un ticket: si todo es crítico, nada lo es.

Si tu archivo crece, tienes dos salidas mejores que recortar a lo bruto:

1. **Reglas por ruta** en `.claude/rules/`, que solo se cargan cuando Claude toca archivos que encajan con un patrón.
2. **Skills**, para procedimientos de varios pasos que solo hacen falta de vez en cuando. Lo vemos en [Skills de Claude Code](/posts/claude-code-skills).

Los imports con `@ruta/al/archivo` sirven para organizar, pero **no ahorran contexto**: el archivo importado se expande y se carga igual al arrancar.

## Reglas por ruta: el patrón que más rinde en frontend

Un frontend real no tiene un conjunto de convenciones, tiene varios: los componentes de UI no se escriben como los route handlers, y los tests no se escriben como ninguno de los dos. Meterlo todo en el `CLAUDE.md` raíz hace que Claude arrastre reglas de API mientras escribe un botón.

`.claude/rules/` resuelve esto. Cada archivo cubre un tema, y el frontmatter `paths` limita cuándo se activa:

```markdown
---
paths:
  - "src/components/**/*.{tsx,astro}"
---

# Componentes

- Un componente nuevo es `.astro` salvo que necesite estado o eventos del DOM.
- Los props van tipados con `interface Props`, nunca `any`.
- Nada de `useEffect` para derivar estado: calcula durante el render.
- Si el componente supera 150 líneas, extrae subcomponentes antes de seguir.
```

```markdown
---
paths:
  - "src/**/*.test.{ts,tsx}"
---

# Tests

- Consulta por rol accesible (`getByRole`), no por `data-testid`.
- Nada de `waitFor` con timeout fijo: usa `findBy*`.
```

Las reglas sin `paths` se cargan siempre, con la misma prioridad que `.claude/CLAUDE.md`. Las que tienen `paths` se activan cuando Claude lee un archivo que encaja con el patrón. En un monorepo esto es la diferencia entre un contexto limpio y uno lleno de ruido de otros equipos.

## El límite honesto: esto es contexto, no un candado

Aquí está la parte que casi ningún tutorial dice. El `CLAUDE.md` **influye** en el comportamiento; no lo garantiza. Se entrega como mensaje de usuario después del prompt del sistema, y no hay cumplimiento estricto.

Consecuencia práctica: si una regla es de las que no se pueden incumplir nunca — no tocar `dist/`, no commitear un `console.log`, pasar siempre el formateador —, escribirla en el `CLAUDE.md` es la herramienta equivocada. Eso se implementa como hook, que es una orden del sistema y se ejecuta pase lo que pase. Es exactamente el tema del [siguiente artículo de la serie](/posts/claude-code-hooks).

La regla mental que uso: **CLAUDE.md para criterio, hooks para invariantes.**

## Cómo saber si está funcionando

Un `CLAUDE.md` no se mide por lo que Claude genera, sino por lo que **deja** de generar. Señales concretas de que el tuyo hace su trabajo:

- Los colores nuevos salen como tokens a la primera, sin que lo pidas.
- Deja de proponerte instalar la librería que ya descartasteis hace seis meses.
- Los componentes nuevos aparecen en la carpeta correcta con la extensión correcta.
- Los code reviews dejan de repetir el mismo comentario.

Si nada de eso cambia, el problema no suele ser que falten instrucciones: suele ser que las que hay son demasiado genéricas, o que hay dos que se contradicen entre archivos y Claude elige una al azar.

## Un ejemplo que puedes copiar hoy

Este blog tiene el suyo, y su sección más valiosa no es la del stack — es la de "cosas que ya sabemos, no las re-descubras": que `astro.config.ts` importa el adapter de Vercel sin usarlo, que MDX no está instalado, que la identidad visual es propia y no la de la plantilla. Son trampas concretas del repositorio que ninguna lectura del código revela rápido, y evitan que cada sesión repita la misma investigación.

Haz el ejercicio con tu proyecto: abre el último PR que necesitó tres rondas de review y escribe cada comentario como una línea verificable. Ese es tu primer `CLAUDE.md` de verdad.

Si el proyecto es un Next.js, empieza por sus convenciones de rutas — repasa [Introducción a las Rutas en Next.js 15](/posts/nextjs-15-routes) y convierte en reglas las decisiones que ya tomasteis. Si es Angular con varias marcas, las reglas de build de [builds personalizados en Angular](/posts/guide-angular-custom-builds) son candidatas perfectas.

---

Esto es el primer artículo de la serie [Claude Code para frontend engineers](/posts/claude-code-frontend). Si quieres que revisemos juntos la configuración de Claude Code de tu equipo, o montar el pipeline frontend completo, [escríbeme](mailto:hi.codevs@gmail.com) o pásate por [sobre mí](/about).
