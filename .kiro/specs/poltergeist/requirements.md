# Requirements: Poltergeist (app 1)

## Introduction

Poltergeist is the accessibility app built on Ghost Crew. It answers one question
for a designer or front-end developer: "who can't use this page, and where exactly?"

## Requirement 1: zero-config sweep

**User story:** As a developer with no ghosts written yet, I want to point Poltergeist
at a URL, so that I get a useful report in one command.

1. WHEN `poltergeist <url>` runs with no ghost files THE SYSTEM SHALL summon the
   built-in crew: one desktop axe sweep, one mobile axe + overflow sweep, one keyboard
   walk.
2. WHEN a folder of ghosts is given with `--ghosts <dir>` THE SYSTEM SHALL summon those
   instead.

## Requirement 2: senses

1. `axe` SHALL run axe-core in the page and report one haunting per rule, with a box for
   every failing node, mood mapped from axe impact, and the rule's help URL.
2. `keyboard-reach` SHALL press Tab up to `limit` times (default 60) and report every
   target that never receives focus.
3. `focus-visible` SHALL focus each of the first `limit` focusable elements and report
   the ones whose outline, box-shadow and border do not change on focus.

## Requirement 3: theme

1. The séance record SHALL carry the Poltergeist name and lore, and title each haunting
   with the plain WCAG wording.
