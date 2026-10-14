---
title: "Del spec al plan técnico: SDD antes de escribir código"
author: Codevs
pubDatetime: 2026-10-14T16:20:00Z
slug: sdd-plan-tecnico
featured: false
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Config
description: "Cómo convertir una spec en un plan técnico en Spec-Driven Development: investigación, modelo de datos, contratos y constitution check antes del código."
series: "Spec-Driven Development con agentes"
seriesOrder: 4
---

La spec dice qué. El plan dice cómo. Y es el punto de la cadena donde más rinde tu atención: **un error de diseño detectado en el plan cuesta un comentario; detectado en el diff, cuesta deshacer 600 líneas**. Lo conté para Antigravity en [Artifacts: revisa el plan, no el diff](/posts/antigravity-artifacts-plan), y en SDD es aún más cierto porque el plan es un archivo versionado que puedes revisar en un PR.

A diferencia de la spec, el plan sí lo escribe el agente. Tu trabajo es darle buen material y revisarlo con criterio.

## Table of contents

## Qué produce la fase de plan

No un archivo, sino un pequeño conjunto:

```bash
specs/003-recordatorios-cita/
├── spec.md          # entrada (ya aprobada)
├── plan.md          # decisiones técnicas y estructura
├── research.md      # alternativas evaluadas y por qué se eligió una
├── data-model.md    # entidades, campos, estados y transiciones
├── contracts/       # API, eventos o esquemas que cruzan fronteras
│   └── reminder-job.schema.json
└── quickstart.md    # cómo probar la feature a mano, de punta a punta
```

Puede parecer mucho para una feature de recordatorios. No lo es: `data-model.md` tiene veinte líneas y `quickstart.md` diez. Lo que importa es que **cada tipo de decisión vive en un sitio**, así que el agente que implemente la tarea 14 lee solo lo que necesita.

## El prompt de entrada

La spec no lleva tecnología, así que el plan necesita que se la des tú. Un párrafo basta:

```text
Planifica specs/003-recordatorios-cita/spec.md.

Stack: Next.js 15 (App Router) + Prisma + PostgreSQL 16. Ya existe un
worker en apps/worker con BullMQ sobre Redis. Emails con Resend (ya
configurado para la confirmación de reserva). Despliegue en Railway.

Respeta .specify/memory/constitution.md. Si alguna decisión choca con un
principio, decláralo en Complexity Tracking en lugar de esquivarlo.
```

Fíjate en lo que **no** dice: no dice "usa un job programado por cita". Esa decisión se la dejas al plan para ver si llega solo y cómo la justifica.

## research.md: las alternativas, por escrito

Es la sección que separa un plan de una corazonada. Para cada decisión no trivial, el agente lista las opciones y elige:

```markdown
## Decisión: cómo disparar el envío

### Opción A — Cron cada 5 min que busca citas en ventana

- Simple, sin estado nuevo.
  − Precisión de ±5 min; consulta pesada con muchas clínicas.
  − Difícil garantizar RF-05 (un solo envío) sin un flag por cita.

### Opción B — Job retrasado en BullMQ al confirmar la cita ← elegida

- Precisión al segundo; el worker ya existe.
- Cancelar/reprogramar = borrar o mover el job (RF-04).
  − Si Redis pierde datos, se pierden recordatorios → mitigar con
  reconciliación diaria (ver Riesgos).

### Opción C — Servicio externo de scheduling

− Viola el principio III (tercer desplegable). Descartada.
```

Dos cosas que hacen bueno este bloque: cada pro y contra **cita un requisito de la spec** (RF-04, RF-05) y la opción descartada **cita la constitución**. Si el plan elige sin referenciar nada, el agente está improvisando.

## data-model.md: estados, no solo tablas

```markdown
## Reminder

| Campo         | Tipo         | Notas                             |
| ------------- | ------------ | --------------------------------- |
| id            | uuid         |                                   |
| appointmentId | uuid         | FK, único (RF-05)                 |
| scheduledFor  | timestamptz  | calculado con RF-02, RF-03, RF-07 |
| status        | enum         | ver transiciones                  |
| jobId         | text         | id del job en BullMQ              |
| sentAt        | timestamptz? |                                   |

### Transiciones

PENDING → SENT (worker envía con éxito)
PENDING → CANCELLED (cita cancelada o reprogramada — RF-04)
PENDING → FAILED (3 reintentos agotados)
SENT → (final)

Retención: se borra a los 90 días de sentAt (principio IV).
```

La restricción `único` sobre `appointmentId` es RF-05 hecho base de datos: aunque el worker tenga un bug, no puede haber dos recordatorios por cita. **Ese es el tipo de decisión que quieres ver en el plan**: requisitos de la spec convertidos en garantías estructurales, no en "el código tendrá cuidado".

## contracts/: lo que cruza fronteras

Aquí va todo lo que dos partes del sistema tienen que acordar: endpoints, payloads de eventos, esquemas de jobs. En el ejemplo, el payload del job:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ReminderJob",
  "type": "object",
  "required": ["reminderId", "appointmentId"],
  "properties": {
    "reminderId": { "type": "string", "format": "uuid" },
    "appointmentId": { "type": "string", "format": "uuid" }
  },
  "additionalProperties": false
}
```

Nada de email ni nombre del paciente en el payload: el worker los lee de la base de datos al ejecutar. Es el principio IV aplicado a una frontera donde sería fácil saltárselo (Redis no es un sitio donde quieras datos personales).

## plan.md: el resumen que une todo

```markdown
# Plan: Recordatorios de cita por email

## Resumen técnico

Job retrasado en BullMQ por cita confirmada. Tabla Reminder como fuente
de verdad. Reconciliación diaria para recuperar jobs perdidos.

## Constitution Check

(tabla principio por principio — ver artículo anterior)

## Estructura de cambios

apps/web/src/server/appointments/ ← hooks en confirmar/cancelar/reprogramar
apps/worker/src/jobs/reminder.ts ← nuevo
packages/db/prisma/schema.prisma ← modelo Reminder + migración
packages/emails/reminder.tsx ← plantilla

## Riesgos

- Pérdida de jobs en Redis → job de reconciliación 03:00 que re-encola
  Reminders PENDING sin job vivo.
- Horario de verano → calcular con la zona IANA de la clínica, nunca con
  offset fijo. Test específico.

## Complexity Tracking

| Desviación | Por qué | Alternativa descartada |
| ---------- | ------- | ---------------------- |
| (ninguna)  |         |                        |
```

La sección **Estructura de cambios** es la que más ayuda a revisar: ves de un vistazo si el agente va a tocar sitios que no esperabas.

## Cómo revisar un plan

Con la spec al lado, en este orden:

1. **Trazabilidad.** Cada RF de la spec aparece en al menos una decisión del plan. Un RF huérfano es un requisito que nadie va a implementar.
2. **Constitution check honesto.** Si todo es ✅ en una feature que añade un modelo, un job y una plantilla, desconfía y comprueba.
3. **Riesgos con mitigación.** Un riesgo sin mitigación es una nota, no un plan.
4. **Nada fuera de alcance.** Si el plan prepara "la base para SMS", recórtalo. La spec dijo que no.
5. **Estructura sin sorpresas.** Ningún archivo tocado que no entiendas por qué.

Un truco que funciona: pídele a un segundo agente, con contexto limpio, que audite el plan contra la spec y la constitución y liste solo inconsistencias. En Claude Code eso es un subagente, como conté en [subagentes en paralelo](/posts/claude-code-subagentes). Un revisor sin el historial de la conversación ve lo que el autor ya no ve.

## Lo que no va en el plan

- **Código.** Firmas de funciones sí, si son contrato. Implementaciones no: atan al agente a lo primero que se le ocurrió.
- **Pasos.** "Primero crea la migración, luego…" es la fase siguiente.
- **Teoría.** Si el plan explica qué es BullMQ, sobra un párrafo.

## Siguiente paso

Con el plan aprobado, toca convertirlo en trabajo ejecutable: [tareas e implementación](/posts/sdd-tareas-implementacion), donde el agente por fin escribe código, de una tarea en una tarea y con test primero.

---

Parte de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si quieres que alguien revise los planes de tu equipo antes de que se conviertan en deuda, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
