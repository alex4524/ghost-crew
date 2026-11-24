---
inclusion: always
name: product
description: What Ghost Crew is, who it is for, and the words we use for its parts
---

# Ghost Crew: product

Ghost Crew is a skeleton for browser QA. A **ghost** is a short YAML file that walks
a web page in a real Chrome, uses **senses** to notice what is broken, and brings
back a **spirit photograph**: a screenshot with every problem circled.

Two applications are built on the skeleton, and each one must keep working on its own:

| App | Folder | Haunts | Built-in senses it adds |
|---|---|---|---|
| Poltergeist | `app-poltergeist/` | accessibility | `axe`, `keyboard-reach`, `focus-visible` |
| Phantom Form | `app-phantom-form/` | forms | `cursed-inputs` |

## Vocabulary (use these words in code, docs and UI copy)

| Word | Means | Never call it |
|---|---|---|
| ghost | one `*.ghost.yaml` file | test, spec, check |
| crew | the set of ghosts summoned together | suite |
| sense | a plugin that inspects a page and reports | assertion, rule |
| haunting | one finding a sense reported | error, issue |
| scene | one page state a sense looked at | step |
| spirit photograph | the annotated screenshot of a scene | screenshot (in UI copy) |
| séance record | the HTML report of one run | dashboard |
| exorcised | a haunting from the baseline that is gone now | fixed, resolved |

## Severity

Senses map their own scale onto four moods, from worst to mildest:
`wrathful` → `restless` → `mischievous` → `faint`. axe impacts map
critical/serious/moderate/minor in that order.

## Rules

- A haunting is only reported with evidence: a scene photograph, and a target box when
  the sense knows which element is at fault. A sense that cannot point at evidence must
  say so in `detail`.
- The theme is decoration on top of plain facts. Every haunting title must still read
  correctly to someone who ignores the ghost story ("Image has no text alternative").
- Never haunt a site the user does not own. The CLI warns on non-local hosts and the
  docs say so.
