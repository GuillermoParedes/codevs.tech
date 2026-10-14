---
title: "Tareas e implementación: el bucle que cierra SDD"
author: Codevs
pubDatetime: 2026-10-14T16:30:00Z
slug: sdd-tareas-implementacion
featured: false
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Contexto
description: "Cómo pasar del plan al código en Spec-Driven Development: tasks.md con dependencias y paralelismo, test primero, un commit por tarea y checkpoints humanos."
series: "Spec-Driven Development con agentes"
seriesOrder: 5
---

Hasta aquí no se ha escrito una línea de código, y es a propósito. Ahora sí. Pero no se le dice al agente "implementa el plan": eso es devolverle la feature entera en una sola petición y volver al caos del principio con mejor documentación.

Se descompone el plan en **tareas atómicas**, se ordenan por dependencias y se ejecutan una a una, cada una con su test, su verificación y su commit.

## Table of contents

## Qué es una tarea atómica

Una tarea que cumple las cuatro:

1. **Toca pocos archivos**, idealmente uno o dos, y los nombra.
2. **Se verifica sola**: hay un comando que dice si está hecha.
3. **Cabe en una sesión corta** del agente sin que tenga que compactar contexto.
4. **Se puede revertir sin arrastrar a otras**: un commit, un `git revert`.

"Implementar el worker de recordatorios" no es atómica. "Crear `apps/worker/src/jobs/reminder.ts` que lee el Reminder, comprueba `status = PENDING`, envía con Resend y marca `SENT`; pasa `reminder.test.ts`" sí.

## tasks.md

El formato que funciona, con el ejemplo de la serie:

```markdown
# Tareas: Recordatorios de cita por email

Formato: `[ID] [P?] [Historia] Descripción — archivo`
[P] = paralelizable (archivos distintos, sin dependencia pendiente)

## Fase 1 — Base

- [ ] T001 Modelo Reminder + enum + índice único en appointmentId — packages/db/prisma/schema.prisma
- [ ] T002 Migración y seed de prueba — packages/db/prisma/migrations/
- [ ] T003 [P] Función pura computeScheduledFor(cita, clínica) — packages/core/reminders/schedule.ts

## Fase 2 — Tests primero (H1) ⚠️ deben fallar antes de la fase 3

- [ ] T004 [P] [H1] Tests de computeScheduledFor: 24 h, 48 h, franja nocturna, DST — schedule.test.ts
- [ ] T005 [P] [H1] Test de integración: confirmar cita crea Reminder + job — appointments.int.test.ts
- [ ] T006 [P] [H1] Test del job: envía una vez, idempotente ante reintento — reminder.test.ts

## Fase 3 — Implementación H1

- [ ] T007 [H1] Implementar computeScheduledFor hasta pasar T004 — schedule.ts
- [ ] T008 [H1] Hook en confirmAppointment: crear Reminder y encolar — confirm.ts
- [ ] T009 [H1] Job reminder.ts hasta pasar T006 — apps/worker/src/jobs/reminder.ts
- [ ] T010 [P] [H1] Plantilla de email con hora y zona explícita (RF-02) — packages/emails/reminder.tsx

**Checkpoint H1** — quickstart.md pasos 1–4 a mano. Revisión humana.

## Fase 4 — Cancelación y reprogramación (RF-04)

- [ ] T011 [H1] Test: cancelar borra job y marca CANCELLED — cancel.int.test.ts
- [ ] T012 [H1] Implementar en cancel.ts y reschedule.ts

## Fase 5 — H2 Desactivar recordatorios

…

## Fase final — Robustez

- [ ] T020 Job de reconciliación diaria — apps/worker/src/jobs/reconcile-reminders.ts
- [ ] T021 Métrica reminders_sent_total{status} (principio V)
```

Las decisiones que hay detrás del formato:

- **Agrupado por historia.** Al terminar la fase 3 tienes la H1 entregable, como exigía la spec. Si el proyecto se para ahí, has desplegado valor.
- **Tests en su propia fase y antes.** Es el principio II de la constitución hecho estructura. El agente no puede "olvidarse" de escribir tests después, porque los tests van antes.
- **`[P]` explícito.** Dice qué se puede lanzar en paralelo. T003 y T004–T006 tocan archivos distintos; T007 depende de T004. Con varios agentes o worktrees —lo conté en [herdr con agentes y worktrees](/posts/herdr-agentes-worktrees)— los `[P]` son el reparto.
- **Checkpoints.** Puntos donde el agente para y tú miras. No en cada tarea, que sería microgestión; al final de cada historia.

## Generar tasks.md

Lo genera el agente a partir de `plan.md`, `data-model.md` y `contracts/`. Las reglas que meto en el prompt (o en el comando, como veremos en [SDD en Claude Code](/posts/sdd-claude-code)):

```text
- Cada tarea nombra el archivo exacto que crea o modifica.
- Tests antes que implementación, dentro de cada historia.
- Marca [P] solo si no comparte archivo ni depende de una tarea pendiente.
- Cada RF de la spec aparece en al menos una tarea; lista al final los que no.
- Nada que no esté en el plan.
```

La penúltima línea es la que detecta huecos: si el agente te dice "RF-07 no tiene tarea", el plan se quedó corto y conviene volver un paso atrás antes de implementar.

## El bucle de implementación

Para cada tarea, el mismo ciclo:

```text
1. Leer la tarea y SOLO los artefactos que cita (spec, plan, contrato).
2. Si es de test: escribirlo y comprobar que FALLA por la razón correcta.
3. Si es de implementación: escribir lo mínimo para que pase su test.
4. Verificar: tests de la tarea + lint + typecheck.
5. Marcar [x] en tasks.md.
6. Commit: "feat(reminders): T009 job de envío idempotente".
```

Tres detalles que marcan la diferencia:

**"Falla por la razón correcta".** Un test que falla porque no compila no prueba nada. El agente tiene que ver el fallo de aserción esperado. Pídelo explícitamente o te encontrarás tests que pasan desde el primer día porque no comprueban nada.

**Leer solo lo citado.** La tarea T010 necesita la plantilla y RF-02. No necesita el modelo de datos ni la reconciliación. Cargar menos contexto es la diferencia entre un agente que se mantiene enfocado veinte tareas y uno que se pierde en la décima; es la tesis de [la ventana de contexto](/posts/ventana-de-contexto).

**Un commit por tarea.** Barato y lo que te salva: si T012 rompe algo, `git revert` de un commit y sigues. Y el historial cuenta la feature tarea a tarea, con el ID que la enlaza a `tasks.md`.

## Cuándo parar y volver atrás

El agente va a encontrar cosas que el plan no previó. La regla:

- **Detalle de implementación** (un nombre, un helper) → lo resuelve y sigue.
- **Cambia una decisión del plan** (otra tabla, otra librería) → para, propone el cambio en `plan.md` y espera.
- **Contradice la spec** (un caso límite imposible) → para y te pregunta. La spec la cambias tú.

Esto va escrito en el prompt de implementación. Sin esa regla, el agente "arregla" la discrepancia en el código y la spec deja de describir lo que hay, que es justo el problema que trato en [specs vivas](/posts/sdd-specs-vivas).

## El checkpoint humano

Al final de cada historia, el agente se detiene y te entrega:

```markdown
## Checkpoint H1

Tareas: T001–T010 ✅
Tests: 14 nuevos, todos verdes. Cobertura de schedule.ts 100 %.
Quickstart: pasos 1–4 ejecutados en local; captura del email en
specs/003-recordatorios-cita/evidence/h1-email.png
Desviaciones del plan: ninguna.
Pendiente de decisión: ninguno.
```

Revisas eso, haces la prueba del quickstart tú mismo si la feature lo merece, y das paso a la siguiente historia. Diez minutos por historia, frente a una hora revisando un diff gigante al final.

## Errores comunes

- **Tareas demasiado grandes.** Si una tarea necesita más de 200 líneas, son dos.
- **Ignorar `[P]` y hacerlo todo en serie.** Funciona, pero desaprovechas lo mejor de tener tareas independientes.
- **No marcar `[x]`.** `tasks.md` es el estado de la feature. Si no se actualiza, la siguiente sesión del agente empieza a ciegas.
- **Saltarse el checkpoint "porque los tests pasan".** Los tests verifican lo que la spec dice; el checkpoint verifica que la spec decía lo correcto.

## Siguiente paso

Hasta aquí, el método. En el [siguiente artículo](/posts/sdd-claude-code) lo montamos entero en Claude Code: comandos, subagente planificador y un hook que impide escribir código sin spec.

---

Parte de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si quieres un flujo de tareas así funcionando en tu equipo, con agentes en paralelo y checkpoints claros, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
