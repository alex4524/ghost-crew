# Decisions

Short records of choices that shape the code. Newest first.

## No false alarms

A haunting is a claim about the site, so three cases that are not the site's fault stay out
of the record:

- **Bot checks.** A Cloudflare challenge, or a DataDome or HUMAN captcha, can stand in front
  of the page. The runner spots one by the `cf-mitigated: challenge` header or the
  challenge's own markers, waits up to 8 seconds for it to let the browser through, and
  otherwise marks the ghost `lost` with the reason. The crew never tries to get past a bot
  check by itself. A lost crew is reported as lost, never as a quiet house.
- **Focus drawn nearby.** Many component libraries remove the outline and draw focus with
  a sibling: an underline that thickens, a halo behind a check box. When an element's own
  style does not change, `focus-visible` photographs the area 8 px around it focused and
  blurred, with motion and the text caret turned off, and only reports it if both
  photographs are identical.
- **Logo text.** WCAG 1.4.3 exempts logotypes. `axe` drops `color-contrast` nodes of 40
  characters or fewer that sit next to an image or class named logo or wordmark.

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
