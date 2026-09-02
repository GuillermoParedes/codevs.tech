---
title: "Cinco agentes en paralelo sin pisarse"
author: Codevs
pubDatetime: 2026-08-26T10:15:00Z
slug: antigravity-agentes-paralelo
featured: false
draft: false
tags:
  - Antigravity
  - Claude Code
  - Config
  - IA
description: "El Manager de Antigravity permite varios agentes a la vez en worktrees aislados: qué tareas se paralelizan bien y cuáles acaban en un merge infernal."
series: "Antigravity con Claude"
seriesOrder: 7
---

La promesa suena bien: cinco agentes trabajando a la vez, tú supervisando desde un panel. La realidad, si lo haces mal, es cinco ramas que tocan los mismos archivos, tres horas de resolución de conflictos y la certeza de que ibas más rápido solo.

El paralelismo con agentes no falla por la herramienta. Falla por el reparto. Y el reparto es un problema que ya sabías resolver: es el mismo que decidir qué tareas del sprint pueden ir en paralelo sin bloquearse.

## Table of contents

## Qué es el Manager

Es la vista principal de Antigravity, y el sitio donde se ve que esto no es un chat con un editor al lado. Un panel donde:

- Lanzas **hasta cinco agentes en paralelo**, cada uno con su tarea y su espacio de trabajo.
- Ves el estado de todos a la vez: trabajando, esperando aprobación, terminado.
- Revisas los **artefactos** de cada uno —planes, diffs, walkthroughs, grabaciones— sin entrar en la conversación.
- Apruebas o corriges desde el mismo sitio.

La clave operativa está en el último punto. Con cinco agentes, tu cuello de botella deja de ser escribir código y pasa a ser **aprobar y revisar**. El Manager está diseñado para eso: es una cola de trabajo tuya, no un chat múltiple.

## El aislamiento: worktrees, no ramas

Si lanzas cinco agentes sobre el mismo working tree, se pisan. No hay matiz posible.

Por eso el modo **New Worktree** existe: cada conversación obtiene un worktree de git aislado, con su propia copia del árbol de trabajo y su propia rama. Cinco agentes, cinco directorios, cero interferencia en el sistema de archivos.

```bash
# lo que Antigravity hace por debajo, en esencia
git worktree add ../proyecto-agente-1 -b feat/menu-movil
git worktree add ../proyecto-agente-2 -b feat/tests-checkout
```

Lo que el worktree **sí** resuelve: dos agentes editando el mismo archivo al mismo tiempo, servidores de desarrollo peleándose, `node_modules` a medio instalar.

Lo que el worktree **no** resuelve: dos agentes escribiendo lógica incompatible en el mismo archivo, en ramas distintas, que descubrirás al mergear. El conflicto no desaparece, se **aplaza**. Y un conflicto aplazado con 400 líneas generadas a cada lado es peor que uno inmediato.

De ahí la regla que hace que todo esto funcione:

> **Reparte por frontera de archivos, no por tema.**

## Qué se paraleliza bien

Después de bastantes intentos, mi lista:

**Sí, casi siempre:**

- **Tareas en módulos disjuntos.** Un agente en `src/components/checkout/`, otro en `src/lib/analytics/`. Fronteras claras, cero solape.
- **Tests para código existente.** No modifican el código de producción; solo añaden archivos nuevos. Es el caso perfecto para paralelizar y casi nadie lo aprovecha.
- **Investigación.** "Averigua por qué el build tarda 4 minutos" mientras otro agente implementa. Uno lee, otro escribe.
- **Traducciones y contenido.** Archivos independientes por definición.
- **Actualizaciones de dependencia, una por agente.** Cada una en su rama, cada una con su verificación. Si una rompe, la tiras entera.

**No, casi nunca:**

- **Refactor grande + cualquier otra cosa.** Un refactor toca todo. Mientras esté en marcha, todo lo demás va detrás.
- **Tareas encadenadas.** "Crea el endpoint" y "consume el endpoint" no son dos tareas paralelas, son una en dos pasos.
- **Cambios de configuración global.** Tailwind, `tsconfig`, `astro.config`. Un agente y solo uno.
- **Cualquier cosa en el mismo archivo.** Aunque sean funciones distintas. No merece la pena.

## Cómo repartir en la práctica

Un método aburrido que funciona:

**1. Escribe primero la lista de archivos.** Antes de lanzar nada, para dos minutos y anota qué archivos toca cada tarea. Si dos listas se solapan, esas tareas no van en paralelo. Punto.

**2. Deja el primer agente para el trabajo que cambia el terreno.** Migraciones, configuración, dependencias. Ese va solo. Cuando termina y está mergeado, lanzas el resto.

**3. Máximo tres si estás empezando.** El límite son cinco, pero cinco agentes generan más artefactos de los que puedes revisar bien. El paralelismo que no puedes supervisar no es velocidad, es deuda.

**4. Mergea a menudo, en orden de riesgo.** Primero lo que menos toca. Cada merge reduce la superficie de conflicto de los que quedan.

**5. Un modelo distinto por tipo de tarea.** No todos los agentes necesitan Opus. El de tests, Sonnet. El de investigación, Sonnet con thinking. El que planifica el refactor, Opus. Ya lo vimos en [qué modelo usar](/posts/antigravity-claude-modelos), pero con cinco agentes a la vez la cuota se evapora al triple de velocidad.

## El aviso honesto

Esta es la parte más joven del producto y conviene decirlo sin adornos: a lo largo de 2026 hubo reportes recurrentes de **agentes perdiendo la pista de sus propios cambios** a mitad de tarea en escenarios de paralelismo — cambios que se dan por hechos y no están, o un agente que trabaja sobre una versión antigua del archivo.

Tres precauciones que no cuestan nada:

- **Commits frecuentes en cada worktree.** El panel de VCS integrado sirve justo para esto: ves el diff sin commitear, lo revisas, lo commiteas. Si un agente se pierde, tienes dónde volver.
- **Verifica en el worktree, no en tu cabeza.** Que cada agente corra lint, tipos y tests **en su propio worktree** antes de decir que terminó. Un walkthrough que dice "todo pasa" sin salida de comando no vale nada, como ya discutimos en [artifacts](/posts/antigravity-artifacts-plan).
- **Nada crítico depende de esto.** La verificación reproducible vive en CI. El paralelismo del IDE es para acelerar el borrador, no para garantizar nada.

## Lo que de verdad cambia

El efecto interesante del Manager no es hacer cinco cosas a la vez. Es que **te obliga a definir las tareas bien antes de empezar**.

Con un solo agente puedes ir improvisando: pides algo, ves qué sale, corriges, sigues. Con cinco no puedes: cada uno necesita un alcance cerrado, una frontera de archivos y una condición de terminación, o el conjunto se convierte en caos.

Eso es planificación de sprint, con otro nombre. Y la parte incómoda es que la gente que ya trabajaba así saca cinco veces más partido a esta herramienta que la que no. La herramienta amplifica el método que ya tenías; no lo sustituye.

## Lo siguiente

Con esto tienes Antigravity montado entero: modelo, reglas, skills, artefactos, navegador y paralelismo. Queda la pregunta que probablemente tenías desde el primer artículo: **¿entonces dejo Claude Code?**

La respuesta es que no, y el [último artículo](/posts/antigravity-claude-code-juntos) explica el reparto: qué hace mejor cada uno, cómo compartir configuración entre ambos y qué no debería vivir en ninguno de los dos.

---

Parte de la serie [Antigravity con Claude](/posts/antigravity-claude). Si quieres montar un flujo de varios agentes sobre el repositorio de tu equipo sin acabar en un merge infernal, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
