# Requirements: Phantom Form (app 2)

## Introduction

Phantom Form is the form-breaking app built on Ghost Crew. Real people have emoji in
their names, apostrophes in their emails and fat fingers on number fields. Phantom
Form types those "cursed" inputs into a form, one at a time, and photographs what the
page does with each.

## Requirement 1: curses

1. THE SYSTEM SHALL ship a curse library: `emoji`, `zalgo`, `rtl`, `long`, `wide`,
   `markup`, `sqlish`, `blank`, `apostrophe`, `unicode-name`, `weird-valid-email`,
   `negative`, `zero`, `huge`.
2. Curses marked valid (`apostrophe`, `unicode-name`, `weird-valid-email`) SHALL be
   real-world input the form must accept.

## Requirement 2: `cursed-inputs` sense

1. FOR each field and curse THE SYSTEM SHALL open a fresh scene, fill every field with
   its `valid` value, replace the field under test with the curse, and submit.
2. THE SYSTEM SHALL report a haunting WHEN, in that scene: an uncaught page error
   occurs; the markup curse executes script; content overflows its box; broken
   characters appear; a blank value is accepted; a valid curse is rejected; or text
   matches a `forbid` pattern.
3. THE SYSTEM SHALL count curses survived and show "survived N of M" in the report.

## Requirement 3: zero-config

1. WHEN `phantom-form <url>` runs with no ghosts THE SYSTEM SHALL find the first form,
   pick curses by input type, and run every check that needs no success indicator.
