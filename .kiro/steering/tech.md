---
inclusion: always
name: tech
description: Runtime, dependencies and the commands that prove a change works
---

# Ghost Crew: tech

- Node.js 20+, ESM only, no build step. Source is plain JavaScript with `// @ts-check`
  and JSDoc types, so `node` runs every file as written.
- Browser: `playwright-core` driving the Chrome already installed on the machine
  (`channel: 'chrome'`). Set `GHOST_CREW_CHROME` to an executable path to override.
  Never download a bundled browser in the default path.
- Dependencies are limited to: `playwright-core`, `yaml`, `axe-core`,
  `@modelcontextprotocol/sdk`, `zod`. Adding one needs a line in `docs/decisions.md`.
- Tests use the built-in `node:test` runner. Browser tests start the demo with
  `core/bin/serve.js` on a random port and close it in `after()`.

## Commands

| Goal | Command |
|---|---|
| unit + browser tests | `npm test` |
| serve the haunted demo | `npm run demo` (http://127.0.0.1:4173) |
| run Poltergeist on the demo | `npm run haunt:poltergeist` |
| run Phantom Form on the demo | `npm run haunt:phantom` |
| full nightly patrol into `site/reports` | `npm run midnight` |
| MCP server for Kiro | `node core/bin/ghost-crew.js mcp` |

## Rules

- A change to `core/src/` is done when `npm test` passes and `npm run midnight`
  still writes three reports.
- CLI output goes to stderr for progress and stdout for the final summary, so
  `--json` output stays machine-readable.
- Bind every local server to `127.0.0.1`.
