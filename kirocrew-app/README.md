# Ghost Crew for Kiro Crew

A Kiro Crew app that puts Ghost Crew on the night shift.

| Part | File | What it does |
|---|---|---|
| Agent | `agents/ghost-captain.json` | Writes ghosts for the pages you name, summons them, reports with evidence |
| Skill | `skills/ghost-crew/SKILL.md` | Tool table, ghost file shape, the midnight patrol procedure |
| MCP server | `app.json` → `mcpServers.ghost-crew` | `npx -p github:alex4524/ghost-crew ghost-crew mcp`: five tools |
| Cron | `app.json` → `crons.midnight-haunt` | Off by default. At 00:00 local time, re-runs the crew against last night's report and stays silent if nothing changed |

## Install

```bash
kirocrew app install https://github.com/alex4524/ghost-crew.git --subdirectory kirocrew-app
kirocrew app enable ghost-crew
```

Then open a chat with the **ghost-captain** agent and say, for example:
"Haunt http://127.0.0.1:5173/ with Poltergeist and Phantom Form."

To turn on the midnight patrol, enable the `ghost-crew:midnight-haunt` job on the
Schedule page.

Uninstall with `kirocrew app uninstall ghost-crew` (your reports stay in your project).

## Needs

Node 20 or newer and Google Chrome. The first summon downloads the package from GitHub
with `npx`, which takes about 20 seconds once.
