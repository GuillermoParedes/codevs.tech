---
title: "Cómo escribir una spec que el agente no malinterprete"
author: Codevs
pubDatetime: 2026-10-14T16:10:00Z
slug: sdd-escribir-spec
featured: false
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Contexto
description: "Cómo escribir una spec para Spec-Driven Development: historias de usuario, requisitos EARS, criterios de aceptación comprobables y marcadores de duda."
series: "Spec-Driven Development con agentes"
seriesOrder: 3
---

La spec es el único artefacto de SDD que no puede escribir el agente solo. Puede redactarla, puede proponer casos que no viste, puede detectar contradicciones. Pero la decisión de **qué se construye y para quién** es tuya, y si la delegas entera vuelves al problema de partida: el agente decide por ti, solo que ahora lo hace por escrito.

Este artículo es cómo escribirla para que sirva de entrada a una máquina sin dejar de ser legible para una persona.

## Table of contents

## La regla que lo ordena todo: qué y por qué, nunca cómo

Una spec no menciona tecnología. Ni Next.js, ni Prisma, ni "un cron". Eso es el plan.

La razón no es purismo. Es que **en cuanto escribes "un cron que cada 15 minutos…" has cerrado el diseño** y el agente ya no va a evaluar alternativas (una cola con jobs programados, un evento al crear la cita). Y peor: la spec deja de servir si cambias de stack, cuando debería ser lo más estable de la feature.

Prueba rápida: si una frase de tu spec seguiría siendo cierta reimplementando todo en otro lenguaje, va en la spec. Si no, va en el plan.

## La estructura

```markdown
# Feature: Recordatorios de cita por email

Rama: 003-recordatorios-cita · Estado: Borrador · Fecha: 2026-10-14

## Contexto y objetivo

## Historias de usuario

## Requisitos funcionales

## Casos límite

## Fuera de alcance

## Criterios de éxito

## Dudas abiertas
```

Siete secciones. Las vemos con el ejemplo de la serie.

## Contexto y objetivo

Dos o tres frases. El problema de negocio, no la solución.

```markdown
## Contexto y objetivo

El 18 % de las citas de la clínica terminan en no-show. Recordar la cita
por email con antelación reduce esa tasa. El objetivo es bajar los
no-shows por debajo del 10 % en tres meses sin generar quejas por spam.
```

Esa última cláusula ("sin generar quejas por spam") va a condicionar media spec. Si no la escribes, el agente optimizará solo la primera parte.

## Historias de usuario con prioridad

Cada historia es independiente y tiene prioridad. **La P1 sola tiene que ser un producto entregable**: si mañana se acaba el tiempo, se despliega la P1 y aporta valor.

```markdown
### H1 — Recibir recordatorio (P1)

Como paciente con una cita reservada, quiero recibir un email 24 horas
antes para no olvidarla.

Prueba independiente: reservar una cita para mañana a las 10:00 y
comprobar que llega un email hoy a las 10:00 con fecha, hora, profesional
y dirección.

### H2 — Desactivar recordatorios (P2)

Como paciente, quiero poder dejar de recibir recordatorios desde el
propio email, sin iniciar sesión.

### H3 — Configurar antelación por clínica (P3)

Como administrador de la clínica, quiero elegir si el recordatorio sale
24 h o 48 h antes.
```

La línea "Prueba independiente" no es decorativa: es lo que convierte cada historia en algo que se puede demostrar en una demo, y el agente la usará para escribir el test de extremo a extremo.

## Requisitos funcionales en notación EARS

Aquí está la precisión. EARS (_Easy Approach to Requirements Syntax_) es una plantilla de los años 2000 para requisitos sin ambigüedad, y la usa Kiro por defecto. Tiene cinco formas; en español quedan así:

| Forma     | Plantilla                                      |
| --------- | ---------------------------------------------- |
| Siempre   | EL SISTEMA DEBERÁ …                            |
| Evento    | CUANDO \<disparador\>, EL SISTEMA DEBERÁ …     |
| Estado    | MIENTRAS \<estado\>, EL SISTEMA DEBERÁ …       |
| Indeseado | SI \<condición\>, ENTONCES EL SISTEMA DEBERÁ … |
| Opcional  | DONDE \<característica\>, EL SISTEMA DEBERÁ …  |

Aplicado:

```markdown
## Requisitos funcionales

- **RF-01** CUANDO falten 24 h para una cita confirmada, EL SISTEMA DEBERÁ
  enviar un email de recordatorio al paciente.
- **RF-02** EL SISTEMA DEBERÁ expresar la hora de la cita en la zona
  horaria de la clínica, indicándola explícitamente.
- **RF-03** SI el envío calculado cae entre las 22:00 y las 08:00 hora de
  la clínica, ENTONCES EL SISTEMA DEBERÁ adelantarlo a las 21:00 del día
  anterior.
- **RF-04** SI la cita se cancela o reprograma antes del envío, ENTONCES
  EL SISTEMA NO DEBERÁ enviar el recordatorio original.
- **RF-05** EL SISTEMA DEBERÁ enviar como máximo un recordatorio por cita.
- **RF-06** CUANDO el paciente pulse "No quiero más recordatorios",
  EL SISTEMA DEBERÁ desactivarlos para todas sus citas futuras.
- **RF-07** DONDE la clínica haya configurado 48 h, EL SISTEMA DEBERÁ usar
  esa antelación en lugar de 24 h.
```

Fíjate en lo que fuerza la plantilla: cada requisito tiene **un disparador y un resultado observable**. "El sistema debería ser fiable" no cabe en EARS. Y cada uno lleva ID, que es lo que permite trazarlo en el plan, en las tareas y en los tests.

## Casos límite

La sección que más valor aporta y la que más gente se salta. Aquí es donde el agente, por su cuenta, inventaría.

```markdown
## Casos límite

- Cita reservada con menos de 24 h de antelación → no se envía
  recordatorio (la confirmación de reserva ya cumple esa función).
- Paciente sin email → no se envía; no es un error.
- El proveedor de email falla → se reintenta; ver RF-05 (nunca dos).
- Cambio de horario de verano entre la reserva y la cita → la hora
  del email es la hora local real de la cita.
```

Cada línea de esta lista es una decisión de producto. Si no la tomas tú, la toma el modelo, y la tomará según lo que vio más veces en internet.

## Fuera de alcance

```markdown
## Fuera de alcance

- SMS y WhatsApp (feature 007).
- Recordatorios al profesional.
- Plantillas editables por la clínica.
```

Es la sección que impide que el agente "aproveche" para añadir SMS ya que estaba. También es la que más discusiones de alcance ahorra con el cliente.

## Criterios de éxito

Medibles y sin tecnología:

```markdown
## Criterios de éxito

- CE-01: El 99 % de los recordatorios se envían dentro de ±10 min de la
  hora programada.
- CE-02: Cero recordatorios duplicados en 30 días de producción.
- CE-03: Tasa de no-show < 10 % a los 90 días.
```

CE-01 y CE-02 se pueden verificar en staging. CE-03 solo en producción, y está bien que esté: es el porqué de la feature.

## El marcador que evita inventar: `[NEEDS CLARIFICATION]`

La regla más útil de toda la plantilla de Spec Kit: **cuando falte información, el agente no la supone, la marca**.

```markdown
- **RF-08** EL SISTEMA DEBERÁ incluir un enlace para cancelar la cita
  [NEEDS CLARIFICATION: ¿cancelar sin login es aceptable para la clínica,
  o exige autenticación?]
```

Si redactas la spec con el agente, mete esa regla en el prompt y limita el número —tres o cuatro como mucho—, o te devolverá una spec que es solo preguntas. Después viene la fase de clarificación: el agente te hace las preguntas una a una, idealmente con opciones, y **escribe tus respuestas en la propia spec**, en una sección `## Clarificaciones` con fecha. Así la decisión queda en el archivo y no perdida en el chat.

Una spec está lista para planificar cuando no le queda ningún `[NEEDS CLARIFICATION]`.

## La revisión: cinco preguntas

Antes de pasar al plan, léela con esto:

1. ¿Hay alguna palabra de tecnología? Fuera.
2. ¿Cada requisito tiene disparador y resultado observable?
3. ¿Cada historia P1 se puede demostrar sola?
4. ¿Los casos límite cubren cancelación, ausencia de datos, fallo externo y tiempo?
5. ¿"Fuera de alcance" nombra lo que el agente tendría tentación de añadir?

Si la respuesta a las cinco es sí, la spec cabe en una pantalla y media y vale más que cualquier prompt largo. Es la misma idea que expliqué en [Context engineering práctico](/posts/context-engineering-practico): contexto denso y estable en lugar de conversación.

## Siguiente paso

Con el qué cerrado, el agente ya puede proponer el cómo. Es el [plan técnico](/posts/sdd-plan-tecnico), donde por fin aparecen Prisma, el worker y la librería de emails.

---

Parte de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si quieres que tu equipo escriba specs así —plantilla, ejemplos y revisión de las primeras—, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
