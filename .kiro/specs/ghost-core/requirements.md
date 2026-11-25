# Requirements: Ghost Crew core (the skeleton)

## Introduction

Front-end developers check their pages by hand before every release: click through,
type odd things into forms, tab through with the keyboard. Ghost Crew turns each of
those walks into a small YAML file (a ghost) that a real Chrome replays, and returns a
photograph of every problem it saw. The core must stay small enough to read in one
sitting and open enough that a new kind of check is one file.

## Requirement 1: ghost files

**User story:** As a developer, I want to describe a page walk in a short file, so that
I can add a check without writing test code.

1. WHEN a `*.ghost.yaml` file is loaded THE SYSTEM SHALL require `ghost`, `haunts` and
   at least one entry in `senses`.
2. WHEN a required key is missing or a sense name is unknown THE SYSTEM SHALL reject the
   file with a message that names the file, the key and the allowed values.
3. WHEN `haunts` is a path THE SYSTEM SHALL join it to the `--base-url` given at run time.
4. THE SYSTEM SHALL support the steps `click`, `fill`, `press`, `wait` and `scroll`, with
   targets given as visible text, a field label, or `css:<selector>`.
5. THE SYSTEM SHALL offer `ghost-crew check <file>` that validates without a browser.

## Requirement 2: summoning a crew

**User story:** As a developer, I want to run many ghosts at once against my site, so
that a full patrol takes seconds, not minutes.

1. WHEN a crew is summoned THE SYSTEM SHALL open one browser and give each ghost its own
   isolated browser context.
2. THE SYSTEM SHALL run up to `--crew-size` ghosts in parallel (default 4).
3. WHILE a ghost walks THE SYSTEM SHALL record console errors, uncaught page errors and
   failed requests for the senses to use.
4. IF a ghost's step fails THEN THE SYSTEM SHALL mark that ghost `lost`, keep its last
   photograph, and continue with the rest of the crew.
5. WHEN the run ends THE SYSTEM SHALL exit with code 1 if any haunting is at or above
   `--fail-on` severity (default `restless`), and 0 otherwise.
6. IF the page answers with a bot check (a Cloudflare challenge, a DataDome or HUMAN
   captcha) THEN THE SYSTEM SHALL wait up to 8 seconds for it to let the browser through,
   and otherwise mark the ghost `lost` with the reason instead of running its senses.
7. WHEN no haunting was found but a ghost got lost THE SYSTEM SHALL say so in the CLI
   summary and the séance record, instead of calling the house quiet.

## Requirement 3: senses are plugins

**User story:** As an app author, I want to add my own kind of check, so that I can
build a new app on the skeleton without touching core.

1. THE SYSTEM SHALL let an app register a sense with `defineSense(name, { run })`.
2. WHEN a sense runs THE SYSTEM SHALL give it the page, a `locate()` helper, a
   `haunt()` reporter, and `scene()` to open a fresh page for a separate experiment.
3. WHEN a sense reports a haunting with a target THE SYSTEM SHALL record the target's
   box in page coordinates.
4. THE SYSTEM SHALL ship core senses: `text-visible`, `text-absent`, `console-clean`,
   `no-overflow`, `no-broken-images`, `broken-characters`, `requests-ok`.

## Requirement 4: spirit photographs

**User story:** As a reviewer, I want to see each problem on the page itself, so that
I trust the finding without re-running anything.

1. WHEN a scene has at least one haunting THE SYSTEM SHALL save a plain screenshot (the
   living page) and an annotated one (the spirit photograph).
2. THE spirit photograph SHALL show the page desaturated, with a glowing halo and a
   numbered seal on every target box; the numbers SHALL match the report list.
3. THE SYSTEM SHALL save the first spirit photograph of a run as `cover.png`.

## Requirement 5: séance record and exorcism

**User story:** As a team, we want a report we can open from CI and compare night to
night, so that we see what we fixed.

1. WHEN a run ends THE SYSTEM SHALL write `report.json` and a self-contained
   `index.html` into the output folder.
2. WHEN `--baseline <report.json>` is given THE SYSTEM SHALL classify every haunting as
   `new` or `still haunting`, and list baseline hauntings that are gone as `exorcised`.
3. THE report SHALL be readable with keyboard and screen reader, meet WCAG 2.1 AA
   contrast, and work without JavaScript except for the photograph toggle.

## Requirement 6: Kiro integration

**User story:** As a Kiro user, I want my agent to write and summon ghosts, so that QA
happens inside the same conversation that wrote the code.

1. THE SYSTEM SHALL run an MCP server over stdio with `ghost-crew mcp`.
2. THE MCP server SHALL expose `list_ghosts`, `check_ghost`, `write_ghost`, `summon`
   and `read_report`.
3. WHEN `write_ghost` receives invalid YAML THE SYSTEM SHALL refuse to write and return
   the validation errors.
