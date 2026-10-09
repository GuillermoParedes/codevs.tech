---
title: "tmux en WSL2: configuración y portapapeles"
author: Codevs
pubDatetime: 2026-10-09T16:40:00Z
slug: tmux-wsl2
featured: false
draft: false
tags:
  - Terminal
  - WSL2
  - Config
description: "Configura tmux en WSL2 paso a paso: prefijo, splits en el mismo directorio, copiar al portapapeles de Windows, resurrect y continuum para no perder sesiones."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 5
---

tmux tiene casi veinte años, está en el repositorio de cualquier distribución y en cualquier servidor al que te conectes. Antes de hablar de herdr conviene tener un tmux bien configurado, por dos razones: es la referencia contra la que se compara todo lo demás, y vas a seguir usándolo aunque adoptes herdr.

## Table of contents

## Los tres conceptos

tmux es un **servidor** que mantiene vivos tus procesos y **clientes** que se conectan a él para dibujarlos. De ahí sale todo lo bueno: cierras la ventana, los procesos siguen; te desconectas del SSH, el `npm run dev` sigue corriendo.

Dentro del servidor hay una jerarquía:

- **Sesión**: un conjunto de trabajo. Yo uso una por proyecto.
- **Ventana**: una pestaña dentro de la sesión.
- **Pane**: una división de la ventana, cada una con su shell.

Todo se controla con un **prefijo** (por defecto `Ctrl+b`) seguido de una tecla.

```bash
sudo apt install -y tmux
tmux new -s blog      # sesión nueva llamada "blog"
# Ctrl+b d            # detach: sales, la sesión sigue viva
tmux ls               # listar sesiones
tmux attach -t blog   # volver a entrar
```

## El ~/.tmux.conf, por partes

Lo que sigue es mi configuración real, recortada a lo que justifica su existencia.

### Prefijo en Ctrl+a

```bash
set -g prefix C-a
unbind C-b
bind C-a send-prefix   # Ctrl+a Ctrl+a → manda un Ctrl+a real (inicio de línea)
```

`Ctrl+a` se pulsa con una mano sin estirar los dedos. El coste es que pierdes `Ctrl+a` como "ir al inicio de línea" en la shell, por eso el `send-prefix`: pulsándolo dos veces llega a la shell.

Hay un motivo más que verás en el último artículo: **herdr usa `Ctrl+b`**. Tener prefijos distintos es lo que permite usar uno dentro del otro sin volverte loco.

### Base sensata

```bash
set -g default-shell /usr/bin/zsh
set -g mouse on               # red de seguridad mientras aprendes
set -g base-index 1           # ventanas desde 1: la fila de números del teclado
setw -g pane-base-index 1
set -g renumber-windows on    # sin huecos al cerrar una ventana
set -g history-limit 50000
set -g escape-time 0          # sin retraso al pulsar Esc en vim
set -g focus-events on
setw -g mode-keys vi
set -sa terminal-features ',xterm-256color:RGB'
set -g update-environment "SSH_AUTH_SOCK"

bind r source-file ~/.tmux.conf \; display " config recargada ✔"
```

`escape-time 0` es obligatorio si usas vim o neovim: por defecto tmux espera 500 ms tras un `Esc` para ver si forma parte de una secuencia, y salir del modo inserción se vuelve lento. La línea de `terminal-features` activa color de 24 bits; sin ella los temas de neovim se ven apagados. `update-environment` es lo que comentaba en el [artículo de ssh-agent](/posts/ssh-agent-wsl2).

### Splits que heredan el directorio

```bash
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind c new-window     -c "#{pane_current_path}"
unbind '"'
unbind %
```

Por defecto, un split nuevo abre en el directorio donde arrancó la sesión, no en el que estás. `-c "#{pane_current_path}"` lo arregla. Y `|` y `-` dibujan el corte que hacen; los `"` y `%` originales no hay quien los recuerde.

### Moverse como en vim

```bash
bind -r h select-pane -L
bind -r j select-pane -D
bind -r k select-pane -U
bind -r l select-pane -R

bind -r H resize-pane -L 5
bind -r J resize-pane -D 3
bind -r K resize-pane -U 3
bind -r L resize-pane -R 5

bind Tab last-window   # alterna entre las dos últimas: el atajo más rentable
```

El `-r` hace el atajo repetible: pulsas el prefijo una vez y luego `h h h` sin volver a pulsarlo durante medio segundo.

### Copiar al portapapeles de Windows

Este es el bloque específico de WSL. En Linux nativo cambiarías `clip.exe` por `wl-copy` o `xclip`.

```bash
# prefix [ entra · v selecciona · y copia y sale · q cancela
bind -T copy-mode-vi v      send -X begin-selection
bind -T copy-mode-vi C-v    send -X rectangle-toggle
bind -T copy-mode-vi y      send -X copy-pipe-and-cancel "clip.exe"
bind -T copy-mode-vi Escape send -X cancel
bind -T copy-mode-vi MouseDragEnd1Pane send -X copy-pipe-and-cancel "clip.exe"

# rueda del ratón que no rompe vim, less o htop
bind -n WheelUpPane if-shell -F "#{alternate_on}" "send-keys -M" "copy-mode -e; send-keys -M"
```

El modo copia de tmux es una de las cosas que hace mejor que cualquier alternativa: navegas el scrollback con las teclas de vim, buscas con `/`, seleccionas en bloque con `Ctrl+v`. `clip.exe` es el ejecutable de Windows que recibe texto por stdin y lo deja en el portapapeles, disponible gracias al interop de WSL.

## Plugins: tpm, resurrect y continuum

```bash
git clone --depth 1 https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

Al final del `.tmux.conf`:

```bash
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'tmux-plugins/tmux-resurrect'   # prefix+C-s guarda · prefix+C-r restaura
set -g @plugin 'tmux-plugins/tmux-continuum'   # autoguardado cada 15 min
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'off'
set -g @continuum-save-interval '15'

run '~/.tmux/plugins/tpm/tpm'
```

Dentro de tmux, `prefix + I` instala los plugins.

El servidor de tmux sobrevive a que cierres la ventana, **pero no a un `wsl --shutdown`** ni a un reinicio de Windows. Para eso está resurrect: guarda la disposición de sesiones, ventanas y panes, sus directorios y el contenido visible, y la restaura. Continuum lo guarda cada 15 minutos.

Fíjate en `@continuum-restore 'off'`. Al principio lo tenía en `on`, y cada vez que abría una terminal me encontraba la sesión de hace tres días con ocho panes de proyectos que ya no tocaba. Prefiero guardar siempre y restaurar a mano con `prefix + Ctrl+r` cuando lo quiero.

Lo que resurrect **no** recupera: el estado de los programas. Un `npm run dev` vuelve como una shell vacía en el directorio correcto; vim puede reabrirse con su sesión si lo configuras; un agente de código vuelve como una shell vacía, con la conversación perdida salvo que la retomes a mano.

## Arrancar tmux automáticamente

Si quieres que cada terminal entre directamente en tmux, al final del bloque de arranque del `.zshrc`:

```bash
if [[ -o interactive ]] && [[ -z "$TMUX" ]] \
   && [[ "${TERM_PROGRAM:-}" != "vscode" ]] \
   && command -v tmux >/dev/null; then
  tmux new-session -A -s main && exit
fi
```

- `[[ -z "$TMUX" ]]` evita anidar tmux dentro de tmux.
- La comprobación de `vscode` deja la terminal integrada de VS Code como shell normal: VS Code ya tiene sus propios paneles y meter tmux ahí molesta más de lo que ayuda.
- `new-session -A -s main` se engancha a la sesión `main` si existe y la crea si no.
- `&& exit` cierra la terminal al hacer detach. Si tmux falla al arrancar, el `exit` no se ejecuta y te quedas en una shell normal en vez de perder la ventana.

Recuerda el orden del [artículo de ssh-agent](/posts/ssh-agent-wsl2): la passphrase se pide **antes** de este bloque.

## Lo que tmux hace mejor que nadie

- **Está en todas partes.** `apt install tmux` en cualquier servidor, contenedor o Raspberry Pi. Saber tmux es saber usar cualquier máquina remota.
- **Es pequeño y estable.** Pocos megas de RAM, sin red, sin actualizaciones que cambien el comportamiento. Una configuración de 2015 sigue funcionando.
- **Es enormemente programable.** `send-keys`, `capture-pane`, `pipe-pane`, formatos condicionales, hooks. Hay scripts de tmux para casi cualquier cosa.
- **El modo copia.** Navegar y copiar el scrollback sin ratón no tiene rival.
- **El ecosistema.** Cientos de plugins, y casi cualquier problema que tengas ya lo tuvo alguien en un foro.

## Lo que se le hace cuesta arriba

- **No sabe qué corre en sus panes.** Para tmux un agente esperando aprobación y un `htop` son lo mismo: texto que cambia.
- **La curva de entrada.** Sin configuración es incómodo, y su lenguaje de configuración es un mundo propio.
- **El ratón es un añadido**, no el modo principal. Funciona, pero se nota.
- **Persistencia tras reinicio a medias.** resurrect recupera la disposición, no el trabajo.

Esos cuatro puntos son exactamente los que herdr intenta resolver, y por eso es el siguiente artículo.

## Siguiente paso

[herdr: instalar y configurar](/posts/herdr-terminal-agentes) un multiplexor pensado para agentes de código.

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. ¿Necesitas formar a tu equipo en un flujo de terminal compartido? [Escríbeme](mailto:hi.codevs@gmail.com).
