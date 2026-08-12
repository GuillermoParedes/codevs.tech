---
title: "Arma tu stack de contexto y memoria, y mide el ahorro"
author: Codevs
pubDatetime: 2026-08-11T09:50:00Z
slug: stack-contexto-memoria
featured: false
draft: false
tags:
  - Contexto
  - IA
  - Claude Code
  - Config
description: "Receta en cuatro fases para configurar contexto y memoria en un equipo, con las métricas y la aritmética que demuestran que sirvió de algo."
series: "Contexto y memoria en agentes de código"
seriesOrder: 7
---

Quedan las dos cosas que convierten los cinco artículos anteriores en algo defendible: **el orden en que se monta** y **los números que demuestran que sirvió**.

El orden importa porque casi todo el mundo empieza por el final —instalando una herramienta— y así nunca sabe si el problema era el que creía. Los números importan porque sin ellos esto es una opinión sobre cómo configurar editores.

## Table of contents

## Fase 0: medir antes de tocar nada

Media hora, y decide todo lo demás.

Abre una sesión de trabajo real —no una de prueba, una en la que estés haciendo algo— y déjala correr como siempre. Cuando lleve una hora, ejecuta `/context` y anota tres cosas:

1. **Cuánto ocupa la configuración**: prompt de sistema, herramientas nativas, servidores MCP, `CLAUDE.md`. Es tu suelo: lo pagas en cada turno de cada sesión, para siempre.
2. **Cuánto ocupa el ruido**: salidas de build, tests, páginas web, archivos leídos que ya no tocas.
3. **Cuántas veces compactó**.

Y mide el suelo por separado, con el conteo de tokens:

```typescript
const files = ["CLAUDE.md", ".claude/skills/nuevo-post/SKILL.md"];

for (const path of files) {
  const { input_tokens } = await client.messages.countTokens({
    model: "claude-opus-5",
    messages: [{ role: "user", content: await readFile(path, "utf8") }],
  });
  console.log(`${path}: ${input_tokens} tokens`);
}
```

Con eso ya puedes tomar decisiones en vez de suposiciones. El patrón típico en un equipo que nunca auditó esto: entre 40.000 y 60.000 tokens de suelo (de los cuales la mayoría son MCP), 100.000 o más de ruido acumulado, y dos o tres compactaciones por sesión larga.

## Fase 1: recortar el suelo

Lo más rentable, porque lo que quitas aquí lo dejas de pagar en cada turno de aquí en adelante.

**Desconecta los servidores MCP que no uses hoy.** Es el mayor recorte disponible en la mayoría de configuraciones, y el más fácil de deshacer. Un servidor de base de datos conectado durante una sesión de frontend son 8.000 tokens por turno de puro impuesto.

**Adelgaza `CLAUDE.md` a hechos.** Recorre el archivo y saca todo lo que sea un procedimiento de varios pasos: eso es una skill, y como skill solo pagas su descripción. Un `CLAUDE.md` de 200 líneas bien escrito rinde más que uno de 600.

**Mueve los checklists a skills.** Aquí el ahorro es asimétrico y por eso conviene entenderlo: un checklist de 300 líneas en `CLAUDE.md` cuesta ~4.000 tokens en cada turno; como skill cuesta ~30 tokens (su descripción) hasta que se usa.

Objetivo razonable de esta fase: **suelo por debajo de 20.000 tokens**.

## Fase 2: controlar el ruido

El ruido es de flujo de trabajo, no de configuración, así que se ataca con hábitos.

**Delega las exploraciones.** Cualquier "revisa todo el módulo X", "busca dónde se usa Y", "audita el diff" es material que no quieres en tu ventana: quieres su conclusión. Subagentes.

**`/clear` al cambiar de tarea.** Es la poda más eficaz que existe y la más infrautilizada, porque parece que se pierde algo. No se pierde nada si lo que había que conservar está escrito en un archivo — y por eso el siguiente punto va inmediatamente después.

**Escribe las decisiones antes de compactar.** El hábito de mayor retorno de toda la serie, y cuesta una frase:

```text
Antes de seguir: escribe en docs/decisiones.md las decisiones que hemos
tomado en esta sesión y el porqué de cada una, incluyendo lo que
descartamos y la razón. Sé concreto, no escribas un resumen genérico.
```

Ahora `/compact` o `/clear` son operaciones seguras: lo importante ya no está en el historial.

## Fase 3: memoria, con curaduría

Solo después de las dos fases anteriores, y con una regla estricta de qué entra.

**Empieza por archivos en el repositorio.** Un directorio de notas cortas, una por hecho, con un índice. Se versiona con el código, se revisa en un PR y lo lee cualquier agente. Sorprende lo lejos que llega esto antes de necesitar nada más.

**Sube a una capa dedicada solo con una razón medida.** Si usas dos o tres agentes distintos y estás duplicando conocimiento, una memoria compartida entre agentes tiene sentido. Si son cinco personas con la misma herramienta, no lo tiene.

**Revisa la memoria como revisas el código.** Una nota falsa es peor que ninguna nota, porque el agente la aplicará con la misma confianza que una verdadera. Ponlo en la revisión trimestral: leer las notas, borrar las obsoletas, fusionar las duplicadas.

## Fase 4: la caché, al final

Se deja para el final a propósito: la caché **abarata lo que ya tienes**, así que optimizarla antes de recortar es abaratar tu propio ruido.

Con el suelo recortado y estable, verifica que se está cacheando:

```typescript
const { cache_read_input_tokens, cache_creation_input_tokens, input_tokens } =
  response.usage;

// El tamaño real del prompt es la SUMA de los tres, no `input_tokens`.
```

Si `cache_read_input_tokens` es cero en peticiones repetidas con el mismo prefijo, tienes un invalidador silencioso: una fecha generada dinámicamente arriba del prompt, un identificador de sesión, un conjunto de herramientas que cambia. Arréglalo antes de mirar cualquier otra métrica — es la diferencia entre pagar el precio completo y una décima parte.

## La aritmética

Un modelo ilustrativo para ver de qué orden de magnitud hablamos. Sesión de 60 turnos con Opus 5, a 5 dólares por millón de tokens de entrada y unos 0,50 por millón leído de caché.

**Sin optimizar** — 180.000 tokens de contexto medio, sin caché efectiva:

> 180.000 × 60 = 10,8M tokens → **~54 $** de entrada, en una sola sesión.

**Optimizado** — suelo de 20.000, ruido controlado, contexto medio de 70.000, de los cuales 50.000 son prefijo estable y cacheado:

> 50.000 × 60 = 3M leídos de caché → ~1,50 $
> 20.000 × 60 = 1,2M a precio completo → ~6 $
> escritura de caché → menos de 1 $
> **Total: ~8 $**

Los números concretos dependerán de tu trabajo; lo que se mantiene es la estructura del ahorro: **el recorte y la caché se multiplican entre sí**, porque el recorte reduce el número base y la caché reduce el precio de lo que queda. Por eso el orden de las fases no es arbitrario.

Y hay una segunda mitad que no sale en la factura: menos ruido es más atención sobre lo que importa, menos compactaciones, y menos veces que el agente repropone lo que descartaron hace media hora.

## Checklist

**Configuración**

- [ ] `/context` ejecutado y anotado en una sesión real
- [ ] Servidores MCP conectados: solo los de hoy
- [ ] `CLAUDE.md` son hechos, no procedimientos
- [ ] Los checklists viven en skills
- [ ] Suelo por debajo de 20.000 tokens

**Flujo de trabajo**

- [ ] Exploraciones amplias delegadas a subagentes
- [ ] `/clear` al cambiar de tarea
- [ ] Decisiones escritas a un archivo antes de compactar

**Memoria**

- [ ] Notas cortas, una por hecho, versionadas en el repositorio
- [ ] Nada de credenciales, nunca
- [ ] Nada que el repositorio ya cuente
- [ ] Revisión periódica para borrar lo obsoleto

**Medición**

- [ ] `cache_read_input_tokens` distinto de cero en peticiones repetidas
- [ ] Costo por sesión conocido, antes y después

## El resumen de la serie en tres frases

**El contexto es un presupuesto que se gasta entero en cada turno**, no una memoria. Se llena antes de lo que crees y una ventana más grande solo desplaza el problema.

**La compactación es el mecanismo de emergencia, no la estrategia.** Todo lo que tenga que sobrevivir a una compactación pertenece a un archivo, no al historial.

**Mide antes de instalar nada.** Las herramientas del ecosistema resuelven problemas reales, pero ninguna decide por ti qué merece estar en la ventana — y ese es el problema que casi siempre tienes.

## Dónde seguir

Si quieres aplicar esto a una configuración concreta, la [serie de Claude Code para frontend engineers](/posts/claude-code-frontend) recorre los mecanismos uno a uno: `CLAUDE.md`, hooks, skills, subagentes, MCP y CI, sobre proyectos reales.

---

Fin de la serie [Contexto y memoria en agentes de código](/posts/contexto-memoria-agentes). Si quieres esto auditado, montado y medido sobre tu equipo —con los números de antes y después—, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
