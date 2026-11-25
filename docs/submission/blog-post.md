---
title: "Every web app is haunted: building Ghost Crew with Kiro for Kiroween Hackathon 2026"
tags: kiro, accessibility, testing, javascript
cover_image: https://alex4524.github.io/ghost-crew/reports/poltergeist/cover.png
---

*Written for the Kiroween Hackathon 2026.*

Before every release I walk my own pages by hand. Tab through with the keyboard. Type
an emoji name into the booking form. Open it on a phone. It is slow, and the same bugs
come back. For Kiroween I built **Ghost Crew** with Kiro: a small skeleton that writes
those walks down once and replays them in a real Chrome every night.

![A spirit photograph](https://alex4524.github.io/ghost-crew/reports/poltergeist/cover.png)

## A ghost is ten lines of YAML

```yaml
ghost: The Locked Door
haunts: /index.html
senses:
  - keyboard-reach:
      targets: [Book now, Reserve]
```

Ghost Crew opens Chrome, gives each ghost a private context, walks four at a time, and
writes a *séance record*. Every finding comes with a *spirit photograph*: the page in
silver, each problem glowing and numbered to match the list. Pass last night's report as
a baseline and the record tells you what you exorcised.

## Two apps, one skeleton

The Skeleton Crew category asks for one foundation and two distinct apps.

- **Poltergeist** checks accessibility: axe-core, a keyboard walk that finds anything
  that looks clickable but cannot take focus, and invisible focus rings.
- **Phantom Form** types what real people type: `👻 Casper`, `Siobhán O'Brien`,
  `o'brien+inn@…`, `<img onerror>`, `-3` nights. Each curse gets a fresh page and its own
  photograph.

Each app is under 300 lines. All an app can do is register senses, a theme and a crew.

## How Kiro shaped it

**Steering before code.** I started with five steering files: the product vocabulary
(ghost, sense, haunting, scene, exorcised), tech rules, an import rule ("core never
imports an app"), the exact ghost file shape, and design tokens with contrast ratios. The
ghost-shape file uses `fileMatch` on `*.ghost.yaml`, so it only loads while a ghost is
open, and generated ghosts parsed on the first try.

**Specs.** The core spec has EARS requirements, a design with the data model, and a task
list. The demo inn has 15 bugs planted on purpose, and the tests require every one to be
found, and none on the fixed twin.

**Hooks.** A `PostFileSave` hook validates a ghost with a script, so the check costs no
tokens. A `SessionStart` hook briefs the agent with last night's worst hauntings. A `Stop`
hook runs the tests.

**MCP.** `ghost-crew mcp` exposes five tools, so a Kiro agent can write a ghost, check it
and summon the crew in the same conversation that wrote the feature.

**Kiro Crew.** The repo ships a Kiro Crew app: a Ghost Captain agent and a midnight patrol
that stays silent unless something changed.

The best moment was watching Kiro Crew critique its own output. It opened the first
Phantom Form photographs, saw that they showed the top of the page while the haunting
was further down, and changed the photographer to save a crop around the evidence.

## Try it

```bash
npx -y -p github:alex4524/ghost-crew poltergeist https://your.app
```

Live records from last night: https://alex4524.github.io/ghost-crew/ · Code:
https://github.com/alex4524/ghost-crew

#KiroweenHackathon26
