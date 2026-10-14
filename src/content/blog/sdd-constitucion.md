---
title: "La constitución en SDD: reglas que el agente no negocia"
author: Codevs
pubDatetime: 2026-10-14T16:00:00Z
slug: sdd-constitucion
featured: false
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Config
description: "Qué es la constitución en Spec-Driven Development, en qué se diferencia de CLAUDE.md y cómo convertir sus principios en puertas que todo plan debe pasar."
series: "Spec-Driven Development con agentes"
seriesOrder: 2
---

Antes de escribir la primera spec hay que responder una pregunta que casi nadie se hace: **¿qué decisiones ya están tomadas en este proyecto y no se vuelven a discutir en cada feature?** Que usamos PostgreSQL. Que no se añaden dependencias sin justificarlo. Que todo endpoint tiene test de integración. Que los datos de pacientes no salen nunca en logs.

Si eso no está escrito, el agente lo redecide en cada plan. A veces acierta. La constitución es el archivo donde lo escribes una vez.

## Table of contents

## Qué es la constitución

Es un markdown corto con los **principios no negociables** del proyecto. El nombre viene de Spec Kit, que lo guarda en `.specify/memory/constitution.md`, pero el concepto es independiente de la herramienta.

Tiene tres propiedades que lo distinguen de cualquier otro documento del repo:

1. **Cambia poco.** Se escribe al adoptar SDD y se enmienda pocas veces al año, con versión y fecha.
2. **Se cita en cada plan.** El plan técnico de cada feature tiene una sección que comprueba, principio por principio, que no viola ninguno.
3. **Es verificable.** Cada principio está escrito de forma que un revisor —humano o agente— pueda decir "cumple" o "no cumple" sin interpretar.

## Constitución vs. CLAUDE.md

Es la confusión número uno, porque los dos son markdown que el agente lee. La frontera:

|               | `CLAUDE.md` / `AGENTS.md`                 | Constitución                                           |
| ------------- | ----------------------------------------- | ------------------------------------------------------ |
| Para qué      | Cómo trabajar en el repo hoy              | Qué principios rigen el diseño                         |
| Contenido     | Comandos, rutas, trampas, convenciones    | Restricciones arquitectónicas y de calidad             |
| Cuándo se lee | Siempre, en cada sesión                   | Al planificar y al revisar un plan                     |
| Cambia        | Cada semana                               | Pocas veces al año, con versión                        |
| Ejemplo       | "Corre `npm run build` antes de terminar" | "Toda funcionalidad nueva empieza como test que falla" |

Regla de bolsillo: si la frase habla de **comandos o archivos**, va en `CLAUDE.md`. Si habla de **cómo debe ser el sistema**, va en la constitución. Lo que ya tienes en `CLAUDE.md` sobre arquitectura probablemente esté en el sitio equivocado; lo desarrollé en [CLAUDE.md como contrato de tu sistema de diseño](/posts/claude-md-frontend).

Y no dupliques: el `CLAUDE.md` enlaza la constitución con una línea ("Los principios de diseño están en `.specify/memory/constitution.md`; léela antes de planificar") y no la copia.

## Una constitución real

Para la app de reservas del ejemplo de la serie:

```markdown
# Constitución — reservas-clinica

Versión 1.2.0 · Ratificada 2026-09-01 · Última enmienda 2026-10-02

## I. Spec antes que código

Ninguna feature se implementa sin `spec.md` aprobada en `specs/NNN-*/`.
Los bugs de menos de 20 líneas están exentos.

## II. Test primero (no negociable)

Cada criterio de aceptación de la spec tiene un test que se escribe y
falla antes de la implementación. Sin test rojo previo, la tarea no empieza.

## III. Simplicidad

- Máximo 2 proyectos desplegables (web + worker). Un tercero requiere enmienda.
- Ninguna dependencia nueva sin entrada en "Complexity Tracking" del plan
  explicando qué alternativa sin dependencia se descartó.
- Nada de capas de abstracción "por si acaso": se abstrae al tercer uso.

## IV. Datos de pacientes

- Ningún dato personal (nombre, email, teléfono) en logs, métricas ni errores.
- Toda tabla con datos personales declara su política de retención.

## V. Observabilidad

Todo proceso en segundo plano expone éxito/fallo como métrica y tiene
reintentos idempotentes.

## Gobierno

Las enmiendas se hacen por PR que modifica este archivo, sube la versión
(semver: MAJOR si elimina o redefine un principio) y actualiza las
plantillas afectadas.
```

Cinco principios. No veinte. Cada uno es comprobable: un revisor puede mirar un plan y decir "el principio III falla, añade una dependencia sin justificar".

## Cómo escribir buenos principios

**Prohibiciones y mínimos, no aspiraciones.** "El código debe ser mantenible" no lo puede verificar nadie. "Máximo 2 proyectos desplegables" sí.

**Con su excepción explícita.** El principio I exime los bugs pequeños. Sin esa línea, el agente te pedirá una spec para corregir un typo, o peor, aprenderá que la regla se salta cuando estorba.

**Con su porqué cuando no es obvio.** El principio IV no necesita explicación. Uno como "nada de ORMs alternativos a Prisma" sí: "migramos de TypeORM en 2025 y no queremos convivir con dos". El porqué es lo que impide que te lo reproponga.

**Pocos.** Cada principio es una puerta que pasa cada plan. Con quince, el _constitution check_ se convierte en una lista que el agente marca sin leer.

## De principio a puerta

La constitución sirve de algo cuando se **aplica**, y se aplica en el plan. Cada `plan.md` arranca con una sección así:

```markdown
## Constitution Check

| Principio                | Estado | Nota                                                      |
| ------------------------ | ------ | --------------------------------------------------------- |
| I. Spec antes que código | ✅     | specs/003-recordatorios-cita/spec.md aprobada             |
| II. Test primero         | ✅     | 7 criterios → 7 tests en tasks.md fase 2                  |
| III. Simplicidad         | ⚠️     | Añade `@react-email/components` — ver Complexity Tracking |
| IV. Datos de pacientes   | ✅     | El worker loguea appointmentId, nunca el email            |
| V. Observabilidad        | ✅     | Métrica reminders_sent_total{status}                      |
```

El ⚠️ no bloquea: obliga a justificar. Y la justificación queda escrita, así que dentro de seis meses alguien sabrá por qué está esa dependencia.

Lo que **sí** bloquea es un ❌ sin justificación. Esa regla va en la plantilla del plan y en el prompt del comando que lo genera, como veremos en [SDD en Claude Code](/posts/sdd-claude-code).

## Generarla con el agente (y revisarla tú)

No hace falta escribirla desde cero. Un prompt que funciona:

```text
Lee el repositorio (package.json, prisma/schema.prisma, la estructura de
src/, los últimos 50 commits y CLAUDE.md). Propón una constitución de
máximo 6 principios con este formato: nombre, regla verificable, excepción
si la hay, y porqué si no es obvio. Marca con [CONFIRMAR] todo principio
que estés infiriendo y no esté explícito en el código o en los docs.
```

El `[CONFIRMAR]` es la parte importante. El agente va a inferir principios del código existente, y el código existente incluye tus errores. Que "todos los servicios usan `any` en los errores" no lo convierte en principio.

## Errores comunes

- **Copiar la constitución de ejemplo de Spec Kit.** Trae principios pensados para librerías ("todo es una CLI") que no aplican a tu app web.
- **Meter convenciones de estilo.** "Usa camelCase" es trabajo del linter, no de la constitución.
- **No versionarla.** Si un plan de hace tres meses pasó el check con la v1.0 y hoy la v1.3 lo rechazaría, necesitas saberlo.

## Siguiente paso

Con los principios escritos, toca la pieza central: [la spec de la feature](/posts/sdd-escribir-spec), donde se decide qué se construye antes de pensar en cómo.

---

Parte de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si quieres la constitución de tu proyecto escrita y conectada con tus plantillas, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
