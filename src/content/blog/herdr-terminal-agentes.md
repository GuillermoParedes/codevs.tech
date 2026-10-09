---
title: "herdr: instalar y configurar en Linux y WSL2"
author: Codevs
pubDatetime: 2026-10-09T16:50:00Z
slug: herdr-terminal-agentes
featured: false
draft: false
tags:
  - Terminal
  - WSL2
  - Config
  - IA
description: "Instala y configura herdr en Linux y WSL2: modelo servidor/cliente, config.toml, atajos, popups, barra lateral y arranque automático desde tu .zshrc."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 6
---

[herdr](https://herdr.dev) se define como un gestor de espacios de trabajo de terminal para agentes de código. En la práctica es un multiplexor, como tmux: un servidor que mantiene vivos tus procesos y un cliente que los dibuja. La diferencia está en lo que hace encima: reconoce qué agente corre en cada pane, sabe si está trabajando, esperando tu aprobación o terminado, y te lo muestra en una barra lateral.

Está escrito en Rust, con licencia Apache 2.0, y el repositorio es [herdrdev/herdr](https://github.com/herdrdev/herdr). Al escribir esto va por la **versión 0.9.3**: es software joven, y lo tengo en cuenta en todo el artículo.

## Table of contents

## Instalar

En Linux y WSL2:

```bash
curl -fsSL https://herdr.dev/install.sh | sh
herdr --version
```

Deja el binario en `~/.local/bin/herdr`, que ya está en el `PATH` si seguiste el [.zshrc modular](/posts/zshrc-modular). También hay paquetes para Homebrew, mise y Nix, e instaladores nativos para Windows, pero si trabajas en WSL2 lo que quieres es la versión de Linux: los agentes, git y Node viven ahí.

Como con cualquier `curl | sh`, lee el script antes si te importa lo que ejecutas. Se actualiza con:

```bash
herdr update
```

## El modelo: sesión, workspace, tab, pane

```bash
herdr          # lanza el servidor si no existe y se engancha a la sesión
```

La jerarquía:

| herdr     | Equivale en tmux a           | Cómo lo uso                                     |
| --------- | ---------------------------- | ----------------------------------------------- |
| Sesión    | Servidor (o socket con `-L`) | Una sola, la de por defecto                     |
| Workspace | Sesión                       | Un proyecto                                     |
| Tab       | Ventana                      | Una misión dentro del proyecto                  |
| Pane      | Pane                         | Una shell, un agente, un servidor de desarrollo |

Detach con `prefix + q`, o simplemente cerrando la ventana: los panes siguen corriendo en el servidor. `herdr` te vuelve a enganchar. `herdr server stop` lo apaga todo.

## Los atajos por defecto

El prefijo por defecto es **`Ctrl+b`**, el mismo que tmux. Los que más uso:

| Atajo                                   | Acción                                       |
| --------------------------------------- | -------------------------------------------- |
| `prefix ?`                              | Ver todos los atajos activos                 |
| `prefix v` / `prefix -`                 | Dividir a la derecha / abajo                 |
| `prefix h j k l`                        | Moverse entre panes                          |
| `prefix z`                              | Zoom del pane actual                         |
| `prefix x`                              | Cerrar pane                                  |
| `prefix r`                              | Modo redimensionar                           |
| `prefix c`                              | Tab nueva                                    |
| `prefix n` / `prefix p` / `prefix 1..9` | Tab siguiente / anterior / por número        |
| `prefix w`                              | Selector de workspaces                       |
| `prefix shift+n`                        | Workspace nuevo                              |
| `prefix b`                              | Mostrar u ocultar la barra lateral           |
| `prefix e`                              | Abrir el scrollback del pane en tu `$EDITOR` |
| `prefix shift+r`                        | Recargar la configuración                    |
| `prefix q`                              | Detach                                       |

Y todo es clicable: pestañas, panes, filas de la barra lateral. herdr se diseñó con el ratón como modo principal, no como añadido. Seleccionar texto con el ratón lo copia directamente.

`prefix e` merece mención: en vez de un modo copia como el de tmux, herdr vuelca el scrollback a tu editor. Con neovim tienes búsqueda, saltos y yank con toda la potencia de vim, sin aprender otro conjunto de teclas.

## config.toml

herdr funciona sin configuración. Para ver todas las opciones con sus valores por defecto:

```bash
herdr --default-config | less
```

El archivo va en `~/.config/herdr/config.toml`. El mío vive en los dotfiles con un symlink. Lo comento por secciones.

### Tema y worktrees

```toml
onboarding = false

[theme]
name = "tokyo-night"       # el mismo que uso en neovim
auto_switch = false

[worktrees]
directory = "~/.worktrees" # donde viven los worktrees (ver siguiente artículo)
```

Temas incluidos: catppuccin, tokyo-night, dracula, nord, gruvbox, one-dark, solarized, kanagawa, rose-pine, vesper y `terminal`, que usa la paleta de tu emulador. Se pueden sobrescribir colores sueltos en `[theme.custom]`.

### Interfaz

```toml
[ui]
# Barra lateral: primero los agentes que te necesitan (blocked > done > working)
agent_panel_sort = "priority"
# Formas distintas por estado, no solo colores: se lee de un vistazo
status_indicators = "symbols"
# El nombre del agente en el borde de su pane
show_agent_labels_on_pane_borders = true
# Tabs nuevas sin pedir nombre (se renombran con prefix+shift+t)
prompt_new_tab_name = false
# Título de la pestaña de Windows Terminal: proyecto · tab
window_title = "{workspace} · {tab}"

# Barra de estado a la derecha de las tabs, estilo tmux
tab_bar_right_separator = " · "
tab_bar_right = [
  { type = "zoom" },
  { type = "command", command = "git branch --show-current 2>/dev/null | sed 's/^/ /'", interval_seconds = 5, timeout_seconds = 2 },
  { type = "datetime", format = "%H:%M" },
]
```

`agent_panel_sort = "priority"` es el ajuste que más cambia el día a día: la barra lateral deja de agruparse por proyecto y se convierte en una cola de atención. Arriba, lo que te bloquea.

`status_indicators = "symbols"` usa un glifo distinto por estado en vez de puntos de colores. Si tienes algún tipo de daltonismo, o simplemente miras de reojo, es mucho más legible.

La barra lateral también se configura fila a fila. Para Claude Code añado el título de su terminal, que dice en qué está trabajando:

```toml
[ui.sidebar.agents.rows_by_agent]
claude = [["state_icon", "workspace", "tab"], ["terminal_title_stripped"], ["agent"]]

[ui.sidebar.spaces]
rows = [["state_icon", "workspace"], ["branch", "git_status"]]
```

### Notificaciones

```toml
[ui.sound]
enabled = true

[ui.toast]
delivery = "system"
```

Sonido y notificación del sistema cuando un agente de **otro** workspace cambia de estado. En WSL2, `delivery = "system"` llega como notificación de Windows. Es lo que permite dejar cuatro agentes trabajando e irte a otra cosa.

### Sesión y persistencia

```toml
[session]
# Tras reiniciar el servidor (o WSL), los agentes vuelven a su conversación
resume_agents_on_restore = true

[experimental]
# Conservar el historial de pantalla de cada pane entre reinicios
pane_history = true
```

Aquí herdr le gana a tmux con resurrect. herdr guarda la disposición de workspaces, tabs y panes de forma continua, y al arrancar tras un `wsl --shutdown` la reconstruye. Con `resume_agents_on_restore`, los agentes con integración oficial vuelven **a su conversación**, no a una shell vacía. `pane_history` está marcado como experimental: a mí me funciona, pero trátalo como tal.

### Atajos propios

```toml
[keys]
last_pane = "prefix+tab"            # alterna entre los dos últimos panes
cycle_pane_next = "prefix+o"        # ciclar, como en tmux
previous_workspace = "prefix+shift+k"
next_workspace = "prefix+shift+j"
next_agent = "prefix+a"             # saltar al siguiente agente, en cualquier proyecto
previous_agent = "prefix+shift+a"
```

`next_agent` no existe en tmux y es el que más uso: salta de agente en agente sin importar en qué workspace esté cada uno.

Un aviso: `prefix+o` viene asignado por defecto a abrir el objetivo de la última notificación. Si lo reasignas, como hago yo, pierdes ese atajo; antes de reasignar nada, mira `prefix ?` para ver qué pisas.

### Popups: herramientas flotantes

La función que más echo de menos cuando vuelvo a tmux. Un comando que se abre flotando sobre el layout sin moverlo:

```toml
[[keys.command]]
key = "prefix+shift+l"
type = "popup"
command = "lazygit"
width = "90%"
height = "90%"

[[keys.command]]
key = "prefix+shift+s"
type = "popup"
command = "zsh"
width = "80%"
height = "70%"
```

lazygit para revisar lo que hizo un agente, una shell suelta para un comando rápido, `htop` para ver quién se come la CPU. Al cerrar el programa, el popup desaparece y el layout sigue intacto. También existen `type = "pane"`, que abre un pane temporal, y `type = "shell"`, que corre el comando en segundo plano.

Para aplicar cambios sin reiniciar: `prefix shift+r`, o desde la shell:

```bash
herdr server reload-config
```

## Arrancar herdr automáticamente desde .zshrc

Cada terminal que abro entra directamente en herdr. Va en el `.zshrc` **antes** de cargar los módulos, y **después** del bloque de ssh-agent del [artículo anterior](/posts/ssh-agent-wsl2):

```bash
# herdr es PERSISTENTE: cada terminal nueva se engancha a la misma sesión.
# No entra: dentro de herdr (no se anida), dentro de un tmux abierto a mano,
# ni en la terminal integrada de VS Code.
# Escape: DOTFILES_NO_HERDR=1 para abrir una shell suelta.
if [[ -o interactive ]] && [[ -z "${HERDR_ENV:-}" ]] && [[ -z "$TMUX" ]] \
   && [[ "${TERM_PROGRAM:-}" != "vscode" ]] \
   && [[ "${DOTFILES_NO_HERDR:-0}" != "1" ]] \
   && command -v herdr >/dev/null; then
  # WSL a veces arranca la shell antes de que Windows Terminal informe el
  # tamaño de la ventana; con 0x0 herdr aborta ("zero-sized grid").
  for _i in {1..20}; do
    [[ "$(stty size 2>/dev/null)" != "0 0" ]] && break
    sleep 0.1
  done
  unset _i
  herdr && exit
fi
```

Cada condición tiene su historia:

- **`HERDR_ENV`** lo define herdr en sus panes. Sin esta guarda, cada pane nuevo intentaría lanzar herdr dentro de herdr. Por defecto herdr lo rechaza (`allow_nested = false`), pero mejor no intentarlo.
- **`TMUX`**: si abrí tmux a mano es porque quiero tmux.
- **VS Code**: su terminal integrada se queda como shell normal.
- **`DOTFILES_NO_HERDR=1`**: la puerta de emergencia. Si rompo la config de herdr, `DOTFILES_NO_HERDR=1 zsh` me da una shell para arreglarlo.
- **El bucle de `stty size`**: un bug específico de WSL. Al abrir Windows Terminal, la shell a veces arranca antes de conocer el tamaño de la ventana y herdr aborta con una rejilla de cero por cero. Esperar hasta 2 segundos lo resuelve.
- **`herdr && exit`**: al hacer detach, la terminal se cierra. Si herdr falla, no se ejecuta el `exit` y te quedas en una shell en vez de ver cómo se cierra la ventana sin explicación.

Añade también el autocompletado:

```bash
eval "$(herdr completion zsh)"
```

## WSL2: lo que conviene saber

- **El cursor.** En WSL, herdr dibuja su propio cursor en vez de usar el de la terminal (`host_cursor = "auto"`), para evitar el parpadeo de ConPTY. Si ves algo raro con el cursor, ese es el ajuste.
- **Atajos con `Alt`.** Windows Terminal y el propio Windows se quedan algunos `Alt+…` antes de que lleguen. Los logs de herdr lo avisan ("flushing lone escape"). Prefiere atajos con prefijo o con `Ctrl`.
- **`wsl --shutdown` mata el servidor**, igual que a tmux. La diferencia es lo bien que se recupera al volver.
- **Red.** Por defecto herdr consulta herdr.dev en segundo plano para buscar actualizaciones y nuevas reglas de detección de agentes. Si trabajas en un entorno sin salida a internet o prefieres que no lo haga, `version_check = false` y `manifest_check = false` en `[update]`.

## Comprobar que todo está bien

```bash
herdr status               # cliente y servidor
herdr workspace list       # JSON con tus workspaces
herdr integration status   # qué integraciones de agentes tienes instaladas
```

## Siguiente paso

Hasta aquí herdr es "un tmux con barra lateral y ratón". Lo que lo justifica son los agentes: [herdr con agentes de código y git worktrees](/posts/herdr-agentes-worktrees).

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. ¿Quieres este flujo con agentes montado para tu equipo? [Cuéntame el caso](mailto:hi.codevs@gmail.com).
