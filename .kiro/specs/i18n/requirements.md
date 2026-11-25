# Requirements: reading Ghost Crew in five languages

## Introduction

Judges and users read the landing page, the demo inn and the séance records. They should
be able to read them in English, Simplified Chinese, Traditional Chinese, Hindi or Tamil,
without changing what a ghost sees when it walks a page.

## Requirement 1: pages

1. THE landing page, both demo inns and every séance record SHALL offer a language menu
   with English, 简体中文, 繁體中文, हिन्दी and தமிழ்.
2. English SHALL be the default and SHALL be written in the HTML itself, so a page reads
   correctly with JavaScript off.
3. WHEN a reader picks a language THE SYSTEM SHALL remember it (`?lang=` and
   `localStorage`) and use it on the other pages of the same site.
4. THE haunted inn SHALL keep every planted bug in every language, including the missing
   `lang` attribute; the exorcised inn SHALL update `lang` to the chosen language.
5. A ghost SHALL always walk the English page: a fresh browser context has no stored choice.

## Requirement 2: séance records

1. Interface text (headings, counts, moods, buttons, captions) SHALL be translated.
2. Hauntings SHALL stay in the words their sense wrote, and a non-English page SHALL say so.
3. An app MAY translate its tagline and tally wording in `theme.i18n`.

## Requirement 3: public links

1. WHEN the nightly patrol walks a local copy of the demo THE records SHALL link to the
   published copy of the same page, never to `127.0.0.1`.

## Requirement 4: README

1. THE repository SHALL ship `README.md` (English, default), `README.zh-CN.md`,
   `README.zh-TW.md`, `README.hi.md` and `README.ta.md`, each starting with the same line of
   language links.
2. THE five files SHALL carry the same code blocks, images, links and numbers.

Each requirement is checked by `core/test/i18n.test.js` or `core/test/crew.test.js`.
