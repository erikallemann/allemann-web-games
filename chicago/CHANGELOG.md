# Changelog

## 2026-08-15

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
