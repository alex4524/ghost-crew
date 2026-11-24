# How Kiro built Ghost Crew

Ghost Crew was built in one long Kiro Crew session, then wired so that the next person
can keep building it in Kiro IDE, Kiro CLI or Kiro Crew.

## 1. Steering before code

The first files written were the five steering documents, not code:

| File | Inclusion | Why it exists |
|---|---|---|
| `product.md` | always | One vocabulary (ghost, sense, haunting, scene, spirit photograph, exorcised). The agent kept using these words in code, UI copy and tests, so names never drifted. |
| `tech.md` | always | Node 20, ESM, no build step, five dependencies, which command proves a change works. |
| `structure.md` | always | Core never imports an app. This rule forced the `app-*/app.js` discovery convention instead of a hard-coded import. |
| `ghost-authoring.md` | `fileMatch: **/*.ghost.yaml` | The exact ghost shape, loaded only while a ghost is open, so generated ghosts parse the first time. |
| `spirit-design.md` | `fileMatch` on site, report and demo | The light "silver gelatin" palette with contrast ratios. When the build measured the ratios, verdigris was 4.49:1 on the page background, just under AA; the token was darkened and `scripts/contrast.mjs` now guards it in CI. |

## 2. Specs

`.kiro/specs/ghost-core/` holds requirements in EARS form ("WHEN a ghost's step fails THE
SYSTEM SHALL mark that ghost lost…"), a design with a mermaid diagram and the data model,
and a task list. The apps and the Kiro Crew app have their own requirements files. Each
requirement maps to a test: for example requirement 5.2 (exorcism) is
`core/test/report.test.js › exorcism diff`, and the app requirements are the planted-bug
assertions in `core/test/crew.test.js`.

## 3. Hooks

| Hook | Trigger | Action |
|---|---|---|
| `check-ghost-on-save.json` | `PostFileSave` on `*.ghost.yaml` | `scripts/hooks/check-saved-ghost.mjs` validates the file without a browser and prints every problem |
| `session-briefing.json` | `SessionStart` | `scripts/hooks/briefing.mjs` prints the newest report's totals and three worst hauntings |
| `sense-docs-sync.json` | `PostFileSave` on a sense file | asks the agent to re-sync the sense lists in steering and the skill |
| `tests-before-stop.json` | `Stop` | `npm test` |

The command hooks are zero-token: a script checks, the agent only reads the result.

## 4. MCP

`ghost-crew mcp` is a stdio MCP server built with the official SDK. Five tools:
`list_ghosts`, `check_ghost`, `write_ghost` (refuses invalid YAML and paths outside the
project), `summon` and `read_report`. `core/test/mcp.test.js` drives it with a real MCP
client the way Kiro does. Kiro IDE picks it up from `.kiro/settings/mcp.json`;
`.kiro/agents/ghost-captain.json` is a Kiro CLI agent that uses it.

## 5. Kiro Crew app

`kirocrew-app/` is a Kiro Crew app (validated with Kiro Crew's own `AppManifest`
parser):

- **Ghost Captain** agent: asks which hosts you own, runs the built-in crews first, writes
  focused ghosts with `write_ghost`, and reports totals, the worst three hauntings and
  the séance record path. Every claim must come from a tool result.
- **ghost-crew skill**: the tool table, ghost shape, and the midnight patrol procedure.
- **MCP server** launched with `npx -p github:alex4524/ghost-crew`, so no npm publish
  and no local checkout are needed.
- **midnight-haunt cron**, off by default: re-runs the crew against last night's report
  and stays silent when nothing changed.

## 6. What Kiro Crew did during the build

- Ran the demo crew many times and read its own spirit photographs. The first
  Phantom Form photographs showed the top of the page while the haunting sat lower down;
  that is why `photograph.js` now also saves a crop around the evidence.
- Used agent-browser to review the séance record and landing page at desktop and phone
  widths before shipping them.
- Set up the nightly GitHub Actions patrol that publishes the reports to Pages.
