---
title: "Antigravity con Claude: la serie"
author: Codevs
pubDatetime: 2026-08-26T11:00:00Z
slug: antigravity-claude
featured: true
draft: false
tags:
  - Antigravity
  - Claude Code
  - IA
  - Config
description: "Cómo usar Antigravity con los modelos Claude para desarrollar software real: reglas, skills, artifacts, navegador y agentes en paralelo, en ocho artículos."
series: "Antigravity con Claude"
seriesOrder: 1
---

Antigravity es el IDE agent-first de Google. Los modelos de Claude son de Anthropic. Que puedas elegir "Claude Opus 4.6 (thinking)" en un desplegable de Google suena a nota al pie, y no lo es: es la combinación más interesante que hay ahora mismo para trabajar, porque junta el modelo con el que la mayoría ya sabemos programar con el arnés que mejor resuelve el problema que Claude Code no resuelve — **ver varias tareas a la vez y revisar el trabajo sin leer diffs**.

Esta serie es sobre esa combinación. No es una reseña de Antigravity ni una comparativa de modelos. Es cómo montar un flujo de desarrollo real encima, viniendo de Claude Code, sin tirar nada de lo que ya tienes escrito.

## Table of contents

## Qué es Antigravity, en una pantalla

Tres ideas y ya lo entiendes:

1. **La unidad de trabajo no es el chat, es el agente.** La vista principal (Manager) es un panel de control con varios agentes corriendo a la vez, cada uno en su tarea y en su espacio de trabajo. La vista de editor sigue ahí, pero es la secundaria.
2. **El agente no te entrega texto, te entrega artefactos.** Un plan de implementación en markdown, una lista de tareas, un diff, capturas, una grabación `.webm` del navegador, un _walkthrough_ final. Revisas objetos, no scrollback.
3. **El agente tiene manos fuera del editor.** Un subagente de navegador maneja Chrome con DevTools abierto, así que puede cargar la página, hacer clic, mirar la consola y grabarlo.

Encima de eso eliges modelo. Y ahí es donde entra Claude.

## Por qué Claude dentro de Antigravity

Antigravity trae varios modelos en el selector: dos variantes de Gemini 3.1 Pro, Gemini Flash, **Claude Sonnet 4.6**, **Claude Sonnet 4.6 (thinking)**, **Claude Opus 4.6 (thinking)** y GPT-OSS-120B. Corren a través de la infraestructura de Google, con los límites de uso del plan que tengas — no necesitas una clave de Anthropic ni pagas aparte.

Las tres razones por las que a mucha gente le sale a cuenta usar Claude ahí:

- **Ya sabes prompteárlo.** Todo lo que aprendiste peleando con Claude Code —cómo escribir instrucciones, cuándo pedir plan antes de código, cómo acotarle el alcance— se transfiere entero. El arnés cambia; el interlocutor no.
- **Tus instrucciones son portables.** Antigravity soporta reglas en markdown y **Agent Skills con el mismo formato `SKILL.md`** que Claude Code. Tu criterio empaquetado no se queda atrás.
- **Los planes largos se sostienen mejor.** Opus 4.6 con thinking en modo planificación produce planes de implementación que aguantan la revisión. Y en Antigravity el plan es un artefacto que puedes comentar línea a línea antes de que se escriba una sola línea de código.

Y la razón por la que no siempre conviene: **Claude no está disponible en el plan Enterprise** de Antigravity, y los límites de uso se cuentan por ventanas de cinco horas y semanales. Si tu equipo está en Enterprise, esta serie te sirve a medias — la parte de arquitectura sí, la elección de modelo no.

## Lo que la serie asume de ti

Que ya usaste un agente de código en serio y que la novedad no es el concepto sino el arnés. Si vienes de cero, empieza por la serie de [Claude Code para frontend engineers](/posts/claude-code-frontend); si lo que te interesa es _por qué_ estos agentes se comportan como se comportan, [Contexto y memoria en agentes de código](/posts/contexto-memoria-agentes) cubre la teoría que aquí voy a dar por sabida.

## Qué recorre la serie

Siete artículos después de este, en orden de instalación real.

**[Qué modelo de Claude usar en Antigravity](/posts/antigravity-claude-modelos)** — el primer proyecto, el selector de modelos y la decisión que más dinero mueve: Sonnet 4.6 para casi todo, Opus 4.6 con thinking para lo que de verdad lo pide. Con la regla de tres para no quemar la cuota el martes.

**[Reglas en Antigravity: del CLAUDE.md al AGENTS.md](/posts/antigravity-reglas-agents)** — dónde viven las reglas globales y de workspace, los cuatro modos de activación (y por qué "Always On" para todo es un error caro), el tope de 12.000 caracteres, y cómo migrar tu `CLAUDE.md` sin duplicarlo.

**[Skills y workflows: reutiliza tu criterio](/posts/antigravity-skills-workflows)** — tus skills de Claude Code funcionan casi tal cual en `.agents/skills/`. Qué cambia, qué se rompe, y cuándo lo que quieres no es una skill sino un workflow invocable con `/`.

**[Artifacts: revisa el plan, no el diff](/posts/antigravity-artifacts-plan)** — el cambio de hábito que más rinde. Modo planificación, feedback inline sobre el plan, lista de tareas y walkthrough final. Revisar antes de que exista el código es cinco veces más barato que revisarlo después.

**[El subagente de navegador](/posts/antigravity-browser-subagente)** — `/browser`, Chrome con DevTools y grabación en vídeo. Que el agente compruebe que su CSS funciona en vez de afirmarlo. Comparado con hacer lo mismo por MCP en Claude Code.

**[Cinco agentes en paralelo sin pisarse](/posts/antigravity-agentes-paralelo)** — el Manager, los worktrees y el reparto de tareas. Qué se paraleliza bien, qué no, y cómo evitar el merge infernal del viernes.

**[Antigravity y Claude Code en el mismo repo](/posts/antigravity-claude-code-juntos)** — la conclusión honesta: no elijas, reparte. Qué hace mejor cada uno, cómo compartir la config MCP y qué dejar en CI.

## La forma corta, si tienes prisa

Si solo vas a leer tres: **modelos → reglas → artifacts**. Con eso tienes Antigravity configurado y revisando por plan, que es el 80 % del beneficio. El navegador y el paralelismo son la parte que te enamora, pero llegan después.

## Un aviso antes de empezar

Antigravity es joven y se mueve rápido: la nomenclatura cambia entre versiones (`.agent/` pasó a `.agents/`), hay funciones que aparecen primero en el CLI y luego en el IDE, y a lo largo de 2026 hubo reportes de agentes perdiendo el hilo de sus propios cambios a mitad de tarea. Lo cubro donde toca, sin adornarlo.

La consecuencia práctica: **no apoyes un flujo crítico en una sola superficie**. Lo que tenga que ser reproducible —lint, formato, tests, revisión de PR— va en CI, como cuento en [Claude Code en CI](/posts/claude-code-github-actions). Lo demás puede vivir en el IDE.

## Empieza aquí

El [primer artículo](/posts/antigravity-claude-modelos) monta el proyecto y elige modelo. Quince minutos, y ya tienes a Claude trabajando dentro de Antigravity con límites que entiendes.

---

Parte de la serie **Antigravity con Claude**. Si quieres esto montado sobre el repositorio de tu equipo, con reglas y skills propias, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
