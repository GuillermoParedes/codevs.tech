---
title: "Contexto no es memoria: los cuatro tipos que importan"
author: Codevs
pubDatetime: 2026-08-11T09:20:00Z
slug: memoria-vs-contexto
featured: false
draft: false
tags:
  - Contexto
  - IA
  - Claude Code
  - Config
description: "Memoria de trabajo, episódica, semántica y procedimental en agentes de código: qué cubre cada mecanismo real y qué no deberías guardar nunca."
series: "Contexto y memoria en agentes de código"
seriesOrder: 4
---

"Que se acuerde de mis convenciones" y "que recuerde lo que hicimos ayer" suenan a la misma petición. No lo son. La primera se resuelve con un archivo de texto de veinte líneas; la segunda es un problema de diseño con varias respuestas posibles, ninguna gratis.

La forma más rápida de dejar de pelearse con esto es separar los tipos de memoria y preguntarse, para cada uno, **qué mecanismo real lo cubre en la herramienta que usas**.

## Table of contents

## Los cuatro tipos

La taxonomía viene de la psicología cognitiva y encaja incómodamente bien con lo que hacen los agentes.

**Memoria de trabajo.** Lo que tienes delante ahora mismo. En un agente es literalmente la ventana de contexto: el archivo abierto, el error que acabas de pegar, los últimos diez turnos. Dura lo que dura la sesión y es la única que el modelo "ve" sin hacer nada.

**Memoria episódica.** Lo que pasó, con su cuándo. "El martes rompimos el build tocando el adaptador de Prisma y lo arreglamos revirtiendo la migración." Es la más difícil de mantener y la que se pierde entera en cada compactación.

**Memoria semántica.** Hechos que son verdad independientemente de cuándo se aprendieron. "Los componentes viven en `src/components`." "La paginación es de 5 posts." No tiene fecha, no tiene narrativa. Es la más barata de guardar y la que más rinde.

**Memoria procedimental.** Cómo se hacen las cosas aquí. "Para publicar un artículo: frontmatter con `pubDatetime` en ISO, `lint`, `format:check`, `build`." Son secuencias, no hechos.

La correspondencia con lo que ya tienes instalado:

| Tipo          | Dónde vive de verdad                       | Costo en contexto      |
| ------------- | ------------------------------------------ | ---------------------- |
| Trabajo       | La ventana                                 | Todo, cada turno       |
| Episódica     | El historial (y se pierde al compactar)    | Alto y creciente       |
| Semántica     | `CLAUDE.md`, `AGENTS.md`, notas de memoria | Fijo, se paga siempre  |
| Procedimental | Skills, comandos, hooks                    | Casi cero hasta usarse |

Esa última columna es la que decide la arquitectura. **Los hechos van a un archivo que se carga siempre; los procedimientos van a algo que se carga bajo demanda.** Meter un checklist de 300 líneas en `CLAUDE.md` es pagar 300 líneas en cada turno para usarlas una vez por semana.

## Lo que ya tienes sin instalar nada

**`CLAUDE.md` / `AGENTS.md` — memoria semántica.** Se carga completa al arrancar. Es memoria en el sentido de que sobrevive a las sesiones, y es contexto en el sentido de que la pagas en cada turno. Esa doble naturaleza es la razón de la única regla que importa aquí: **hechos sí, procedimientos no**. Si una sección dejó de describir cómo es el proyecto y pasó a describir un proceso de varios pasos, ya no pertenece a este archivo.

**Skills y comandos — memoria procedimental.** Solo su descripción vive en el contexto; el cuerpo se carga cuando se activa. Esto es _progressive disclosure_, y es lo que hace que puedas tener veinte procedimientos documentados sin pagar por diecinueve de ellos.

**Archivos de memoria del proyecto — memoria semántica con curaduría.** Un directorio de notas cortas, una por hecho, con un índice. Se consultan cuando hacen falta en lugar de cargarse enteras. El patrón se volvió estándar precisamente porque separa el índice (barato, siempre presente) del contenido (caro, bajo demanda).

## La herramienta de memoria de la API

Cuando construyes tu propio agente sobre la API en vez de usar un CLI, hay una herramienta de memoria dedicada. Su diseño es instructivo porque es deliberadamente simple:

```typescript
tools: [{ type: "memory_20250818", name: "memory" }];
```

Es una herramienta **de cliente**: Anthropic define el contrato —los comandos `view`, `create`, `str_replace`, `insert`, `delete`, `rename` sobre un directorio `/memories`— y **tú implementas el almacenamiento**. Puede ser el sistema de archivos, S3, una tabla de Postgres o lo que quieras.

Que sea tuyo tiene una consecuencia que la gente descubre tarde: **el control de acceso también es tuyo**. Las implementaciones de referencia no traen ninguno. En un sistema multiusuario necesitas directorios por usuario y autenticación en tus manejadores, o el agente del usuario A leerá las notas del usuario B.

Y una regla sin excepciones: **nunca guardes credenciales en memoria**. Una nota persiste y se reinyecta literalmente en cada sesión futura que monte ese almacén. Una clave escrita una vez se reproduce indefinidamente. Lo mismo aplica, con más matices legales, a datos personales.

Para agentes gestionados existe además una versión con almacenes versionados: cada modificación genera una versión inmutable, hay comprobación de concurrencia por hash de contenido y se pueden redactar versiones antiguas para borrar un secreto filtrado sin destruir el rastro de auditoría. Es la diferencia entre "un archivo de notas" y "memoria que puedes gobernar".

## Contexto, poda, resumen, memoria: cuál usar

Cuatro mecanismos que la gente mezcla. La pregunta que los separa es **cuánto tiempo tiene que sobrevivir el dato**:

| Necesitas                          | Mecanismo                  |
| ---------------------------------- | -------------------------- |
| Que dure este turno                | Contexto, sin más          |
| Tirar salida de herramientas vieja | Edición de contexto (poda) |
| Que la sesión siga cuando se llena | Compactación (resumen)     |
| Que sobreviva a la sesión          | Memoria                    |

La confusión típica es usar compactación donde hacía falta memoria. Compactar es un mecanismo de supervivencia: mantiene la sesión viva a cambio de degradar lo que sabía. Si el dato importa mañana, la compactación **no** es el lugar donde debe estar.

## La parte difícil: qué NO guardar

Escribir memoria es fácil. El fallo real, y el que hace que la memoria termine estorbando, es guardar de más. Cuatro categorías que no deberían acabar nunca en una nota:

**Lo que el repositorio ya cuenta.** La estructura de carpetas, qué hace una función, qué se arregló en el commit de ayer. El agente puede leerlo, y una nota sobre ello se desincroniza en la primera refactorización. Guardas una mentira con fecha.

**Lo que solo importaba en esa conversación.** "El usuario quería la barra en azul" no es un hecho del proyecto.

**Rutas, flags y versiones concretas.** Es lo primero que se pudre. Guarda la arquitectura y el flujo de trabajo, no el número de versión.

**Lecciones de una sola sesión.** Un tropiezo puntual convertido en regla permanente hace que las siguientes veinte sesiones esquiven un bache que no existe. Antes de escribir una regla: ¿habría ayudado esto en la mayoría de sesiones, o solo en la que la escribió?

Lo que sí merece una nota: **lo que solo tú sabes y no es derivable del código**. Por qué se eligió un enfoque, qué se probó y falló, qué restricción externa condiciona el diseño, cómo trabaja tu equipo. Ahí la memoria no compite con el repositorio — lo complementa.

Y una nota bien escrita lleva **el porqué**, no solo la regla. "No uses `useEffect` para derivar estado" es una orden que el agente obedecerá sin criterio. "No uses `useEffect` para derivar estado: causó tres bugs de doble render en el checkout; deriva en el render" es una regla que sabe cuándo aplicarse y cuándo no.

## Un formato que aguanta

Poco misterio, y funciona:

- **Un hecho por archivo.** Los archivos multitema no se actualizan, se acumulan.
- **Un resumen de una línea arriba.** Es lo que decide si vale la pena leer el resto.
- **El porqué junto a la regla.**
- **Actualiza en vez de duplicar.** Dos notas que se contradicen son peor que ninguna.
- **Borra lo que resulte falso.** La memoria equivocada es activamente dañina; la ausente solo es una oportunidad perdida.

## Lo siguiente

Ya está la teoría completa: qué es el contexto, cómo lo gestiona cada agente y qué pertenece a la memoria. Sigue la parte operativa — las decisiones concretas que se toman al configurar un proyecto y que separan un agente barato y preciso de uno caro y disperso.

Eso es [context engineering práctico](/posts/context-engineering-practico), el siguiente artículo.

---

Parte de la serie [Contexto y memoria en agentes de código](/posts/contexto-memoria-agentes). Si quieres una revisión de qué está guardando tu configuración y qué debería, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
