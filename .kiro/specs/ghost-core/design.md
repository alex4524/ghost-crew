# Design: Ghost Crew core

## Overview

```mermaid
flowchart LR
  Y[*.ghost.yaml] --> P[ghost.js<br/>parse + validate]
  P --> R[runner.js<br/>summon]
  A[defineApp<br/>senses + theme] --> R
  R -->|one context per ghost| C[(Chrome)]
  R --> S[senses]
  S -->|haunt()| F[findings + boxes]
  F --> PH[photograph.js<br/>living + spirit PNG]
  F --> RJ[report.json]
  RJ --> X[exorcism diff<br/>vs baseline]
  RJ --> H[index.html<br/>séance record]
  M[mcp.js] --> R
```

## Components

| File | Job |
|---|---|
| `core/src/ghost.js` | YAML → `Ghost` object; collects every error before throwing |
| `core/src/registry.js` | sense and app registry (`defineSense`, `defineApp`) |
| `core/src/locate.js` | turns a human target into a Playwright locator |
| `core/src/runner.js` | browser lifecycle, crew pool, scenes, steps, events |
| `core/src/photograph.js` | overlay injection and the two screenshots |
| `core/src/senses/*.js` | built-in senses |
| `core/src/report/*.js` | JSON model, exorcism diff, HTML renderer |
| `core/src/cli.js` | `haunt`, `check`, `new`, `mcp`, `serve` commands |
| `core/src/mcp.js` | MCP tools on top of the same functions |

## Data model

```ts
type Mood = 'wrathful' | 'restless' | 'mischievous' | 'faint'
type Haunting = {
  n: number            // seal number inside its scene photograph
  key: string          // stable id for exorcism diff: ghost::sense::detailKey
  sense: string
  mood: Mood
  title: string        // plain fact, theme-free
  detail?: string
  help?: string; helpUrl?: string
  boxes: { x: number, y: number, w: number, h: number }[]
  scene: string        // label of the scene that holds the evidence
  status?: 'new' | 'still'
}
type Scene = { label: string, url: string, living?: string, spirit?: string, hauntings: Haunting[] }
type GhostResult = { ghost: string, file: string, lore?: string, url: string,
  state: 'quiet' | 'haunted' | 'lost', ms: number, scenes: Scene[], error?: string,
  tally?: Record<string, number> }
```

## Sense context

```js
defineSense('my-sense', {
  describe: 'one line for docs',
  async run(ctx, options) {
    ctx.page            // the scene's Playwright page
    ctx.locate(target)  // → Locator | null
    ctx.events          // { consoleErrors, pageErrors, failedRequests }
    await ctx.haunt({ mood, title, key, target | elements | boxes, detail, help })
    await ctx.scene('label', async (sceneCtx) => { ... })  // fresh page, same ghost walk
    ctx.tally(name, n)  // counters shown in the report (e.g. curses survived)
  },
})
```

`haunt()` measures boxes immediately, because a later step can move or remove the
element. A sense that has no element passes no target and the haunting is drawn as a
banner seal on the photograph.

## Photograph

1. Plain full-page PNG → `living-<id>.png`.
2. Inject `<div id="__ghost_crew">` as a sibling of `<body>`, add a style that applies
   `filter: grayscale(1) contrast(1.08) brightness(.96) sepia(.12)` to `body`, then draw
   halos (`box-shadow` glow in ectoplasm) and numbered wax seals at each box.
3. Full-page PNG → `spirit-<id>.png`, then remove the overlay.

## Error handling

- Unknown sense or bad YAML: fail fast before Chrome starts, exit code 2.
- Chrome not found: exit code 3 with the three ways to point at a browser.
- A sense that throws becomes a `faint` haunting titled "Sense <name> could not finish"
  so a broken plugin is visible instead of silent.

## Testing strategy

- `core/test/ghost.test.js`: parser accepts every demo ghost and rejects six bad shapes.
- `core/test/diff.test.js`: exorcism diff on hand-built reports.
- `core/test/crew.test.js`: summons both apps against `demo/haunted` and
  `demo/exorcised`; expects hauntings on the first and none on the second.
