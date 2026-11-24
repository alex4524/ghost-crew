# Poltergeist

App 1 built on the Ghost Crew skeleton. It finds the parts of a page that some people
cannot see, reach or read.

```bash
npx -y -p github:alex4524/ghost-crew poltergeist https://your.app
```

## What this folder adds to the skeleton

| File | Adds |
|---|---|
| `app.js` | `defineApp()`: name, theme, and the zero-config crew of 3 ghosts |
| `senses/axe.js` | `axe`: runs axe-core in the page; one haunting per WCAG rule, a circle on every failing element |
| `senses/keyboard.js` | `keyboard-reach`: tabs through the page; reports named targets the keyboard never reaches, or, with no targets, anything that looks clickable but cannot take focus |
| `senses/keyboard.js` | `focus-visible`: reports focusable elements whose outline, shadow, border and colours do not change on focus |
| `ghosts/hollow-pines/` | 5 ghosts for the demo inn |
| `bin/poltergeist.js` | the command line, 3 lines long |

Nothing in `core/` knows Poltergeist exists. The core finds it by the `app-*/app.js`
convention.

## Moods

axe impact `critical` → wrathful, `serious` → restless, `moderate` → mischievous,
`minor` → faint. A target the keyboard cannot reach is always wrathful.
