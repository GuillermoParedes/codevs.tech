---
title: "Specs vivas: brownfield, drift y cuándo no usar SDD"
author: Codevs
pubDatetime: 2026-10-14T17:00:00Z
slug: sdd-specs-vivas
featured: false
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Contexto
description: "Cómo mantener vivas las specs en Spec-Driven Development: adoptar SDD en un repo existente, evitar que spec y código diverjan y cuándo no usarlo."
series: "Spec-Driven Development con agentes"
seriesOrder: 8
---

SDD no fracasa el primer día. Fracasa el tercer mes, cuando alguien abre `specs/003-recordatorios-cita/spec.md` para entender por qué el sistema hace algo y descubre que el sistema ya no hace eso. Desde ese momento nadie se fía de las specs, nadie las actualiza, y vuelves a programar a base de conversación.

Este último artículo es cómo evitarlo: qué hacer con un repo que ya existe, cómo impedir que la spec y el código se separen y dónde está el umbral para no usar SDD en absoluto.

## Table of contents

## El problema: dos tipos de spec

Hay una distinción que la mayoría de equipos descubre tarde:

- **Spec de cambio**: describe una feature mientras se construye. `specs/003-recordatorios-cita/` es de este tipo. Su vida útil es la de la feature.
- **Spec de sistema**: describe cómo se comporta hoy una capacidad. "Recordatorios" en general, con todo lo que se le ha ido añadiendo.

El flujo de Spec Kit genera las primeras. El problema es que **lo que consultas dentro de seis meses es la segunda**. Si solo tienes specs de cambio, para saber cómo funcionan los recordatorios hoy tienes que leer `003`, luego `011` (que añadió SMS), luego `014` (que cambió la antelación) y reconstruir mentalmente el resultado. Nadie lo hace.

## La solución: archivar en la spec de sistema

La regla que lo arregla, tomada de [OpenSpec](/posts/sdd-herramientas): **al cerrar una feature, su spec se fusiona en la spec de la capacidad**.

```bash
docs/capabilities/
├── reminders.md        # cómo funcionan los recordatorios HOY
├── appointments.md
└── billing.md
specs/
├── 003-recordatorios-cita/   # spec de cambio, archivada
└── 011-recordatorios-sms/    # en curso
```

El último paso de `/implement` —o un `/archive` aparte— hace esto:

```text
1. Lee specs/<rama>/spec.md y docs/capabilities/<capacidad>.md.
2. Fusiona: añade requisitos nuevos, sustituye los modificados, borra
   los eliminados. Conserva los IDs; los nuevos siguen la numeración.
3. Añade al final de la capacidad: "Historial: 011-recordatorios-sms
   (2026-11-03)".
4. Marca la spec de cambio como Estado: Archivada.
```

Así la spec de cambio queda como registro de la decisión y la de capacidad como verdad actual. Y el agente, cuando vaya a tocar recordatorios, lee **un** archivo en lugar de cinco. Es el mismo principio de [memoria vs. contexto](/posts/memoria-vs-contexto): lo que persiste tiene que estar consolidado, no apilado.

## El drift: cuando el código cambia sin la spec

Pasa por tres vías, y cada una tiene su freno.

**1. El agente "arregla" una discrepancia en el código.** Durante la implementación encuentra que un requisito no encaja y lo resuelve a su manera. Freno: la condición de parada del [bucle de implementación](/posts/sdd-tareas-implementacion) — si algo contradice la spec, para y pregunta.

**2. Un bugfix cambia el comportamiento.** Alguien corrige un bug en `fix/*`, sin spec (como permite la constitución), y el fix altera algo que la spec describía. Freno: en la revisión del PR, una pregunta fija — "¿cambia esto algún requisito de `docs/capabilities/`?". Si sí, el PR actualiza también la capacidad.

**3. Nadie mira.** Freno: una comprobación automática. Un job semanal en CI con un agente que, para cada capacidad, lee la spec y el código y reporta divergencias:

```text
Para docs/capabilities/reminders.md: verifica cada requisito contra el
código en apps/worker/src/jobs/ y apps/web/src/server/appointments/.
Por cada requisito responde: cumple / divergente (con archivo:línea) /
no encontrado. No propongas cambios. Abre un issue si hay divergentes.
```

No necesita ser perfecto. Necesita existir, porque la mera posibilidad de que alguien compare hace que se mantengan las specs. Cómo montarlo está en [Claude Code en CI](/posts/claude-code-github-actions).

## Adoptar SDD en un repo existente

El error típico es intentar documentar todo el sistema antes de empezar. Son semanas de trabajo que nadie valida y que se quedan obsoletas mientras las escribes.

Lo que funciona, por orden:

**Semana 1: la constitución.** Generada con el agente leyendo el repo y revisada por ti, como en el [artículo 2](/posts/sdd-constitucion). Es lo único que se hace "de golpe".

**Siguiente feature: spec de cambio + spec de capacidad mínima.** Antes de la spec de la feature, pídele al agente que documente **solo la capacidad que vas a tocar**, tal como está hoy:

```text
Lee el código de recordatorios (apps/worker/src/jobs/reminder*.ts y sus
llamadas). Escribe docs/capabilities/reminders.md describiendo el
comportamiento ACTUAL en EARS, con IDs. Marca [VERIFICAR] todo lo que
deduzcas pero no puedas confirmar con un test existente.
```

Revisas los `[VERIFICAR]` —ahí suelen estar los bugs que nadie sabía que existían— y ya tienes la base sobre la que la spec de cambio escribe su delta.

**A partir de ahí: crece con el trabajo.** Cada feature documenta la capacidad que toca. En tres meses tienes cubierto lo que de verdad se mueve, y lo que no se ha tocado sigue sin spec, que está bien: si no cambia, no la necesita.

## Cuándo no usar SDD

SDD tiene coste: veinte minutos de spec, diez de revisión de plan, la disciplina de los checkpoints. Merece la pena cuando ese coste es menor que el de las iteraciones que ahorra. Mi umbral:

**Sin spec:**

- Bugs con causa clara y arreglo de menos de ~20 líneas.
- Cambios de copy, estilos, dependencias, configuración.
- Refactors sin cambio de comportamiento (los tests existentes son la spec).
- Prototipos que vas a tirar. Explorar es para lo que sirve el chat.

**Spec ligera** (solo `spec.md` con requisitos y casos límite, sin plan formal):

- Features pequeñas en una sola capa, de un día.
- Cambios a una capacidad ya documentada que no tocan el modelo de datos.

**SDD completo:**

- Cualquier cosa que toque el modelo de datos o un contrato entre servicios.
- Features de varios días o varias historias.
- Lo que vaya a implementar un agente con poca supervisión o varios en paralelo.
- Lo que un cliente vaya a validar contra lo pactado.

La última línea es la que más se olvida: una spec aprobada es también **el documento que cierra discusiones de alcance**. "Eso está en Fuera de alcance, lo hablamos como feature 007" ahorra más tiempo que cualquier agente.

## Lo que te llevas de la serie

Si te quedas con una sola idea: **el agente es tan bueno como su entrada, y la mejor entrada es un archivo que tú has revisado**. La constitución fija lo que no se discute; la spec, lo que se construye; el plan, cómo; las tareas, en qué orden y cómo se comprueba. Todo en markdown, en el repo, revisable en un PR y válido para cualquier herramienta.

El resto —skills, hooks, Spec Kit u OpenSpec— es cómo hacer que ese hábito cueste menos que saltárselo.

---

Final de la serie [Spec-Driven Development con agentes](/posts/sdd-spec-driven-development). Si quieres implantar SDD en tu equipo —constitución, plantillas, skills, revisión en CI y acompañamiento en las primeras features—, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
