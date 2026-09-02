---
title: "Artifacts: revisa el plan, no el diff"
author: Codevs
pubDatetime: 2026-08-26T09:45:00Z
slug: antigravity-artifacts-plan
featured: false
draft: false
tags:
  - Antigravity
  - Claude Code
  - IA
  - Config
description: "El modo planificación de Antigravity convierte el trabajo del agente en artefactos revisables: plan, lista de tareas, diff y walkthrough final."
series: "Antigravity con Claude"
seriesOrder: 5
---

Revisar código generado por un agente leyendo el diff es como corregir un examen sin haber visto el enunciado. Ves lo que escribió, no lo que entendió. Y cuando el diff son 600 líneas repartidas en catorce archivos, lo que haces no es revisar: es hojear y confiar.

La idea central de Antigravity es que el agente no te entregue texto, sino **artefactos**: objetos estructurados que puedes leer, comentar y aprobar. Y el artefacto que más cambia tu vida es el que llega **antes** del código.

## Table of contents

## Qué es un artefacto

Un artefacto es un entregable que el agente produce para comunicar su trabajo. Los tipos que te vas a encontrar:

| Artefacto                    | Cuándo aparece         | Para qué sirve                        |
| ---------------------------- | ---------------------- | ------------------------------------- |
| **Plan de implementación**   | Antes de tocar código  | Ver qué entendió y corregirlo barato  |
| **Lista de tareas**          | Durante la ejecución   | Saber por dónde va y qué queda        |
| **Diff de código**           | Al escribir            | La revisión clásica, ya en su sitio   |
| **Diagrama de arquitectura** | En diseño              | Discutir estructura sin leer código   |
| **Capturas e imágenes**      | Trabajo visual         | Comprobar UI sin abrir el navegador   |
| **Grabación de navegador**   | Verificación (`.webm`) | Ver la interacción real, no su relato |
| **Walkthrough**              | Al terminar            | Resumen final: qué cambió y por qué   |

Se generan sobre todo en **modo planificación**, viven en un panel lateral propio y están disponibles tanto en el IDE como en el CLI. Que estén fuera de la conversación no es un detalle de UI: significa que **no se los lleva por delante una compactación de contexto**. En [cómo gestiona el contexto cada agente](/posts/contexto-claude-codex-antigravity) contaba que lo que quieres conservar no debe vivir en el historial. Los artefactos son exactamente eso, resuelto en el producto.

## El plan es el artefacto que importa

Cuando lanzas una tarea no trivial, Antigravity con Opus 4.6 (thinking) produce primero un plan en markdown: qué archivos va a tocar, en qué orden, qué decisiones toma y qué se deja fuera.

Y aquí está el gesto que hay que aprender: **puedes dar feedback inline sobre ese plan antes de que se ejecute nada**. Comentas un paso, corriges una suposición, tachas algo que no quieres, y el agente rehace el plan.

La aritmética es brutalmente favorable:

- Corregir una frase en un plan: **treinta segundos**.
- Corregir el código que salió de esa frase mal entendida: **veinte minutos**, y probablemente con el agente defendiendo su enfoque anterior.

Un plan típico y sus puntos de intervención:

```markdown
## Plan: migrar el formulario de contacto a validación en servidor

1. Añadir `zod` como dependencia. ← ¿ya no tenemos validación?
2. Crear `src/lib/schemas/contact.ts` con el schema.
3. Convertir `contact.astro` a página con `output: "server"`. ← esto cambia el deploy entero
4. Añadir endpoint `POST /api/contact`.
5. Reemplazar la validación de cliente por la de servidor. ← no: quiero las dos
6. Añadir tests del schema.
```

Los tres comentarios de la derecha son treinta segundos de lectura. El paso 3, sin corregir, te convierte un sitio estático en uno con SSR y descubres el problema en el deploy. Con corrección, el agente propone un endpoint aislado o te dice que hace falta cambiar el adaptador, y decides tú.

**Ese es el momento de máximo apalancamiento de toda la sesión.** Todo lo demás —el modelo, las reglas, las skills— sirve para llegar a un plan mejor. El plan es donde tu criterio entra al proceso.

## Cómo trabajar con el plan

Cuatro hábitos, en orden de rentabilidad:

**1. Pide plan explícitamente para cualquier cosa que toque más de tres archivos.** No esperes a que el agente decida que la tarea merece plan; su umbral y el tuyo no coinciden.

**2. Planifica con Opus, ejecuta con Sonnet.** Ya lo dije en [qué modelo usar](/posts/antigravity-claude-modelos), pero es aquí donde se aplica: cambia de modelo en el mismo mensaje en el que apruebas. El plan es un artefacto persistente, así que no pierdes nada al cambiar.

**3. Busca lo que _no_ está en el plan.** El fallo típico de un plan generado no es un paso incorrecto, es un paso ausente: la migración de datos, el estado de carga, el caso de error, el texto en el otro idioma. Lee el plan preguntándote qué falta, no si lo escrito es correcto.

**4. Si el plan tiene más de diez pasos, la tarea es demasiado grande.** Pártela. Un plan de veinticinco pasos es un plan que el agente va a ejecutar a medias y tú vas a revisar peor.

## La lista de tareas, durante

Mientras ejecuta, el plan se convierte en una lista de tareas con estado. Suena menor y no lo es: te dice **dónde está** sin que tengas que leer la conversación.

El uso real es la interrupción. Ves que la tarea 4 de 9 tomó el camino equivocado, paras ahí, corriges y sigue desde la 4. Sin lista, la alternativa es dejar que termine las nueve y revisar el resultado completo, que es como se pierden las tardes.

## El walkthrough, después

Al terminar, el agente produce un **walkthrough**: un resumen estructurado de qué cambió, con los resultados de verificación y capturas si hubo trabajo visual. No es el diff; es el enunciado del diff.

Dos usos que valen mucho:

- **El cuerpo del PR ya está escrito.** Un walkthrough decente es mejor descripción de pull request que la que escribe la mayoría de la gente a las siete de la tarde.
- **Es el registro de por qué.** Dentro de tres semanas, cuando alguien pregunte por qué ese componente hace lo que hace, el walkthrough tiene la respuesta y el diff no.

Guárdalos. Un walkthrough es la mejor memoria episódica gratis que vas a tener, en el sentido exacto que discutía en [contexto no es memoria](/posts/memoria-vs-contexto).

## El fallo que hay que vigilar

Los artefactos son **una afirmación del agente sobre su propio trabajo**. Un walkthrough que dice "verificado, todos los tests pasan" no es una prueba de que los tests pasan. Es texto que un modelo generó después de intentar que pasaran.

Es el mismo problema de siempre, con mejor presentación. La solución no es leer el walkthrough con más desconfianza, es **exigir evidencia que no salga del modelo**: la salida real del comando, la captura del navegador, el vídeo de la interacción.

Y esa es, precisamente, la mejor función del subagente de navegador. Es el [siguiente artículo](/posts/antigravity-browser-subagente): cómo conseguir que el agente demuestre que su cambio funciona en vez de decírtelo.

---

Parte de la serie [Antigravity con Claude](/posts/antigravity-claude). Si tu equipo revisa diffs de agente a ciegas y quieres montar un flujo de revisión por plan, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
