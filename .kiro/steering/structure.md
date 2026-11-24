---
inclusion: always
name: structure
description: Where each part of Ghost Crew lives and what may import what
---

# Ghost Crew: structure

```
core/                 the skeleton (engine, built-in senses, report, CLI, MCP)
  src/ghost.js        parse + validate *.ghost.yaml
  src/runner.js       launch Chrome, walk steps, run senses, take photographs
  src/senses/         built-in senses every app gets
  src/report/         séance record (JSON + HTML) and exorcism diff
  src/mcp.js          MCP server exposing the crew to Kiro
app-poltergeist/      app 1: accessibility hauntings
app-phantom-form/     app 2: cursed form inputs
demo/haunted/         a small inn website with bugs planted on purpose
demo/exorcised/       the same site with every planted bug fixed
site/                 landing page; CI writes nightly reports to site/reports/
kirocrew-app/         Kiro Crew app: skill, agent, MCP server, midnight cron
scripts/              midnight patrol and Kiro hook scripts
.kiro/                specs, steering, hooks, MCP settings, CLI agent
```

## Import rules

- `core/` imports nothing from `app-*`. Apps import core only through `core/index.js`.
- An app adds behaviour only by registering senses, a theme and ghosts with
  `defineApp()`. If an app needs to patch core, the skeleton is missing an extension
  point: add it to core with a test instead.
- `demo/` is static HTML/CSS/JS with no dependencies so GitHub Pages can serve it.
