---
title: "Skills de Claude Code: empaqueta tu criterio"
author: Codevs
pubDatetime: 2026-08-04T09:20:00Z
slug: claude-code-skills
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - Config
description: "Cuándo una skill de Claude Code gana a CLAUDE.md, cómo escribir su description para que se active sola y cómo empaquetar checklists de frontend."
series: "Claude Code para frontend engineers"
seriesOrder: 4
---

## Table of contents

## El síntoma que pide una skill

Hay una señal muy fiable de que necesitas una skill: **estás pegando el mismo bloque de instrucciones en el chat por tercera vez**. "Crea el componente en `src/components`, con `interface Props`, sin `any`, exporta desde el barrel, añade el story, y comprueba el contraste." Cada vez lo escribes un poco distinto y cada vez el resultado sale un poco distinto.

La segunda señal: una sección de tu `CLAUDE.md` ha dejado de ser un hecho y se ha convertido en un procedimiento. Los hechos van en `CLAUDE.md` ("los componentes viven en `src/components`"). Los procedimientos de varios pasos, no.

La diferencia técnica es la que importa: **el cuerpo de una skill solo se carga cuando se usa**. Puedes escribir un checklist de accesibilidad de 300 líneas y no te cuesta prácticamente nada de contexto hasta el día que hace falta.

## Cómo se ve una skill

Una skill es un directorio con un `SKILL.md` dentro:

```text
.claude/skills/
└── componente-nuevo/
    └── SKILL.md
```

El archivo lleva frontmatter YAML y luego markdown normal:

```markdown
---
name: componente-nuevo
description: Crea un componente de UI siguiendo las convenciones del design system del proyecto (tokens, tipado, accesibilidad, barrel export). Úsalo cuando el usuario pida "nuevo componente", "crea un botón/card/modal" o describa una pieza de interfaz que no existe.
---

# Crear un componente

## 1. Comprueba que no existe ya

Busca en `src/components/` por nombre y por función. Duplicar un componente
que ya existe con otro nombre es el error más caro de este repositorio.

## 2. Elige la tecnología

- `.astro` por defecto.
- `.tsx` solo si necesita estado o eventos del DOM. En ese caso monta con
  `client:visible`; `client:load` requiere justificación.

## 3. Escribe el componente

- Props tipadas con `interface Props`. Nada de `any`.
- Colores solo con tokens `skin-*`. Un hex hardcodeado rompe el modo oscuro.
- Todo control interactivo necesita nombre accesible.

## 4. Verifica

npm run lint && npm run build

## 5. Reporta

Ruta del archivo, decisión .astro vs .tsx y por qué, y qué queda pendiente.
```

Se invoca con `/componente-nuevo`, o Claude la carga solo si la tarea encaja con la `description`.

## La `description` es el 80 % del trabajo

Este es el punto donde fallan casi todas las skills que veo. El cuerpo puede ser brillante, pero si la `description` no dispara, la skill no existe.

Lo que hay que saber:

- Es lo único que está en el contexto **siempre**. El cuerpo no.
- La `description` combinada se trunca a 1.536 caracteres en el listado, así que **pon el caso de uso principal primero**.
- Tiene que decir dos cosas: **qué hace** y **cuándo usarla**.

```yaml
# Mal: describe la skill, no el momento de usarla
description: Utilidades para trabajar con componentes.

# Bien: qué hace + cuándo, con las palabras que el usuario escribiría
description: >
  Audita la accesibilidad de un componente: roles, nombres accesibles, orden de
  foco, contraste y navegación por teclado. Úsalo cuando el usuario pida
  "revisa la accesibilidad", "pasa el a11y", mencione WCAG o lectores de
  pantalla, o antes de dar por cerrado un componente interactivo.
```

Escribe las frases que tú realmente tecleas. Si en tu equipo decís "pásale el a11y", esa expresión va en la `description`.

## Frontmatter que merece la pena conocer

Además de `name` y `description`, hay campos que cambian bastante el comportamiento:

| Campo                      | Para qué sirve en frontend                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `paths`                    | Globs que limitan cuándo se activa sola. `src/components/**/*.tsx` evita que una skill de UI se dispare tocando el backend.         |
| `allowed-tools`            | Herramientas preaprobadas durante el turno que invoca la skill. Evita la ronda de permisos en un flujo que siempre hace lo mismo.   |
| `disable-model-invocation` | `true` si solo quieres invocarla tú con `/nombre`. Útil para skills destructivas o caras.                                           |
| `model` / `effort`         | Sube o baja el modelo y el esfuerzo mientras la skill está activa. Una skill de renombrado mecánico no necesita el modelo más caro. |
| `context: fork`            | Ejecuta la skill en un subagente con contexto propio. Ideal para auditorías que generan mucho ruido.                                |
| `argument-hint`            | Lo que se muestra en el autocompletado: `[ruta-al-componente]`.                                                                     |

Un detalle histórico útil: los comandos personalizados de `.claude/commands/` se fusionaron con las skills. Un `.claude/commands/deploy.md` y un `.claude/skills/deploy/SKILL.md` generan ambos `/deploy`. Los archivos antiguos siguen funcionando; las skills añaden el directorio para archivos de apoyo y todo el frontmatter de arriba.

## Tres skills que valen para cualquier frontend

**Auditoría de accesibilidad.** El caso perfecto: es un checklist largo, no lo necesitas todos los días, y la calidad depende de no saltarse pasos. Con `context: fork` la auditoría se hace en un contexto aparte y a tu conversación solo vuelve el informe.

**Presupuesto de rendimiento.** Construir, medir el peso de los bundles, comparar contra los umbrales acordados y señalar qué dependencia se comió el margen. Aquí `allowed-tools` con `Bash` y `Read` ahorra media docena de confirmaciones.

**Post-mortem de un componente lento.** Un procedimiento de diagnóstico: perfilar, buscar re-renders, revisar memoización, mirar el tamaño de las props. Es exactamente el tipo de conocimiento que en un equipo vive en la cabeza de una persona y desaparece cuando esa persona está de vacaciones.

Este mismo blog usa el patrón: hay skills para crear un artículo con el frontmatter válido, para auditar el SEO técnico y para revisar el rendimiento. Ninguna ocupa contexto hasta que se invoca.

## Archivos de apoyo: el segundo nivel

Una skill es un directorio, no un archivo suelto, y eso habilita el patrón más potente: divulgación progresiva en dos escalones.

```text
.claude/skills/auditoria-a11y/
├── SKILL.md              # el procedimiento, corto
├── referencia/
│   ├── wcag-aa.md        # criterios completos
│   └── patrones-aria.md  # patrones autorizados
└── scripts/
    └── contraste.mjs     # cálculo determinista
```

El `SKILL.md` describe el flujo y dice cuándo leer cada archivo de referencia. Claude los abre solo si hace falta. Y lo que se puede calcular exacto — el ratio de contraste, por ejemplo — se calcula con un script, no se estima con un modelo. Esa frontera es la misma idea que vimos con los [hooks](/posts/claude-code-hooks): lo determinista, en código.

## Cuándo NO crear una skill

Vale la pena decirlo porque el entusiasmo inicial lleva a llenar `.claude/skills/` de archivos que nadie invoca:

- **Si es un hecho, no un procedimiento** → va en `CLAUDE.md`.
- **Si tiene que ocurrir siempre** → es un hook, no una skill. Una skill puede no dispararse.
- **Si es un paso** → no lo empaquetes. "Ejecuta los tests" no necesita ceremonia.
- **Si el procedimiento cambia cada semana** → mantener la skill costará más de lo que ahorra.

## Depurar una skill que no se activa

Dos síntomas y sus causas habituales:

**No se dispara nunca.** La `description` describe la skill en lugar del momento de usarla, o le faltan las palabras que la gente escribe de verdad. Prueba a invocarla a mano con `/nombre`: si así funciona bien, el problema está confirmado en la `description`, no en el cuerpo.

**Se dispara demasiado.** La descripción es demasiado amplia. Acótala con `paths`, o pon `disable-model-invocation: true` y déjala solo para invocación manual.

## Lo siguiente

Las skills empaquetan criterio. Lo que no resuelven es el **contexto**: si una auditoría genera 4.000 líneas de salida, eso entra en tu conversación y desplaza lo que sí importaba. Para eso están los subagentes, con su propia ventana de contexto — y es [el siguiente artículo](/posts/claude-code-subagentes).

---

Serie completa en [Claude Code para frontend engineers](/posts/claude-code-frontend). Si tu equipo tiene conocimiento operativo que solo vive en la cabeza de dos personas, empaquetarlo es justo el tipo de trabajo que hago: [hablemos](mailto:hi.codevs@gmail.com).
