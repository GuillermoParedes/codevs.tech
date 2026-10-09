---
title: "herdr vs tmux: ventajas, desventajas y cuál usar"
author: Codevs
pubDatetime: 2026-10-09T17:10:00Z
slug: herdr-vs-tmux
featured: false
draft: false
tags:
  - Terminal
  - WSL2
  - IA
  - Config
description: "herdr vs tmux en Linux y WSL2: ventajas y desventajas, memoria medida, los riesgos de una herramienta joven y cómo hacer que convivan en la misma máquina."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 8
---

Después de varios meses con los dos, mi respuesta a "¿herdr o tmux?" es: **herdr en mi máquina, tmux en todas las demás**. Este artículo explica por qué, y en qué casos la respuesta sería otra.

## Table of contents

## La comparación, en una tabla

|                            | tmux 3.4                              | herdr 0.9                                           |
| -------------------------- | ------------------------------------- | --------------------------------------------------- |
| Madurez                    | Desde 2007, estable                   | Primer commit público en 2026, pre-1.0              |
| Disponibilidad             | En el repositorio de cualquier distro | Instalador propio, Homebrew, mise, Nix              |
| Agentes de código          | No sabe que existen                   | Detecta más de 20, con estado y notificaciones      |
| Ratón                      | Opcional (`mouse on`)                 | Modo principal, todo clicable                       |
| Configuración              | Lenguaje propio de tmux               | TOML                                                |
| Scripting                  | `send-keys`, `capture-pane`, formatos | CLI y API por socket con JSON                       |
| Persistencia tras reinicio | Con resurrect: layout y directorios   | Nativa: layout, historial y conversación de agentes |
| Copiar del scrollback      | Modo copia con teclas de vim          | Selección con ratón o scrollback en `$EDITOR`       |
| Popups                     | `display-popup`                       | Popups configurables por atajo                      |
| Remoto                     | Entras por SSH y ejecutas tmux        | Igual, o `--remote` con la interfaz en local        |
| Red                        | Ninguna                               | Comprueba actualizaciones (desactivable)            |
| Ecosistema                 | Enorme: tpm, cientos de plugins       | Pequeño y creciendo                                 |
| Licencia                   | ISC                                   | Apache 2.0                                          |

## Ventajas de herdr

**Sabe qué hacen tus agentes.** Es la razón de existir de herdr, y no tiene equivalente en tmux sin escribírtelo tú. La barra lateral ordenada por prioridad, el salto al siguiente agente y la notificación cuando uno se bloquea en otro proyecto cambian la forma de trabajar: dejas de vigilar y empiezas a responder. Lo cuento en [herdr con agentes y worktrees](/posts/herdr-agentes-worktrees).

**Se recupera de verdad tras un reinicio.** En WSL2 esto pesa: una actualización de Windows o un `wsl --shutdown` te tumba todo. tmux con resurrect te devuelve shells vacías en los directorios correctos. herdr te devuelve los agentes en su conversación y el historial de pantalla de cada pane.

**Se automatiza con datos, no con texto.** `herdr agent prompt … --wait` espera a que el agente termine o se bloquee, y devuelve JSON. Con tmux, lo mismo es un bucle de `capture-pane` comparando texto, frágil y sin saber distinguir "terminó" de "me pregunta algo".

**Se aprende en una tarde.** Funciona bien sin configurar, el ratón hace todo lo que no recuerdes y `prefix ?` muestra los atajos. La configuración es TOML legible.

**Los popups.** lazygit flotando sobre el layout con un atajo es de esas cosas que, una vez probadas, no quieres soltar. tmux tiene `display-popup` y se puede montar igual, pero en herdr es una entrada de cuatro líneas en el config.

## Desventajas de herdr

**Es joven.** Versión 0.9, con un ritmo de lanzamientos rápido. Las opciones cambian de nombre (el config ya acepta alias "legacy" de versiones anteriores), hay funciones marcadas como experimentales y la documentación va por detrás del código a veces. Apostar tu flujo diario por una herramienta pre-1.0 tiene un riesgo real: que mañana cambie algo o que el proyecto pierda impulso.

**No está en los servidores.** Si entras por SSH a un servidor de producción, a un contenedor o a la máquina de un cliente, ahí habrá tmux, o lo podrás instalar con `apt`. herdr no, y no vas a pedir que lo instalen.

**Consume más.** Medido en mi máquina, con dos panes abiertos: el servidor de herdr ocupa unos 26 MB de RAM y el cliente unos 17 MB. Un servidor de tmux con varias sesiones ronda los 5–8 MB. Frente a lo que consume un solo agente de código, es irrelevante; en una máquina pequeña o un servidor con poca memoria, no tanto.

**Habla con internet.** Por defecto comprueba nuevas versiones y descarga reglas de detección de agentes desde herdr.dev. Se desactiva en `[update]`, pero tmux nunca lo ha necesitado, y en entornos con políticas estrictas importa.

**El modo copia de tmux no tiene equivalente directo.** La selección con ratón y `prefix e` para abrir el scrollback en neovim cubren casi todo, pero si tienes los dedos hechos al modo copia de tmux, lo vas a echar de menos.

**El ecosistema es pequeño.** Para tmux casi cualquier problema ya lo resolvió alguien con un plugin o una respuesta en un foro. Con herdr vas a leer el código o abrir issues con más frecuencia.

## Ventajas y desventajas de tmux, en corto

A favor: está en todas partes, es estable desde hace años, consume casi nada, no habla con la red y es infinitamente programable. Saber tmux es una habilidad que te sirve en cualquier máquina durante toda tu carrera.

En contra: no sabe nada de agentes, necesita configuración para ser cómodo, el ratón es secundario, y su persistencia tras un reinicio es parcial. Los detalles están en [tmux en WSL2](/posts/tmux-wsl2).

## Cuándo usar cada uno

**Usa herdr si:**

- Trabajas con dos o más agentes de código a la vez, en uno o varios proyectos.
- Estás en tu propia máquina (WSL2, Linux o macOS) y la controlas.
- Te importa recuperar las conversaciones de los agentes tras un reinicio.
- Te cuesta memorizar atajos y prefieres el ratón para lo que haces poco.

**Usa tmux si:**

- Trabajas sobre todo en servidores remotos por SSH.
- No usas agentes de código, o usas uno y lo vigilas tú.
- Tu entorno no permite instalar binarios de terceros ni salida a internet.
- Ya tienes un tmux configurado que te funciona y no te duele nada.

**Usa los dos** si, como yo, haces ambas cosas. Y entonces la pregunta es cómo.

## Cómo hacer que convivan

### Prefijos distintos

herdr usa `Ctrl+b` por defecto; tmux también. Si los dejas así y abres tmux dentro de un pane de herdr (por ejemplo, tras un `ssh` a un servidor), el primero se come todos los prefijos. Por eso mi tmux usa **`Ctrl+a`**:

```bash
# ~/.tmux.conf
set -g prefix C-a
unbind C-b
bind C-a send-prefix
```

Así, dentro de herdr, `Ctrl+b` habla con herdr y `Ctrl+a` con el tmux del servidor remoto. Sin dobles pulsaciones.

### Un solo arranque automático

El `.zshrc` arranca herdr, salvo que ya estés en tmux:

```bash
if [[ -o interactive ]] && [[ -z "${HERDR_ENV:-}" ]] && [[ -z "$TMUX" ]] \
   && [[ "${TERM_PROGRAM:-}" != "vscode" ]] \
   && [[ "${DOTFILES_NO_HERDR:-0}" != "1" ]] \
   && command -v herdr >/dev/null; then
  herdr && exit
fi
```

Si un día quiero tmux en local, `DOTFILES_NO_HERDR=1 zsh` me da una shell suelta y `tmux new -A -s main` hace el resto.

### No anidar en local

herdr dentro de herdr está bloqueado por defecto (`allow_nested = false`). tmux dentro de herdr en local funciona, pero no aporta nada: tienes dos capas de panes y dos barras de estado. La regla que sigo: **herdr en local, tmux solo al otro lado de un `ssh`**.

### La configuración de los dos, en el mismo repo

Los dos configs viven en `~/dotfiles` con sus symlinks, y el `bootstrap.sh` instala ambos. Si mañana herdr cambia algo que no me gusta o el proyecto se detiene, vuelvo a tmux quitando un bloque del `.zshrc`. Esa salida barata es lo que me permite apostar por una herramienta pre-1.0 sin miedo.

## Migrar de tmux a herdr

Si vienes de tmux, esta es la equivalencia de atajos de mi configuración. Los de herdr son los valores por defecto salvo los marcados con \*.

| Acción                      | tmux (mi config) | herdr          |
| --------------------------- | ---------------- | -------------- |
| Prefijo                     | `Ctrl+a`         | `Ctrl+b`       |
| Split vertical / horizontal | `\|` / `-`       | `v` / `-`      |
| Moverse                     | `h j k l`        | `h j k l`      |
| Zoom                        | `z`              | `z`            |
| Cerrar pane                 | `x`              | `x`            |
| Ventana / tab nueva         | `c`              | `c`            |
| Alternar última             | `Tab` (ventana)  | `Tab` (pane)\* |
| Recargar config             | `r`              | `shift+r`      |
| Detach                      | `d`              | `q`            |
| Ver sesiones / workspaces   | `s`              | `w`            |

Las diferencias que más cuestan: `d` frente a `q` para hacer detach, y que en herdr la unidad "proyecto" es el workspace y no la sesión. Durante la primera semana, `prefix ?` es tu amigo.

## Mi veredicto

herdr resuelve bien un problema que tmux no se planteó: coordinar varios agentes de código. Si ese es tu día a día, el cambio vale la pena hoy, con los riesgos de una herramienta joven bien acotados por tener tmux como salida. Si no lo es, tmux sigue siendo la elección correcta y probablemente lo sea durante muchos años más.

Lo que no recomiendo es elegir solo uno y dejar de aprender el otro. tmux es la base que te encuentras en cualquier servidor; herdr es hacia dónde va el trabajo local con agentes.

## Volver al principio

Si llegaste aquí directamente, la serie empieza en [Terminal en WSL2 con zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr), y el primer paso práctico es [dejar WSL2 bien configurado](/posts/wsl2-entorno-terminal).

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. Si quieres que tu equipo trabaje con varios agentes de código sin perder el control, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
