---
title: "Claude Code en CI: el PR que se revisa solo"
author: Codevs
pubDatetime: 2026-08-04T09:50:00Z
slug: claude-code-github-actions
featured: false
draft: false
tags:
  - Claude Code
  - IA
  - Frontend
  - Github
description: "Monta claude-code-action y el modo headless para revisar PRs, vigilar el peso del bundle y controlar el coste, sin abrir el terminal ni una vez."
series: "Claude Code para frontend engineers"
seriesOrder: 7
---

## Table of contents

## Por qué mover esto a CI

Todo lo que hemos montado hasta aquí —[reglas](/posts/claude-md-frontend), [hooks](/posts/claude-code-hooks), [skills](/posts/claude-code-skills), [subagentes](/posts/claude-code-subagentes)— vive en la máquina de quien lo configuró. Funciona bien y no escala: el compañero que no lo instaló abre PRs sin ninguna de esas comprobaciones.

CI es donde el criterio se vuelve del equipo. Y hay dos formas de llevarlo allí, con propósitos distintos:

| Forma                   | Qué es                                                       | Cuándo                                                                |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `claude-code-action@v1` | Acción de GitHub, responde a `@claude` o corre con un prompt | Revisiones de PR, responder issues, tareas conversacionales           |
| `claude -p`             | Modo no interactivo del CLI                                  | Comprobaciones scriptadas con salida estructurada que quieres parsear |

La primera comenta en el PR. La segunda devuelve JSON que puedes convertir en un check verde o rojo. Casi siempre acabas usando las dos.

## Puesta en marcha

La vía rápida es ejecutar `/install-github-app` dentro de una sesión de Claude Code: instala la app de GitHub en el repositorio y te guía para añadir el workflow y el secreto.

Manualmente son tres pasos: instalar la [app de GitHub](https://github.com/apps/claude), añadir `ANTHROPIC_API_KEY` a los secretos del repositorio y copiar un workflow a `.github/workflows/`.

El más simple, que responde a menciones:

```yaml
name: Claude Code
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

Con eso, escribir `@claude ¿por qué este componente vuelve a renderizar en cada tecla?` en un comentario del PR ya funciona. La acción detecta sola si debe correr en modo interactivo (responde a la mención) o automático (arranca con un `prompt`).

Si vienes de la beta, hay cambios que rompen: `@beta` pasa a `@v1`, `mode` desaparece porque se detecta solo, `direct_prompt` se llama ahora `prompt`, y opciones como `max_turns`, `model` o `custom_instructions` se mueven dentro de `claude_args`.

## Revisión automática con criterio frontend

Lo interesante no es la revisión genérica —esa la hace cualquier herramienta— sino la que conoce **tu** proyecto. Como la acción respeta el `CLAUDE.md` del repositorio, todas las convenciones que escribiste en el primer artículo de la serie ya están operando en CI sin repetirlas.

```yaml
name: Revisión frontend
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "src/**"
      - "package.json"

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Revisa el diff de este PR contra la rama base. Céntrate en:

            1. Accesibilidad: controles sin nombre accesible, div con onClick,
               foco no gestionado en diálogos.
            2. Rendimiento: componentes hidratados sin necesitarlo, imágenes sin
               dimensiones, dependencias nuevas (di cuánto pesan).
            3. Consistencia: colores literales en vez de tokens del sistema de
               diseño, componentes duplicados que ya existen.

            Informa solo de lo que un revisor humano pediría cambiar. Si un
            hallazgo es dudoso, dilo con su nivel de confianza en lugar de
            omitirlo. Nada de comentarios de estilo que ya cubre el formateador.
          claude_args: |
            --max-turns 10
            --model claude-sonnet-5
```

Tres decisiones que marcan la diferencia entre una revisión útil y ruido:

**Filtra por `paths`.** Un cambio en el README no necesita revisión de accesibilidad. Cada ejecución cuesta minutos de Actions y tokens.

**Cuidado con "solo lo importante".** Es contraintuitivo: pedir "informa solo de problemas graves" hace que el modelo filtre de verdad y el número de hallazgos baje, aunque los haya encontrado. Si quieres cobertura, pide que informe de todo con su nivel de severidad y confianza, y filtra tú después.

**Pon un techo con `--max-turns`.** Sin él, un PR grande puede convertirse en una sesión larga y cara.

## Convertir una skill en un job

Detalle poco conocido: el `prompt` acepta la invocación de una skill, no solo texto libre. Si ya tienes `.claude/skills/auditoria-a11y/`, no reescribas el procedimiento en el YAML — haz `checkout` y llámala.

```yaml
- uses: actions/checkout@v4

- uses: anthropics/claude-code-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    prompt: "/auditoria-a11y"
```

Esto es lo que hace que la serie encaje: el procedimiento se define **una vez** y corre igual en tu terminal y en CI. Cuando el checklist cambia, cambia en un sitio.

## El modo headless para comprobaciones duras

La acción comenta. Para **fallar el build** con una condición propia, el modo no interactivo del CLI es mejor herramienta, porque devuelve datos que puedes parsear.

El caso frontend por excelencia: el presupuesto de peso.

```yaml
- name: Presupuesto de bundle
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    npm ci && npm run build

    claude --bare -p "Analiza los archivos de dist/ y devuelve el peso
    total de JS y CSS en KB, y el archivo más pesado de cada tipo." \
      --allowedTools "Read,Glob,Bash(du *),Bash(ls *)" \
      --output-format json \
      --json-schema '{
        "type":"object",
        "properties":{
          "js_kb":{"type":"number"},
          "css_kb":{"type":"number"},
          "mayor_js":{"type":"string"}
        },
        "required":["js_kb","css_kb","mayor_js"]
      }' > out.json

    js=$(jq '.structured_output.js_kb' out.json)
    echo "JS total: ${js} KB"
    awk -v v="$js" 'BEGIN { exit (v <= 180) }' \
      && { echo "::error::Presupuesto de JS superado: ${js} KB > 180 KB"; exit 1; }
```

Cuatro cosas que hacen que esto funcione:

**`--bare`.** Salta el autodescubrimiento de hooks, skills, plugins, servidores MCP y `CLAUDE.md`. En CI eso es exactamente lo que quieres: el mismo resultado en cualquier máquina, sin que el `~/.claude` de nadie se cuele en el pipeline. Ojo: en modo bare no se usa el login por suscripción, así que `ANTHROPIC_API_KEY` es obligatorio.

**`--json-schema`.** Fuerza la forma de la salida. El resultado estructurado llega en el campo `structured_output`, así que `jq` funciona sin heurísticas de parseo.

**`--allowedTools` con reglas finas.** `Bash(du *)` permite cualquier comando que empiece por `du `. El espacio antes del asterisco es importante: sin él, `Bash(du*)` también aceptaría `duplicate-something`.

**Un umbral numérico.** El corte lo decide `awk`, no el modelo. El agente aporta el análisis; la política es tuya y es determinista. Es la misma frontera de los [hooks](/posts/claude-code-hooks).

## Controlar el coste desde el primer día

Un workflow con agente puede pasar de invisible a incómodo en una semana. Lo que funciona:

- **`--max-turns`** en todo lo que corra sin supervisión.
- **Filtros `paths`** para no revisar lo que no lo necesita.
- **Modelo por tarea**: un rastreo de texto hardcodeado no necesita el modelo más caro.
- **Control de concurrencia**, para que cinco pushes seguidos no lancen cinco revisiones del mismo PR.
- **Medir de verdad**: con `--output-format json`, la respuesta incluye `total_cost_usd` y un desglose por modelo. Guárdalo como artefacto y tendrás la cifra real en lugar de una sensación.

```yaml
concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

## Lo que no debe hacer un agente en CI

Merece una sección propia porque es el error caro.

**No le des permiso de escritura sobre `main`.** La revisión comenta; los arreglos van en una rama y pasan por review humano como cualquier otro cambio.

**No hagas que la revisión bloquee el merge.** Un agente que se equivoca y bloquea PRs se desactiva en dos semanas. Que informe. El check duro es el presupuesto de bundle, que es un número, no una opinión.

**No lo apuntes a secretos que no necesita.** Da al job los permisos mínimos: `contents: read` y `pull-requests: write` bastan para revisar y comentar.

Si tu pipeline maneja despliegues o accesos a repositorios privados, la parte de credenciales está más cerca de lo que cuento en [generar llaves SSH para GitHub y GitLab](/posts/ssh-github-gitlab) que de nada específico de agentes: los mismos principios de mínimo privilegio.

## Lo siguiente

CI cubre lo repetitivo y acotado. Lo que no cubre es el trabajo grande y puntual: migrar doscientos componentes, cambiar de librería de estilos, actualizar una API en todo el repositorio. Para eso ni el chat ni un workflow bastan — hace falta escribir el bucle tú. Es [el último artículo de la serie](/posts/claude-agent-sdk-migraciones).

---

Parte de [Claude Code para frontend engineers](/posts/claude-code-frontend). ¿Quieres esto montado en tu repositorio con presupuestos reales y coste bajo control? [Hablemos](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
