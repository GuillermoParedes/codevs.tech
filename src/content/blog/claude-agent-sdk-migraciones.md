---
title: "Agent SDK: migraciones masivas de frontend"
author: Codevs
pubDatetime: 2026-08-04T10:00:00Z
slug: claude-agent-sdk-migraciones
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - TypeScript
  - Frontend
description: "Migra cientos de componentes combinando codemods deterministas con el Agent SDK de Claude, dejando al modelo solo el 20 % que exige criterio real."
series: "Claude Code para frontend engineers"
seriesOrder: 8
---

## Table of contents

## El trabajo que rompe el chat

Migrar 240 componentes de una librería de estilos a otra. Sustituir una API de formularios en todo el repositorio. Actualizar una versión mayor que cambia la firma de la mitad de los hooks.

Estas tareas se atascan en una conversación por dos motivos. El primero es obvio: la ventana de contexto. El segundo es más sutil y más caro — **son repetitivas hasta que dejan de serlo**. Los primeros treinta archivos son mecánicos, y de pronto aparece uno que usa una característica que la librería nueva no tiene y hay que decidir algo. Un bucle en un chat no distingue entre esos dos casos: trata los 240 igual, a precio de razonamiento y con la misma probabilidad de deriva.

La solución no es un prompt mejor. Es **cambiar quién controla el bucle**.

## Repartir el trabajo antes de escribir nada

La regla que hace viable una migración grande:

> Todo lo que se puede decidir con un `if` no es trabajo para un modelo.

Una migración típica de frontend se descompone así:

| Parte                                                           | Proporción | Quién la hace              |
| --------------------------------------------------------------- | ---------- | -------------------------- |
| Renombrar imports, props, cambiar firmas de una a una           | ~60 %      | Codemod (AST)              |
| Reescribir estilos con equivalencia directa                     | ~20 %      | Codemod con tabla de mapeo |
| Casos sin equivalente, lógica condicional, decisiones de diseño | ~20 %      | Agente                     |

Ese último 20 % es el que justifica todo esto. También es el que un codemod puro deja como `// TODO: revisar manualmente` en 47 archivos que nadie revisa nunca.

Empieza siempre por el codemod. `jscodeshift` o `ts-morph` hacen el 80 % en segundos, son deterministas, se testean y se revierten. El agente entra después, sobre lo que quedó.

## Lo que hace un codemod y por qué no basta

Con `ts-morph`, sustituir un import es trivial:

```typescript
import { Project } from "ts-morph";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });

for (const file of project.getSourceFiles("src/**/*.tsx")) {
  const decl = file.getImportDeclaration("styled-components");
  if (!decl) continue;

  decl.setModuleSpecifier("@emotion/styled");
  file.saveSync();
}
```

Lo que ese enfoque no puede resolver es cualquier cosa que exija criterio: qué clase de Tailwind corresponde a un bloque de CSS con media queries anidadas y selectores de descendiente, si una interpolación dinámica se convierte en variante o en estilo en línea, o si dos componentes que quedaron casi idénticos deberían fusionarse.

Ahí no hay regla. Hay decisiones.

## El bucle que sí escala

El patrón es siempre el mismo, y es lo contrario de "dale la carpeta y que se apañe":

```text
1. Descubrimiento  → código determinista lista los archivos afectados
2. Transformación  → una invocación de agente POR ARCHIVO, aislada
3. Verificación    → tipos y tests, otra vez código determinista
4. Informe         → qué pasó, qué falló, qué necesita un humano
```

Cada archivo arranca con contexto limpio. Un archivo que sale mal no contamina los otros 239. Y como el bucle está en tu código, puedes reintentar, paralelizar, saltar, o parar con lo que llevas.

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

interface Resultado {
  archivo: string;
  estado: "ok" | "fallo" | "revisar";
  nota: string;
  costeUsd: number;
}

async function migrar(archivo: string): Promise<Resultado> {
  const antes = readFileSync(archivo, "utf8");
  let texto = "";
  let coste = 0;

  const prompt = `Migra ${archivo} de styled-components a Tailwind.

Reglas:
- Usa exclusivamente los tokens de tailwind.config.cjs. Si un valor no tiene
  token equivalente, NO inventes uno: deja el estilo original comentado y
  añade "REVISAR: sin token para <valor>".
- Conserva el comportamiento exacto, incluidos estados hover, focus y disabled.
- No renombres el componente ni cambies su API pública.
- No toques otros archivos.

Cuando termines, resume en una línea qué quedó pendiente, o "sin pendientes".`;

  for await (const mensaje of query({
    prompt,
    options: {
      allowedTools: ["Read", "Edit", "Grep"],
      maxTurns: 12,
    },
  })) {
    if (mensaje.type === "result") {
      texto = "result" in mensaje ? String(mensaje.result) : "";
      coste = mensaje.total_cost_usd ?? 0;
    }
  }

  // Verificación determinista: la decide el compilador, no el modelo.
  try {
    execSync(`npx tsc --noEmit`, { stdio: "pipe" });
  } catch {
    writeFileSync(archivo, antes); // revertir y marcar
    return {
      archivo,
      estado: "fallo",
      nota: "rompe los tipos",
      costeUsd: coste,
    };
  }

  const estado = texto.includes("REVISAR") ? "revisar" : "ok";
  return { archivo, estado, nota: texto.slice(0, 120), costeUsd: coste };
}
```

Los detalles que importan de ese fragmento:

**`allowedTools` es una lista corta.** El agente puede leer, editar y buscar. No puede ejecutar comandos ni escribir archivos nuevos. Un agente de migración con `Bash` acabará "arreglando" el `package.json`.

**El veredicto lo da `tsc`, no el modelo.** Nunca preguntes al agente si su cambio funciona. Compílalo. Si falla, revierte ese archivo y sigue: un fallo aislado no debe parar una tanda de 240.

**"No inventes un token"** es la instrucción más valiosa del prompt. Sin ella, un agente competente rellena el hueco con un valor plausible y tú descubres un `#1e293b` suelto tres semanas después. Con ella, el hueco queda marcado y contable.

**El coste se acumula por archivo.** `total_cost_usd` viene en el mensaje de resultado. Si las primeras diez migraciones salen a más de lo que esperabas, lo sabes en la iteración diez y no en la doscientos.

## El orquestador: por lotes y con freno de mano

```typescript
const trocear = <T>(xs: T[], n: number): T[][] =>
  xs.length ? [xs.slice(0, n), ...trocear(xs.slice(n), n)] : [];

const archivos = execSync(
  "rg -l 'from \"styled-components\"' src --glob '*.tsx'"
)
  .toString()
  .trim()
  .split("\n");

const resultados: Resultado[] = [];
let gastado = 0;
const PRESUPUESTO_USD = 25;

for (const lote of trocear(archivos, 5)) {
  if (gastado > PRESUPUESTO_USD) {
    console.warn(
      `Presupuesto agotado. Migrados ${resultados.length}/${archivos.length}.`
    );
    break;
  }

  const tanda = await Promise.all(lote.map(migrar));
  resultados.push(...tanda);
  gastado += tanda.reduce((s, r) => s + r.costeUsd, 0);

  console.log(
    `${resultados.length}/${archivos.length} · $${gastado.toFixed(2)}`
  );
}

console.table({
  ok: resultados.filter(r => r.estado === "ok").length,
  revisar: resultados.filter(r => r.estado === "revisar").length,
  fallo: resultados.filter(r => r.estado === "fallo").length,
});
```

Tres decisiones deliberadas:

- **Lotes pequeños** en vez de los 240 de golpe. Ves los primeros resultados en un minuto y puedes abortar si el prompt está mal calibrado.
- **Un presupuesto explícito.** Una migración que se dispara de coste debe parar sola, no avisarte cuando ya ha terminado.
- **Tres estados, no dos.** `revisar` no es un fallo: es trabajo identificado para un humano. Salir con 190 `ok`, 38 `revisar` y 12 `fallo` es un resultado excelente. El error es pretender 240 `ok` y no mirar de cerca.

## Prueba con diez antes de lanzar 240

El error caro es lanzar la migración completa a la primera. El orden que funciona:

1. **Diez archivos elegidos a mano**, incluyendo dos difíciles a propósito.
2. **Lee los diez diffs enteros.** No la muestra: los diez.
3. **Ajusta el prompt** con lo que aprendiste. Casi siempre son restricciones que faltaban, no falta de detalle.
4. **Cincuenta archivos.** Revisa el resumen y una muestra.
5. **El resto**, con el presupuesto puesto.

El paso 3 es donde está el aprendizaje real. Los prompts de migración fallan casi siempre por lo mismo: no dijiste explícitamente qué **no** debe hacer el agente. "Conserva el comportamiento exacto" y "no toques otros archivos" valen más que tres párrafos describiendo el estilo objetivo.

## Cuándo esto no compensa

Sé honesto con el cálculo. Montar el bucle, calibrar el prompt y revisar los resultados cuesta un día de trabajo. Merece la pena si:

- Son **más de ~50 archivos**. Por debajo, hazlo en sesiones normales de Claude Code con los [subagentes](/posts/claude-code-subagentes) que ya tienes.
- El patrón es **repetible pero no mecánico**. Si es totalmente mecánico, un codemod solo es más barato, más rápido y no tiene varianza.
- Hay **verificación automática**. Sin tipos ni tests, no tienes forma de saber si funcionó, y estarás revisando 240 diffs a mano — que era justo lo que querías evitar.

Si tu proyecto no tiene esa red de seguridad, el trabajo previo no es la migración: es la verificación. Es lo mismo que pasa con las migraciones de base de datos, donde el esquema y las migraciones versionadas son lo que te permite avanzar sin miedo — el enfoque que describo en [Dominando Prisma](/posts/prisma-workflow) se aplica igual aquí.

## El cierre de la serie

Los siete artículos apuntan al mismo sitio. Cada mecanismo es una respuesta a una pregunta distinta:

- **¿Qué debe saber siempre?** → [CLAUDE.md](/posts/claude-md-frontend)
- **¿Qué debe pasar siempre?** → [Hooks](/posts/claude-code-hooks)
- **¿Qué procedimiento repites?** → [Skills](/posts/claude-code-skills)
- **¿Qué genera ruido que no volverás a leer?** → [Subagentes](/posts/claude-code-subagentes)
- **¿Qué necesita verse o medirse?** → [MCP](/posts/claude-code-mcp-visual)
- **¿Qué debe valer para todo el equipo?** → [CI](/posts/claude-code-github-actions)
- **¿Qué es demasiado grande para una conversación?** → el Agent SDK

Ninguna es "usa la IA para programar". Todas son decisiones de infraestructura, versionadas en el repositorio, que sobreviven a la sesión en la que se tomaron.

---

Último artículo de [Claude Code para frontend engineers](/posts/claude-code-frontend). ¿Tienes una migración grande parada porque nadie quiere empezarla? Es exactamente el tipo de encargo que me gusta: [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
