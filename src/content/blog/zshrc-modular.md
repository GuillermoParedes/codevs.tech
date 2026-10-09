---
title: "Un .zshrc modular: Oh My Zsh, starship y conf.d"
author: Codevs
pubDatetime: 2026-10-09T16:20:00Z
slug: zshrc-modular
featured: false
draft: false
tags:
  - Terminal
  - Config
  - WSL2
description: "Organiza tu .zshrc en módulos: Oh My Zsh sin tema, starship, zshenv vs zshrc, nvm bajo demanda, historial compartido y alias de proyecto automáticos."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 3
---

Todo `.zshrc` empieza con diez líneas y termina con trescientas: alias copiados de un blog, un instalador que añadió su bloque al final, la misma línea de `PATH` repetida tres veces. Cuando algo falla, no hay forma de saber qué línea es.

La solución no es un framework más. Es separar por responsabilidad: un `.zshrc` corto que orquesta y un directorio con un archivo por tema.

## Table of contents

## zsh como shell por defecto

```bash
sudo apt install -y zsh
chsh -s "$(command -v zsh)"
```

Cierra y abre la terminal. `echo $SHELL` debería decir `/usr/bin/zsh`.

## .zshenv contra .zshrc

zsh lee varios archivos al arrancar, y elegir mal dónde poner algo es fuente de bugs sutiles:

| Archivo     | Cuándo se lee                                                   | Qué poner                                 |
| ----------- | --------------------------------------------------------------- | ----------------------------------------- |
| `~/.zshenv` | **Siempre**: scripts, `ssh host comando`, hooks de git, agentes | Solo lo barato y sin salida por pantalla  |
| `~/.zshrc`  | Solo en shells interactivas                                     | Prompt, alias, completions, todo lo demás |

Los agentes de código ejecutan comandos en shells **no interactivas**. Si `cargo` solo está en el `PATH` vía `.zshrc`, tú lo ves y el agente no. Mi `.zshenv` tiene una sola línea:

```bash
# Se lee en TODAS las shells. Solo cosas baratas y sin salida.
[ -r "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"
```

Nunca pongas un `echo` en `.zshenv`: rompe `scp`, `rsync` y cualquier herramienta que hable por stdin/stdout de una shell remota.

## La estructura

```text
~/dotfiles/zsh/
├── zshenv              → ~/.zshenv
├── zshrc               → ~/.zshrc
└── conf.d/             → ~/.config/zsh/
    ├── 00-path.zsh
    ├── 05-env.zsh
    ├── 10-node.zsh
    ├── 20-ssh-agent.zsh
    ├── 30-aliases.zsh
    ├── 35-projects.zsh
    ├── 40-agents.zsh
    └── 50-completions.zsh
```

El prefijo numérico fija el orden de carga: el `PATH` antes que todo, los alias antes que los alias automáticos que no deben pisarlos. Y un `~/.zshrc.local` fuera del repo para secretos y cosas de una sola máquina.

## El .zshrc que orquesta

```bash
# ── Oh My Zsh ─────────────────────────────────────────────
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=""                       # el prompt lo pone starship
plugins=(git zsh-autosuggestions)
[ -s "$ZSH/oh-my-zsh.sh" ] && source "$ZSH/oh-my-zsh.sh"

# ── Prompt ────────────────────────────────────────────────
command -v starship >/dev/null && eval "$(starship init zsh)"

# ── (aquí va el arranque del multiplexor, ver más abajo) ──

# ── Módulos ───────────────────────────────────────────────
for _f in "$HOME"/.config/zsh/*.zsh; do
  [ -r "$_f" ] && source "$_f"
done
unset _f

# ── Local, fuera del repo ─────────────────────────────────
[ -r "$HOME/.zshrc.local" ] && source "$HOME/.zshrc.local"
```

Dos decisiones que merecen explicación.

**Oh My Zsh, pero mínimo.** Lo uso por sus plugins (`git` trae alias como `gco`, `gp`; `zsh-autosuggestions` sugiere en gris el comando del historial). Lo que no uso son sus temas: `ZSH_THEME=""` y el prompt lo pone [starship](https://starship.rs), que está escrito en Rust, es rápido y se configura igual en zsh, bash o fish. Cada plugin de Oh My Zsh que añades suma milisegundos a cada pane que abres; con un multiplexor abres muchos.

**Todo con guardas.** `[ -r archivo ] && source archivo`, `command -v x >/dev/null && …`. Si en una máquina falta una herramienta, la línea no hace nada en vez de escupir un error en cada shell.

Instala los plugins y starship:

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --keep-zshrc
git clone --depth 1 https://github.com/zsh-users/zsh-autosuggestions \
  "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"
curl -sS https://starship.rs/install.sh | sh
```

El `--keep-zshrc` importa: sin él, el instalador de Oh My Zsh sustituye tu `.zshrc` por el suyo.

## 00-path: el PATH sin duplicados

```bash
export PATH="$HOME/.local/bin:$PATH"

export GOROOT="$HOME/sdk/go"
export GOPATH="${GOPATH:-$HOME/go}"
[ -d "$GOROOT/bin" ] && export PATH="$GOROOT/bin:$GOPATH/bin:$PATH"

export BUN_INSTALL="$HOME/.bun"
[ -d "$BUN_INSTALL/bin" ] && export PATH="$BUN_INSTALL/bin:$PATH"

# Varios instaladores añaden ~/.local/bin por su cuenta
typeset -U path PATH
```

`typeset -U path` es un truco de zsh: marca el array `path` como único, y zsh elimina los duplicados solo. Es la línea que limpia lo que pnpm, uv y cargo añaden por su cuenta.

## 05-env: historial compartido y WSL

```bash
HISTSIZE=100000
SAVEHIST=100000
HISTFILE="$HOME/.zsh_history"
setopt HIST_IGNORE_ALL_DUPS HIST_REDUCE_BLANKS SHARE_HISTORY EXTENDED_HISTORY
setopt AUTO_CD INTERACTIVE_COMMENTS
```

`SHARE_HISTORY` es la que más se nota con un multiplexor: un comando que escribes en un pane aparece con la flecha arriba en el de al lado. Sin ella, cada pane tiene su historial hasta que se cierra.

En el mismo archivo, lo específico de WSL va detrás de una detección:

```bash
if grep -qi microsoft /proc/version 2>/dev/null; then
  _chrome="/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"
  if [ -x "$_chrome" ]; then
    export BROWSER="${_chrome// /\\ }"
    # Puppeteer/Playwright: no descargar otro Chromium dentro de WSL
    export PUPPETEER_EXECUTABLE_PATH="$_chrome"
  fi
  unset _chrome
fi
```

Así el mismo repo de dotfiles funciona en un Linux nativo sin tocar nada.

## 10-node: nvm sin pagar 200 ms por pane

nvm es lo más lento que puedes meter en un `.zshrc`: cargarlo cuesta en torno a 200 ms. Con un multiplexor que abre seis panes a la vez, se nota. La solución es cargarlo la primera vez que lo necesitas:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] || return

_nvm_load() {
  [ "${_NVM_LOADED:-0}" = "1" ] && return
  unset -f nvm node npm npx pnpm yarn corepack 2>/dev/null
  source "$NVM_DIR/nvm.sh"
  _NVM_LOADED=1
}

for _cmd in node npm npx pnpm yarn corepack; do
  eval "$_cmd() { _nvm_load; command $_cmd \"\$@\"; }"
done
unset _cmd
nvm() { _nvm_load; nvm "$@"; }
```

Cada comando de Node empieza siendo una función que carga nvm, se borra a sí misma y llama al binario real. El coste se paga una vez, solo en los panes donde usas Node.

Y un hook que cambia de versión al entrar en un proyecto con `.nvmrc`:

```bash
autoload -U add-zsh-hook
_nvmrc_auto() {
  [ -f .nvmrc ] || return
  _nvm_load 2>/dev/null
  nvm use --silent >/dev/null 2>&1
}
add-zsh-hook chpwd _nvmrc_auto
```

## 30-aliases: reemplazos modernos con red de seguridad

```bash
if command -v eza >/dev/null; then
  alias ls='eza --group-directories-first'
  alias ll='eza -lh --group-directories-first --git'
  alias lt='eza --tree --level=2'
fi
command -v bat  >/dev/null && alias cat='bat --paging=never'
command -v nvim >/dev/null && alias vim='nvim'

alias gs='git status -sb'
alias gl='git log --oneline --graph --decorate -20'
alias reload='exec zsh'
alias zshconf='nvim ~/dotfiles/zsh/conf.d'
```

`reload='exec zsh'` en vez de `source ~/.zshrc`: `exec` reemplaza la shell por una nueva, limpia. `source` vuelve a ejecutar todo encima del estado actual, y las funciones o alias que borraste siguen vivos.

## 35-projects: alias que se generan solos

El módulo que más uso. Cada carpeta dentro de mis raíces de proyectos genera un alias `cd` y un directorio con nombre:

```bash
PROJECT_ROOTS=( "$HOME/work" "$HOME/codevs" )

project-rehash() {
  local root dir name
  for root in $PROJECT_ROOTS; do
    [[ -d $root ]] || continue
    for dir in $root/*(N-/); do
      name=${dir:t}
      [[ $name = *[^A-Za-z0-9._-]* ]] && continue
      [[ $name = .* ]] && continue
      # no pisar alias manuales ni comandos reales (cat, git, node…)
      (( $+aliases[$name] )) && continue
      (( $+commands[$name] || $+functions[$name] || $+builtins[$name] )) && continue
      alias -- "$name=cd ${(q)dir}"
      hash -d -- "$name=$dir"
    done
  done
}
project-rehash
```

Si existe `~/codevs/codevs.tech`, escribir `codevs.tech` te lleva ahí, y `~codevs.tech/src` funciona como ruta. starship además muestra el directorio como `~codevs.tech` en el prompt. El glob `*(N-/)` es sintaxis de zsh: `N` no falla si no hay coincidencias, `-/` solo directorios (siguiendo symlinks).

La comprobación de colisiones es lo que lo hace seguro: un proyecto llamado `node` no te rompe `node`.

## 50-completions: fzf y compañía

```bash
if command -v fzf >/dev/null; then
  export FZF_DEFAULT_OPTS='--height 40% --layout=reverse --border'
  command -v fd >/dev/null && export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git'
  if [ -t 0 ]; then
    source /usr/share/doc/fzf/examples/completion.zsh
    source /usr/share/doc/fzf/examples/key-bindings.zsh
  fi
fi

command -v gh >/dev/null && eval "$(gh completion -s zsh)" 2>/dev/null
command -v herdr >/dev/null && eval "$(herdr completion zsh)" 2>/dev/null
```

`Ctrl+R` con fzf es búsqueda difusa en un historial de 100.000 líneas: probablemente el cambio de productividad más grande de todo el artículo. El `[ -t 0 ]` evita que los scripts de fzf toquen el editor de línea cuando no hay terminal real, como cuando un agente ejecuta `zsh -ic`.

## Medir cuánto tarda en arrancar

```bash
for i in {1..5}; do /usr/bin/time -f "%e s" zsh -i -c exit; done
```

Por debajo de 0,15 s está bien. Si pasa de 0,3 s, carga `zmodload zsh/zprof` al principio del `.zshrc`, `zprof` al final, y mira qué función se come el tiempo. Casi siempre es nvm, un `eval "$(herramienta completion zsh)"` lento, o `compinit` ejecutándose dos veces.

## Ventajas y desventajas de este enfoque

**A favor**: cada módulo se entiende solo, los errores se aíslan (comenta un `source` y descartas medio `.zshrc`), y el mismo repo funciona en WSL, Linux nativo y un servidor.

**En contra**: más archivos que mantener, y el orden de carga es una convención implícita: si `35-projects` se carga antes que `30-aliases`, los alias automáticos pisan los manuales. Además, Oh My Zsh sigue siendo un peso que podrías quitarte con un gestor más ligero como zinit o antidote; yo no lo he hecho porque con dos plugins el coste es bajo y la documentación de Oh My Zsh la conoce todo el mundo.

## Siguiente paso

Falta el módulo `20-ssh-agent`, que tiene su propio artículo porque esconde el bug más molesto de usar un multiplexor en WSL2: [ssh-agent con varios panes](/posts/ssh-agent-wsl2). Si todavía no tienes llaves configuradas, empieza por [generar llaves SSH para GitHub y GitLab](/posts/ssh-github-gitlab).

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. ¿Quieres unos dotfiles así para tu equipo, con bootstrap reproducible? [Hablemos](mailto:hi.codevs@gmail.com).
