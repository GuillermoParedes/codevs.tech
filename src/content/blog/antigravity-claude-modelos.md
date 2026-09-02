---
title: "Qué modelo de Claude usar en Antigravity"
author: Codevs
pubDatetime: 2026-08-26T09:00:00Z
slug: antigravity-claude-modelos
featured: false
draft: false
tags:
  - Antigravity
  - Claude Code
  - IA
  - Config
description: "Primer proyecto en Antigravity y la decisión que más cuota consume: cuándo basta Sonnet 4.6 y cuándo pagar Opus 4.6 con thinking."
series: "Antigravity con Claude"
seriesOrder: 2
---

El selector de modelos de Antigravity tiene siete entradas y ninguna explicación. La mayoría de la gente deja el que viene por defecto, se queda sin cuota un martes por la tarde y concluye que la herramienta "no da". Es un problema de configuración, no de producto.

Este artículo monta el primer proyecto y fija la regla de elección de modelo. Quince minutos bien invertidos.

## Table of contents

## Instalar y abrir el primer proyecto

Antigravity viene en dos sabores que comparten configuración: la aplicación de escritorio y el CLI.

```bash
# CLI, macOS/Linux
curl -fsSL https://antigravity.google/cli/install.sh | bash

# el binario queda en ~/.local/bin/agy
agy
```

En Windows el instalador equivalente es `irm https://antigravity.google/cli/install.ps1 | iex`. La app de escritorio se descarga desde el sitio y hay extensiones para VS Code, JetBrains, Zed, Visual Studio y Xcode si prefieres no cambiar de editor.

Lo primero que pide es crear un **proyecto**. No es cosmético: el proyecto define **a qué carpetas y repositorios puede acceder el agente**. Es el límite de radio de explosión, y conviene apretarlo desde el minuto uno.

Al crear el proyecto eliges modo de ejecución:

| Modo             | Qué hace                                         | Cuándo                                          |
| ---------------- | ------------------------------------------------ | ----------------------------------------------- |
| **Local**        | El agente trabaja sobre tu working tree          | Tarea única, quieres ver los cambios al vuelo   |
| **New Worktree** | Crea un worktree de git aislado por conversación | Varias tareas a la vez, o cambios que dan miedo |

Si vas a usar el Manager con agentes en paralelo, worktree no es opcional: lo tratamos en [cinco agentes en paralelo](/posts/antigravity-agentes-paralelo).

Y un detalle que agradeces a la tercera sesión: Antigravity es **seguro por defecto**. Cada comando de terminal pide aprobación interactiva y el acceso al sistema de archivos está acotado al proyecto salvo que lo abras a mano. Resiste la tentación de darle vía libre el primer día.

## Los modelos disponibles

En el momento de escribir esto, el selector ofrece:

| Modelo                           | Perfil                                 |
| -------------------------------- | -------------------------------------- |
| Gemini 3.1 Pro                   | Razonamiento alto, contexto muy grande |
| Gemini 3.x Flash                 | Rápido y barato, tareas mecánicas      |
| **Claude Sonnet 4.6**            | Caballo de batalla                     |
| **Claude Sonnet 4.6 (thinking)** | Igual, con razonamiento extendido      |
| **Claude Opus 4.6 (thinking)**   | El más capaz, el más caro en cuota     |
| GPT-OSS-120B                     | Complejidad media, alternativa abierta |

Hay además un modelo de imagen (Nano Banana 2) que el agente usa solo para mockups, diagramas y assets. No es seleccionable ni te lo tienes que plantear.

Dos cosas que conviene saber antes de elegir:

- **La elección es _sticky_ dentro de la conversación.** El modelo que fijas se mantiene entre mensajes hasta que lo cambies. No hay enrutado automático que te "ayude" a mitad de tarea.
- **Claude está en los planes gratuito, AI Plus y Pro, pero no en Enterprise.** Si tu organización está en Enterprise, este artículo te sirve para entender el reparto, no para aplicarlo.

Los límites se cuentan en dos ventanas: una de **cinco horas** y una **semanal**. Esa doble ventana es la que hace que la elección importe. Quemar la de cinco horas un martes a las once te deja mirando el techo hasta las cuatro.

## La regla de elección

La versión corta, que funciona el 90 % del tiempo:

> **Sonnet 4.6 por defecto. Opus 4.6 (thinking) solo para planificar y para lo que ya falló dos veces.**

La versión larga:

**Sonnet 4.6, sin thinking** — implementación de un plan que ya está escrito, refactors mecánicos, escribir tests para código existente, aplicar un cambio repetido en veinte archivos, corregir errores de tipos. Todo lo que tiene una respuesta correcta y el trabajo está en ejecutarla bien.

**Sonnet 4.6 (thinking)** — depuración con hipótesis, decisiones de diseño acotadas ("¿esto es un hook o un componente?"), leer código ajeno y explicarlo. Cuando el problema tiene varios caminos y quieres ver por cuál va antes de que se comprometa.

**Opus 4.6 (thinking)** — tres casos y ni uno más:

1. **El plan de implementación** de una tarea grande. Es donde más rinde: un plan bueno se ejecuta con Sonnet, un plan malo cuesta tres sesiones. Lo desarrollo en [artifacts: revisa el plan, no el diff](/posts/antigravity-artifacts-plan).
2. **El bug que resistió dos intentos.** Cambiar de modelo no es magia, pero cambiar de modelo _con el contexto de por qué fallaron los intentos anteriores_ rompe muchos bucles.
3. **Migraciones con criterio**, del tipo que describí en [migraciones masivas con el Agent SDK](/posts/claude-agent-sdk-migraciones): el 80 % mecánico va a un codemod o a Flash, y el 20 % que exige juicio va a Opus.

**Gemini Flash** — no lo descartes por tribalismo. Para tareas programadas, para resumir salidas largas de build y para renombrados masivos es más barato y suficientemente bueno. De hecho, las tareas programadas de Antigravity corren con Flash por diseño.

## El error de coste que comete todo el mundo

No es elegir Opus. Es **dejar Opus puesto**.

Como la selección es sticky, lo que pasa en la práctica es esto: pides un plan con Opus, el plan sale bien, dices "adelante" y el agente ejecuta cuarenta pasos de trabajo mecánico con el modelo más caro del catálogo. Has pagado razonamiento de frontera para renombrar imports.

El hábito que lo arregla cabe en una línea:

> Cambia a Sonnet **en el mismo mensaje en el que apruebas el plan**.

Aquí Antigravity juega a favor: como el plan es un artefacto persistente y no una parte de la conversación que hay que recordar, cambiar de modelo no te cuesta contexto. El plan sigue ahí. Esa es exactamente la ventaja de la que hablaba en [cómo gestiona el contexto cada agente](/posts/contexto-claude-codex-antigravity): repartir en vez de comprimir.

## Sobre preguntarle al modelo qué modelo es

Vas a ver hilos en foros diciendo que el selector miente porque alguien preguntó "¿qué modelo eres?" y le respondió otra cosa. Ignóralo: **los modelos no tienen una forma fiable de saber bajo qué etiqueta comercial se les sirve**, y su respuesta a esa pregunta sale del entrenamiento, no de introspección. Es la pregunta menos informativa que puedes hacer.

Si quieres saber si el cambio de modelo sirvió, mide lo de siempre: cuántas iteraciones hasta que el test pasa, cuántas veces tuviste que corregir el rumbo, cuánta cuota consumió la tarea. Eso sí se observa.

## Checklist del primer día

- [ ] Proyecto creado con acceso acotado a un solo repositorio.
- [ ] Modo **New Worktree** si vas a lanzar más de una conversación.
- [ ] Aprobación de comandos de terminal **activada** (no la desactives todavía).
- [ ] Sonnet 4.6 como modelo por defecto.
- [ ] Una nota mental: subir a Opus solo para planificar.

## Lo siguiente

Ya tienes a Claude corriendo dentro de Antigravity con límites que entiendes. Lo que todavía no tiene es **tu criterio**: tus convenciones, tu sistema de diseño, las cosas que en Claude Code viven en `CLAUDE.md`.

Eso va en el [siguiente artículo](/posts/antigravity-reglas-agents): dónde viven las reglas en Antigravity, los cuatro modos de activación y por qué poner todas en "Always On" te sale caro.

---

Parte de la serie [Antigravity con Claude](/posts/antigravity-claude). ¿Necesitas decidir qué agente y qué plan compra tu equipo? [Cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
