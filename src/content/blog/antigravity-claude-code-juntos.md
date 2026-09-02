---
title: "Antigravity y Claude Code en el mismo repositorio"
author: Codevs
pubDatetime: 2026-08-26T10:30:00Z
slug: antigravity-claude-code-juntos
featured: false
draft: false
tags:
  - Antigravity
  - Claude Code
  - Config
  - IA
description: "No elijas entre Antigravity y Claude Code: reparte. Qué hace mejor cada uno, cómo compartir MCP y reglas, y qué debe vivir siempre en CI."
series: "Antigravity con Claude"
seriesOrder: 8
---

La pregunta llega siempre en el mismo punto: "vale, ¿y entonces me paso a Antigravity o me quedo en Claude Code?".

La pregunta está mal formulada. Son herramientas con formas distintas —una es un IDE orientado a orquestar agentes, la otra es un agente en el terminal— y el coste de tener las dos configuradas sobre el mismo repositorio es de una tarde. La decisión no es cuál, es **qué va en cada una**.

Este es el cierre de la serie: el reparto concreto y la configuración compartida.

## Table of contents

## En qué es mejor cada uno

Sin diplomacia:

| Situación                                            | Herramienta | Por qué                                                                                 |
| ---------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| Tarea única, sé exactamente qué quiero               | Claude Code | Menos ceremonia, latencia mínima                                                        |
| Tarea grande que hay que planificar                  | Antigravity | El plan como artefacto comentable no tiene equivalente                                  |
| Frontend con verificación visual                     | Antigravity | `/browser` sin configurar nada                                                          |
| Varias tareas independientes a la vez                | Antigravity | El Manager y los worktrees                                                              |
| Estoy dentro de una sesión de terminal, con contexto | Claude Code | Cambiar de ventana cuesta más que el beneficio                                          |
| Scripting, automatización, modo headless             | Claude Code | Modo no interactivo maduro y componible con Unix                                        |
| Revisión de PR, lint, tests reproducibles            | **Ninguno** | Eso va en CI                                                                            |
| Migración masiva con reglas deterministas            | Claude Code | Codemod + Agent SDK, como en [migraciones masivas](/posts/claude-agent-sdk-migraciones) |
| Explorar un repositorio ajeno                        | Cualquiera  | Con subagentes, ambos van bien                                                          |

El patrón, si lo destilas: **Antigravity gana cuando el cuello de botella es tu revisión; Claude Code gana cuando el cuello de botella es tu tiempo de ida y vuelta.**

Una tarea de dos minutos no necesita un plan, una lista de tareas y un walkthrough. Una tarea de dos horas repartida en cuatro módulos, sí.

## Configuración compartida: lo que se puede

La buena noticia es que en 2026 hay bastante convergencia. Lo que se comparte y lo que no:

**Se comparte tal cual:**

- **Las skills.** Mismo formato `SKILL.md`. Copia o, mejor, enlaza:

  ```bash
  ln -s ../../.claude/skills .agents/skills
  ```

  Un solo sitio donde escribir el criterio, dos agentes que lo leen. Lo cubrí en [skills y workflows](/posts/antigravity-skills-workflows), incluidos los cuatro retoques que necesitan.

- **Los servidores MCP.** Antigravity centraliza su configuración en un archivo:

  ```bash
  ~/.gemini/config/mcp_config.json
  ```

  Su formato es el mismo `mcpServers` que ya conoces, así que trasladar los servidores de tu `.mcp.json` es copiar y pegar. Dos avisos: usa **rutas absolutas** para el comando y **variables de entorno** para los secretos, nunca la clave literal en el JSON.

- **`AGENTS.md`.** La convención abierta que leen varios agentes. Es el sitio natural para las preferencias que valen en cualquier herramienta.

**No se comparte:**

- Reglas de workspace: `.agents/rules/*.md` con sus modos de activación, frente a `CLAUDE.md`. Aquí no hay atajo, y en [reglas en Antigravity](/posts/antigravity-reglas-agents) explico cómo trocearlo bien en vez de duplicarlo.
- Subagentes: los de `.claude/agents/` no los ve Antigravity.
- Hooks: Antigravity tiene los suyos en JSON, con sus propias etapas de ejecución. Concepto idéntico, configuración distinta. El porqué de los hooks sigue siendo el de [hooks de Claude Code](/posts/claude-code-hooks): un hook se ejecuta, una instrucción solo se obedece a veces.

Una estructura de repositorio que funciona:

```text
proyecto/
├── AGENTS.md              # contrato común, corto, para cualquier agente
├── CLAUDE.md              # detalle específico de Claude Code
├── .agents/
│   ├── rules/             # reglas troceadas por activación
│   ├── workflows/         # guiones invocables con /
│   └── skills -> ../.claude/skills
└── .claude/
    ├── skills/            # la fuente única del criterio empaquetado
    ├── agents/
    └── settings.json
```

## Lo que no debe vivir en ninguno de los dos

Esta es la parte que más veces hay que repetir.

Todo lo que tenga que ser **reproducible** —lint, formato, tipos, tests, auditoría de dependencias, presupuesto de bundle— pertenece a CI, no a un agente. Un agente ejecuta el comando **si se acuerda**. Una GitHub Action lo ejecuta siempre, en la misma versión de Node, con el mismo resultado, y bloquea el merge si falla.

La forma correcta de encajar un agente en CI es la que describí en [Claude Code en CI](/posts/claude-code-github-actions): que los comprobables deterministas los haga la máquina, y que el agente aporte lo que una regla de lint no puede — revisión de criterio, detección de patrones raros, explicación de por qué un cambio es arriesgado.

Dicho de otra forma: **el agente en tu máquina es para escribir, el CI es para garantizar.** Confundirlos es cómo acaban llegando a producción cosas que "el agente dijo que había verificado".

## Un flujo de día completo

Cómo se ve esto en una jornada real, sin idealizar:

**Por la mañana, tarea grande.** Antigravity. Proyecto en modo worktree, Opus 4.6 (thinking), pido plan. Reviso el plan con calma con un café — es el rato del día que más rinde. Corrijo dos suposiciones, apruebo cambiando a Sonnet 4.6. Mientras ejecuta, lanzo un segundo agente en otro worktree escribiendo tests de un módulo que ya estaba terminado.

**A media mañana, revisión.** Manager. Miro la grabación de `/browser` del primero, luego el diff. El segundo terminó; sus tests son archivos nuevos, merge directo.

**Por la tarde, trabajo fino.** Terminal, Claude Code. Cinco cosas pequeñas: un tipo mal puesto, un texto, un `README`. Nada de eso necesita plan ni artefactos; necesita velocidad y que yo esté mirando.

**Al cerrar.** Push, y el PR se revisa solo en CI. El cuerpo del PR sale casi entero del walkthrough de la mañana.

Ni una sola vez tuve que elegir herramienta. La tarea la elige.

## El resumen de la serie

Ocho artículos, y si todo se me olvidara menos cinco frases, serían estas:

1. **Sonnet por defecto, Opus para planificar.** La cuota es un recurso y la selección de modelo es sticky.
2. **Trocea tus reglas por activación.** "Always On" para todo es pagar contexto en cada turno por instrucciones que no aplican.
3. **Empaqueta tu criterio en skills.** Es lo único que se transfiere entre herramientas sin coste.
4. **Revisa el plan, no el diff.** Corregir una frase cuesta treinta segundos; corregir el código que salió de ella, veinte minutos.
5. **Exige evidencia, no afirmaciones.** Grabación, salida de comando, test que pasa. "Verificado" no es una verificación.

Ninguna de las cinco depende de Antigravity. Todas se aplican a cualquier agente que uses el año que viene, cuando el catálogo haya cambiado otra vez. Ese era el objetivo de escribirlas así.

---

Fin de la serie [Antigravity con Claude](/posts/antigravity-claude). Si quieres este flujo montado sobre el repositorio y el equipo que tienes —reglas, skills, verificación y CI—, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
