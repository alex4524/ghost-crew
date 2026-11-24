# Devpost submission: Ghost Crew

Copy each block into the matching field of "Enter a Submission" on kiroween.devpost.com.

## Project name

Ghost Crew

## Elevator pitch (200 characters max)

A skeleton crew of ghosts that walk your web app in a real Chrome and bring back spirit photographs of every bug. Two apps on one skeleton: Poltergeist (accessibility) and Phantom Form (forms).

## Category

Skeleton Crew

## Bonus prizes to opt into

- Best Kiro Crew App (write-up below, code in `kirocrew-app/`)
- Bonus Blog Prize (after the blog post is published; add its URL)
- Social Blitz (after the post is published; add its URL)

## Try it out links

- Live site: https://alex4524.github.io/ghost-crew/
- Last night's Poltergeist séance record: https://alex4524.github.io/ghost-crew/reports/poltergeist/
- Last night's Phantom Form séance record: https://alex4524.github.io/ghost-crew/reports/phantom-form/
- The demo inn with bugs planted: https://alex4524.github.io/ghost-crew/demo/haunted/
- Code: https://github.com/alex4524/ghost-crew

## Video

YouTube URL: (paste after upload; the file is `video/build/ghost-crew-demo.mp4`, 2:17)

## Built with

javascript, node.js, playwright, chrome, axe-core, model-context-protocol, yaml, github-actions, github-pages, kiro, kiro-crew

## Testing instructions (judges)

No login is needed. Three ways to test, fastest first:

1. Open https://alex4524.github.io/ghost-crew/reports/poltergeist/ and use "Show the living page" on any plate. These records are regenerated every night at 00:00 UTC by `.github/workflows/midnight-haunt.yml`.
2. On any machine with Node 20+ and Google Chrome: `npx -y -p github:alex4524/ghost-crew poltergeist https://alex4524.github.io/ghost-crew/demo/haunted/` then open `ghost-reports/poltergeist/index.html`.
3. `git clone https://github.com/alex4524/ghost-crew && cd ghost-crew && npm install && npm run midnight && npm test` (about 1 minute; 20 tests including both apps end to end).

---

## Story

### Inspiration

Before every release, front-end developers walk their own pages by hand. We tab with the keyboard to see if focus shows. We type an emoji name into the signup form. We open it on a phone and look for sideways scrolling. It is slow, nobody enjoys it, and the same bugs come back. We wanted those walks written down once and replayed every night, and we wanted the result to be something a designer or a PM would actually open: not a stack trace, a picture of the page with the problem circled.

### What it does

Ghost Crew is a skeleton for browser QA. A **ghost** is a few lines of YAML: which page to haunt, a few steps (click, fill, press, wait, scroll) and which **senses** to use. Ghost Crew opens one real Chrome, gives every ghost a private context, walks four at a time, and writes a **séance record**: an HTML report where every haunting comes with a **spirit photograph**. The photograph is the page turned to silver, with each problem glowing and numbered to match the list next to it. One button flips back to the living page.

Pass last night's report as a baseline and the record splits hauntings into new, still haunting and **exorcised**.

Two distinct apps are built from the skeleton:

- **Poltergeist** (accessibility) adds three senses: `axe` runs axe-core and circles every failing element; `keyboard-reach` tabs through the page and reports what the keyboard never reaches, and with no targets it finds things that look clickable but cannot take focus; `focus-visible` catches focus rings that were styled away. With no ghosts at all, `poltergeist <url>` runs a desktop sweep, a keyboard walk and a phone visit.
- **Phantom Form** (forms) adds a library of 14 curses and one sense, `cursed-inputs`. Every field and curse gets a fresh page and its own photograph. It catches crashes, script injection, broken characters (emoji split by `name[0]`), blank answers accepted, real answers refused (`o'brien+inn@…`), and text like `$-540` or `1.8e+22`. The record says "The form survived N of M curses." With no ghosts it finds the first form and picks curses by field type.

The demo, the Hollow Pines Inn, has 15 bugs planted on purpose and a fixed twin. Every night GitHub Actions haunts both and publishes four séance records: Poltergeist finds 9 hauntings, Phantom Form about a dozen, and both report "The house is quiet" on the fixed inn, with every haunting marked exorcised.

### How we built it

The whole project was built in **Kiro Crew**, spec first:

- **Steering first.** Five steering files went in before any code: product vocabulary (ghost, sense, haunting, scene, spirit photograph, exorcised), tech rules, folder and import rules ("core never imports an app"), the exact ghost file shape (loaded only for `*.ghost.yaml` with `fileMatch`), and the design tokens with their contrast ratios (loaded only for the site and report).
- **Specs.** `.kiro/specs/ghost-core/` has requirements in EARS form, a design with the data model and a mermaid diagram, and the task list the build followed. Each app and the Kiro Crew app have their own requirements. The requirements map to tests: the planted bugs are assertions in `core/test/crew.test.js`.
- **Hooks** (`.kiro/hooks/*.json`, v1 format): validate a ghost on `PostFileSave` with a script (zero tokens), brief each `SessionStart` with the newest report's worst hauntings, ask the agent to resync the sense lists when a sense file changes, and run `npm test` on `Stop`.
- **MCP.** `ghost-crew mcp` is a stdio server with five tools: `list_ghosts`, `check_ghost`, `write_ghost` (refuses invalid YAML and paths outside the project), `summon`, `read_report`. A test drives it with the official MCP client exactly as Kiro does.
- **Kiro Crew app** (`kirocrew-app/`): a Ghost Captain agent, a skill, the MCP server launched straight from GitHub with `npx`, and an optional midnight patrol cron.

Kiro Crew also reviewed its own output. It ran the crew against the demo dozens of times, opened the spirit photographs, and fixed what it saw: the first Phantom Form photographs showed the top of the page while the haunting sat lower down, so the photographer now also saves a crop around the evidence. When it measured the design tokens, one link colour was 4.49:1, just under WCAG AA, so it darkened the token and added `scripts/contrast.mjs` to CI.

Stack: Node 20 ESM with no build step, `playwright-core` driving the Chrome already installed (no browser download), axe-core, the MCP SDK, YAML. The core is 16 files; each app is about 220 lines.

### Challenges we ran into

- **Evidence that survives the page moving.** Boxes are measured the moment a sense reports a haunting, not when the photograph is taken, because later steps move or remove elements.
- **Desaturating a page but not its halos.** The overlay lives beside `<body>` (as a child of `<html>`), the grey filter goes on `<body>`, and the canvas colour is moved onto the body so the whole print is silver.
- **One curse must not hide the next.** Each curse runs in a fresh scene, so a crash from one value cannot mask the next result.
- **Detecting invisible focus.** `focus-visible` compares the computed outline, shadow, border and colours of each element with keyboard focus and without it.

### Accomplishments that we're proud of

- The theme is the interface. Spirit photographs, moods (wrathful, restless, mischievous, faint) and exorcism are how the tool shows evidence and progress, and every haunting title still reads as a plain fact.
- The landing page and séance record pass their own audit: tokens are WCAG AA, the record works with a keyboard and screen reader, and it respects reduced motion.
- Zero-config modes found real problems on the demo without being told where to look.

### What we learned

Writing steering before code changed the build. Once "ghost, sense, haunting, scene" were fixed words, the code, UI copy, tests and docs stopped drifting apart. The `fileMatch` steering for ghost files meant generated ghosts parsed the first time.

### What's next for Ghost Crew

A GitHub Action that comments the séance record on pull requests, a sense for motion (`prefers-reduced-motion` honoured or not), and letting the Ghost Captain open a fix for the simplest hauntings, with the spirit photograph attached.

---

## Best Kiro Crew App write-up

**Ghost Crew for Kiro Crew** (`kirocrew-app/`, MIT) puts browser QA on the night shift.

| Part | What it does |
|---|---|
| Ghost Captain agent | Asks which hosts you own, runs Poltergeist and Phantom Form's built-in crews, writes focused ghosts with `write_ghost`, validates them, summons them, and reports the total, the worst three hauntings with the page and the fix, and the séance record path. Every claim must come from a tool result. |
| ghost-crew skill | The tool table, the ghost file shape, and the midnight patrol procedure. |
| MCP server | Started straight from the public repo with `npx -p github:alex4524/ghost-crew ghost-crew mcp`, so the app needs no npm publish and no checkout. Read-only tools are auto-approved; `summon` and `write_ghost` ask. |
| midnight-haunt cron | Off until you enable it. At 00:00 local time the captain re-runs the crew with last night's report as baseline and replies only with new hauntings and exorcisms; a quiet night sends nothing. |

The manifest validates with Kiro Crew's own `AppManifest` parser (no errors). Install:

```
kirocrew app install https://github.com/alex4524/ghost-crew.git --subdirectory kirocrew-app
kirocrew app enable ghost-crew
```
