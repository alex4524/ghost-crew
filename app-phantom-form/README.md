# Phantom Form

App 2 built on the Ghost Crew skeleton. It types what real people type into your forms,
one cursed value at a time, and photographs what the page does with each.

```bash
npx -y -p github:alex4524/ghost-crew phantom-form https://your.app/signup
```

## What this folder adds to the skeleton

| File | Adds |
|---|---|
| `app.js` | `defineApp()`: name, theme, tally wording, the zero-config crew |
| `curses.js` | 14 curses, three of them valid input the form must accept |
| `senses/cursed-inputs.js` | `cursed-inputs`: one fresh scene per field and curse |
| `ghosts/hollow-pines/` | 3 ghosts for the demo inn's booking form |
| `bin/phantom-form.js` | the command line, 3 lines long |

## Curses

| Curse | Value | Must the form accept it? |
|---|---|---|
| `emoji` | `👻 Casper` | – |
| `zalgo` | `Z̷̛̖a̸̜͝l̵̰̈g̶̣̓ő̵̟` | – |
| `rtl` | text wrapped in U+202E | – |
| `long` | a 48-character double-barrelled name | – |
| `wide` | one 24-letter word | – |
| `markup` | `<img src=x onerror=…>` | – |
| `sqlish` | `Robert'); DROP TABLE guests;--` | – |
| `blank` | three spaces | must refuse |
| `apostrophe` | `Siobhán O'Brien` | yes |
| `unicode-name` | `Zoë Ñúñez-Łukasiewicz` | yes |
| `weird-valid-email` | `o'brien+inn@hollow-pines.example` | yes |
| `negative` | `-3` | – |
| `zero` | `0` | – |
| `huge` | `99999999999999999999` | – |

## What counts as a haunting

For each curse, in its own scene: an uncaught page error, the markup curse running
script, content spilling out of its box or making the page scroll sideways, broken
characters, a blank value accepted, a valid value refused, or text matching a `forbid`
pattern (`NaN`, `undefined`, `$-540`, `1.8e+22` …). A curse with none of these counts as
survived, and the séance record says "The form survived N of M curses."
