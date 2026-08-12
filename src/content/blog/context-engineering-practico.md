---
title: "Context engineering: qué entra en la ventana y qué no"
author: Codevs
pubDatetime: 2026-08-11T09:30:00Z
slug: context-engineering-practico
featured: false
draft: false
tags:
  - Contexto
  - IA
  - Claude Code
  - Config
description: "Progressive disclosure, subagentes, poda frente a resumen y el costo real de MCP: las decisiones que hacen un agente barato y preciso."
series: "Contexto y memoria en agentes de código"
seriesOrder: 5
---

Context engineering es un nombre pomposo para una disciplina sencilla: **decidir deliberadamente qué información ve el modelo en cada momento**, en lugar de dejar que la ventana se llene por acumulación.

La prueba de si lo estás haciendo es directa. Ejecuta `/context` en una sesión que lleve una hora. Si más de la mitad de lo que hay dentro no lo pusiste tú a propósito, no estás haciendo context engineering: estás mirando cómo se llena un balde.

## Table of contents

## El principio: todo empieza cargado, casi nada debería estarlo

La configuración por defecto de cualquier agente carga todo lo que puede por si acaso: todas las herramientas, todo el `CLAUDE.md`, todos los servidores MCP conectados. Es un comportamiento razonable para empezar y terrible para trabajar.

La alternativa se llama **progressive disclosure** y consiste en que en el contexto viva solo el índice y el contenido se cargue cuando haga falta:

| Recurso              | Lo que está siempre        | Lo que se carga bajo demanda           |
| -------------------- | -------------------------- | -------------------------------------- |
| Skill                | Su descripción (una línea) | El cuerpo entero                       |
| Nota de memoria      | El índice                  | El archivo                             |
| Subagente            | Nada                       | Su exploración, que ni siquiera vuelve |
| Herramienta diferida | Su nombre                  | Su esquema                             |

La consecuencia práctica es liberadora: **puedes documentar mucho más de lo que crees, siempre que lo pongas en la capa correcta**. Un checklist de accesibilidad de 300 líneas en una skill no te cuesta prácticamente nada hasta el día que se usa. Ese mismo checklist en `CLAUDE.md` lo pagas en cada turno de cada sesión durante meses.

## Las cinco decisiones que más rinden

### 1. `CLAUDE.md`: hechos, no procedimientos

Es lo que más gente infla. Se carga completo, siempre.

Van dentro: dónde vive el código, qué convenciones son innegociables, qué comandos son los reales, qué cosas ya sabemos y no hay que redescubrir. Fuera: cualquier procedimiento de varios pasos (eso es una skill), cualquier cosa que el agente pueda leer del repositorio, y cualquier lección de una sesión concreta.

La prueba: **si una sección describe un proceso en lugar de un hecho, está en el archivo equivocado**.

### 2. MCP: cada servidor conectado es un impuesto fijo

Aquí está el error más caro y el menos visible. Lo que cuesta un servidor MCP no son sus llamadas: son **las descripciones de todas sus herramientas, presentes en cada petición**, las uses o no.

Tres servidores razonablemente ricos pueden llevarse más contexto que toda tu conversación. Y a diferencia de la salida de un build, esto no se puede podar: es parte del prefijo.

Dos remedios reales:

- **Desconecta lo que no estás usando hoy.** Un servidor de base de datos conectado durante una sesión de CSS es puro gasto.
- **Usa carga diferida de herramientas** donde esté disponible: las definiciones se marcan como diferidas y solo entran en contexto cuando se buscan. Tiene además una propiedad valiosa — **añade** esquemas en lugar de sustituirlos, así que no invalida la caché de prompt como haría cambiar el conjunto de herramientas a mitad de sesión.

### 3. Subagentes: delega cuando quieres la conclusión, no el material

La regla corta ya la escribí en [el artículo de subagentes](/posts/claude-code-subagentes) y sigue siendo la mejor formulación que conozco: **delega cuando quieras la conclusión pero no el material**.

Una investigación amplia sobre veinte archivos genera decenas de miles de tokens de exploración de los que solo te interesa el párrafo final. Si la haces en tu hilo, cargas con los veinte archivos. Si la delegas, te llevas solo el párrafo.

Y el contrapeso, que importa igual: un subagente **no es gratis**. Arranca sin tu contexto, tiene que reconstruirlo y luego tienes que leer su informe. Para dos archivos y un cambio de una línea, ese sobrecosto no se paga. Delegar por sistema es tan mal diseño como no delegar nunca.

### 4. Podar antes que resumir

Dos operaciones distintas que la gente trata como una:

- **Podar** (edición de contexto): borrar resultados de herramientas antiguos o bloques de razonamiento. Lo eliminado desaparece; el resto queda intacto.
- **Resumir** (compactación): sustituir el historial por una versión condensada. Todo sobrevive, degradado.

El orden correcto es podar primero. La salida del build de hace cuarenta minutos no necesita resumirse: necesita desaparecer. Resumir contenido que solo había que tirar es pagar dos veces —una por tenerlo, otra por comprimirlo— y de paso diluye lo que sí importaba.

En la API son estrategias explícitas: limpiar resultados de herramientas antiguos, limpiar bloques de razonamiento, o compactar. En un CLI, la versión manual es igual de válida: `/clear` cuando cambias de tarea es la poda más eficaz que existe, y está infrautilizada porque parece destructiva. No lo es, si lo que había que conservar está escrito en un archivo.

### 5. No te rompas la caché sin darte cuenta

La caché de prompt es una coincidencia de prefijo exacta, y el prompt se renderiza en el orden `herramientas → sistema → mensajes`. Cualquier byte que cambie invalida todo lo posterior.

Los invalidadores silenciosos que se ven una y otra vez:

- Una fecha u hora generada dinámicamente en el prompt de sistema. Invalida **todo**, en **cada** petición.
- Un identificador de sesión o de usuario interpolado arriba.
- Un `JSON.stringify` sin orden estable de claves, o un `Set` iterado.
- Un conjunto de herramientas que varía según el usuario: las herramientas van en la posición cero.
- Secciones condicionales del prompt de sistema: cada combinación de flags es un prefijo distinto.

La regla de diseño que los evita todos: **lo estable arriba, lo volátil abajo**. El contexto dinámico va en los mensajes, no en el prompt de sistema — un dato inyectado en el turno cinco no invalida nada anterior al turno cinco.

Y la verificación, que cuesta una línea: si `cache_read_input_tokens` sale cero en peticiones repetidas con el mismo prefijo, tienes un invalidador. Búscalo antes de optimizar cualquier otra cosa.

## Un flujo de sesión que funciona

Traducido a comportamiento diario, con Claude Code como ejemplo:

**Al empezar.** `/context` para ver de dónde partes. Desconecta los servidores MCP que no vayas a usar. Si `CLAUDE.md` supera las 200 líneas, mira qué se convirtió en procedimiento y muévelo a una skill.

**Mientras trabajas.** Delega las exploraciones amplias. Después de una tanda de builds o tests fallidos, considera que ya has extraído lo que necesitabas de esa salida. Y cuando cambies de tarea —de verdad, no de subtarea—, `/clear`.

**Antes de que compacte.** Este es el hábito de mayor retorno de toda la serie: **pide explícitamente que escriba las decisiones y su porqué en un archivo antes de compactar**. Cinco segundos. Es la diferencia entre perder el razonamiento y conservarlo.

**Al terminar.** Si aprendiste algo duradero y no derivable del código, escríbelo. Si no, no escribas nada: una memoria de más es peor que ninguna.

## Lo que no arregla el context engineering

Por honestidad, tres límites:

- **No sustituye a saber lo que quieres.** Un contexto impecable con una petición ambigua produce trabajo impecablemente equivocado.
- **No compensa un repositorio ilegible.** Si hacen falta ocho archivos para entender una función, el agente los va a leer. El arreglo es el código.
- **No es gratis en tiempo.** Configurar esto bien toma un rato. En un proyecto de dos semanas, probablemente no compensa. En uno de dos años y cinco personas, se paga solo en la primera semana.

## Lo siguiente

Todo lo anterior se hace con lo que las herramientas ya traen. Alrededor creció un ecosistema que promete resolver los huecos que quedan: comprimir la salida, persistir memoria entre agentes distintos, dar visibilidad al gasto.

El [siguiente artículo](/posts/herramientas-memoria-ia) mira Caveman, Gentle AI y la capa de memoria para aplicaciones, y dice de cada uno qué problema resuelve de verdad y cuál no.

---

Parte de la serie [Contexto y memoria en agentes de código](/posts/contexto-memoria-agentes). Si quieres una auditoría de contexto sobre tu repositorio y tu configuración, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
