---
title: "El subagente de navegador de Antigravity"
author: Codevs
pubDatetime: 2026-08-26T10:00:00Z
slug: antigravity-browser-subagente
featured: false
draft: false
tags:
  - Antigravity
  - Frontend
  - IA
  - Claude Code
description: "Con /browser el agente abre Chrome con DevTools, interactúa y graba la sesión: cómo pasar de que afirme que funciona a que lo demuestre."
series: "Antigravity con Claude"
seriesOrder: 6
---

"Listo, el menú ya se cierra al hacer clic fuera."

No. El menú _debería_ cerrarse al hacer clic fuera, según un modelo que escribió un `useEffect` con un listener y nunca lo ejecutó. La distancia entre esas dos frases es donde vive la mitad del tiempo que pierdes con un agente de frontend.

Antigravity la cierra con un subagente de navegador. Y lo hace de una forma más limpia de la que esperaba.

## Table of contents

## Qué es y cómo se invoca

Se lanza con `/browser` y hace lo obvio: abre Chrome, carga la página, interactúa con ella y mira lo que pasa —incluida la consola de DevTools y las peticiones de red—. Al terminar deja una **grabación en `.webm`** como artefacto, además de las capturas que haya tomado.

El detalle de arquitectura interesante: **el subagente de navegador corre su propio modelo**, especializado en operar páginas, distinto del que tú elegiste para el agente principal. O sea que Claude sigue razonando sobre tu código mientras otro modelo, más barato y más adecuado, hace el trabajo mecánico de "encuentra el botón, haz clic, dime qué salió en consola".

Esto es exactamente el patrón que defendí en [subagentes de Claude Code](/posts/claude-code-subagentes): el trabajo exploratorio y ruidoso ocurre en otra ventana, y a la principal solo vuelve la conclusión. Aquí lo tienes cableado en el producto, sin que tengas que configurarlo.

## El cambio de hábito

La instrucción que hay que interiorizar cabe en una línea, y es la que más valor te va a dar de toda esta serie:

> **No aceptes "hecho". Pide la prueba.**

En la práctica, cambia el final de tus prompts:

```text
❌ Arregla que el menú móvil no se cierra al hacer clic fuera.

✅ Arregla que el menú móvil no se cierra al hacer clic fuera.
   Después, con /browser: abre /, redimensiona a 390x844, abre el menú,
   haz clic en el fondo y confirma que se cierra.
   Comprueba que la consola no tiene errores nuevos.
   Adjunta la grabación.
```

El segundo prompt no es más largo por ceremonia. Es más largo porque **especifica la condición de éxito de forma observable**, y eso hace dos cosas a la vez: te da evidencia y le da al agente un criterio para saber cuándo ha terminado de verdad. Un agente sin criterio de terminación observable termina cuando el código "parece" correcto.

## Qué verificar de verdad

No todo merece un vídeo. La lista donde el navegador rinde de verdad:

**1. Interacción con estado.** Menús, modales, acordeones, drag and drop. Todo lo que depende de una secuencia de eventos y no se ve en el diff.

**2. Estados de carga y de error.** El caso que el agente casi siempre olvida. "Corta la red en DevTools y enséñame qué se ve" descubre en diez segundos que no hay estado de error.

**3. Responsive real.** No `min-width` en el CSS: la página a 390 píxeles con el contenido de verdad. El overflow horizontal aparece con textos reales, no con lorem ipsum.

**4. La consola.** Este es el más infravalorado. Warnings de hidratación, claves duplicadas en listas, `act()` de React, un 404 de una fuente. Nada de eso rompe la página y todo eso es deuda. Pídelo explícitamente: **"la consola tiene que quedar limpia"**.

**5. Modo oscuro.** Dos capturas, la misma pantalla. Es donde salen los colores hardcodeados que tu regla prohibía y que el agente puso igualmente.

## Lo que no hace

Sé claro con las expectativas, porque este subagente es fácil de sobrevender:

- **No sustituye a los tests.** Es una verificación puntual, no una suite. Lo que tiene que seguir funcionando dentro de tres meses va en Playwright y en CI, como en [Claude Code en CI](/posts/claude-code-github-actions). El navegador del agente es para el bucle de desarrollo.
- **No es medición de rendimiento fiable.** Puede abrir DevTools y leer métricas, pero tu máquina con veinte pestañas abiertas no es un entorno de medida. Para Core Web Vitals, Lighthouse en CI.
- **No adivina el diseño correcto.** Ver la pantalla no le da criterio estético. Si el resultado es feo pero funcional, va a decirte que funciona. Y tendrá razón.

## Antigravity vs. hacerlo por MCP en Claude Code

En Claude Code lo equivalente se monta conectando Playwright o Chrome DevTools por MCP, que es lo que describí en [MCP en frontend: darle ojos a Claude Code](/posts/claude-code-mcp-visual). Funciona bien y lleva más tiempo funcionando. La comparación honesta:

|                    | Antigravity `/browser`                        | Claude Code + MCP                               |
| ------------------ | --------------------------------------------- | ----------------------------------------------- |
| Configuración      | Ninguna, viene puesto                         | Instalar y declarar el servidor MCP             |
| Coste de contexto  | Bajo: modelo aparte, solo vuelve el resultado | Las definiciones de herramientas ocupan ventana |
| Evidencia          | Vídeo `.webm` + capturas como artefacto       | Capturas, y lo que el servidor exponga          |
| Control fino       | Menor: el subagente decide cómo navegar       | Mayor: llamas a las herramientas que quieras    |
| Reutilizable en CI | No                                            | Sí, el mismo Playwright corre en CI             |

El resumen: **Antigravity gana en fricción cero, Claude Code + MCP gana en control y en que lo que montas sirve también fuera del IDE**. Si tu equipo ya tiene Playwright, el MCP te da dos usos por el mismo trabajo. Si no lo tiene, `/browser` te da el 80 % hoy mismo.

Un apunte de coste de contexto que se pasa por alto: cada servidor MCP conectado mete las definiciones de sus herramientas en tu ventana **en cada turno**, uses o no la herramienta. Con tres servidores generosos son decenas de miles de tokens permanentes. Lo desarrollé en [context engineering práctico](/posts/context-engineering-practico), y es un argumento real a favor del subagente integrado.

## Un flujo que funciona

El bucle que uso, y que se explica solo:

1. Describo el cambio y **pido plan**.
2. Corrijo el plan. Añado la condición de verificación al plan, no al final.
3. Apruebo, cambiando a Sonnet.
4. El agente implementa y verifica con `/browser`.
5. Miro **la grabación primero y el diff después**.

El punto 5 es contraintuitivo y es el que más tiempo ahorra. Si el vídeo muestra que el comportamiento es el correcto, el diff se lee buscando calidad —nombres, duplicación, si respetó las reglas— y no buscando errores. Son dos lecturas distintas y mucho más rápidas que la lectura ansiosa de "¿esto funcionará?".

## Lo siguiente

Un agente que planifica, implementa y verifica ya es un compañero de trabajo decente. El siguiente salto no es hacerlo mejor: es tener **cinco a la vez**.

Ahí es donde Antigravity enseña por qué se llama "agent-first", y donde también aparecen sus peores fallos. El [siguiente artículo](/posts/antigravity-agentes-paralelo) va del Manager, de los worktrees y de qué se paraleliza bien de verdad.

---

Parte de la serie [Antigravity con Claude](/posts/antigravity-claude). ¿Tu equipo entrega frontend sin verificación visual? [Cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
