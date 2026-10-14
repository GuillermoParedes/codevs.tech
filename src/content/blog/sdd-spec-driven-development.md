---
title: "Spec-Driven Development con agentes: la serie"
author: Codevs
pubDatetime: 2026-10-14T17:30:00Z
slug: sdd-spec-driven-development
featured: true
draft: false
tags:
  - SDD
  - IA
  - Claude Code
  - Config
description: "Cómo implementar Spec-Driven Development con agentes de código: constitución, spec, plan, tareas e implementación verificable, paso a paso en ocho artículos."
series: "Spec-Driven Development con agentes"
seriesOrder: 1
---

Le pides a un agente "añade recordatorios de citas por email". Veinte minutos después tienes un cron que manda correos, una tabla nueva en la base de datos, una librería de plantillas que no usabas y un endpoint que nadie pidió. Funciona. Y no es lo que querías: los recordatorios tenían que respetar la zona horaria del paciente, no salir de madrugada y poder desactivarse. Nada de eso estaba en tu frase, así que el agente lo decidió por ti.

Eso no es un fallo del modelo. Es un fallo de entrada. **Spec-Driven Development (SDD)** es la disciplina que corrige la entrada: antes de que exista código, existe una especificación que dice qué hay que construir y por qué, un plan que dice cómo, y una lista de tareas que el agente ejecuta una a una contra criterios que se pueden comprobar.

Esta serie es cómo implantarlo de verdad, en un repositorio real, con Claude Code u otro agente, sin convertirlo en burocracia.

## Table of contents

## Qué es SDD, en una pantalla

La idea cabe en una frase: **la spec es la fuente de verdad y el código es su consecuencia**. Lo que cambia respecto a "escribir documentación antes" son tres cosas:

1. **La spec la consume una máquina.** No es un documento para un comité; es la entrada de un agente. Por eso tiene que ser precisa donde importa y callarse donde no.
2. **El trabajo va por fases con puertas.** Especificar → planificar → descomponer en tareas → implementar. Cada fase produce un artefacto en el repo y no se pasa a la siguiente sin revisarlo.
3. **Todo es verificable.** Cada requisito tiene un criterio de aceptación; cada tarea, una forma de comprobar que está hecha. "Funciona en mi máquina" no es un criterio.

En el disco se ve así:

```bash
.specify/memory/constitution.md   # reglas del proyecto que no se negocian
specs/003-recordatorios-cita/
├── spec.md          # qué y por qué — sin tecnología
├── plan.md          # cómo — stack, decisiones, riesgos
├── data-model.md    # entidades y estados
├── contracts/       # API, eventos, esquemas
└── tasks.md         # trabajo atómico, ordenado, con dependencias
```

Esa estructura es la de [GitHub Spec Kit](/posts/sdd-herramientas), pero no necesitas Spec Kit para usarla. A lo largo de la serie la monto a mano y luego comparo herramientas.

## Por qué ahora y no hace diez años

Las specs formales existían antes. Murieron porque escribirlas costaba más que escribir el código, y porque nadie las mantenía cuando el código cambiaba.

Con agentes la ecuación se invierte. El código ya no es lo caro: un agente escribe 400 líneas en un minuto. **Lo caro es que esas 400 líneas sean las correctas.** Una spec de una página que tardas veinte minutos en escribir te ahorra tres iteraciones de "no, eso no", que es donde se va de verdad el tiempo y la cuota.

Y hay una razón técnica, que desarrollé en [Context engineering práctico](/posts/context-engineering-practico): el agente solo sabe lo que está en su ventana. Una conversación de cuarenta turnos acumula decisiones contradictorias; una spec en un archivo es contexto **estable, compacto y reutilizable** entre sesiones, entre agentes y entre personas.

## Lo que SDD no es

- **No es waterfall.** Una spec cubre una feature, no el producto. Se escribe en una tarde y se itera.
- **No es para todo.** Un bug de una línea o un cambio de copy no necesitan spec. En el [último artículo](/posts/sdd-specs-vivas) doy el umbral concreto.
- **No sustituye a los tests.** Los alimenta. Los criterios de aceptación de la spec son los tests que el agente escribe primero.

## Lo que la serie asume de ti

Que ya trabajas con un agente de código y te has topado con el problema del primer párrafo. Si vienes de cero, la serie de [Claude Code para frontend engineers](/posts/claude-code-frontend) te deja preparado; aquí doy por sabido qué es un `CLAUDE.md`, una skill y un subagente.

## Qué recorre la serie

Siete artículos después de este, en el orden en que lo implantarías. Todos usan el mismo ejemplo: **recordatorios de citas por email** en una app de reservas para clínicas (Next.js + Prisma + PostgreSQL).

**[La constitución: reglas que el agente no negocia](/posts/sdd-constitucion)** — el archivo que fija los principios del proyecto, en qué se diferencia de `CLAUDE.md` y cómo se convierte en puertas que el plan tiene que pasar.

**[Cómo escribir una spec que el agente no malinterprete](/posts/sdd-escribir-spec)** — historias de usuario, requisitos en notación EARS, criterios de aceptación comprobables y el marcador `[NEEDS CLARIFICATION]` que evita que el agente rellene huecos inventando.

**[Del spec al plan técnico](/posts/sdd-plan-tecnico)** — investigación, modelo de datos, contratos y el _constitution check_. Dónde se decide la arquitectura y por qué revisar aquí es cinco veces más barato que revisar el diff.

**[Tareas e implementación: el bucle que cierra SDD](/posts/sdd-tareas-implementacion)** — `tasks.md` con dependencias y marcadores de paralelismo, test primero, un commit por tarea y checkpoints donde el humano mira.

**[SDD en Claude Code con skills, subagentes y hooks](/posts/sdd-claude-code)** — el flujo completo montado con lo que Claude Code ya trae: comandos `/spec`, `/plan`, `/tasks`, un subagente planificador y un hook que bloquea código sin spec.

**[Spec Kit, Kiro y OpenSpec](/posts/sdd-herramientas)** — las herramientas que empaquetan SDD, qué decide cada una por ti y cuándo merece la pena adoptarlas en lugar del montaje propio.

**[Specs vivas: brownfield, drift y cuándo no usar SDD](/posts/sdd-specs-vivas)** — adoptarlo en un repo con años de historia, evitar que la spec y el código se separen, y el umbral para saltártelo sin culpa.

## La forma corta, si tienes prisa

Si solo vas a leer tres: **spec → plan → tareas**. Con eso ya cambias la calidad de lo que entrega el agente. La constitución y los hooks son lo que lo vuelve sostenible en equipo, pero llegan después.

## Un aviso antes de empezar

SDD con agentes es una práctica de 2025–2026 y las herramientas se mueven rápido: los comandos de Spec Kit cambiaron de nombre entre versiones y cada IDE agéntico tiene su propio formato. Por eso la serie se apoya en **archivos markdown en el repo**, que sobreviven a cualquier herramienta. Si mañana cambias de agente, tus specs siguen sirviendo.

## Empieza aquí

El [primer artículo](/posts/sdd-constitucion) escribe la constitución del proyecto. Media hora, una vez por repositorio, y a partir de ahí cada feature arranca con las reglas claras.

---

Parte de la serie **Spec-Driven Development con agentes**. Si quieres este flujo implantado en el repositorio de tu equipo —plantillas, comandos y puertas en CI— [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
