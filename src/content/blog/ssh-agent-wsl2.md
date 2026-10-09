---
title: "ssh-agent en WSL2 con tmux o herdr sin passphrase"
author: Codevs
pubDatetime: 2026-10-09T16:30:00Z
slug: ssh-agent-wsl2
featured: false
draft: false
tags:
  - SSH
  - WSL2
  - Terminal
description: "Arregla ssh-agent en WSL2 con tmux o herdr: un solo agente por systemd, socket fijo y passphrase una vez por arranque, sin pedirla en cada git push."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 4
---

Este artículo existe porque perdí una tarde entera con un bug que parece de git y es de shell. El síntoma: tienes tus llaves SSH con passphrase, un `ssh-agent` en el `.zshrc`, y aun así **git te pide la passphrase en cada `push`**. Pero no siempre. Solo desde que usas tmux.

Si nunca te ha pasado, sáltate la explicación y copia la solución. Si te está pasando, la explicación te ahorra la tarde.

## Table of contents

## La receta clásica, y por qué falla

La forma habitual de levantar el agente en WSL es algo así en el `.zshrc`:

```bash
# ⚠️ La receta clásica. No la uses con un multiplexor.
if ! pgrep -u "$USER" ssh-agent >/dev/null; then
  ssh-agent > ~/.ssh/agent-environment
fi
source ~/.ssh/agent-environment >/dev/null
ssh-add ~/.ssh/id_ed25519 2>/dev/null
```

Con una sola terminal funciona. Ahora abre tmux con una sesión guardada de seis panes. Los seis shells arrancan **a la vez**:

1. Los seis ven que no hay agente y lanzan uno cada uno. Ahora hay seis agentes.
2. Los seis escriben su socket en `~/.ssh/agent-environment`. Gana el último en escribir.
3. Los seis lanzan `ssh-add`, y `ssh-add` pide la passphrase **en el pane donde corre**. Tú estás mirando uno; los otros cinco esperan input en panes que no ves.
4. Escribes la passphrase en el pane que miras. Esa llave entra en el agente de ese pane, que probablemente no es el que ganó el archivo de entorno.

Resultado: el agente "oficial" está vivo **pero vacío**. Y como el chequeo es "¿hay un proceso `ssh-agent`?", nadie vuelve a cargar las llaves. git usa ese agente vacío y te pide la passphrase cada vez.

El error de fondo es doble: el socket cambia de ruta en cada arranque, y el chequeo pregunta lo que no importa.

## La solución en tres piezas

1. **Un solo agente, supervisado por systemd**, en un socket de **ruta fija**. Ningún shell lo lanza; todos lo encuentran en el mismo sitio.
2. **El chequeo es "¿están mis llaves?"**, no "¿hay un proceso?".
3. **La passphrase se pide antes de entrar al multiplexor**, en la única terminal que estás mirando.

Necesita `systemd=true` en `/etc/wsl.conf`, como contaba en el [artículo de WSL2](/posts/wsl2-entorno-terminal).

## Pieza 1: el servicio de systemd

`~/.config/systemd/user/ssh-agent.service`:

```ini
[Unit]
Description=ssh-agent del usuario (socket fijo, uno solo para todo WSL)

[Service]
Type=simple
Environment=SSH_AUTH_SOCK=%t/ssh-agent.socket
# Si quedó un socket muerto de un arranque anterior, ssh-agent no puede crearlo
ExecStartPre=-/bin/rm -f %t/ssh-agent.socket
# -D = no daemonizar (systemd lo supervisa) · -a = socket en ruta fija
ExecStart=/usr/bin/ssh-agent -D -a $SSH_AUTH_SOCK
Restart=on-failure
RestartSec=2

[Install]
WantedBy=default.target
```

`%t` es `$XDG_RUNTIME_DIR`, normalmente `/run/user/1000`. Actívalo:

```bash
systemctl --user daemon-reload
systemctl --user enable --now ssh-agent.service
systemctl --user status ssh-agent.service
```

Desde ahora el socket está siempre en `/run/user/1000/ssh-agent.socket`. No hay archivo de entorno que se pueda pisar.

## Pieza 2: el módulo de zsh

`~/.config/zsh/20-ssh-agent.zsh`:

```bash
export SSH_AUTH_SOCK="${XDG_RUNTIME_DIR:-/run/user/$UID}/ssh-agent.socket"

SSH_KEYS=( "$HOME/.ssh/github_personal" "$HOME/.ssh/github_trabajo" )

# El agente tiene que estar arriba (fallback si systemd no está)
if [ ! -S "$SSH_AUTH_SOCK" ]; then
  command -v systemctl >/dev/null && systemctl --user start ssh-agent.service 2>/dev/null
  [ -S "$SSH_AUTH_SOCK" ] || ssh-agent -a "$SSH_AUTH_SOCK" >/dev/null 2>&1
fi

# Cargar SOLO las llaves que falten
ssh-keys-load() {
  local lock="${XDG_RUNTIME_DIR:-/tmp}/ssh-add.lock" loaded owner k fp
  local -a pending

  loaded="$(ssh-add -l 2>/dev/null)"
  for k in "${SSH_KEYS[@]}"; do
    [ -f "$k" ] || continue
    fp="$(ssh-keygen -lf "$k" 2>/dev/null | awk '{print $2}')"
    [[ -n "$fp" && "$loaded" == *"$fp"* ]] && continue
    pending+=("$k")
  done
  (( ${#pending} )) || return 0

  # Lock: pregunta un único pane. Guarda el PID para que, si ese pane
  # muere a mitad del prompt, el siguiente tome el relevo.
  if ! mkdir "$lock" 2>/dev/null; then
    owner="$(<"$lock/pid" 2>/dev/null)"
    [[ -n "$owner" ]] && kill -0 "$owner" 2>/dev/null && return 0
    rm -rf "$lock"; mkdir "$lock" 2>/dev/null || return 0
  fi
  echo $$ > "$lock/pid"

  print -P "%F{yellow}Llaves SSH: passphrase una vez por arranque de WSL%f"
  for k in "${pending[@]}"; do ssh-add "$k"; done

  rm -rf "$lock"
}

# Solo en shell interactiva con terminal real (nunca en scripts ni hooks)
if [[ -o interactive ]] && [ -t 0 ]; then
  ssh-keys-load
fi
```

Lo que cambia respecto a la receta clásica:

- **Compara huellas.** `ssh-keygen -lf` saca la huella de la llave en disco, `ssh-add -l` lista las huellas cargadas. Solo se piden las que faltan. Si ya están, la función sale sin hacer nada en milisegundos.
- **Usa un lock con `mkdir`**, que es atómico: de seis shells que intentan crearlo a la vez, solo uno lo consigue. Los otros cinco salen sin preguntar.
- **El lock no se queda trabado.** Si el pane que pregunta se cierra antes de que escribas la passphrase, el PID guardado ya no existe (`kill -0` falla) y el siguiente shell toma el relevo.
- **No silencia `ssh-add`.** Si la passphrase es incorrecta, lo ves.

Si tienes varias llaves para varias cuentas de GitHub, el `~/.ssh/config` con un `Host` por cuenta lo explico en [llaves SSH para GitHub y GitLab](/posts/ssh-github-gitlab).

## Pieza 3: pedirla antes del multiplexor

El lock evita el caos, pero sigue siendo posible que pregunte en un pane que no estás mirando. La solución definitiva es pedir la passphrase **fuera** del multiplexor, antes de lanzarlo. En el `.zshrc`, antes del bloque que arranca tmux o herdr:

```bash
# Fuera hay un solo pane y lo estás mirando: el prompt no se pierde.
if [[ -o interactive ]] && [[ -z "$TMUX" ]] && [[ -z "${HERDR_ENV:-}" ]]; then
  [ -r "$HOME/.config/zsh/20-ssh-agent.zsh" ] && source "$HOME/.config/zsh/20-ssh-agent.zsh"
fi

# … aquí se arranca tmux o herdr …
```

`$TMUX` lo define tmux en sus panes; `HERDR_ENV=1` lo define herdr. Si no estás en ninguno de los dos, estás en la terminal "de fuera". Ahí pide la passphrase, y cuando el multiplexor abre sus panes, el módulo vuelve a cargarse con el resto pero ve que las llaves ya están y no pregunta.

## tmux: un detalle más

tmux guarda el entorno del primer cliente que creó la sesión. Si alguna vez `SSH_AUTH_SOCK` cambia, los panes nuevos heredan el valor viejo. Con un socket fijo no debería pasar, pero en `~/.tmux.conf` conviene dejarlo explícito:

```bash
set -g update-environment "SSH_AUTH_SOCK"
```

herdr no me ha pedido nada parecido: con el socket fijo, sus panes heredan el `SSH_AUTH_SOCK` correcto, y en `~/.config/herdr/` verás un enlace `herdr.sock.agent` que apunta al mismo agente.

## Comprobarlo

```bash
echo $SSH_AUTH_SOCK          # /run/user/1000/ssh-agent.socket, en todos los panes
ssh-add -l                   # tus llaves, en todos los panes
ssh -T git@github.com        # "Hi <usuario>! You've successfully authenticated"
```

Si `ssh-add -l` dice `Could not open a connection to your authentication agent`, el servicio no está arriba: `systemctl --user status ssh-agent`.

## Ventajas y desventajas

**A favor**: una passphrase por arranque de WSL, sin importar cuántos panes, sesiones o agentes de código abras. Los agentes de IA que hacen `git push` usan el mismo socket sin que tengas que hacer nada.

**En contra**: depende de systemd en WSL, que funciona bien desde 2022 pero añade un poco al tiempo de arranque de la VM. Y las llaves quedan cargadas en memoria mientras WSL esté vivo: si compartes la máquina o te preocupa que un proceso comprometido use el agente, añade un tiempo de vida con `ssh-add -t 8h` o usa `AddKeysToAgent` con confirmación.

## Siguiente paso

Con la shell y el agente resueltos, toca el multiplexor. Primero el veterano: [tmux en WSL2](/posts/tmux-wsl2).

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. Si tu equipo pelea con llaves, identidades de git y accesos a servidores, [cuéntame el caso](mailto:hi.codevs@gmail.com).
