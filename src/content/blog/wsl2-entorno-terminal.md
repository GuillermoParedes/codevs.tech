---
title: "WSL2 para desarrollar: wsl.conf y .wslconfig"
author: Codevs
pubDatetime: 2026-10-09T16:10:00Z
slug: wsl2-entorno-terminal
featured: false
draft: false
tags:
  - WSL2
  - Terminal
  - Config
description: "Configura WSL2 para desarrollar: systemd, wsl.conf, .wslconfig con límites de RAM, dónde guardar el código y Windows Terminal con una Nerd Font."
series: "Terminal en WSL2: zsh, tmux y herdr"
seriesOrder: 2
---

Antes de tocar zsh conviene dejar bien la capa de abajo. La mayoría de los problemas "raros" que la gente achaca a zsh, tmux o Node en WSL —watchers que no detectan cambios, `npm install` que tarda cinco minutos, Windows que se queda sin RAM— son de configuración de WSL2, no de las herramientas.

Son cuatro piezas: dos archivos de configuración, una regla sobre dónde vive el código y el emulador de terminal.

## Table of contents

## Instalar WSL2 y Ubuntu

Desde PowerShell como administrador:

```powershell
wsl --install -d Ubuntu-24.04
wsl --set-default-version 2
```

Al terminar te pide usuario y contraseña de Linux. Comprueba que la distro corre en la versión 2:

```powershell
wsl -l -v
```

La columna `VERSION` tiene que decir `2`. WSL1 traduce llamadas del kernel; WSL2 es una máquina virtual con un kernel Linux real, y todo lo que sigue lo da por hecho.

## /etc/wsl.conf: lo que vive dentro de la distro

Este archivo configura **una distro concreta** y necesita `sudo`. El mío:

```ini
[boot]
# Necesario para docker nativo, systemctl y timers.
systemd=true

[user]
default=tu-usuario

[automount]
# metadata: chmod/chown reales sobre /mnt/c (si no, todo sale 777
# y ssh/git se quejan). umask/fmask: que los archivos de Windows no
# aparezcan todos como ejecutables.
options=metadata,umask=22,fmask=11

[interop]
enabled=true
# Deja el PATH de Windows disponible (chrome.exe, clip.exe, explorer.exe).
# En false arranca más rápido, pero pierdes los puentes con Windows.
appendWindowsPath=true
```

Lo importante es `systemd=true`. Sin systemd no hay `systemctl --user`, y en el [artículo de ssh-agent](/posts/ssh-agent-wsl2) lo uso para tener un único agente con un socket fijo. Docker nativo (sin Docker Desktop) también lo necesita.

## .wslconfig: lo que vive en Windows

Este va en `C:\Users\<tú>\.wslconfig` y afecta a **todas** las distros, porque todas comparten la misma máquina virtual. Está calibrado para un equipo de 32 GB y 16 hilos:

```ini
[wsl2]
# Techo de RAM. Por defecto WSL toma el 50 % del host; explícito
# para que no cambie solo si mañana amplías la RAM.
memory=16GB

# Deja 4 hilos para Windows: el host no se congela mientras
# compilas o corren varios agentes a la vez.
processors=12

# Colchón para picos (builds de Go, node_modules gordos).
swap=8GB

# EL AJUSTE QUE MÁS IMPORTA: sin esto WSL coge RAM y no la
# devuelve a Windows hasta un `wsl --shutdown`.
autoMemoryReclaim=gradual

# El .vhdx crece pero no encoge solo; con esto sí.
sparseVhd=true

# Apaga la VM tras 1 min sin distros corriendo.
vmIdleTimeout=60000
```

Si tienes 16 GB en total, baja `memory` a 8 GB y `processors` a la mitad de tus hilos. Con varios agentes de código abiertos, cada uno con su servidor de lenguaje y su `npm run dev`, la RAM se va antes de lo que crees.

Ninguno de los dos archivos se aplica en caliente:

```powershell
wsl --shutdown
```

Y vuelves a abrir la terminal. Ojo: `wsl --shutdown` mata **todo** lo que corre en WSL, incluidas las sesiones de tmux y de herdr. Tenlo en cuenta cuando lleguemos a la persistencia.

## La regla de oro: el código vive en ~, no en /mnt/c

WSL2 monta tus discos de Windows en `/mnt/c`, y es tentador trabajar ahí para abrir el proyecto desde los dos lados. No lo hagas. El acceso a `/mnt/c` cruza la frontera entre la VM y Windows por un protocolo de red (9P), y se nota:

- `npm install` o `pnpm install` tarda varias veces más.
- Los watchers de Vite, Next o Angular no reciben eventos del sistema de archivos y no recargan, salvo que actives polling, que consume CPU.
- `git status` en un repo grande pasa de instantáneo a segundos.

El código va en el sistema de archivos de Linux (`~/proyectos/...`). Para verlo desde Windows tienes `\\wsl$\Ubuntu-24.04\home\<tú>` en el Explorador, o directamente:

```bash
explorer.exe .
```

VS Code con la extensión WSL abre las carpetas de Linux de forma nativa, así que no pierdes nada.

## Los puentes con Windows que sí sirven

Con `appendWindowsPath=true` los ejecutables de Windows están en el `PATH`. Tres que uso a diario:

```bash
clip.exe < archivo.txt        # copiar al portapapeles de Windows
explorer.exe .                # abrir la carpeta actual en el Explorador
wslview https://codevs.tech   # abrir una URL en el navegador de Windows (paquete wslu)
```

`clip.exe` es el que hace que copiar desde tmux funcione, lo verás en el [artículo de tmux](/posts/tmux-wsl2).

## Windows Terminal y la fuente

El emulador es la ventana que dibuja todo. Windows Terminal es el correcto en Windows 11: soporta colores de 24 bits, ligaduras, y las notificaciones que usa herdr.

Lo que tienes que cambiar en su configuración:

1. **Perfil por defecto**: Ubuntu, no PowerShell.
2. **Directorio de inicio**: `//wsl$/Ubuntu-24.04/home/<tú>` en vez del perfil de Windows.
3. **Fuente**: una [Nerd Font](https://www.nerdfonts.com/). starship, eza y la barra de herdr usan iconos que una fuente normal pinta como cuadrados. Yo uso JetBrainsMono Nerd Font; se instala en Windows, no en Linux, porque la dibuja Windows Terminal.
4. **Atajos que chocan**: Windows Terminal captura algunos `Ctrl+Shift+…` y `Alt+…` antes de que lleguen a la shell. Si un atajo de tmux o herdr "no hace nada", mira primero si Windows Terminal se lo está comiendo.

## Los paquetes base

Lo que instala el módulo `apt` de mis dotfiles, y que da por hecho el resto de la serie:

```bash
sudo apt update && sudo apt install -y \
  build-essential git curl zsh tmux \
  ripgrep fzf fd-find bat eza jq wslu
```

`fd` y `bat` se instalan en Ubuntu como `fdfind` y `batcat` por conflictos de nombre. Un symlink en `~/.local/bin` lo arregla:

```bash
mkdir -p ~/.local/bin
ln -s "$(command -v fdfind)" ~/.local/bin/fd
ln -s "$(command -v batcat)" ~/.local/bin/bat
```

## Ventajas y desventajas de trabajar en WSL2

**A favor**: Linux real con un kernel de verdad, Docker nativo, las mismas herramientas que en el servidor de producción, y sigues teniendo Windows para todo lo demás. Para desarrollo web es, a día de hoy, la mejor forma de programar en un equipo Windows.

**En contra**: la frontera con Windows es una fuente constante de fricción (rendimiento de `/mnt/c`, atajos de teclado, el reloj que a veces se desfasa tras suspender el equipo), y un `wsl --shutdown` o una actualización de Windows te tumba todas las sesiones. Eso último importa, y es una de las razones por las que la persistencia de tmux y herdr entra en esta serie.

## Siguiente paso

Con WSL2 bien puesto, toca la shell: [un .zshrc modular que se entiende](/posts/zshrc-modular).

---

Parte de la serie **[Terminal en WSL2: zsh, tmux y herdr](/posts/terminal-wsl2-zsh-herdr)**. ¿Tu equipo pierde horas con entornos de desarrollo que no se parecen entre sí? [Escríbeme](mailto:hi.codevs@gmail.com) y lo dejamos reproducible.
