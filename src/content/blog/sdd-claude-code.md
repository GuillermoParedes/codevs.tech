---
title: "SDD en Claude Code con skills, subagentes y hooks"
author: Codevs
pubDatetime: 2026-10-14T16:40:00Z
slug: sdd-claude-code
featured: false
draft: false
tags:
  - SDD
  - Claude Code
  - IA
  - Config
description: "Cómo implementar Spec-Driven Development en Claude Code sin herramientas extra: skills /spec, /plan y /tasks, un subagente revisor y un hook que exige spec."
series: "Spec-Driven Development con agentes"
seriesOrder: 6
---

Todo lo que has visto en la serie se puede hacer con un chat y disciplina. El problema es la disciplina: el tercer día, con prisa, le dices al agente "añade esto rápido" y te saltas la spec. Lo que convierte SDD en hábito es que **el camino correcto sea también el más corto**.

En Claude Code eso se consigue con tres piezas que ya trae: skills para cada fase, un subagente que revisa con contexto limpio y un hook que bloquea código sin spec. Sin instalar nada.

## Table of contents

## La estructura en el repo

```bash
.claude/
├── skills/
│   ├── spec/SKILL.md        # /spec  → specs/NNN-x/spec.md
│   ├── plan/SKILL.md        # /plan  → plan.md, research.md, data-model.md…
│   ├── tasks/SKILL.md       # /tasks → tasks.md
│   └── implement/SKILL.md   # /implement → ejecuta tareas con checkpoints
├── agents/
│   └── spec-reviewer.md     # audita plan/tareas contra spec y constitución
├── hooks/
│   └── require-spec.sh      # bloquea Edit/Write sin spec aprobada
└── settings.json
.specify/
├── memory/constitution.md
└── templates/               # spec, plan y tasks en blanco
specs/
```

Las plantillas viven aparte de las skills a propósito: la skill dice **cómo** trabajar, la plantilla dice **qué forma** tiene el resultado. Si mañana cambias de agente, las plantillas siguen valiendo.

Si no has escrito skills todavía, [Skills de Claude Code: empaqueta tu criterio](/posts/claude-code-skills) cubre el formato; aquí voy directo al contenido.

## /spec

```markdown
---
name: spec
description: Crea la spec de una feature nueva en specs/NNN-slug/spec.md. Úsalo cuando el usuario pida una feature, no para bugs pequeños.
argument-hint: "<descripción de la feature>"
disable-model-invocation: true
---

# Crear spec

Feature pedida: $ARGUMENTS

1. Calcula NNN como el siguiente número libre en specs/. Deriva un slug
   kebab-case de 2–4 palabras. Crea la rama git `NNN-slug`.
2. Copia .specify/templates/spec.md a specs/NNN-slug/spec.md y rellénala.
3. Reglas:
   - Qué y por qué. Ninguna tecnología, librería ni nombre de archivo.
   - Requisitos en EARS con ID (RF-01…). Cada uno con disparador y
     resultado observable.
   - Historias con prioridad; la P1 debe ser entregable sola.
   - Casos límite: cancelación, datos ausentes, fallo externo, tiempo.
   - Lo que no sepas, NO lo supongas: márcalo
     `[NEEDS CLARIFICATION: pregunta]`. Máximo 4.
4. Haz las preguntas de clarificación de una en una, con 2–4 opciones y
   tu recomendación. Escribe cada respuesta en `## Clarificaciones` con
   fecha y elimina el marcador.
5. Termina con Estado: Lista para planificar. No escribas el plan.
```

`disable-model-invocation: true` hace que solo se dispare cuando tú escribes `/spec`. No quieres que el agente decida por su cuenta abrir una feature nueva en mitad de otra tarea.

## /plan

```markdown
---
name: plan
description: Genera el plan técnico de la spec de la rama actual.
argument-hint: "<stack y restricciones técnicas>"
disable-model-invocation: true
---

# Planificar

1. Localiza specs/<rama>/spec.md. Si tiene algún [NEEDS CLARIFICATION],
   para y dilo: no se planifica una spec abierta.
2. Lee .specify/memory/constitution.md.
3. Contexto técnico del usuario: $ARGUMENTS. Lee el código que vayas a
   tocar antes de decidir; no supongas estructura.
4. Escribe research.md (alternativas con pros/contras que citan RF-xx),
   data-model.md (entidades, estados, transiciones), contracts/ y
   quickstart.md.
5. Escribe plan.md con Constitution Check principio por principio.
   Un ❌ sin entrada en Complexity Tracking es un error: no termines así.
6. Lanza el subagente spec-reviewer sobre el resultado y corrige lo que
   encuentre antes de devolverme el control.
```

El paso 6 es el que más rinde de todo el montaje.

## El subagente revisor

```markdown
---
name: spec-reviewer
description: Audita plan.md o tasks.md contra spec.md y la constitución. Devuelve solo inconsistencias.
tools: Read, Grep, Glob
model: sonnet
---

Eres un revisor. No escribes ni propones código.

Recibes una carpeta specs/NNN-x/. Comprueba:

1. Cada RF de spec.md aparece en plan.md (y en tasks.md si existe).
2. Nada en plan.md o tasks.md contradice spec.md ni está en "Fuera de alcance".
3. El Constitution Check es honesto: verifica cada ✅ contra el plan.
4. Cada riesgo tiene mitigación.
5. En tasks.md: tests antes que implementación, [P] correctos,
   archivos nombrados.

Responde con una lista numerada de problemas, cada uno con archivo y
línea. Si no hay ninguno, responde "Sin inconsistencias." y nada más.
```

Dos decisiones deliberadas: **solo herramientas de lectura**, para que no "arregle" nada por su cuenta, y **contexto limpio**, porque no ha visto la conversación en la que el autor se convenció de sus propias decisiones. El patrón general está en [subagentes de Claude Code](/posts/claude-code-subagentes).

## /tasks y /implement

`/tasks` sigue las reglas del [artículo anterior](/posts/sdd-tareas-implementacion) y termina también llamando al revisor. `/implement` es el bucle:

```markdown
---
name: implement
description: Ejecuta las tareas pendientes de tasks.md de la rama actual.
argument-hint: "[ID de tarea o fase, opcional]"
disable-model-invocation: true
---

# Implementar

Para cada tarea pendiente (o solo $ARGUMENTS si se indica):

1. Lee la tarea y solo los artefactos que cita.
2. Test: escríbelo y ejecútalo; debe fallar por aserción, no por compilación.
3. Implementación: lo mínimo para pasar su test.
4. Verifica: test de la tarea, `npm run lint`, `npm run typecheck`.
5. Marca [x] en tasks.md y haz commit `feat(<área>): TNNN <resumen>`.

Para cuando:

- Llegues a un **Checkpoint**: entrega el resumen y espera.
- Una decisión cambie el plan: propón el cambio en plan.md y espera.
- Algo contradiga la spec: pregúntame. No cambies la spec tú.
```

Las tres condiciones de parada son la parte que más importa del archivo.

## El hook que hace cumplir el principio I

Un hook `PreToolUse` que se ejecuta antes de cada `Edit` o `Write`. Si estás en una rama de feature y el archivo que se va a tocar es código de aplicación, exige que exista la spec y que no tenga dudas abiertas.

```bash
#!/usr/bin/env bash
# .claude/hooks/require-spec.sh
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
branch=$(git rev-parse --abbrev-ref HEAD)

# Solo código de aplicación; specs, docs y config pasan siempre.
[[ "$file" =~ /(apps|packages)/.+/src/ ]] || exit 0
# Solo ramas de feature NNN-slug; main y fix/* quedan fuera.
[[ "$branch" =~ ^[0-9]{3}- ]] || exit 0

spec="specs/$branch/spec.md"
tasks="specs/$branch/tasks.md"

if [[ ! -f "$spec" ]]; then
  echo "No existe $spec. Ejecuta /spec antes de escribir código (constitución, principio I)." >&2
  exit 2
fi
if grep -q 'NEEDS CLARIFICATION' "$spec"; then
  echo "$spec tiene dudas abiertas. Resuélvelas antes de implementar." >&2
  exit 2
fi
if [[ ! -f "$tasks" ]]; then
  echo "No existe $tasks. Ejecuta /plan y /tasks primero." >&2
  exit 2
fi
```

Y su registro:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": ".claude/hooks/require-spec.sh" }
        ]
      }
    ]
  }
}
```

Con `exit 2`, Claude Code bloquea la herramienta y le pasa el mensaje de `stderr` al agente, que entiende qué falta y te propone ejecutar `/spec`. No es un muro; es una señal que redirige. El mecanismo completo está en [Hooks de Claude Code](/posts/claude-code-hooks).

Fíjate en las dos salidas tempranas: el hook **no** se mete con `main` ni con ramas `fix/*`. La excepción de los bugs pequeños que pusimos en la constitución se aplica aquí, en código.

## CLAUDE.md: una línea, no un capítulo

```markdown
## Flujo de trabajo

Features nuevas siguen SDD: /spec → /plan → /tasks → /implement.
Principios en .specify/memory/constitution.md. Bugs < 20 líneas: directo
en rama fix/\*, sin spec.
```

Nada más. Las skills tienen el procedimiento, la constitución los principios y el hook la garantía. Repetirlo en `CLAUDE.md` solo gasta contexto en cada sesión.

## Cómo queda una feature de principio a fin

```text
/spec Recordatorios de cita por email 24 h antes
   → 3 preguntas de clarificación, spec lista
/plan Next.js 15 + Prisma + BullMQ existente + Resend
   → plan + revisor: "RF-07 sin decisión en research.md" → corregido
/tasks
   → 21 tareas, 9 marcadas [P]
/implement Fase 1
/implement Fase 2
/implement Fase 3
   → Checkpoint H1 — revisas, pruebas el quickstart, sigues
```

Tu tiempo activo: la spec (veinte minutos), la revisión del plan (diez) y un checkpoint por historia. Todo lo demás es el agente trabajando contra criterios que tú fijaste.

## En CI

Lo reproducible va en CI, como en [Claude Code en CI](/posts/claude-code-github-actions). Para SDD, dos comprobaciones baratas en cada PR de una rama `NNN-*`: que exista `specs/NNN-*/spec.md` sin marcadores abiertos, y que todas las casillas de `tasks.md` estén en `[x]` antes del merge. Diez líneas de bash en un _job_.

## Siguiente paso

Esto es el montaje propio. En el [siguiente artículo](/posts/sdd-herramientas) comparo con las herramientas que empaquetan SDD —Spec Kit, Kiro y OpenSpec— y cuándo te conviene adoptar una en lugar de mantener esto.

---

Parte de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si quieres este `.claude/` montado y ajustado a tu repositorio, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
