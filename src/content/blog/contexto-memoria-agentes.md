---
title: "Contexto y memoria en agentes de código: la serie"
author: Codevs
pubDatetime: 2026-08-11T10:00:00Z
slug: contexto-memoria-agentes
featured: true
draft: false
tags:
  - Contexto
  - IA
  - Claude Code
  - Config
description: "Cómo funcionan el contexto y la memoria en Claude, Codex y Antigravity, qué los diferencia y qué herramientas como Caveman o Engram cubren de verdad."
series: "Contexto y memoria en agentes de código"
seriesOrder: 1
---

Hay un momento que reconoce cualquiera que use un agente de código a diario. Llevas cuarenta minutos con Claude, Codex o Antigravity. Acordaron una convención, descartaron dos enfoques, arreglaron un bug sutil. Y de pronto el agente propone exactamente lo que descartaron hace media hora, con el mismo entusiasmo que la primera vez.

La reacción instintiva es pensar que el modelo "se olvidó". No es eso. **Nunca lo recordó.** Lo tenía delante, en un buffer de texto que se reenvía entero en cada petición, y en algún punto ese buffer se llenó y alguien decidió qué tirar.

Esa distinción —entre lo que el modelo tiene delante y lo que el modelo conserva— es la que organiza esta serie. Son dos mecanismos distintos, con costos distintos, fallos distintos y herramientas distintas. Confundirlos es la razón número uno por la que la gente pelea con su agente en vez de configurarlo.

## Table of contents

## Las dos cosas que la gente llama "memoria"

**El contexto** es la ventana de tokens que viaja en cada petición: el prompt de sistema, las definiciones de tus herramientas, tu `CLAUDE.md`, los archivos que se han leído, la salida del build y toda la conversación. Es efímero, se paga por token y se paga otra vez en el turno siguiente. Cuando se llena, algo tiene que salir.

**La memoria** es lo que sobrevive a que la sesión termine: un archivo en disco, un almacén versionado, una nota que el agente escribió para su yo futuro. No viaja entera en cada petición — se consulta cuando hace falta. Es barata de tener y cara de mantener bien.

La tabla corta, que es la que conviene tener en la cabeza:

|            | Contexto                     | Memoria                        |
| ---------- | ---------------------------- | ------------------------------ |
| Dura       | Una sesión                   | Indefinidamente                |
| Se paga    | Por token, en **cada** turno | Solo cuando se lee             |
| Se llena   | Sí, y entonces se compacta   | No, pero se pudre              |
| Falla por  | Saturación y degradación     | Datos obsoletos o irrelevantes |
| Lo arregla | Context engineering          | Higiene de lo que guardas      |

Casi todo lo que la gente pide a la memoria ("que se acuerde de mis convenciones") es en realidad un problema de contexto, y casi todo lo que se le reclama al contexto ("no retiene nada entre sesiones") es un problema de memoria. Ordenar eso es la mitad del trabajo.

## Por qué esto importa ahora y no hace un año

Durante un tiempo el argumento fue "esperemos a que las ventanas crezcan". Crecieron: hoy hay modelos con un millón de tokens de contexto, y Antigravity anuncia dos millones en su suite de agentes. El problema no se fue, se desplazó.

Se desplazó por tres razones muy concretas:

1. **La atención no es uniforme.** Un modelo con un millón de tokens no atiende igual al token 500.000 que al 900. Meter más no es lo mismo que usarlo mejor.
2. **El costo es lineal y recurrente.** Cada turno reenvía todo lo anterior. Una sesión con 400.000 tokens de contexto no cuesta 400.000 tokens: cuesta 400.000 multiplicado por el número de turnos que quedan.
3. **Los agentes generan basura a un ritmo brutal.** Un `npm run build` fallido son 15.000 tokens que mirarás una vez y ocuparán espacio hasta el final de la sesión.

Con ventanas pequeñas, el contexto era un límite técnico. Con ventanas grandes, es una **decisión de diseño**. Y como toda decisión de diseño, se puede tomar bien o dejarla al azar.

## Qué recorre la serie

Seis artículos, pensados para leerse en orden.

**[La ventana de contexto: el recurso que pagas en cada turno](/posts/ventana-de-contexto)** — qué hay exactamente dentro de la ventana, por qué se llena mucho antes de lo que crees y qué significa que el rendimiento caiga aunque quede espacio. Lleva un **presupuesto de contexto interactivo**: enciendes y apagas piezas y ves cuánto te queda para trabajar.

**[Cómo gestiona el contexto cada agente](/posts/contexto-claude-codex-antigravity)** — Claude Code, Codex y Antigravity resuelven el mismo problema de tres maneras distintas: compactación por capas, resumen de traspaso, y aislamiento por agente. Con la comparativa y con lo que cada uno pierde.

**[Contexto no es memoria](/posts/memoria-vs-contexto)** — los cuatro tipos de memoria que importan en un agente, cuál cubre cada mecanismo real (`CLAUDE.md`, `MEMORY.md`, la herramienta de memoria de la API, los almacenes versionados) y la regla para decidir qué se guarda y qué no.

**[Context engineering: qué entra en la ventana y qué no](/posts/context-engineering-practico)** — la parte práctica. Progressive disclosure, subagentes, poda frente a resumen, el costo real de conectar servidores MCP y cómo no romperte la caché de prompt sin darte cuenta.

**[Caveman, Gentle AI y el ecosistema que rellena los huecos](/posts/herramientas-memoria-ia)** — qué resuelve de verdad cada herramienta del ecosistema. Caveman comprime la salida; Engram persiste memoria entre agentes distintos; mem0 y compañía son otra cosa completamente. Con lo que **no** resuelven.

**[Arma tu stack y mide el ahorro](/posts/stack-contexto-memoria)** — la receta final, en fases, y cómo medir que sirvió de algo, en tokens y en dinero. Sin medición esto es religión.

## Cómo leerla si tienes prisa

Si andas con poco tiempo y solo quieres arreglar tu configuración de hoy:

- **Te preocupa el costo**: 1 → 4 → 6.
- **Te preocupa que el agente pierda el hilo**: 1 → 2 → 3.
- **Vas a armar un stack desde cero**: léela entera, en orden.

## Un aviso sobre el ecosistema

Vas a encontrar muchas herramientas que prometen "memoria infinita para tu agente". La mayoría hace una de estas tres cosas, y conviene saber cuál antes de instalarla:

- **Comprimir** lo que entra o sale de la ventana (Caveman).
- **Persistir** hechos entre sesiones y entre agentes (Engram, y los `MEMORY.md` que ya tienes).
- **Dar memoria a tu producto**, no a tu editor (mem0, Letta, Zep). Este es un problema distinto que se confunde constantemente con el anterior.

Ninguna de las tres sustituye a decidir bien qué metes en la ventana. Una herramienta de compresión sobre un contexto mal diseñado te da un contexto mal diseñado un 60% más barato — que está bien, pero no es lo que creías comprar.

## Empieza aquí

El [primer artículo](/posts/ventana-de-contexto) abre la ventana y mira qué hay dentro, con la calculadora delante. Si después de leerlo tu reacción es "¿esto lo estoy pagando en cada turno?", la serie habrá hecho su trabajo.

---

Parte de la serie **Contexto y memoria en agentes de código**. Si quieres esto montado y medido sobre tu equipo y tu repositorio, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
