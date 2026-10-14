---
title: "Spec Kit, Kiro y OpenSpec: herramientas de SDD"
author: Codevs
pubDatetime: 2026-10-14T16:50:00Z
slug: sdd-herramientas
featured: false
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Config
description: "Comparativa de herramientas de Spec-Driven Development: GitHub Spec Kit, Kiro y OpenSpec. Qué decide cada una por ti y cuándo superan a un montaje propio."
series: "Spec-Driven Development con agentes"
seriesOrder: 7
---

En el [artículo anterior](/posts/sdd-claude-code) monté SDD a mano: cuatro skills, un subagente y un hook. Funciona y lo controlas entero. Pero hay herramientas que ya traen ese montaje hecho, y cada una toma decisiones distintas sobre cómo debe ser el flujo.

Las tres que merecen atención: **GitHub Spec Kit**, **Kiro** y **OpenSpec**. No son equivalentes: resuelven problemas distintos.

## Table of contents

## GitHub Spec Kit

**Qué es.** Un kit de código abierto de GitHub: una CLI (`specify`) que instala plantillas, scripts y comandos en tu repo para el agente que uses. Funciona con Claude Code, Copilot, Gemini CLI, Cursor y varios más. La estructura que he usado en toda la serie —`.specify/memory/constitution.md`, `specs/NNN-feature/`— es la suya.

**Arranque:**

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init reservas-clinica --ai claude
```

Eso genera los comandos en `.claude/commands/` y las plantillas en `.specify/templates/`. El flujo:

```text
/speckit.constitution   principios del proyecto
/speckit.specify        spec de la feature + rama NNN-slug
/speckit.clarify        preguntas para cerrar los [NEEDS CLARIFICATION]
/speckit.plan           plan, research, data-model, contracts, quickstart
/speckit.tasks          tasks.md con [P] y fases por historia
/speckit.analyze        consistencia entre spec, plan y tareas
/speckit.implement      ejecuta las tareas
```

(En las primeras versiones eran `/specify`, `/plan` y `/tasks` a secas; si ves tutoriales con esos nombres, es lo mismo.)

**Qué decide por ti:**

- Una carpeta por feature, numerada, con su rama.
- Plantillas largas y muy estructuradas, con secciones obligatorias y una checklist de calidad dentro.
- Test primero y _constitution check_ en cada plan.

**Dónde brilla.** Features nuevas de tamaño medio en un equipo que quiere un formato común sin diseñarlo. Las plantillas son buenas y están pensadas para que el agente no se salte pasos. `/speckit.analyze` es lo que yo hago con el subagente revisor, ya hecho.

**Dónde cojea.**

- **Verboso.** Una feature pequeña produce cinco o seis archivos y muchas líneas de markdown que alguien tiene que revisar. Para cambios pequeños es demasiado.
- **Pensado para greenfield.** Cada feature es una carpeta nueva; no hay un concepto nativo de "la spec actual del sistema" que se actualiza con cada cambio. Los repos con años de historia lo notan.
- **Plantillas genéricas.** La constitución de ejemplo trae principios de librería que tienes que reescribir.

## Kiro

**Qué es.** Un IDE agéntico de AWS (sobre Code OSS) con SDD integrado en la interfaz. En lugar de comandos, tienes un modo _Spec_ que guía la feature por tres documentos.

```bash
.kiro/
├── steering/              # contexto persistente del proyecto
│   ├── product.md
│   ├── tech.md
│   └── structure.md
└── specs/recordatorios-cita/
    ├── requirements.md    # historias + criterios en EARS
    ├── design.md          # arquitectura, modelo, diagramas
    └── tasks.md           # tareas con enlace a requisitos
```

**Qué decide por ti:**

- Tres fases, no cuatro: requisitos → diseño → tareas. La constitución se reparte entre los archivos de _steering_.
- **EARS obligatorio** en los requisitos. Es de donde lo tomé en el [artículo de la spec](/posts/sdd-escribir-spec).
- Tareas ejecutables desde la propia interfaz, una a una, con su estado.
- _Agent hooks_: automatizaciones que se disparan al guardar o crear archivos (actualizar tests, regenerar docs).

**Dónde brilla.** La experiencia es la más pulida: ves la spec, el diseño y las tareas como vistas del IDE, no como archivos que abres. Para quien empieza con SDD, es la curva más suave.

**Dónde cojea.** Te ata al IDE. Los archivos son markdown en el repo y se pueden leer desde otro agente, pero el flujo guiado vive en Kiro. Si tu equipo usa Claude Code en terminal o mezcla herramientas —como conté en [Antigravity y Claude Code en el mismo repo](/posts/antigravity-claude-code-juntos)—, es una pieza más que sincronizar.

## OpenSpec

**Qué es.** Una CLI ligera de código abierto (`npm install -g @fission-ai/openspec`) que parte de una idea distinta: **la spec describe el sistema tal como es, y cada cambio es una propuesta que la modifica**.

```bash
openspec/
├── project.md
├── specs/                         # verdad actual, por capacidad
│   └── reminders/spec.md
└── changes/
    └── add-reminder-opt-out/      # propuesta en curso
        ├── proposal.md            # por qué y qué cambia
        ├── tasks.md
        └── specs/reminders/spec.md   # delta: ADDED / MODIFIED / REMOVED
```

Un delta se ve así:

```markdown
## ADDED Requirements

### Requirement: Desactivar recordatorios

El sistema DEBERÁ permitir al paciente desactivar los recordatorios
desde el email, sin iniciar sesión.

#### Scenario: Pulsar el enlace de baja

- WHEN el paciente pulsa "No quiero más recordatorios"
- THEN no recibe recordatorios de sus citas futuras
```

Cuando el cambio se despliega, `openspec archive` fusiona el delta en `openspec/specs/` y mueve la propuesta al archivo. `openspec validate` comprueba el formato antes.

**Qué decide por ti:**

- Specs **por capacidad** (recordatorios, pagos, agenda), no por feature.
- Cambios como deltas revisables, al estilo de un PR sobre la documentación.
- Muy poca ceremonia: propuesta, tareas, delta. Sin plan ni research obligatorios.

**Dónde brilla.** Repos existentes. Puedes empezar documentando solo la capacidad que vas a tocar, y la spec se va completando con cada cambio en lugar de pudrirse en una carpeta `specs/017-…` que nadie vuelve a abrir. Es la mejor respuesta que he visto al problema que trato en [specs vivas](/posts/sdd-specs-vivas).

**Dónde cojea.** Menos guía para features grandes y nuevas: no hay fase de plan técnico estructurada ni _constitution check_. Si lo necesitas, lo añades tú.

## Comparativa

|            | Spec Kit                      | Kiro            | OpenSpec                       |
| ---------- | ----------------------------- | --------------- | ------------------------------ |
| Forma      | CLI + comandos                | IDE             | CLI + comandos                 |
| Agente     | Varios (Claude Code incluido) | El suyo         | Varios (Claude Code incluido)  |
| Unidad     | Feature                       | Feature         | Capacidad + cambio             |
| Fases      | 4 + clarify/analyze           | 3               | Propuesta → aplicar → archivar |
| Principios | Constitución                  | Steering        | `project.md`                   |
| Ceremonia  | Alta                          | Media           | Baja                           |
| Mejor en   | Greenfield, equipos           | Empezar con SDD | Brownfield                     |

## Cuál elegir

Mi criterio, en orden:

1. **¿Tu equipo vive en un IDE concreto y no lo vas a cambiar?** Si es Kiro, usa su modo Spec y no montes nada más.
2. **¿El repo tiene años y vas a tocar lo que ya existe?** OpenSpec. Las specs por capacidad con deltas son lo único que no se desincroniza.
3. **¿Features nuevas, equipo que necesita formato común ya?** Spec Kit. Reescribe la constitución y recorta las plantillas a la mitad.
4. **¿Ya tienes `.claude/` con skills y hooks y quieres control total?** El [montaje propio](/posts/sdd-claude-code). Es menos código que adaptar una herramienta a tus manías.

Y una combinación que funciona bien en la práctica: **plantillas de Spec Kit dentro de tus propias skills**. Copias `spec-template.md` y `plan-template.md`, las recortas, y las usas desde `/spec` y `/plan`. Te quedas con lo mejor de sus plantillas sin depender de su CLI.

## Lo que no importa tanto como parece

La herramienta. De verdad. Las tres producen markdown en el repo y las tres funcionan si la spec es buena; ninguna salva una spec vaga. Si dudas, empieza a mano con una feature, escribe la spec como en el [artículo 3](/posts/sdd-escribir-spec), y decide la herramienta cuando sepas qué te molesta del proceso.

## Siguiente paso

Queda la parte que decide si SDD sobrevive en tu equipo más de un mes: [specs vivas](/posts/sdd-specs-vivas), cómo adoptarlo en un repo existente y cuándo saltárselo.

---

Parte de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si no tienes claro qué herramienta encaja con tu equipo y tu repo, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
