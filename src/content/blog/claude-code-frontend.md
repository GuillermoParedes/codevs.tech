---
title: "Claude Code para frontend engineers: la serie"
author: Codevs
pubDatetime: 2026-08-04T10:10:00Z
slug: claude-code-frontend
featured: true
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - Config
description: "Siete formas de usar Claude Code en un proyecto frontend que no son pedirle un componente: memoria, hooks, skills, subagentes, MCP, CI y Agent SDK."
series: "Claude Code para frontend engineers"
seriesOrder: 1
---

## Table of contents

## Lo que esta serie no es

No vas a encontrar aquí "pídele a Claude que te haga una landing en React". Eso funciona, lo sabe todo el mundo y se agota en una tarde.

Lo que casi nadie cuenta es la otra mitad: **Claude Code es un runtime configurable, y esa configuración se versiona en tu repositorio**. Hooks que se ejecutan en momentos fijos, skills que empaquetan procedimientos, subagentes con su propio contexto, servidores MCP que le dan acceso a un navegador de verdad. Nada de eso vive en un chat — vive en archivos que revisas en un PR como cualquier otro código.

Esta serie recorre esos siete mecanismos desde la perspectiva de alguien que escribe interfaces: componentes, sistemas de diseño, Core Web Vitals, accesibilidad, bundles.

## El mapa

Cada mecanismo responde a una pregunta distinta. Si no tienes claro cuál usar, la pregunta es el atajo:

| Pregunta                                        | Mecanismo                     |
| ----------------------------------------------- | ----------------------------- |
| ¿Qué debe saber **siempre**?                    | `CLAUDE.md` y reglas por ruta |
| ¿Qué debe pasar **siempre**, obedezca o no?     | Hooks                         |
| ¿Qué procedimiento repites cada tanto?          | Skills                        |
| ¿Qué genera ruido que no volverás a leer?       | Subagentes                    |
| ¿Qué hay que **ver** o **medir**?               | Servidores MCP                |
| ¿Qué debe valer para todo el equipo?            | CI                            |
| ¿Qué es demasiado grande para una conversación? | Agent SDK                     |

## 1. CLAUDE.md: convierte tu sistema de diseño en un contrato

El archivo de memoria del proyecto no es un README. Es la lista de decisiones que un desarrollador nuevo no puede adivinar leyendo el código: qué tokens usar, qué directiva de hidratación es la de por defecto, qué librería descartasteis y por qué.

Cubre dónde se carga cada archivo, por qué las instrucciones concretas ganan a las genéricas, cómo partir las reglas por ruta con `.claude/rules/` para que las convenciones de componentes no contaminen el trabajo de API, y el límite honesto del mecanismo: esto es contexto, no un candado.

**→ [Leer el artículo](/posts/claude-md-frontend)**

## 2. Hooks: el linter que se ejecuta solo

Donde el `CLAUDE.md` termina, empiezan los hooks. Son comandos que se ejecutan en puntos fijos del ciclo de vida, independientemente de lo que el modelo decida.

Cuatro que valen para cualquier frontend: formatear el archivo recién editado, devolverle a Claude los errores de tipos que acaba de introducir, bloquear ediciones sobre rutas generadas, y una puerta de salida que impide dar por terminado un turno con el build roto. Con la mecánica real: JSON por `stdin`, códigos de salida y qué eventos bloquean de verdad.

**→ [Leer el artículo](/posts/claude-code-hooks)**

## 3. Skills: empaqueta tu criterio, no tu código

Cuando pegas el mismo bloque de instrucciones por tercera vez, eso es una skill. La diferencia técnica con el `CLAUDE.md` es que el cuerpo de una skill **solo se carga cuando se usa**: un checklist de accesibilidad de 300 líneas no cuesta contexto hasta el día que hace falta.

El artículo entra en lo que casi todo el mundo hace mal: la `description`, que es lo único que está siempre en contexto y lo único que decide si la skill llega a activarse.

**→ [Leer el artículo](/posts/claude-code-skills)**

## 4. Subagentes: revisión frontend en paralelo

Una revisión seria no es una tarea, son varias independientes: accesibilidad, rendimiento, internacionalización, consistencia visual. Cada una con su criterio, ninguna dependiente de las otras. Eso se abanica en paralelo, y cada subagente trabaja en su propia ventana de contexto.

Incluye tres subagentes listos para copiar, el enrutado de tareas mecánicas a modelos más baratos, y una sección que suele faltar: cuándo **no** delegar nada.

**→ [Leer el artículo](/posts/claude-code-subagentes)**

## 5. MCP: darle ojos a Claude Code

Un agente que escribe CSS y no ve el resultado está adivinando. Conectando Playwright o Chrome DevTools por MCP, el bucle se cierra: captura, compara con el diseño, corrige, repite.

Es la ventaja estructural del frontend sobre otros dominios — se puede verificar píxel a píxel — y también la vía para dejar de discutir el rendimiento con intuiciones y empezar a leer LCP y CLS medidos con la CPU ralentizada.

**→ [Leer el artículo](/posts/claude-code-mcp-visual)**

## 6. Claude en CI: el PR que se revisa solo

Todo lo anterior vive en la máquina de quien lo configuró. CI es donde el criterio se vuelve del equipo: revisión automática de PRs con `claude-code-action`, invocar en un workflow la misma skill que usas en local, y presupuestos duros de bundle en modo headless con salida estructurada.

Con la parte que decide si esto sobrevive tres meses: control de coste, permisos mínimos y qué **no** debe poder hacer un agente en tu pipeline.

**→ [Leer el artículo](/posts/claude-code-github-actions)**

## 7. Agent SDK: migraciones masivas

Doscientos cuarenta componentes de una librería de estilos a otra. Ese trabajo rompe una conversación, y no por falta de contexto: porque es repetitivo hasta que deja de serlo.

La salida es cambiar quién controla el bucle. El codemod hace el 80 % determinista, el agente entra archivo a archivo sobre el 20 % que exige criterio, y la verificación la firma el compilador — nunca el modelo.

**→ [Leer el artículo](/posts/claude-agent-sdk-migraciones)**

## Por dónde empezar si solo vas a hacer una cosa

Empieza por el `CLAUDE.md`, y hazlo con este ejercicio concreto: abre el último PR de tu equipo que necesitó tres rondas de review y convierte cada comentario en una línea verificable. No "cuida la accesibilidad", sino "todo control interactivo necesita nombre accesible; los `<div onClick>` se rechazan en review".

Es media hora de trabajo y es lo que hace que el resto de la serie tenga sobre qué apoyarse.

## Si vienes del stack clásico

Buena parte de lo que hay aquí es la misma idea que ya aplicas en otros sitios: entornos reproducibles y automatización que no depende de que alguien se acuerde. Si te interesa esa continuidad, [Docker para desarrolladores frontend](/posts/docker-frontends-dev) cubre el lado del entorno, y [las rutas en Next.js 15](/posts/nextjs-15-routes) es un buen ejemplo de convención de proyecto que merece estar escrita en tu `CLAUDE.md` en lugar de repetirse en cada sesión.

---

¿Quieres montar esta configuración en el repositorio de tu equipo — reglas, hooks, revisión automática y presupuestos de rendimiento — sin romper el flujo de trabajo de nadie? Es justo el tipo de encargo que hago: [escríbeme](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
