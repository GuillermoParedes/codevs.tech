---
title: "Caveman, Gentle AI y el ecosistema que rellena los huecos"
author: Codevs
pubDatetime: 2026-08-11T09:40:00Z
slug: herramientas-memoria-ia
featured: false
draft: false
tags:
  - Contexto
  - IA
  - Claude Code
  - Config
description: "Qué resuelve de verdad cada herramienta de contexto y memoria para agentes: Caveman comprime, Engram persiste y mem0 es otro problema distinto."
series: "Contexto y memoria en agentes de código"
seriesOrder: 6
---

Busca "memoria para agentes de IA" y te salen cuarenta proyectos que dicen lo mismo. La mayoría hace una de tres cosas muy diferentes entre sí, y confundirlas es la razón por la que la gente instala tres herramientas para terminar resolviendo un problema que tenía una.

Este artículo es la clasificación. Para cada categoría: qué problema ataca, cuál es el representante claro, y —la parte que ningún README trae— **qué no resuelve**.

## Table of contents

## Las tres categorías

| Categoría                  | El problema                               | Representante      |
| -------------------------- | ----------------------------------------- | ------------------ |
| Compresión                 | Los tokens son caros                      | Caveman            |
| Persistencia entre agentes | Cambias de herramienta y empiezas de cero | Gentle AI / Engram |
| Memoria para tu producto   | Tu app necesita recordar a sus usuarios   | mem0, Letta, Zep   |

La tercera es la que más ruido mete en las búsquedas y la que menos tiene que ver con tu editor. Empecemos por las dos que sí.

## Caveman: menos tokens, mismo contenido

**Qué es.** Una skill de Claude Code con una premisa deliciosamente literal — _why use many token when few token do trick_ — y un objetivo serio detrás: hacer que el agente responda con muchos menos tokens de salida sin perder información.

**Cómo.** Elimina relleno, cortesías, frases envolventes, sobreexplicación y estructura repetida. No comprime conocimiento: comprime prosa. Los benchmarks publicados hablan de un ahorro medio en torno al 65% de tokens de salida, con un rango amplio según el prompt (aproximadamente del 22% al 87%).

**El detalle que lo hace usable:** el código y los mensajes de error salen **byte a byte exactos**. Un compresor que "resumiera" un stack trace sería inservible; la compresión se aplica al lenguaje natural que rodea al código, no al código.

Alrededor del proyecto creció además un stack de eficiencia más amplio —visibilidad del gasto, caché, compresión y enrutado entre modelos— con la idea de aplicar las optimizaciones automáticamente y demostrar el ahorro. Esa segunda parte, la de **demostrar**, es la que más falta hace en este ecosistema.

**Qué no resuelve.** Actúa sobre la salida. Tu contexto de entrada —el `CLAUDE.md` inflado, los tres servidores MCP conectados, los archivos leídos enteros— sigue costando exactamente lo mismo. Y como el historial de la conversación incluye las respuestas del agente, un agente más conciso llena el contexto más despacio, pero eso es un efecto de segundo orden, no el mecanismo.

**Cuándo tiene sentido.** Cuando tu gasto está dominado por la salida: sesiones largas y conversacionales, agentes que narran mucho, equipos con factura visible. Si tu problema es que el agente pierde el hilo, esto no es lo tuyo.

Y una advertencia de calibración: hay contextos en los que quieres que el agente sea explícito. Un informe para alguien que no siguió la sesión necesita frases completas. Comprimir por defecto en todas partes es una decisión, no una mejora automática.

## Gentle AI y Engram: memoria que sobrevive al cambio de herramienta

**Qué es.** Gentle AI es un **configurador de ecosistema**, y conviene subrayar lo que explícitamente _no_ es: no instala agentes. Adapta los que ya tienes en la máquina —Claude Code, Codex, Cursor, Gemini CLI, OpenCode, Copilot, Antigravity— y les añade una capa común: memoria persistente, desarrollo dirigido por especificación, skills curadas, servidores MCP y enrutado de modelos.

**La pieza que importa aquí es Engram**, su memoria persistente: guarda decisiones, hallazgos y arreglos entre sesiones, de forma automática, y —esta es la parte interesante— **todos esos agentes leen y escriben en la misma memoria**.

Ese es el hueco real que llena. Tu `CLAUDE.md` no lo lee Codex. Tu `AGENTS.md` no lo lee Cursor. Cada herramienta trae su formato y su ubicación, así que cambiar de agente —o simplemente usar dos— significa mantener el mismo conocimiento por duplicado o empezar de cero. Una capa compartida convierte la memoria en propiedad del proyecto en lugar de propiedad del editor.

**Qué no resuelve.** La memoria persistente no es gratis: lo que se recupera **entra en tu contexto**. Una memoria que crece sin curaduría es un `CLAUDE.md` inflado con pasos extra. Todo lo del [artículo anterior](/posts/memoria-vs-contexto) sobre qué no guardar aplica igual, o más, cuando el guardado es automático.

Y la parte que ninguna herramienta puede hacer por ti: **decidir qué merece recordarse**. Un sistema que captura todo lo que pasó en la sesión captura sobre todo ruido. La calidad de la memoria es una función de la curaduría, y la curaduría es criterio humano.

**Cuándo tiene sentido.** Cuando de verdad usas más de un agente, o cuando el equipo no está estandarizado en uno. Si son cinco personas todas con Claude Code, la memoria nativa más un directorio de notas en el repositorio cubre el caso con menos piezas móviles.

## La tercera categoría: memoria para tu producto

Aquí caben mem0, Letta (heredera de MemGPT), Zep, supermemory, cognee y compañía. Aparecen en las mismas búsquedas y resuelven **otro problema**.

Son capas de memoria para aplicaciones que tú construyes: extraen hechos de las conversaciones de tus usuarios, los almacenan —normalmente con búsqueda vectorial o un grafo—, y los recuperan cuando son relevantes. El caso de uso es "mi asistente de soporte tiene que recordar que este cliente ya reportó este bug en marzo", no "mi editor tiene que recordar mis convenciones".

**La distinción práctica**: si estás escribiendo código que llama a la API de un modelo, esta categoría es candidata. Si estás configurando un CLI que escribe código por ti, casi nunca lo es.

Meterlas en un flujo de trabajo de agente de código es posible, pero estás montando infraestructura de recuperación —embeddings, un almacén, una política de relevancia— para un problema que un directorio de archivos markdown resuelve igual de bien y sin latencia. Empieza por los archivos. Sube a una capa de recuperación cuando tengas una razón medida, no anticipada.

## Cómo elegir

La pregunta correcta no es "¿qué herramienta de memoria uso?" sino **"¿qué me está fallando exactamente?"**:

| Síntoma                                      | Categoría                                 |
| -------------------------------------------- | ----------------------------------------- |
| La factura es más alta de lo que esperabas   | Compresión + auditoría de contexto        |
| El agente se explaya y llena la ventana      | Compresión                                |
| Cambias de agente y empiezas de cero         | Persistencia entre agentes                |
| El agente repropone lo que descartaron       | **Nada de esto** — es context engineering |
| Tu producto necesita recordar a sus usuarios | Memoria para aplicaciones                 |
| No sabes en qué se te va el contexto         | **Nada de esto** — empieza midiendo       |

Fíjate en las dos filas que no llevan herramienta. Son, con diferencia, los dos síntomas más comunes. La secuencia sana es: **mide, arregla lo que ya tienes, y solo entonces añade una pieza** — con una métrica que diga si sirvió.

Instalar una capa de memoria sobre una configuración que nunca se auditó produce lo mismo que antes, más una dependencia.

## Lo que ninguna herramienta te va a dar

Tres límites que conviene tener claros antes de instalar nada:

**Ninguna sabe qué es importante en tu proyecto.** Pueden capturar, comprimir y recuperar. La decisión de qué merece sobrevivir sigue siendo tuya.

**Ninguna arregla un `CLAUDE.md` mal escrito.** Si tus instrucciones son ambiguas, contradictorias o describen procedimientos donde deberían describir hechos, la persistencia se limita a hacer permanente el problema.

**Ninguna sustituye a medir.** Sin `/context`, sin conteo de tokens y sin mirar los campos de uso de caché, no puedes saber si una herramienta mejoró algo. Y sin eso, elegir herramientas es fe.

## Lo siguiente

Queda la parte que convierte todo esto en algo que puedes defender ante quien paga la factura: **montarlo en orden y medir el resultado**. Eso es el [último artículo de la serie](/posts/stack-contexto-memoria) — la receta por fases y los números concretos que la validan.

---

Parte de la serie [Contexto y memoria en agentes de código](/posts/contexto-memoria-agentes). Si quieres ayuda para decidir qué de esto necesita tu equipo de verdad, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
