# Changelog

## 2026-08-21

- Skip the low-hand redeal prompt for players who have a ten or higher.
- Show poker calls and award poker points after the second exchange.

## 2026-08-18

- Add the remembered, editable family roster from 10000 to Chicago's setup while retaining one human and up to three CPU opponents.
- Add a compact sticky mobile score ribbon with expandable player details, matching the 10000 game.
- Add breathing room between the mobile Details control and the score ribbon.
- Pause after the fifth trick so it remains visible until the player chooses to show the round result.
- Correct the opponent card-back selector so five-card stacks keep their intended compact alignment on mobile.

## 2026-08-15

- Show the active browser asset version in the game footer.
- Renamed the poker-call heading from “Pokeranrop” to “Utrop”.
- Changed human exchange selection to mark cards to keep.
- Added a choice to accept the face-up replacement for a one-card exchange or reject it and take the next card face-down.
- Reveal every player's complete hand after the fifth trick and before the next round.
- Show all five tricks in play order at the end of a round, expanded on desktop and optional on mobile.
- Describe revealed final hands factually, including their exact ranks, instead of repeating the earlier hidden-hand utrop.
- Use the correct Swedish term “sakar” when a player cannot follow suit.

## Baseline — 2026-08-12

First Git-preserved baseline of the live game at <https://allemann.se/chicago/>.

The baseline includes Swedish Chicago for one human and one to three CPU opponents, exchanges, Chicago declarations, poker-hand comparison, trick play, local persistence, responsive controls, automated rules/game/CPU tests, and coherent browser-asset versioning.

Earlier operational changes remain documented in the server's append-only `/home/erik/ops_log.md`.
