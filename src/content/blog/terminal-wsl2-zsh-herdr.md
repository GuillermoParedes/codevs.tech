---
title: "Terminal en WSL2 con zsh, tmux y herdr: la serie"
author: Codevs
pubDatetime: 2026-10-09T16:00:00Z
slug: terminal-wsl2-zsh-herdr
featured: true
draft: false
tags:
  - Terminal
  - WSL2
  - Config
  - IA
description: "Cómo montar una terminal de desarrollo en WSL2 con zsh, tmux y herdr: pasos, configuración real, ventajas y desventajas de cada pieza, en ocho artículos."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 1
---

Durante años mi terminal fue la de casi todo el mundo que programa en Windows: WSL2, Ubuntu, zsh con Oh My Zsh y tmux encima. Funcionaba. Luego empecé a tener tres o cuatro agentes de código corriendo a la vez —Claude Code en un proyecto, Antigravity en otro, un tercero revisando un PR— y tmux empezó a quedarse corto en una cosa concreta: **no sabe qué está pasando dentro de sus panes**. Un agente esperando que le apruebes un comando y un agente que terminó hace diez minutos se ven exactamente igual.

Ahí entró [herdr](https://herdr.dev), un multiplexor de terminal pensado para agentes. No lo cambio por tmux en todos lados, y esta serie explica por qué.

## Table of contents

## Qué es esta serie

Es la configuración que uso a diario, explicada pieza por pieza, con sus defectos. No es una lista de "los 20 plugins de zsh que necesitas". Cada decisión viene con el problema que resuelve, y cuando algo no vale la pena lo digo.

El stack completo:

| Capa        | Herramienta                   | Para qué                                            |
| ----------- | ----------------------------- | --------------------------------------------------- |
| Sistema     | WSL2 + Ubuntu                 | Linux de verdad sin dejar Windows                   |
| Emulador    | Windows Terminal              | Dibuja la ventana, las fuentes y los colores        |
| Shell       | zsh + Oh My Zsh + starship    | El prompt, el historial, los alias, las funciones   |
| Multiplexor | tmux **o** herdr              | Panes, pestañas y sesiones que sobreviven al cierre |
| Agentes     | Claude Code, Antigravity CLI… | Lo que corre dentro de los panes                    |

La pregunta "¿zsh o herdr?" no tiene sentido: son capas distintas. zsh es la shell que corre _dentro_ de cada pane; tmux y herdr son los que reparten la pantalla en panes. La pregunta real es **tmux o herdr**, y la respuesta corta es: los dos, cada uno donde gana.

## Lo que la serie asume de ti

Que sabes moverte en una terminal Linux (`cd`, `ls`, editar un archivo) y que tienes Windows 10/11 con WSL2 o un Linux nativo. Todo lo que no es específico de WSL funciona igual en Ubuntu, Debian o Fedora.

Si vas a usar herdr con agentes, conviene haber usado alguno en serio. La serie de [Claude Code para frontend engineers](/posts/claude-code-frontend) es buen punto de partida.

## Qué recorre la serie

Siete artículos después de este, en el orden en que se instala una máquina nueva.

**[WSL2 listo para desarrollar](/posts/wsl2-entorno-terminal)** — `wsl.conf`, `.wslconfig`, systemd, cuánta RAM darle, por qué el código vive en `~` y nunca en `/mnt/c`, y cómo dejar Windows Terminal con una Nerd Font.

**[Un .zshrc modular que se entiende](/posts/zshrc-modular)** — Oh My Zsh sin tema, starship como prompt, `.zshenv` contra `.zshrc`, un directorio `conf.d/` con un archivo por responsabilidad, nvm cargado bajo demanda y alias de proyectos que se generan solos.

**[ssh-agent en WSL2 con varios panes](/posts/ssh-agent-wsl2)** — el bug que te pide la passphrase en cada `git push` cuando usas un multiplexor, por qué pasa, y cómo arreglarlo con un socket fijo de systemd.

**[tmux en WSL2: la configuración que vale la pena](/posts/tmux-wsl2)** — prefijo, splits que heredan el directorio, copiar al portapapeles de Windows, resurrect y continuum. Y lo que tmux sigue haciendo mejor que nadie.

**[herdr: instalar y configurar](/posts/herdr-terminal-agentes)** — el modelo servidor/cliente, `config.toml`, atajos, popups, la barra lateral y cómo arrancarlo automáticamente desde `.zshrc` sin romper VS Code.

**[herdr con agentes y git worktrees](/posts/herdr-agentes-worktrees)** — estados de agente, integraciones, notificaciones, la CLI que devuelve JSON y un comando `swarm` que abre un agente por rama en worktrees aislados.

**[herdr vs tmux: ventajas, desventajas y cuándo usar cada uno](/posts/herdr-vs-tmux)** — la comparación honesta, con números de memoria medidos, el riesgo de apostar por una herramienta pre-1.0 y cómo hacer que convivan en la misma máquina.

## La forma corta, si tienes prisa

Si solo vas a leer tres: **WSL2 → .zshrc modular → herdr vs tmux**. Con eso tienes la base bien puesta y sabes qué multiplexor te conviene. Si la respuesta es herdr, sigue con los dos artículos de herdr.

## Todo está en un repo de dotfiles

Nada de esto se configura a mano en cada máquina. Vive en un repositorio `~/dotfiles` con dos scripts:

```bash
./bootstrap.sh   # instala programas: apt, oh-my-zsh, starship, tpm, nvm, herdr…
./install.sh     # crea los symlinks: ~/.zshrc → ~/dotfiles/zsh/zshrc, etc.
```

Los dos son idempotentes: puedes correrlos diez veces y el resultado es el mismo. Una máquina nueva queda lista en un cuarto de hora. Lo menciono porque es la diferencia entre una configuración que mantienes y una que se pudre: si cambias algo en `~/.zshrc` directamente, se pierde en la próxima máquina.

## Empieza aquí

El [primer artículo](/posts/wsl2-entorno-terminal) deja WSL2 bien configurado. Es la parte más aburrida y la que más problemas raros evita después.

---

Parte de la serie **Terminal en WSL2: zsh, tmux y herdr**. Si quieres un entorno así montado para tu equipo —dotfiles compartidos, bootstrap reproducible y agentes trabajando en paralelo— [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
