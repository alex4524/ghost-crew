---
inclusion: fileMatch
fileMatchPattern: "{site/**,core/src/report/**,demo/**}"
name: spirit-design
description: Visual language for the séance record and the landing page
---

# Spirit photography design language

The look is a Victorian spirit-photograph album: silver-gelatin prints with a faint
ectoplasm glow around whatever is haunted. It is a light theme on purpose; it should
not look like every other dark Halloween page.

## Tokens

| Token | Hex | Use |
|---|---|---|
| `--plate` | `#D8D9D4` | page background, the silver of a gelatin print |
| `--paper` | `#EFEFEA` | raised surfaces, photo mounts |
| `--ink` | `#24202E` | body text (11.2:1 on plate) |
| `--tarnish` | `#55515D` | secondary text (5.4:1 on plate) |
| `--verdigris` | `#0A5E56` | links, mischievous severity (5.4:1 on plate) |
| `--ectoplasm` | `#5CE1D0` | glow and halos only, never text on light |
| `--wax` | `#8C1C2C` | wrathful severity, wax seals (6.4:1 on plate) |
| `--amber` | `#7F470C` | restless severity (5.3:1 on plate) |

Ratios are WCAG 2.1 contrast, computed with the relative-luminance formula; re-run the
check in `scripts/contrast.mjs` after changing any colour.

## Type

- Display: IM Fell English (period type, used in 19th-century printing). Sizes 64/40/28.
- Body: Atkinson Hyperlegible, chosen because Poltergeist is an accessibility tool.
  17px, line-height 1.6, measure under 72ch.
- Code only: JetBrains Mono.

## Rules

- The spirit photograph is the one bold element on any page. Everything around it
  stays quiet: no gradients, no card grids, no icons for decoration.
- Severity is never colour alone: each seal carries its word.
- Respect `prefers-reduced-motion`; the only ambient motion is the fog drift.
- No all-caps labels, no numbered markers unless the content is a real sequence.
