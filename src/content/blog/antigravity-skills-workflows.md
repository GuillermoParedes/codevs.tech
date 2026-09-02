---
title: "Skills y workflows en Antigravity: reutiliza tu criterio"
author: Codevs
pubDatetime: 2026-08-26T09:30:00Z
slug: antigravity-skills-workflows
featured: false
draft: false
tags:
  - Antigravity
  - Claude Code
  - Config
  - IA
description: "Tus skills de Claude Code funcionan en Antigravity casi tal cual: dónde ponerlas, qué cambia y cuándo lo que necesitas es un workflow con slash."
series: "Antigravity con Claude"
seriesOrder: 4
---

La mejor noticia de migrar a Antigravity cabe en una frase: **Agent Skills es un formato abierto, y Antigravity lo soporta de forma nativa**. Ese `SKILL.md` que escribiste para Claude Code —tu checklist de SEO, tu procedimiento de revisión de accesibilidad, tu forma de crear un artículo con el frontmatter correcto— se copia de carpeta y funciona.

Es el punto donde deja de haber vendor lock-in en la parte que más trabajo te costó: tu criterio empaquetado.

## Table of contents

## Dónde van las skills

Dos ubicaciones, mismo patrón que las reglas:

```bash
# Workspace: viaja con el repositorio, la ve todo el equipo
.agents/skills/<nombre>/SKILL.md

# Global: solo tuya, en todos tus proyectos
~/.gemini/config/skills/<nombre>/SKILL.md
```

Una skill es una **carpeta**, no un archivo. El `SKILL.md` es obligatorio; junto a él puedes poner lo que el procedimiento necesite:

```text
.agents/skills/seo-check/
├── SKILL.md          # obligatorio
├── scripts/
│   └── check-meta.mjs
├── examples/
│   └── head-correcto.astro
└── resources/
    └── checklist.md
```

El frontmatter es mínimo:

```markdown
---
name: seo-check
description: Audita el SEO técnico y on-page del sitio — meta tags, Open Graph,
  JSON-LD, sitemap, headings y enlazado interno. Úsala tras tocar layouts,
  el head o publicar contenido nuevo.
---

# Auditoría de SEO

## 1. Meta tags

...
```

`description` es obligatorio. `name` es opcional: si lo omites, se toma el nombre de la carpeta. Y si eso te suena exactamente igual que en Claude Code, es porque lo es.

## Cómo se activan

Tres etapas, y entenderlas explica por qué las skills son baratas:

1. **Descubrimiento.** Al arrancar la conversación, el agente ve la lista de skills con su nombre y su descripción. Nada más. El cuerpo no está en el contexto.
2. **Activación.** Si la tarea encaja con alguna descripción, lee el `SKILL.md` completo.
3. **Ejecución.** Sigue el procedimiento mientras trabaja.

Lo que ocupa ventana permanentemente es una línea por skill. El procedimiento de 300 líneas solo se paga cuando se usa. Es el mismo mecanismo que expliqué en [skills de Claude Code](/posts/claude-code-skills), y la razón por la que puedes tener quince skills sin que te cueste nada.

Puedes mencionarlas explícitamente, pero lo normal es que el agente decida solo. Lo cual significa que **la calidad de tu `description` determina si la skill existe o no en la práctica**. Una descripción vaga es una skill que nunca se activa; una descripción con las palabras que el usuario va a usar de verdad es una skill que aparece cuando toca.

Compara:

```yaml
# mala: no dice cuándo
description: Ayuda con el rendimiento web.

# buena: qué hace + cuándo + con qué palabras lo va a pedir el usuario
description: Audita el performance del sitio — peso del bundle, hidratación de
  islas React, fuentes e imágenes. Úsala tras añadir dependencias o componentes,
  o cuando pidan "revisar performance", "optimizar velocidad" o "mejorar Lighthouse".
```

## Migrar tus skills de Claude Code

El proceso, en cuatro pasos:

```bash
mkdir -p .agents/skills
cp -r .claude/skills/* .agents/skills/
```

Y luego revisa cuatro cosas:

**1. Las herramientas nombradas.** Si tu skill dice "usa la herramienta Read para abrir el archivo", reescríbelo en términos de intención: "lee el archivo". Los nombres de herramientas internas de Claude Code no significan nada en Antigravity, y una instrucción que nombra algo inexistente confunde al modelo.

**2. Los comandos slash.** Una skill que dice "después ejecuta `/seo-check`" asume que ese comando existe. En Antigravity, lo que se invoca con `/` son los **workflows** — más abajo. Si tu skill encadena otras skills, exprésalo como "aplica el procedimiento de auditoría SEO" y deja que el agente encuentre la skill por descripción.

**3. Las rutas.** `.claude/` no existe allí. Si tu skill referencia archivos del propio repositorio, usa rutas del repositorio, no de la carpeta de configuración.

**4. Los scripts.** Siguen funcionando, con una condición: el agente necesita **aprobación** para ejecutar comandos de terminal. Si tu skill depende de correr un script, la primera vez te lo va a pedir. Es lo correcto; no lo desactives por comodidad.

Lo que **no** se transfiere: los subagentes de Claude Code definidos en `.claude/agents/`, los hooks de `settings.json` y todo lo específico del arnés. Antigravity tiene equivalentes —subagentes propios, hooks en JSON— pero son otra configuración, no un `cp`. Lo de los hooks lo comparo en [el último artículo](/posts/antigravity-claude-code-juntos); para el modelo mental de por qué un hook manda más que una instrucción, sigue valiendo [hooks de Claude Code](/posts/claude-code-hooks).

## Cuándo lo que quieres es un workflow

Un **workflow** también es un markdown de hasta 12.000 caracteres, pero se comporta al revés que una skill: **lo disparas tú**, con `/nombre-del-workflow`, y describe una secuencia de pasos.

La diferencia no es de formato, es de nivel:

|                 | Skill                      | Workflow                        |
| --------------- | -------------------------- | ------------------------------- |
| Quién la activa | El agente, por descripción | Tú, con `/nombre`               |
| Qué aporta      | Criterio y procedimiento   | Una secuencia de pasos          |
| Actúa sobre     | _Cómo_ se hace algo        | _Qué_ se hace, y en qué orden   |
| Se anida        | Por descripción            | Un workflow puede llamar a otro |

Ejemplo claro de workflow — el ritual de release, que nadie recuerda entero:

```markdown
# Release

1. Comprueba que la rama está limpia y actualizada con `main`.
2. Ejecuta `npm run lint`, `npm run format:check` y `npm run build`.
   Si alguno falla, para y reporta. No intentes arreglarlo por tu cuenta.
3. Actualiza el `CHANGELOG.md` con los commits desde la última etiqueta,
   agrupados por tipo de commit convencional.
4. Sube la versión en `package.json` según el mayor cambio del changelog.
5. Crea el commit `chore(release): vX.Y.Z` y la etiqueta correspondiente.
6. Muéstrame el diff completo. **No hagas push.**
```

Eso no es criterio, es un guion. Y como guion se invoca: `/release`.

Un detalle bonito: **el agente puede generarte el workflow a partir del historial de la conversación**. Cuando acabas de hacer un procedimiento largo a mano y sabes que lo repetirás, pedirle "conviérteme esto en un workflow" produce un primer borrador decente. Luego lo editas, que es mucho más rápido que escribirlo en frío.

## El reparto, en una línea

- Lo que el agente debe respetar siempre → **regla**.
- Lo que debe saber hacer bien cuando toque → **skill**.
- Lo que quieres disparar tú, en orden → **workflow**.

Tres mecanismos, tres momentos distintos. La gente que se pelea con Antigravity casi siempre está usando uno de los tres para el trabajo de otro.

## Lo siguiente

Ya tienes reglas, skills y workflows: el agente sabe cómo trabajar en tu repositorio. Falta la otra mitad, que es **cómo revisas tú lo que hizo**.

Y ahí Antigravity propone un cambio de hábito que es, para mi gusto, su mejor idea: dejar de revisar diffs y empezar a revisar planes. Es el [siguiente artículo](/posts/antigravity-artifacts-plan).

---

Parte de la serie [Antigravity con Claude](/posts/antigravity-claude). Si quieres tus procedimientos de equipo empaquetados como skills reutilizables entre agentes, [cuéntame el caso](mailto:hi.codevs@gmail.com) o mira [en qué trabajo](/about).
