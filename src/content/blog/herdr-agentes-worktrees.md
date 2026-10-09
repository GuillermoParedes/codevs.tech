---
title: "herdr con agentes de código y git worktrees"
author: Codevs
pubDatetime: 2026-10-09T17:00:00Z
slug: herdr-agentes-worktrees
featured: false
draft: false
tags:
  - Terminal
  - IA
  - Claude Code
  - Config
description: "Usa herdr con agentes de código: estados, integraciones, notificaciones, la CLI en JSON y un comando swarm que abre un agente por rama en git worktrees."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 7
---

Un agente de código pasa la mayor parte del tiempo en uno de dos estados: trabajando solo, o parado esperando que le digas algo. El problema de tener varios es que no sabes cuál está en cuál. Con tmux, la forma de enterarte es ir pane por pane mirando. Con herdr, te lo dice la barra lateral, y te avisa cuando cambia.

Este artículo es lo que hace que herdr merezca la pena frente a tmux.

## Table of contents

## Los estados de un agente

herdr reconoce más de veinte agentes —Claude Code, Codex, Gemini CLI, Antigravity CLI, Cursor, opencode, Copilot, Amp y otros— y clasifica cada uno en cinco estados:

| Estado    | Significa                                       | Qué haces                |
| --------- | ----------------------------------------------- | ------------------------ |
| `working` | Está trabajando                                 | Nada                     |
| `blocked` | Muestra una pregunta o pide aprobación          | Ir ya: te está esperando |
| `done`    | Terminó y no has mirado el resultado            | Revisar                  |
| `idle`    | Listo para recibir trabajo, ya visto            | Darle la siguiente tarea |
| `unknown` | Hay un agente, pero herdr no sabe en qué estado | Mirar                    |

La distinción entre `done` e `idle` es lo valioso: `done` significa "terminó **y aún no lo has visto**". Al enfocar el pane pasa a `idle`. Es una bandeja de entrada.

Con `agent_panel_sort = "priority"`, que configuramos en el [artículo anterior](/posts/herdr-terminal-agentes), la barra lateral ordena por urgencia: arriba los `blocked`, luego los `done`, luego los que trabajan. Y `prefix a` salta al siguiente sin importar en qué proyecto esté.

## Integraciones: estado más fiable y sesiones que vuelven

herdr detecta los agentes leyendo la pantalla. Para algunos agentes existe además una **integración oficial**: un hook que el agente ejecuta y que informa a herdr directamente.

```bash
herdr integration status
herdr integration install claude
```

La integración de Claude Code instala un hook en `~/.claude/hooks/`. Lo que aporta depende del agente: en algunos, el estado deja de depender de leer la pantalla; en Claude Code, sobre todo, aporta la **restauración de sesión**. Herdr guarda el identificador de la conversación de cada pane, y tras un reinicio del servidor o de WSL vuelve a lanzar Claude Code en esa conversación (con `resume_agents_on_restore = true`).

Esa es la diferencia práctica con tmux-resurrect: tras un `wsl --shutdown`, resurrect te devuelve una shell vacía en el directorio correcto; herdr te devuelve el agente con su conversación.

## La CLI: todo devuelve JSON

Todo lo que haces con el teclado lo puedes hacer desde la shell, y la salida es JSON:

```bash
herdr workspace list
herdr tab list --workspace "$HERDR_WORKSPACE_ID"
herdr pane list --workspace "$HERDR_WORKSPACE_ID"
herdr agent list
```

Cada pane recibe variables con su contexto: `HERDR_ENV=1`, `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID` y `HERDR_PANE_ID`. Así un script sabe dónde está corriendo.

Los comandos de agentes son los interesantes:

```bash
# abrir un pane a la derecha sin mover el foco
herdr pane split --current --direction right --cwd "$PWD" --no-focus

# arrancar un agente con nombre en ese pane
herdr agent start revisor --kind claude --pane w1:p3

# mandarle trabajo y esperar a que termine o se bloquee
herdr agent prompt revisor "Revisa el diff actual y reporta solo lo accionable." \
  --wait --timeout 300000

# leer lo que dijo
herdr agent read revisor --lines 80
```

`agent start` no vuelve hasta que el agente está listo para recibir input. `agent prompt --wait` espera a que el agente se asiente en `idle`, `done` o `blocked`. Con eso puedes orquestar agentes desde un script sin `sleep` adivinados.

En tmux lo más parecido es `send-keys` más `capture-pane` en un bucle mirando si el texto cambió: funciona, pero no sabe distinguir "terminó" de "me está preguntando algo".

herdr incluye además una skill para que los propios agentes lo controlen (`herdr --skill` la imprime). Con ella, Claude Code puede abrir un pane hermano, lanzar a otro agente y esperar su resultado.

## Worktrees: un agente, un directorio

El problema de tener varios agentes en el mismo repositorio es obvio en cuanto lo pruebas: dos agentes editando el mismo árbol de trabajo se pisan. Uno ejecuta `npm install` mientras el otro corre los tests; uno cambia de rama y el otro pierde sus cambios.

La solución es `git worktree`: varios directorios de trabajo del mismo repositorio, cada uno en su rama, compartiendo un único `.git`. Mi regla:

- **1 worktree = 1 agente.** Cada uno en su directorio, en su rama.
- **1 tab de herdr = 1 misión.**

Los worktrees viven fuera del proyecto, en `~/.worktrees/<repo>/<rama>`, el mismo directorio que configuré en `[worktrees]` de herdr, para que los que crea el propio herdr con `prefix shift+g` caigan en el mismo sitio que los míos.

### wt: gestionar worktrees

Un módulo de zsh, `40-agents.zsh`, con dos funciones. La primera:

```bash
WT_HOME="${WT_HOME:-$HOME/.worktrees}"

# raíz del repo PRINCIPAL (funciona también dentro de un worktree)
_wt_root() {
  local cdir
  cdir="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)" || return 1
  dirname "$cdir"
}

wt() {
  local cmd="$1"; shift 2>/dev/null
  local root name dir branch
  root="$(_wt_root)" || { echo "✗ no estás en un repo git"; return 1; }
  name="$(basename "$root")"

  case "$cmd" in
    new|n)
      branch="$1"; [ -z "$branch" ] && { echo "uso: wt new <rama>"; return 1; }
      dir="$WT_HOME/$name/$branch"
      if [ -d "$dir" ]; then
        echo "• ya existía, entrando…"
      elif git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
        git -C "$root" worktree add "$dir" "$branch" || return 1
      else
        git -C "$root" worktree add -b "$branch" "$dir" || return 1
      fi
      # comparte node_modules del repo principal
      if [ -d "$root/node_modules" ] && [ ! -e "$dir/node_modules" ]; then
        ln -s "$root/node_modules" "$dir/node_modules"
      fi
      cd "$dir"
      ;;
    go|g) cd "$WT_HOME/$name/$1" 2>/dev/null || echo "✗ no existe worktree '$1'" ;;
    ls|l) git -C "$root" worktree list ;;
    rm|r) git -C "$root" worktree remove "$WT_HOME/$name/$1" "${@:2}" ;;
    *)    echo "wt new|go|ls|rm <rama>" ;;
  esac
}
```

`--git-common-dir` es el truco: dentro de un worktree, `git rev-parse --show-toplevel` devuelve el worktree, no el repo principal. `--git-common-dir` apunta al `.git` compartido, y su directorio padre es el repo principal.

El symlink de `node_modules` ahorra un `npm install` de varios minutos por worktree. Tiene un coste: si una rama cambia dependencias, tiene que hacer su propio `install` (borra el enlace primero).

### swarm: un agente por rama

La segunda función une los worktrees con la CLI de herdr. `swarm login-fix perf-tune` crea una tab con un pane "líder" en el repo principal y un pane por rama, cada uno con su worktree y su agente:

```bash
AGENT_CMD="${AGENT_CMD:-claude}"

swarm() {
  setopt local_options no_monitor
  local root name b dir out lead pane prev agent
  local kind="${AGENT_CMD:t}"
  root="$(_wt_root)" || { echo "✗ no estás en un repo git"; return 1; }
  name="$(basename "$root")"
  [ "${HERDR_ENV:-}" = 1 ] || { echo "✗ ejecuta esto DENTRO de herdr"; return 1; }
  [ -z "$1" ] && { echo "uso: swarm <rama1> [rama2 ...]"; return 1; }

  for b in "$@"; do ( wt new "$b" >/dev/null ) || return 1; done

  out="$(herdr tab create --cwd "$root" --label "swarm:$name" --focus)" || return 1
  lead="$(jq -r '.result.root_pane.pane_id' <<<"$out")"
  herdr pane rename "$lead" "líder" >/dev/null

  prev="$lead"
  for b in "$@"; do
    dir="$WT_HOME/$name/$b"
    # el primero a la derecha del líder, los siguientes apilados debajo
    out="$(herdr pane split "$prev" \
      --direction "$([ "$prev" = "$lead" ] && echo right || echo down)" \
      --cwd "$dir")" || continue
    pane="$(jq -r '.result.pane.pane_id' <<<"$out")"
    herdr pane rename "$pane" "$b" >/dev/null

    # nombre de agente válido para herdr: [a-z][a-z0-9_-]{0,31}
    agent="${(L)b//[^a-zA-Z0-9_-]/-}"
    [[ "$agent" = [a-z]* ]] || agent="a-$agent"
    agent="${agent[1,32]}"
    herdr agent start "$agent" --kind "$kind" --pane "$pane" >/dev/null &
    prev="$pane"
  done
  wait
  echo "✔ swarm:$name — $# agente(s). Estado: herdr agent list"
}
```

Detalles que costaron:

- **`( wt new "$b" )` en un subshell**: `wt new` hace `cd`, y no quieres que tu shell acabe dentro del último worktree.
- **Los agentes arrancan en paralelo** (`&` y `wait`): `agent start` espera a que cada uno esté listo, y en serie serían varios segundos por agente.
- **Los nombres de agente** tienen que cumplir `[a-z][a-z0-9_-]{0,31}`. Una rama `feat/Login` no vale; la función la convierte en `feat-login`.
- **Los IDs se leen de la respuesta**, nunca se adivinan. herdr no reutiliza IDs de panes cerrados.

Después le das a cada agente su tarea, y la barra lateral te dice quién te necesita. Cuando una rama está lista: revisas el diff con lazygit en el popup, haces merge desde el pane líder y `wt rm <rama>`.

## Cuántos agentes a la vez

La herramienta no es el límite; tú lo eres. Con tres agentes en paralelo reviso bien lo que hacen. Con cinco empiezo a aprobar cosas sin leerlas, que es justo lo que no quieres. Y cada agente con su servidor de lenguaje y su `npm run dev` consume RAM: aquí es donde importa el techo de memoria del [artículo de WSL2](/posts/wsl2-entorno-terminal).

Las tareas que mejor se paralelizan son las que tocan zonas distintas del código. Dos agentes refactorizando el mismo módulo en ramas distintas producen un merge peor que hacerlo en serie. Lo cuento con más detalle, desde el lado de Antigravity, en [cinco agentes en paralelo sin pisarse](/posts/antigravity-agentes-paralelo).

## Siguiente paso

Con todo montado, la pregunta que queda: [herdr vs tmux, ventajas y desventajas](/posts/herdr-vs-tmux).

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. ¿Quieres a tu equipo trabajando con varios agentes en paralelo sin pisarse? [Hablemos](mailto:hi.codevs@gmail.com).
