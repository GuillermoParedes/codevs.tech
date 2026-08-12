---
title: "Cómo gestiona el contexto cada agente: Claude, Codex y Antigravity"
author: Codevs
pubDatetime: 2026-08-11T09:10:00Z
slug: contexto-claude-codex-antigravity
featured: false
draft: false
tags:
  - Contexto
  - IA
  - Claude Code
  - Config
description: "Comparativa de cómo Claude Code, Codex CLI y Antigravity compactan el contexto, qué pierde cada uno al hacerlo y qué control real te dejan."
series: "Contexto y memoria en agentes de código"
seriesOrder: 3
---

Los tres agentes se enfrentan al mismo momento: la ventana se acaba y hay que decidir qué sobrevive. Las tres respuestas son distintas, y la diferencia no es cosmética — determina qué información pierdes, cuándo la pierdes y cuánto control tienes sobre el proceso.

Esta es la comparación que casi nunca se hace, porque exige mirar el mecanismo y no la lista de features.

## Table of contents

## Claude Code: compactación por capas, con mandos a la vista

Claude Code es el que más superficie de control expone, y el que mejor se deja auditar.

**`/context`** es el comando que deberías usar antes que ningún otro. Da el desglose por categorías —prompt de sistema, herramientas nativas, servidores MCP, tus archivos, la conversación—, sugiere optimizaciones y muestra el buffer que reserva para poder compactar. Es un diagnóstico completo en un comando, y casi nadie lo ejecuta hasta que ya tiene un problema.

**`/compact`** resume la conversación y la sustituye por un resumen estructurado. **`/clear`** la tira entera y arranca de cero. La regla es sencilla: `/compact` cuando sigues en la misma tarea y necesitas el hilo; `/clear` cuando cambias de tarea, que es más a menudo de lo que la gente cree.

**`/autocompact`** ajusta cuándo salta la compactación automática. Si trabajas con ventana grande y quieres que compacte más tarde, se le da un valor.

Por debajo, la estrategia es de varias capas: se recortan resultados de herramientas antiguos, se cuida no romper la caché de prompt, y el resumen final es estructurado por secciones en lugar de un párrafo libre. Esa estructura importa: un resumen con apartados fijos conserva mejor las decisiones que uno narrativo.

Al ecosistema de Claude hay que sumarle dos mecanismos que no son compactación pero atacan el mismo problema desde antes:

- **Subagentes**, que exploran en su propia ventana y devuelven solo la conclusión. La exploración no llega a tocar tu contexto. Lo cubrí a fondo en [subagentes de Claude Code](/posts/claude-code-subagentes).
- **Skills**, cuyo cuerpo no se carga hasta que se usan. Solo su descripción vive en el contexto. Es el mismo principio, aplicado a las instrucciones: lo tratamos en [skills de Claude Code](/posts/claude-code-skills).

En la API hay además dos operaciones que conviene distinguir porque se confunden todo el rato: **compactar** (resumir el historial) y **editar el contexto** (borrar resultados de herramientas o bloques de razonamiento antiguos). La primera resume, la segunda **poda**. Volveremos sobre esto en el [artículo de context engineering](/posts/context-engineering-practico), porque elegir bien entre las dos es de lo que más rinde.

## Codex CLI: resumen de traspaso, en el servidor

Codex toma el camino contrario: menos mandos, más automatismo.

Su compactación es de **una sola capa**: cuando la ventana se llena, genera un _handoff summary_ —un resumen de traspaso— y continúa con él. No hay recorte progresivo previo ni secciones fijas; es un corte limpio entre el "antes" y el "después".

Con los modelos alojados por OpenAI, ese resumen se produce del lado del servidor: el CLI llama a un endpoint de compactación que devuelve un blob cifrado cuya clave vive en la infraestructura de OpenAI, y en el turno siguiente el servidor lo descifra y antepone un prompt que enmarca el resumen para el modelo. Es un detalle de arquitectura más relevante de lo que parece: **el resumen es opaco para ti**. No puedes leerlo, versionarlo ni corregirlo antes de que el agente siga trabajando sobre él.

La capa de instrucciones estáticas es **`AGENTS.md`**, el equivalente de `CLAUDE.md`. Aquí hay una trampa concreta que merece la pena conocer: tiene un tope de tamaño (del orden de 32 KiB) y lo que pase de ahí **se trunca en silencio**. En un monorepo con archivos de instrucciones anidados es perfectamente posible que la mitad de tus convenciones no llegue nunca al modelo y que nada te avise. Si mantienes un `AGENTS.md` largo, mídelo.

El resultado neto: Codex pide menos gestión y te deja menos margen. Para sesiones cortas y bien acotadas es cómodo. Para una sesión larga donde el "por qué" de las decisiones importa, el resumen opaco de una capa es el eslabón débil.

## Antigravity: el contexto se reparte, no se comprime

Antigravity ataca el problema desde otro lado. En lugar de optimizar cómo se encoge una ventana, reparte el trabajo entre ventanas.

Su unidad de organización es el **Manager**: una vista donde orquestas varios agentes en paralelo en vez de conversar con uno. Los subagentes corren con aislamiento de espacio de trabajo, así que las tareas grandes se trocean sin que el hilo principal se llene de material de todas ellas a la vez. Sumado a ventanas muy grandes —Gemini 3 Pro aporta un contexto nativo de un millón de tokens, y la suite anuncia hasta dos millones—, la estrategia es clara: **evitar la compresión repartiendo**.

La pieza más interesante conceptualmente es la **memoria de equipo**: agentes distintos comparten un contexto de proyecto común, de modo que un agente revisor ya conoce las decisiones que tomó el agente que escribió el código, sin releer la conversación entera. Es la idea correcta —que el conocimiento del proyecto viva fuera de cualquier hilo concreto— llevada al producto.

También conviene la nota honesta: a lo largo de 2026 se reportaron problemas de estabilidad, incluidos errores en los que agentes pierden la pista de cambios a mitad de tarea. Es una arquitectura joven y ambiciosa; trátala como tal antes de apoyar en ella un flujo crítico.

## La comparativa

|                    | Claude Code                                      | Codex CLI                                       | Antigravity                |
| ------------------ | ------------------------------------------------ | ----------------------------------------------- | -------------------------- |
| Estrategia         | Compactar por capas                              | Resumen de traspaso                             | Repartir entre agentes     |
| Control manual     | `/context`, `/compact`, `/clear`, `/autocompact` | Escaso                                          | Orquestación en el Manager |
| Resumen            | Estructurado, local                              | Opaco, en servidor                              | Menos frecuente por diseño |
| Instrucciones      | `CLAUDE.md`                                      | `AGENTS.md` (tope ~32 KiB, truncado silencioso) | Reglas + memoria de equipo |
| Carga bajo demanda | Skills, subagentes                               | Limitada                                        | Subagentes aislados        |
| Punto débil        | Exige configurarlo                               | No auditas lo que se pierde                     | Madurez                    |

## Lo que todos pierden

Distintas implementaciones, el mismo agujero. **Ningún resumen automático conserva el razonamiento descartado.**

Los tres guardan bien lo que se decidió y mal por qué se decidió. Guardan "usamos Zustand" y pierden "descartamos Redux porque el equipo ya tenía tres formas de gestionar estado, y meter una cuarta era la causa del bug de la semana pasada". La segunda frase es la que impide que el agente reproponga Redux dentro de veinte turnos.

Y como cada compactación resume el resumen anterior, la degradación es acumulativa: tras dos o tres ciclos, lo que queda es un esqueleto de hechos sin sus razones.

La consecuencia práctica es incómoda y es el argumento central de esta serie: **si algo tiene que sobrevivir a una compactación, no lo dejes en la conversación**. Escríbelo donde no dependa de que un resumidor decida que era importante — un archivo del repositorio, una nota de memoria, una línea en tu `CLAUDE.md`. Cualquier cosa menos el historial.

Un hábito que cuesta cinco segundos y ahorra sesiones enteras: antes de dejar que compacte, pide explícitamente al agente que escriba las decisiones y su porqué en un archivo. Después compacta tranquilo.

## Lo siguiente

Hemos llegado al límite de lo que el contexto puede hacer por ti. Todo lo que quieras conservar más allá de una sesión pertenece a otro mecanismo, con otras reglas y otros modos de fallo.

Ese mecanismo es la memoria, y es el [siguiente artículo](/posts/memoria-vs-contexto): qué tipos hay, cuál cubre cada herramienta real y —la parte que casi nadie acierta— qué **no** deberías guardar nunca.

---

Parte de la serie [Contexto y memoria en agentes de código](/posts/contexto-memoria-agentes). Si estás eligiendo agente para tu equipo y quieres la comparación aplicada al repositorio de tu equipo, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
