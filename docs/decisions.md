# Decisions

Short records of choices that shape the code. Newest first.

## Five languages, English in the HTML

The landing page, both demo inns and the séance records switch between English, 简体中文,
繁體中文, हिन्दी and தமிழ். English is written in the HTML, and a small browser script
(`core/src/i18n/runtime.browser.js`, copied verbatim to `demo/shared/i18n.js`) swaps in
the other languages from per-page dictionaries. This keeps three properties:

- every page reads correctly with JavaScript off;
- a ghost, which starts in a fresh browser with no stored choice, always walks the English
  page, so findings and planted bugs do not change with the reader's language;
- no new dependency. Script fonts (Noto) load only when someone picks that language.

Hauntings stay in the words their sense wrote. Translating them would mean translating axe
rule descriptions and every sense's message, and the evidence would no longer match the
English report the CLI prints.

## Records link to the public demo

The nightly patrol walks `demo/` served on 127.0.0.1 from the same commit, so the records
always match the code. `buildReport({ publicUrl })` rewrites those addresses to the
GitHub Pages copy of the same files, so every link in a published record opens.


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
