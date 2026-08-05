---
title: "Hooks de Claude Code: el linter que se ejecuta solo"
author: Codevs
pubDatetime: 2026-08-04T09:10:00Z
slug: claude-code-hooks
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - Config
description: "Configura hooks en Claude Code para formatear, lintar y bloquear ediciones peligrosas de forma determinista, sin depender de que el modelo obedezca."
series: "Claude Code para frontend engineers"
seriesOrder: 3
---

## Table of contents

## El problema que los hooks resuelven

En el [artículo anterior](/posts/claude-md-frontend) terminamos con una frase incómoda: el `CLAUDE.md` es contexto, no un candado. Puedes escribir "pasa siempre Prettier después de editar" y funcionará el 90 % de las veces. El 10 % restante es un diff sucio en tu PR.

Los hooks son la otra mitad. Son comandos que Claude Code ejecuta en momentos fijos del ciclo de vida, **independientemente de lo que el modelo decida**. No se negocian, no se olvidan al compactar el contexto y no dependen de cómo redactaste la instrucción.

La división de trabajo queda así:

| Necesitas…                                                      | Herramienta |
| --------------------------------------------------------------- | ----------- |
| Que Claude entienda tus convenciones y las aplique con criterio | `CLAUDE.md` |
| Que algo pase **siempre**, sin excepción                        | Hook        |
| Un procedimiento largo que solo hace falta a veces              | Skill       |

## Anatomía de un hook

Los hooks viven en los archivos de settings, con tres niveles de anidamiento: evento → matcher → handlers.

| Archivo                       | Alcance              | ¿Se comparte?          |
| ----------------------------- | -------------------- | ---------------------- |
| `~/.claude/settings.json`     | Todos tus proyectos  | No                     |
| `.claude/settings.json`       | El proyecto          | Sí, va a git           |
| `.claude/settings.local.json` | El proyecto, solo tú | No, va al `.gitignore` |

La estructura mínima:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/format.sh",
            "statusMessage": "Formateando..."
          }
        ]
      }
    ]
  }
}
```

Los eventos que más rinden en frontend son cuatro:

- **`PreToolUse`** — antes de que la herramienta se ejecute. Puede **bloquear**.
- **`PostToolUse`** — después de que la herramienta haya tenido éxito. No bloquea, pero puede devolver información a Claude.
- **`UserPromptSubmit`** — antes de que Claude procese tu mensaje. Sirve para inyectar contexto fresco.
- **`Stop`** — cuando Claude termina de responder. El sitio natural de la verificación final.

El `matcher` filtra por nombre de herramienta. Si solo contiene letras, números, guiones y `|`, se interpreta como lista exacta (`Edit|Write`); cualquier otro carácter lo convierte en expresión regular (`mcp__.*`).

## Hook 1: formatear lo que se acaba de tocar

El clásico, y el que más ruido quita de los diffs. La gracia está en formatear **solo el archivo editado**, no el proyecto entero.

El hook recibe un JSON por `stdin` con, entre otras cosas, `tool_name`, `tool_input` y `cwd`. Para `Edit` y `Write`, la ruta está en `tool_input.file_path`:

```bash
#!/usr/bin/env bash
# .claude/hooks/format.sh
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[[ -z "$file" ]] && exit 0

case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.astro|*.css|*.md)
    npx prettier --write "$file" >/dev/null 2>&1 || true
    ;;
esac

exit 0
```

Detalle que se pasa por alto: `PostToolUse` **no bloquea**, así que si el formateador falla no rompes la sesión. Por eso el `|| true`. Un hook de formato que aborta el turno porque Prettier no encontró su config es peor que no tener hook.

## Hook 2: devolver los errores de tipos a Claude

Este es el que cambia de verdad la experiencia. Cuando Claude edita un `.tsx`, quieres que **él** se entere de que rompió los tipos, no enterarte tú diez minutos después.

Un `PostToolUse` que sale con código distinto de 0 muestra `stderr` en la transcripción, y Claude lo lee. Es un bucle de realimentación gratis:

```bash
#!/usr/bin/env bash
# .claude/hooks/typecheck.sh
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[[ "$file" != *.ts && "$file" != *.tsx && "$file" != *.astro ]] && exit 0

if ! output=$(npx tsc --noEmit 2>&1); then
  echo "Errores de tipos tras editar $file:" >&2
  echo "$output" | head -20 >&2
  exit 1
fi
```

Nota el `exit 1`, no `exit 2`. En `PostToolUse` el código 2 tampoco bloquea nada (la herramienta ya se ejecutó), pero cualquier salida distinta de cero muestra `stderr`. Con proyectos grandes, cambia `tsc --noEmit` por algo incremental o el hook se convertirá en una espera de quince segundos por cada edición.

## Hook 3: bloquear de verdad, con PreToolUse

Aquí es donde los hooks dejan de ser conveniencia y pasan a ser una barrera. `PreToolUse` es de los eventos que **sí** bloquean: sal con código 2 y la llamada a la herramienta no se ejecuta; `stderr` se le entrega a Claude como motivo.

```bash
#!/usr/bin/env bash
# .claude/hooks/protect-paths.sh
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')

case "$file" in
  */dist/*|*/.astro/*|*/node_modules/*|*package-lock.json)
    echo "Ruta generada: $file. Edita el origen, no la salida del build." >&2
    exit 2
    ;;
esac

exit 0
```

Con el registro correspondiente:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/protect-paths.sh"
          }
        ]
      }
    ]
  }
}
```

Si prefieres un control más fino, en lugar de salir con 2 puedes salir con 0 e imprimir JSON en `stdout`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Los archivos de dist/ se generan, no se editan."
  }
}
```

`permissionDecision` acepta `allow`, `deny`, `ask` y `defer`. El modo `ask` es el punto medio interesante: no prohíbes, obligas a que te pregunten.

## Hook 4: la puerta de salida

El evento `Stop` se dispara cuando Claude termina de responder, y también bloquea: código 2 le impide detenerse y lo obliga a seguir trabajando. Es el sitio para la comprobación que de verdad define "terminado" en tu proyecto.

En este blog, "terminado" significa que `astro check` pasa:

```bash
#!/usr/bin/env bash
# .claude/hooks/gate.sh
set -uo pipefail

if ! output=$(npm run build 2>&1); then
  echo "El build falla. Aún no has terminado:" >&2
  echo "$output" | tail -30 >&2
  exit 2
fi
```

Úsalo con cabeza. Un `Stop` que lanza el build completo en cada turno convierte una sesión ágil en una espera continua. Dos alternativas mejores según el caso:

- `"async": true` en el handler, para que corra en segundo plano sin bloquear.
- Devolver contexto en vez de bloquear, con `hookSpecificOutput.additionalContext`, que informa a Claude sin cortarle el turno.

## Filtrar por comando con `if`

Para el `Bash` genérico, el `matcher` se queda corto: te interesa distinguir `git status` de `git push`. Para eso está el campo `if`, con sintaxis de reglas de permisos:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(git push *)",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/confirm-push.sh"
          }
        ]
      }
    ]
  }
}
```

Es más robusto de lo que parece: las asignaciones de variables al principio se descartan antes de comparar, y los subcomandos también se revisan, así que `npm test && git push` también encaja con `Bash(git push *)`.

## Errores que vas a cometer

**Olvidar que `stdin` es JSON.** El hook no recibe argumentos con la ruta del archivo; recibe un objeto por la entrada estándar. Sin `jq` (o equivalente) no vas a ninguna parte.

**Poner rutas relativas en `command`.** El directorio de trabajo puede no ser el que crees. Usa siempre `${CLAUDE_PROJECT_DIR}`, que además se exporta como variable de entorno a los procesos hijos.

**Confundir los códigos de salida.** Solo el 2 bloquea, y solo en los eventos que aceptan bloqueo. Cualquier otro código distinto de cero es un error no bloqueante: se muestra `stderr` y la acción continúa.

**Hacer hooks lentos.** El timeout por defecto es generoso (600 segundos), pero cada segundo de hook es un segundo que estás esperando. Filtra por extensión al principio del script y sal pronto.

Para depurar, `/hooks` dentro de una sesión lista todos los hooks configurados, sus matchers y de qué archivo salen. Es lo primero que hay que mirar cuando algo "no se ejecuta".

## Dónde encaja esto

Los hooks son la capa determinista: lo que no puede fallar. Encima va la capa de criterio, que son las skills — procedimientos que Claude carga cuando hacen falta y no antes. Es [el siguiente artículo](/posts/claude-code-skills).

Y si vienes del mundo de los contenedores, la analogía es directa: los hooks son a Claude Code lo que un `entrypoint` bien escrito es a una imagen de Docker. Si te interesa esa comparación, el artículo sobre [Docker para desarrolladores frontend](/posts/docker-frontends-dev) cubre el otro lado del entorno reproducible.

---

Parte de la serie [Claude Code para frontend engineers](/posts/claude-code-frontend). ¿Quieres montar esta capa de automatización en el repositorio de tu equipo sin romper el flujo de nadie? [Escríbeme](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
