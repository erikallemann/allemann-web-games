# Chicago

A dependency-free browser implementation of the Swedish card game Chicago, deployed at <https://allemann.se/chicago/>.

## Structure

- `cards.js` — standard 52-card deck, shuffle, sorting, and labels.
- `poker.js` — pure five-card poker evaluation, tie-breaking without suit ranking, and hidden-hand spoken calls.
- `rules.js` — pure low-hand, Chicago, legal-move, trick-winner, and normal-victory rules.
- `game.js` — explicit round state machine, exchanges, scoring, Chicago lifecycle, and persistence validation.
- `cpu.js` — hidden-information-safe heuristics for redeals, declarations, exchanges, and tricks.
- `app.js` — Swedish rendering, human controls, CPU timing, settings, and local storage.
- `styles.css` — responsive styling aligned with the neighboring 10000 game.
- `tests/` — Node tests for poker, rules, game flow, CPU play, and asset versioning.

The current game is stored under `chicago-game-v2`; CPU speed is stored separately. No data is sent to a server.

## Deterministic interpretations

- A unique royal flush wins immediately only when it is the single best hand. Equal royal flushes tie and award no win, following the note's rule that completely equal leading hands receive nothing.
- A successful Chicago ends when the fifth trick is resolved, before ordinary fifth-trick/final-poker scoring. A failed Chicago continues through both later scoring events.
- Chicago is offered as one of the acting player's choices in the first exchange. An accepted call completes that player's first-exchange action without changing cards; otherwise the player may stand pat or exchange selected cards.
- Poker comparisons are presented as trust-based spoken calls such as `Ett par, lågt` rather than by exposing full hands. The engine still applies exact category and kicker comparisons.
- The note requires one 52-card deck, forbids discarded cards from returning, and also permits up to five replacements in each of three exchanges. Those requirements can exhaust the stock in an extreme four-player round. The game never reuses discards: once the stock is low, the UI and engine limit a player's selection to the number of undealt cards remaining. Passing remains available in all three phases.
- CPU players use only their own hand and public trick/declaration state. They do not receive other hands or the undealt deck in decision inputs.

## Test

```sh
cd /home/erik/sites/chicago
npm test
npm run check
```

## Deployment

Caddy redirects `/chicago` to `/chicago/`, strips the prefix for `/chicago/*`, and serves `/home/erik/sites/chicago` only on `allemann.se` and `www.allemann.se`. Static assets use one shared `v=` marker; bump it in `index.html` and all module imports for every release.
