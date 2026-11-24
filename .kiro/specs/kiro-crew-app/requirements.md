# Requirements: Ghost Crew as a Kiro Crew app

## Introduction

Kiro Crew runs agents that keep working when nobody is watching. Ghost Crew's natural
home there is a night shift: a captain agent that writes ghosts for a page, summons the
crew, and posts only what changed since last night.

## Requirement 1: app package

1. `kirocrew-app/app.json` SHALL declare the skill, the `ghost-captain` agent, the
   `ghost-crew` MCP server and a `midnight-haunt` cron that is off until the user
   enables it.
2. The MCP server SHALL start from the public GitHub repository with `npx`, so the app
   needs no npm publish and no local checkout.

## Requirement 2: the captain

1. WHEN asked to haunt a URL THE captain SHALL write one ghost per concern with
   `write_ghost`, validate them, summon them, and answer with counts and the report path.
2. THE captain SHALL refuse to haunt a host the user has not confirmed they own.

## Requirement 3: midnight patrol

1. WHEN the cron fires THE captain SHALL summon the saved crew with the previous report
   as baseline, and reply only with new hauntings and exorcisms; a night with no change
   ends with no message.
