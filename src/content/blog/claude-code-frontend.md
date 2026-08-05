---
title: "Claude Code para frontend engineers: la serie"
author: Codevs
pubDatetime: 2026-08-04T10:10:00Z
modDatetime: 2026-08-05T09:00:00Z
slug: claude-code-frontend
featured: true
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - Config
description: "Guía de Claude para frontend engineers: memoria, hooks, skills, subagentes, MCP, CI y Agent SDK aplicados a un proyecto frontend real, en siete artículos."
series: "Claude Code para frontend engineers"
seriesOrder: 1
---

Usar **Claude para frontend engineers** no consiste en pedirle componentes en un chat. Consiste en configurarlo: siete mecanismos —`CLAUDE.md`, hooks, skills, subagentes, MCP, CI y el Agent SDK— que viven en tu repositorio, se revisan en un PR y aplican tus convenciones de frontend aunque tú no estés delante. Esta serie los recorre uno a uno, con ejemplos sobre proyectos React, Next.js y Angular reales.

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

**→ [Cómo escribir un CLAUDE.md para un proyecto frontend](/posts/claude-md-frontend)**

## 2. Hooks: el linter que se ejecuta solo

Donde el `CLAUDE.md` termina, empiezan los hooks. Son comandos que se ejecutan en puntos fijos del ciclo de vida, independientemente de lo que el modelo decida.

Cuatro que valen para cualquier frontend: formatear el archivo recién editado, devolverle a Claude los errores de tipos que acaba de introducir, bloquear ediciones sobre rutas generadas, y una puerta de salida que impide dar por terminado un turno con el build roto. Con la mecánica real: JSON por `stdin`, códigos de salida y qué eventos bloquean de verdad.

**→ [Hooks de Claude Code para automatizar formato, tipos y build](/posts/claude-code-hooks)**

## 3. Skills: empaqueta tu criterio, no tu código

Cuando pegas el mismo bloque de instrucciones por tercera vez, eso es una skill. La diferencia técnica con el `CLAUDE.md` es que el cuerpo de una skill **solo se carga cuando se usa**: un checklist de accesibilidad de 300 líneas no cuesta contexto hasta el día que hace falta.

El artículo entra en lo que casi todo el mundo hace mal: la `description`, que es lo único que está siempre en contexto y lo único que decide si la skill llega a activarse.

**→ [Crear skills de Claude Code que sí se activan](/posts/claude-code-skills)**

## 4. Subagentes: revisión frontend en paralelo

Una revisión seria no es una tarea, son varias independientes: accesibilidad, rendimiento, internacionalización, consistencia visual. Cada una con su criterio, ninguna dependiente de las otras. Eso se abanica en paralelo, y cada subagente trabaja en su propia ventana de contexto.

Incluye tres subagentes listos para copiar, el enrutado de tareas mecánicas a modelos más baratos, y una sección que suele faltar: cuándo **no** delegar nada.

**→ [Subagentes para revisar accesibilidad y rendimiento en paralelo](/posts/claude-code-subagentes)**

## 5. MCP: darle ojos a Claude Code

Un agente que escribe CSS y no ve el resultado está adivinando. Conectando Playwright o Chrome DevTools por MCP, el bucle se cierra: captura, compara con el diseño, corrige, repite.

Es la ventaja estructural del frontend sobre otros dominios — se puede verificar píxel a píxel — y también la vía para dejar de discutir el rendimiento con intuiciones y empezar a leer LCP y CLS medidos con la CPU ralentizada.

**→ [MCP con Playwright: verificación visual del CSS que escribe Claude](/posts/claude-code-mcp-visual)**

## 6. Claude en CI: el PR que se revisa solo

Todo lo anterior vive en la máquina de quien lo configuró. CI es donde el criterio se vuelve del equipo: revisión automática de PRs con `claude-code-action`, invocar en un workflow la misma skill que usas en local, y presupuestos duros de bundle en modo headless con salida estructurada.

Con la parte que decide si esto sobrevive tres meses: control de coste, permisos mínimos y qué **no** debe poder hacer un agente en tu pipeline.

**→ [Claude Code en GitHub Actions: revisión de PR y presupuestos de bundle](/posts/claude-code-github-actions)**

## 7. Agent SDK: migraciones masivas

Doscientos cuarenta componentes de una librería de estilos a otra. Ese trabajo rompe una conversación, y no por falta de contexto: porque es repetitivo hasta que deja de serlo.

La salida es cambiar quién controla el bucle. El codemod hace el 80 % determinista, el agente entra archivo a archivo sobre el 20 % que exige criterio, y la verificación la firma el compilador — nunca el modelo.

**→ [Agent SDK: migrar cientos de componentes sin romper la build](/posts/claude-agent-sdk-migraciones)**

## Por dónde empezar si solo vas a hacer una cosa

Empieza por el `CLAUDE.md`, y hazlo con este ejercicio concreto: abre el último PR de tu equipo que necesitó tres rondas de review y convierte cada comentario en una línea verificable. No "cuida la accesibilidad", sino "todo control interactivo necesita nombre accesible; los `<div onClick>` se rechazan en review".

Es media hora de trabajo y es lo que hace que el resto de la serie tenga sobre qué apoyarse.

## Preguntas frecuentes

**¿Qué es Claude Code y en qué se diferencia de usar Claude en el navegador?**
Claude Code es el agente de Anthropic que corre en tu terminal, con acceso a tus archivos, tu git y tus comandos. La diferencia que importa para un frontend engineer no es que "escriba código": es que se configura por repositorio y esa configuración se versiona. En el navegador vuelves a explicar tus convenciones cada sesión; en el repositorio están escritas una vez.

**¿Sirve para Angular, Vue o Svelte, o solo para React?**
Ninguno de los siete mecanismos es específico de un framework. Los ejemplos usan React y Next.js porque es lo más extendido, pero un hook que ejecuta Prettier, un subagente de accesibilidad o un presupuesto de bundle en CI funcionan igual sobre Angular o Svelte. Lo que cambia son los comandos, no la estructura.

**¿Por dónde empieza alguien que nunca lo ha configurado?**
Por el `CLAUDE.md`, y solo por eso. Los hooks sin convenciones escritas automatizan un criterio que todavía no existe. Media hora convirtiendo comentarios de code review en reglas verificables rinde más que las otras seis piezas juntas.

**¿Cuánto cuesta tener esto montado en un equipo?**
La configuración local no cuesta nada más allá de tu suscripción. Lo que sí conviene presupuestar es CI: cada PR revisado consume tokens. En [Claude Code en GitHub Actions](/posts/claude-code-github-actions) está el detalle de cómo acotar ese gasto con permisos mínimos y disparadores selectivos.

## Si vienes del stack clásico

Buena parte de lo que hay aquí es la misma idea que ya aplicas en otros sitios: entornos reproducibles y automatización que no depende de que alguien se acuerde. Si te interesa esa continuidad, [Docker para desarrolladores frontend](/posts/docker-frontends-dev) cubre el lado del entorno, y [las rutas en Next.js 15](/posts/nextjs-15-routes) es un buen ejemplo de convención de proyecto que merece estar escrita en tu `CLAUDE.md` en lugar de repetirse en cada sesión.

---

¿Quieres montar esta configuración en el repositorio de tu equipo — reglas, hooks, revisión automática y presupuestos de rendimiento — sin romper el flujo de trabajo de nadie? Es justo el tipo de encargo que hago: [escríbeme](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
