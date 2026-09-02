---
title: "Reglas en Antigravity: del CLAUDE.md al AGENTS.md"
author: Codevs
pubDatetime: 2026-08-26T09:15:00Z
slug: antigravity-reglas-agents
featured: false
draft: false
tags:
  - Antigravity
  - Claude Code
  - Config
  - Contexto
description: "Dónde viven las reglas de Antigravity, los cuatro modos de activación, el tope de 12.000 caracteres y cómo migrar tu CLAUDE.md sin duplicarlo."
series: "Antigravity con Claude"
seriesOrder: 3
---

Un agente sin reglas inventa. Inventa colores que no están en tu paleta, instala una librería para algo que ya resolvías a mano y elige el patrón de estado que vio más veces en internet, no el que usa tu equipo. En Claude Code eso se arregla con `CLAUDE.md`. En Antigravity el mecanismo es parecido pero tiene una diferencia que cambia cómo lo escribes: **las reglas no son un archivo, son varios, y cada uno decide por su cuenta cuándo entra al contexto**.

Esa diferencia es la razón de este artículo.

## Table of contents

## Dónde viven las reglas

Dos niveles.

**Globales**, para todos tus proyectos:

```bash
~/.gemini/GEMINI.md     # reglas globales de Antigravity
~/.gemini/AGENTS.md     # reglas globales compartidas entre herramientas
```

El segundo archivo es el interesante: `AGENTS.md` es la convención abierta que también leen otros agentes. Si escribes ahí tus preferencias personales —"responde en español", "no me expliques lo que ya hiciste, muéstrame el diff"—, viajan contigo entre herramientas.

**De workspace**, dentro del repositorio:

```bash
.agents/rules/
├── stack.md
├── estilo-componentes.md
├── testing.md
└── migraciones-db.md
```

La carpeta se resuelve desde la raíz del workspace o del repositorio git. Si vienes de una versión anterior, `.agent/rules` (singular) sigue funcionando por compatibilidad, pero la carpeta buena hoy es `.agents/`.

Cada regla es un markdown normal, **con un tope duro de 12.000 caracteres**. Pasarse no es una recomendación estilística: es un límite del sistema, igual que el `AGENTS.md` de Codex tiene el suyo. Si tu `CLAUDE.md` actual pasa de ahí, no lo copies entero — sigue leyendo.

## Los cuatro modos de activación

Aquí está la diferencia real con `CLAUDE.md`. Cada regla de workspace declara **cuándo se carga**:

| Modo               | Cuándo entra                                 | Buen uso                                    |
| ------------------ | -------------------------------------------- | ------------------------------------------- |
| **Always On**      | Siempre, en cada conversación                | El contrato irrenunciable del proyecto      |
| **Model Decision** | El agente decide leyendo tu descripción      | Reglas de dominio: "migraciones", "i18n"    |
| **Glob Pattern**   | Cuando toca archivos que casan con el patrón | `*.tsx`, `src/styles/**`, `prisma/**`       |
| **Manual**         | Solo si la mencionas con `@` en el prompt    | Procedimientos raros que casi nunca aplican |

Esto es **progressive disclosure** aplicado a instrucciones, exactamente el mismo principio que hace baratas a las skills y que expliqué en [context engineering práctico](/posts/context-engineering-practico): lo que no se usa no ocupa ventana.

Y de ahí sale el error caro: **marcar todo como "Always On"**. Es lo que hace la gente que viene de un `CLAUDE.md` monolítico, porque replica el comportamiento que conocía. El resultado es que cada conversación arranca con 30.000 caracteres de instrucciones sobre migraciones de base de datos, i18n y accesibilidad, para acabar cambiando un `padding`. Pagas ese contexto en **cada turno**, no una vez — el mecanismo está en [la ventana de contexto](/posts/ventana-de-contexto).

La regla práctica:

> **Always On** solo para lo que no puede fallar nunca. Todo lo demás, glob o decisión del modelo.

En un frontend, "lo que no puede fallar nunca" suele ser una lista corta: el stack, la prohibición de hardcodear colores fuera de los tokens, y qué comandos hay que correr antes de dar algo por terminado. Tres o cuatro mil caracteres. El resto se carga cuando toca.

## Cómo migrar un CLAUDE.md

No lo copies. **Trocéalo por criterio de activación.** Es un ejercicio de media hora que además mejora el `CLAUDE.md` original.

Coge tu archivo y clasifica cada sección:

```text
CLAUDE.md
├── "Qué es este proyecto"        → Always On     (contexto, corto)
├── "Stack"                        → Always On     (contrato)
├── "Comandos"                     → Always On     (se usan siempre)
├── "Mapa del código"              → Model Decision (solo al explorar)
├── "Convenciones de componentes"  → Glob: *.tsx, *.astro
├── "Reglas de contenido/artículos"→ Glob: src/content/**
├── "Cosas que ya sabemos"         → Model Decision (trampas del proyecto)
└── "Antes de terminar"            → Always On     (checklist de cierre)
```

Y queda algo así:

```markdown
---
description: Convenciones de componentes React y Astro de este repositorio.
Aplica al crear o modificar cualquier componente de UI.
---

# Componentes

- Un componente nuevo es `.astro` salvo que necesite estado o eventos.
- Si necesita React, usa la directiva de cliente más barata disponible.
- Nada de CSS suelto: Tailwind con los tokens del tema.
  Un color hardcodeado rompe el modo oscuro.
```

Dos detalles que marcan la diferencia:

**La descripción es el disparador.** En modo "Model Decision", el agente decide si carga la regla leyendo su descripción, igual que decide si carga una skill. Escríbela en tercera persona, diciendo **qué cubre y cuándo aplica**, con las palabras que aparecerán en la petición del usuario. "Convenciones de componentes" es mala; "aplica al crear o modificar cualquier componente de UI" es buena. Es el mismo oficio que cuento en [skills de Claude Code](/posts/claude-code-skills).

**Puedes referenciar archivos con `@`.** Dentro de una regla, `@tailwind.config.cjs` o `@docs/adr/003-estado.md` traen ese archivo cuando la regla se activa. Las rutas relativas se resuelven desde la propia regla; las absolutas, desde la raíz del repositorio. Esto te salva del tope de 12.000 caracteres: la regla se queda corta y apunta al detalle.

## Qué escribir y qué no

Lo mismo que vale para `CLAUDE.md` vale aquí, y lo desarrollé en [CLAUDE.md como contrato de tu sistema de diseño](/posts/claude-md-frontend). El resumen operativo:

**Sí:**

- Prohibiciones concretas. "No uses `client:load`" vale más que "cuida el rendimiento".
- Decisiones ya tomadas y **su porqué**. "Usamos Zustand; descartamos Redux porque ya había tres formas de gestionar estado". El porqué es lo que impide que te reproponga Redux dentro de veinte turnos.
- Comandos exactos de verificación.
- Trampas del repositorio que no se deducen leyendo el código.

**No:**

- Lo que el agente puede leer del código en tres segundos. Un árbol de carpetas completo es contexto desperdiciado.
- Cortesías. "Sé cuidadoso", "piensa bien antes de responder". No cambian nada y ocupan.
- Documentación de la librería. El modelo la conoce mejor que tu resumen.

## Reglas vs. skills vs. workflows

Antigravity tiene tres mecanismos y se confunden constantemente. La frontera:

- **Regla**: restricción persistente. Modifica _cómo_ trabaja el agente mientras haga otra cosa.
- **Skill**: capacidad empaquetada. El agente la carga cuando la tarea encaja y aporta procedimiento.
- **Workflow**: secuencia que **tú** disparas con `/nombre`. Es un guion, no una restricción.

Regla de bolsillo: si la frase empieza por "nunca" o "siempre", es una regla. Si empieza por "cuando toque hacer X, hazlo así", es una skill. Si es "haz esto, luego esto, luego esto", es un workflow.

Los dos últimos son el [siguiente artículo](/posts/antigravity-skills-workflows), donde además veremos la mejor noticia de todo esto: tus skills de Claude Code funcionan casi tal cual.

---

Parte de la serie [Antigravity con Claude](/posts/antigravity-claude). Si quieres el conjunto de reglas de tu repositorio escrito y trocado como aquí, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
