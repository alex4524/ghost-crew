---
name: ghost-crew
description: Summon Ghost Crew ghosts against a web page the user owns, write new ghost files, and read séance records. Use when the user asks to check a page for accessibility problems, test a form with odd input, compare a page with last night, or run the midnight patrol.
always: false
---

# Ghost Crew

Ghost Crew walks a page in a real Chrome and returns hauntings (findings) with spirit
photographs (screenshots with each problem circled and numbered). Two apps ship on it:

| App | Finds | Built-in crew for a bare URL |
|---|---|---|
| `poltergeist` | accessibility: axe-core rules, keyboard reach, invisible focus, phone overflow | 3 ghosts |
| `phantom-form` | forms: crashes, script injection, broken characters, blank accepted, real input refused | 1 ghost, auto-detects the first form |

## Tools (MCP server `ghost-crew`)

| Tool | Use it to |
|---|---|
| `summon` | run ghosts; `target` is the base URL; `app` picks the crew; `ghosts` lists files; `baseline` is an earlier report.json |
| `write_ghost` | save a ghost file; it refuses invalid YAML and returns the problems |
| `check_ghost` | validate YAML without a browser |
| `list_ghosts` | see the ghosts already in the project |
| `read_report` | summarise the newest report.json, or one you name |

## Rules

1. Only haunt hosts the user owns or may test. Local hosts (127.0.0.1, localhost) are fine.
2. A finding exists only if a tool result shows it. Quote the haunting title as returned.
3. One concern per ghost. Targets are visible text or labels; use `css:` only as a last resort.
4. Moods, worst first: wrathful, restless, mischievous, faint.

## Ghost file shape

```yaml
ghost: The Checkout Wraith
lore: Pays with every card a real customer might have.
haunts: /checkout
device: desktop            # or mobile
steps:
  - click: Continue to payment
senses:
  - cursed-inputs:
      submit: Pay now
      success: Thank you
      valid: { Email: ada@example.com }
      fields:
        Name on card: [emoji, apostrophe, long, markup]
  - console-clean
```

Senses: `axe`, `keyboard-reach`, `focus-visible`, `cursed-inputs`, `text-visible`,
`text-absent`, `console-clean`, `no-overflow`, `no-broken-images`, `broken-characters`,
`requests-ok`.

## Midnight patrol

When the `midnight-haunt` job fires:

1. Call `list_ghosts`. If the project has none, end with no reply.
2. For each app folder the ghosts live in, call `summon` with the same `out` folder as
   last time and `baseline` set to that folder's `report.json` (summon reads the baseline
   before it overwrites it).
3. If every result says `0 new` and `0 exorcised`, reply with nothing.
4. Otherwise reply with one line per change: `new` hauntings first (title, page), then
   exorcised ones, then the séance record path.
