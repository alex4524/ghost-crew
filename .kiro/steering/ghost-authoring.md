---
inclusion: fileMatch
fileMatchPattern: "**/*.ghost.yaml"
name: ghost-authoring
description: The exact shape of a ghost file, so generated ghosts always parse
---

# Writing a ghost

A ghost file is named `<kebab-name>.ghost.yaml`. Keys, in this order:

```yaml
ghost: The Lantern Dimmer          # required. Title case, starts with "The".
lore: Snuffs out text nobody can read.   # optional. One sentence, present tense.
haunts: /index.html                # required. Path (joined to --base-url) or full URL.
device: desktop                    # optional. desktop (1280x800) | mobile (390x844)
steps:                             # optional. Run in order before senses.
  - click: Book a room             # target text, label, or "css:<selector>"
  - fill: { field: Guest name, with: Ada }
  - press: Tab
  - wait: 300                      # milliseconds, max 10000
  - scroll: bottom                 # top | bottom | <target>
senses:                            # required, at least one
  - axe: { impact: [critical, serious] }
  - keyboard-reach: { targets: [Book now] }
```

## Rules

- One concern per ghost. A ghost that checks contrast and forms is two ghosts.
- Targets are what a person sees: button text, a field's label. Use `css:` only when
  the element has no visible name, and leave a comment saying why.
- `senses` entries are a single-key map (`- name: options`) or a bare name
  (`- console-clean`).
- Only use senses that exist. Core: `text-visible`, `text-absent`, `console-clean`,
  `no-overflow`, `no-broken-images`, `broken-characters`, `requests-ok`.
  Poltergeist adds `axe`, `keyboard-reach`, `focus-visible`. Phantom Form adds
  `cursed-inputs`.
- After writing a ghost, validate it without a browser:
  `node core/bin/ghost-crew.js check <file>`.
