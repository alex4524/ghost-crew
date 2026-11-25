# The Hollow Pines Inn

A small, fictional inn website in two editions. `haunted/` has bugs planted on purpose;
`exorcised/` is the same page with every one of them fixed. The nightly patrol haunts
both, and the tests require hauntings on the first and none on the second.

| Planted bug | Where | Found by |
|---|---|---|
| `<html>` has no `lang` | `haunted/index.html` | Poltergeist `axe` (html-has-lang) |
| Hero image has no `alt` | hero `<img>` | Poltergeist `axe` (image-alt) |
| Close button is an icon with no name | top notice | Poltergeist `axe` (button-name) |
| Grey note text at 2:1 contrast | "Prices include…" | Poltergeist `axe` (color-contrast) |
| "Book now" is a `<div onclick>` | hero | Poltergeist `keyboard-reach` |
| Navigation focus outline removed | `.site nav a:focus` | Poltergeist `focus-visible` |
| 560px price table, no scroll box | prices | Poltergeist `no-overflow` on a phone |
| Attic photo file is missing | rooms | Poltergeist `no-broken-images`, `requests-ok` |
| `name[0]` splits emoji in half | `haunted/app.js` | Phantom Form `emoji` → broken characters |
| `innerHTML` with the guest's name | `haunted/app.js` | Phantom Form `markup` → script injection |
| `'·'.repeat(32 - name.length)` | `ticketStub()` | Phantom Form `long`, `markup` → crash |
| Name tag is `12ch` and `nowrap` | `.tag` | Phantom Form `wide`, `long`, `apostrophe` → spills |
| Name is never trimmed | submit handler | Phantom Form `blank` → accepted |
| Email regex rejects `+` and `'` | submit handler | Phantom Form `weird-valid-email` → refused |
| Nights accepts negatives and huge numbers | submit handler | Phantom Form `negative`, `huge` → "$-540", "1.8e+22" |

The guest name field also has only a placeholder and no label. axe accepts a placeholder
as a name, so no ghost reports it; the exorcised edition adds a label anyway.

## Languages

Both editions have a language menu (English, 简体中文, 繁體中文, हिन्दी, தமிழ்). The menu is
not a planted bug: it is labelled and reachable by keyboard. The haunted edition keeps its
missing `lang` attribute in every language. Ghosts always see English, because each ghost
starts in a fresh browser with no stored choice. Translations live in
`shared/i18n-inn.js`; `shared/i18n.js` is a copy of `core/src/i18n/runtime.browser.js`.
