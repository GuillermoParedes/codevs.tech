---
title: "MCP en frontend: darle ojos a Claude Code"
author: Codevs
pubDatetime: 2026-08-04T09:40:00Z
slug: claude-code-mcp-visual
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - React
description: "Conecta Playwright y Chrome DevTools por MCP para que Claude Code vea la pantalla, mida Core Web Vitals reales y verifique su propio CSS sin adivinar."
series: "Claude Code para frontend engineers"
seriesOrder: 6
---

## Table of contents

## La asimetría del frontend

Un agente que escribe una función de backend puede comprobar su trabajo: ejecuta el test, lee el resultado, corrige. El bucle se cierra.

Un agente que escribe CSS no. Escribe `justify-content: space-between`, no ve nada, y te dice que ya está. Tú abres el navegador y el botón está descolocado. El bucle lo cierras tú, a mano, en cada iteración.

Eso no es una limitación del modelo: es que le falta un sentido. Y es también, dicho al revés, la mayor oportunidad del frontend con agentes. **Es el único dominio donde el trabajo se puede verificar píxel a píxel de forma automática.** Si el agente puede tomar una captura y compararla con el diseño, deja de adivinar.

MCP —Model Context Protocol— es el mecanismo estándar para conectarle esas herramientas externas.

## Cómo se configura un servidor MCP

Tres alcances, según quién deba tenerlo:

| Alcance   | Dónde vive                         | Para qué                                              |
| --------- | ---------------------------------- | ----------------------------------------------------- |
| `local`   | Config de usuario, por proyecto    | Pruebas tuyas, servidores con credenciales personales |
| `project` | `.mcp.json` en la raíz, versionado | Lo que todo el equipo debe tener                      |
| `user`    | Config de usuario, global          | Servidores que usas en todos tus proyectos            |

Lo normal para un equipo es un `.mcp.json` en la raíz del repositorio:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

También puedes añadirlos desde el terminal con `claude mcp add`, y comprobar el estado de las conexiones con `/mcp` dentro de una sesión. Ese comando es lo primero que hay que mirar cuando "las herramientas no aparecen": un servidor que no arrancó no da error visible, simplemente no expone nada.

Las herramientas que aporta un servidor siguen el patrón `mcp__<servidor>__<herramienta>`. Es un detalle práctico, porque es como las referencias en reglas de permisos y en los matchers de [hooks](/posts/claude-code-hooks) — por ejemplo `mcp__playwright__.*` para todas las de Playwright.

## Bucle 1: implementar contra una captura

El flujo que cambia el resultado no es "genera el componente". Es este:

```text
1. Levanta el dev server.
2. Navega a /components/pricing-card.
3. Toma una captura en 1440px y en 375px.
4. Compáralas con design/pricing-card.png: mira espaciado, tamaños de
   tipografía, alineación y estados hover.
5. Corrige el CSS y repite hasta que las diferencias sean irrelevantes.
6. Enséñame la captura final y la lista de lo que ajustaste.
```

La instrucción que hace el trabajo es el paso 5: **repite**. Sin ella, el agente toma una captura, comenta lo que ve y se detiene. Con ella, itera. He visto pasar de tres o cuatro rondas de "no, el padding sigue mal" a una sola revisión final.

Un truco que ayuda mucho: pídele que verifique **estados**, no solo la vista por defecto. Hover, foco, `disabled`, texto largo que desborda, lista vacía. Son los casos donde el CSS generado falla, y son justo los que no se ven en una captura estática del diseño.

## Bucle 2: medir en vez de opinar

La segunda cosa que desbloquea un navegador conectado es dejar de discutir sobre rendimiento con intuiciones.

Un servidor MCP de Chrome DevTools expone lo que ya usas a mano: trazas de rendimiento, peticiones de red, mensajes de consola, emulación de CPU y red. Con eso, la petición pasa de vaga a concreta:

```text
Levanta la build de producción, carga la home con CPU a 4x de ralentización
y red 3G lenta, y dame:
- LCP y qué elemento lo provoca
- CLS y qué nodo desplaza el layout
- las tres peticiones que más bloquean el render

Luego propón el cambio de mayor impacto. Solo uno.
```

Ese "solo uno" importa. Sin él recibes una lista de doce optimizaciones ordenadas por lo fácil que son de escribir, no por lo que arreglan.

La diferencia con el flujo habitual es que el agente ya no razona sobre lo que **cree** que pesa: lee un número. Y cuando le pides que verifique el arreglo, vuelve a medir. Eso es el bucle cerrado.

Por poner un ejemplo de este mismo blog: las fuentes se cargan desde Google Fonts en el `<head>`, lo que mete dos conexiones externas en la ruta crítica. Es exactamente el tipo de hallazgo que sale de una medición real y no de una lectura del código.

## Bucle 3: del diseño al código, sin capturas de pantalla

Figma ofrece su propio servidor MCP orientado al modo desarrollo. En lugar de darle a Claude una imagen del diseño, le das acceso a la estructura: los nombres de los tokens, los valores de espaciado, la jerarquía de capas.

La diferencia es de fondo. Con una captura, el agente **estima** que ese hueco son 24 píxeles. Con acceso al diseño, lee que es `spacing-lg` y usa tu token. El resultado deja de ser "se parece" y pasa a ser "usa el sistema".

Consulta la documentación de Figma para la configuración exacta del servidor, porque cambia con las versiones. La idea a llevarse es la que importa: **cuanto más estructurada sea la entrada, menos margen de invención tiene la salida**.

## Errores que se cometen al empezar

**Instalar seis servidores el primer día.** Cada servidor mete todas sus herramientas en el contexto. Un `.mcp.json` con siete servidores puede añadir docenas de definiciones que se pagan en cada turno. Empieza con uno, y añade el siguiente cuando el primero te haya ahorrado algo medible.

**Olvidar que el navegador es un efecto secundario.** Un agente con Playwright puede navegar a donde quiera y rellenar formularios. Apúntalo a entornos locales o de staging, nunca a producción con sesión iniciada. Las reglas de permisos aceptan el patrón `mcp__playwright__.*` para acotarlo.

**Pedir una captura y llamarlo verificación.** Una captura sin comparación no verifica nada; solo produce una imagen que el agente describe con optimismo. Lo que verifica es el criterio: contra qué se compara y qué se considera aceptable.

**Ignorar el `/mcp`.** Un servidor que no arranca —falta un binario, el `npx` no resuelve, el puerto está ocupado— se salta en silencio. Si las herramientas no aparecen, el problema está ahí y no en tu prompt.

## Combinado con el resto de la serie

Aquí es donde las piezas empiezan a encajar entre sí:

- Un [subagente](/posts/claude-code-subagentes) de rendimiento **con** acceso al navegador ya no revisa código: mide la página y devuelve números.
- Una [skill](/posts/claude-code-skills) de "verificación visual" puede empaquetar el bucle completo — navegar, capturar los cinco viewports acordados, comparar, informar — para que cualquiera del equipo lo lance con un comando.
- Un [hook](/posts/claude-code-hooks) de `Stop` puede exigir que la captura final exista antes de dar por cerrado el turno.

Ninguna de las tres es espectacular por separado. Juntas convierten "hazme un componente" en un flujo con verificación real.

## Lo siguiente

Todo esto ocurre en tu máquina, contigo delante. El [siguiente artículo](/posts/claude-code-github-actions) lleva el mismo enfoque a integración continua: revisiones automáticas de PR y presupuestos que fallan el build, sin que nadie abra un terminal.

---

Serie completa en [Claude Code para frontend engineers](/posts/claude-code-frontend). Si quieres montar el bucle visual sobre tu design system —tokens, componentes y verificación automática—, [escríbeme](mailto:hi.codevs@gmail.com).
