---
title: "Subagentes de Claude Code: revisión en paralelo"
author: Codevs
pubDatetime: 2026-08-04T09:30:00Z
slug: claude-code-subagentes
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - React
description: "Crea subagentes de accesibilidad, performance e i18n con contexto aislado para revisar tu frontend en paralelo, y aprende cuándo no delegar nada."
series: "Claude Code para frontend engineers"
seriesOrder: 5
---

## Table of contents

## El recurso escaso no es el modelo, es el contexto

Cuando pides "revisa este componente en profundidad", pasa algo predecible: Claude lee ocho archivos, ejecuta el build, saca la salida de ESLint, mira el bundle. Al terminar, tu conversación contiene 6.000 líneas de material que ya no vas a volver a mirar — y todo eso sigue ocupando sitio en el resto de la sesión.

Un subagente resuelve exactamente eso. Trabaja en **su propia ventana de contexto**, con su propio prompt de sistema y su propio conjunto de herramientas, y a tu conversación solo vuelve el resumen. La exploración se queda fuera.

Hay tres beneficios más, y en frontend los tres importan:

- **Restringir herramientas.** Un revisor puede ser estrictamente de lectura. No puede "arreglarlo mientras lo mira".
- **Especializar el criterio.** Un prompt centrado en accesibilidad encuentra cosas que un prompt genérico pasa por alto.
- **Controlar el coste.** Puedes enrutar tareas mecánicas a un modelo más barato.

## Los que ya tienes

Antes de escribir ninguno, conviene saber que Claude Code trae varios de serie y los usa solo:

| Subagente         | Herramientas                             | Cuándo lo usa                                  |
| ----------------- | ---------------------------------------- | ---------------------------------------------- |
| `Explore`         | Solo lectura; `Write` y `Edit` denegados | Buscar y entender código sin tocarlo           |
| `Plan`            | Solo lectura                             | Investigar el repositorio durante el modo plan |
| `general-purpose` | Todas las disponibles para subagentes    | Tareas complejas que exploran **y** modifican  |

Un matiz que ahorra sorpresas: `Explore` y `Plan` **se saltan tus archivos `CLAUDE.md`** para que la investigación sea rápida y barata. El resto de subagentes, incluidos los tuyos, sí los cargan. Si te preguntas por qué una exploración ignoró una convención del proyecto, esa es la razón.

## Escribir el tuyo

Un subagente es un markdown con frontmatter, en `.claude/agents/` (proyecto) o `~/.claude/agents/` (tú, en todos los proyectos):

```markdown
---
name: a11y-reviewer
description: Revisa componentes de interfaz buscando problemas de accesibilidad: roles ARIA, nombres accesibles, orden de foco, contraste y navegación por teclado. Úsalo antes de cerrar cualquier componente interactivo.
tools: Read, Grep, Glob
model: sonnet
---

Eres un especialista en accesibilidad web revisando componentes de frontend.

Para cada archivo que revises, comprueba en este orden:

1. **Semántica**: ¿hay un `<div>` o `<span>` haciendo de botón, enlace o
   control de formulario? Es el hallazgo más frecuente y el más caro.
2. **Nombre accesible**: todo control necesita texto visible, `aria-label` o
   `aria-labelledby`. Un icono suelto sin etiqueta es un fallo.
3. **Foco**: orden de tabulación lógico, foco visible, y foco atrapado dentro
   de diálogos modales mientras están abiertos.
4. **Estado**: `aria-expanded`, `aria-selected`, `aria-current` donde
   corresponda. Un acordeón sin `aria-expanded` es invisible para un lector.
5. **Movimiento**: animaciones que no respetan `prefers-reduced-motion`.

Para cada hallazgo devuelve: archivo y línea, criterio WCAG concreto, por qué
falla para un usuario real, y el código corregido.

No informes de preferencias de estilo. Solo de lo que afecta a alguien que
navega con teclado o con lector de pantalla.
```

Fíjate en dos decisiones del frontmatter:

- **`tools: Read, Grep, Glob`** — solo lectura. Este agente no puede "arreglar" nada, y eso es deliberado: un revisor que edita te deja sin la revisión.
- **`model: sonnet`** — una auditoría con checklist no necesita el modelo más caro. La especialización viene del prompt, no de la potencia bruta.

## El patrón que de verdad rinde: revisión por dimensiones

Aquí está la idea central del artículo. Una revisión frontend seria no es una tarea, son varias **independientes entre sí**: accesibilidad, rendimiento, internacionalización, consistencia con el sistema de diseño. Cada una necesita un criterio distinto y ninguna depende del resultado de las otras.

Eso es exactamente lo que se puede abanicar en paralelo. Tres subagentes:

```markdown
---
name: perf-reviewer
description: Revisa el impacto en rendimiento de cambios de frontend: hidratación innecesaria, imágenes sin optimizar, dependencias pesadas, re-renders evitables y bloqueo del hilo principal.
tools: Read, Grep, Glob, Bash
model: sonnet
---

Eres un ingeniero de rendimiento web revisando un diff de frontend.

Prioriza por impacto real en Core Web Vitals, no por elegancia teórica:

1. **LCP**: imágenes sin dimensiones ni `loading`, fuentes desde dominios
   externos en la ruta crítica, CSS que bloquea el render.
2. **CLS**: contenedores sin altura reservada, contenido inyectado por encima
   del pliegue, fuentes que provocan salto de layout.
3. **INP**: manejadores caros en el hilo principal, listas largas sin
   virtualizar, animaciones sobre propiedades que fuerzan layout.
4. **Peso**: dependencias nuevas — di cuánto pesan; importaciones completas de
   librerías que permiten importación selectiva.
5. **Hidratación**: componentes marcados como interactivos que no tienen ni
   estado ni eventos.

Cuantifica siempre que puedas. "Esto añade 43 KB" convence; "esto es pesado" no.
```

```markdown
---
name: i18n-reviewer
description: Detecta texto hardcodeado, formatos de fecha y número dependientes del locale, y supuestos de dirección de texto en componentes de interfaz.
tools: Read, Grep, Glob
model: haiku
---

Buscas contenido que se rompe fuera del idioma y la región de desarrollo:

1. Cadenas literales visibles en JSX o plantillas, fuera del sistema de i18n.
2. Fechas, monedas y números formateados a mano en lugar de con `Intl`.
3. Concatenación de cadenas para construir frases: no sobrevive a la traducción.
4. Anchos fijos en elementos con texto: el alemán ocupa más, y bastante más.
5. Supuestos de dirección izquierda-a-derecha en márgenes y posiciones.

Sé literal y exhaustivo. Este trabajo es de rastreo, no de opinión.
```

El de i18n va a `haiku`: es una tarea de reconocimiento de patrones, no de juicio. Ese enrutado es una de las formas más directas de bajar el coste sin perder nada.

Con los tres definidos, la petición es simplemente:

```text
Revisa el diff contra main con los agentes a11y-reviewer, perf-reviewer
e i18n-reviewer en paralelo, y dame los hallazgos agrupados por severidad.
```

Los tres corren a la vez, cada uno en su contexto, y tu conversación recibe tres informes en vez de tres exploraciones completas.

## Cuándo NO usar un subagente

Esta sección es la que falta en casi todo lo que se escribe sobre el tema, y es la que separa una configuración útil de una que quema dinero.

Un subagente no es gratis. Arranca de cero, tiene que reconstruir el contexto que tú ya tienes, explora, informa, y luego tú lees su informe. Ese sobrecoste solo se paga si la tarea es lo bastante grande.

**No delegues:**

- Lo que resolverías en tres o cuatro llamadas a herramientas. Leer dos archivos y cambiar una línea se hace directamente.
- Trabajo secuencial donde cada paso depende del anterior. El paralelismo no aporta nada y sí añade coordinación.
- Tareas que necesitan el contexto de tu conversación. El subagente no lo tiene, y explicárselo cuesta más que hacerlo.

**Sí delega:**

- Investigación amplia sobre muchos archivos donde solo te importa la conclusión.
- Revisiones por dimensiones independientes, como la de arriba.
- Cualquier cosa que genere mucha salida que no volverás a consultar: logs, resultados de tests, salida del build.

La regla corta: **delega cuando quieras la conclusión pero no el material**.

## Detalles que se pagan caros si no los sabes

**La memoria automática de tu conversación no llega al subagente.** Lo que Claude aprendió de tus correcciones en el hilo principal no viaja con él. Si el subagente necesita saber algo, va en su prompt de sistema o en el mensaje con el que lo invocas.

**Los subagentes personalizados sí cargan tus `CLAUDE.md`.** Solo `Explore` y `Plan` se los saltan. Tus convenciones de proyecto llegan al `a11y-reviewer` sin que hagas nada.

**El nombre es el interruptor.** Un subagente de proyecto llamado `Explore` sobrescribe al integrado. Es útil a propósito — puedes definir uno con `model: haiku` para que la exploración salga más barata —, pero sorprende si ocurre sin querer.

**Restringir herramientas es diseño, no paranoia.** Un revisor con `Edit` acabará editando. La restricción es lo que garantiza que recibes un informe en lugar de un diff.

## Lo siguiente

Los subagentes reparten el trabajo, pero todos comparten una limitación: solo ven **texto**. Leen tu JSX y razonan sobre él, pero no ven la interfaz renderizada. En frontend eso es media película.

El [siguiente artículo](/posts/claude-code-mcp-visual) cierra ese hueco con MCP: darle a Claude un navegador de verdad para que mire la pantalla y mida en lugar de suponer.

Y si el diff que quieres revisar viene de varias instancias del mismo producto con estilos distintos, el escenario de [builds personalizados en Angular](/posts/guide-angular-custom-builds) es un buen banco de pruebas para el revisor de consistencia visual.

---

Parte de la serie [Claude Code para frontend engineers](/posts/claude-code-frontend). Si quieres un pipeline de revisión así montado sobre tu repositorio, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
