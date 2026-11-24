# Decisions

Short records of choices that shape the code. Newest first.

## Apps are found by folder convention

`core/src/apps.js` imports every `app-*/app.js` at start. The alternative, core importing
each app by name, would make core depend on its apps and break the "skeleton" promise.
`--plugin <module>` covers apps that live outside the repository.

## Chrome already on the machine, not a downloaded browser

`playwright-core` with `channel: 'chrome'`. It keeps `npx` fast (no 150 MB browser
download) and uses the same Chrome the developer tests in. GitHub's Ubuntu runners ship
Google Chrome, so CI needs no extra step. `GHOST_CREW_CHROME` and Playwright's own
Chromium are fallbacks.

## Dependencies

| Package | License | Why |
|---|---|---|
| `playwright-core` | Apache-2.0 | drives Chrome; no bundled browser |
| `axe-core` | MPL-2.0 | the accessibility rules engine Poltergeist runs in the page |
| `yaml` | ISC | ghost files |
| `@modelcontextprotocol/sdk` | MIT | the MCP server for Kiro |
| `zod` | MIT | MCP tool input schemas |

## One fresh scene per curse

Phantom Form opens a new page for every field and curse instead of retyping into one
page. It is slower (about 0.6 s a curse locally) but a crash from one curse cannot hide
or cause the next one's result, and each haunting gets its own photograph.

## Photographs are measured when the haunting is reported

Boxes are measured inside `haunt()`, not when the photograph is taken, because a later
step can move or remove the element.
