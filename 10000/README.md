# 10000

A dependency-free, local multiplayer implementation of the dice game **10000**, deployed at <https://allemann.se/10000/>.

## File structure

- `index.html` — semantic game, setup, event-log, and rules markup.
- `styles.css` — responsive desktop/mobile styling and the brief dice animation.
- `scoring.js` — pure scoring rules, precedence, and exact farkle probability.
- `game.js` — game state machine: turns, break-in, passed dice, final round, and ties.
- `cpu.js` — reusable CPU strategy interface, valid-selection enumeration, and the Balanced strategy.
- `i18n.js` — English/Swedish interface, event-log, scoring-feedback, and error translations.
- `app.js` — rendering, human/CPU turn control, keyboard shortcuts, browser randomness, language switching, and local storage.
- `tests/` — Node test suite for scoring and game-flow edge cases.
- `package.json` — dependency-free test command.

The deployment directory is `/home/erik/sites/10000`. The browser stores one unfinished game under the local-storage key `ten-thousand-game-v1`, plus the language and probability-display preferences; no game data is sent to the server.

## Rules implemented

- Two to six named local players, six dice, optional scoring selection, banking, farkles, and hot dice. Scoring all six forces another roll with all six before banking; a farkle on that roll loses the entire turn score. A farkled roll remains visibly marked on the table until the player explicitly passes play with **Next player**.
- Every seat may be a Human or CPU player, including all-CPU games. CPU turns are animated and can be paused or run at normal, fast, or very-fast speed.
- The initial **Balanced** CPU strategy evaluates every valid scoring subset, the farkle risk of remaining dice, break-in requirements, inherited continuations, score position, and final-round targets. CPU strategy decisions are isolated in `cpu.js` so additional strategies can be added without changing the game engine.
- A persistent EN/SV toggle changes the complete interface and event log without interrupting the current game.
- An optional, persistent probability switch shows the exact farkle risk for the number of dice currently available to roll. It uses the same scoring evaluator as the game, including six-dice special combinations.
- First bank requires at least 1,000 points in a single turn. That successful bank immediately establishes the player and may pass a continuation.
- A broken-in player's banked turn score and remaining dice—including the bank that completes their break-in—are offered only when the next player had already broken in. An inherited score cannot be banked until the inheriting player adds a score.
- Singles, all three-through-six-of-a-kind table values, straight, three pairs, and two triples with the documented precedence.
- Reaching 10,000 starts a final round that runs until every player has taken the same number of turns. Tied leaders then take complete additional rounds until one remains.

## Test

Node.js 18 or newer is sufficient; there are no packages to install.

```sh
cd /home/erik/sites/10000
npm test
```

## Caddy and deployment

The Caddy configuration adds host-and-path matchers for `allemann.se` and `www.allemann.se` only:

- `/10000` redirects permanently to `/10000/` so relative assets resolve correctly.
- `/10000/*` strips the prefix and serves this directory.
- The existing `/var/www/landing` fallback remains unchanged for every hostname and all other paths.

The pre-change configuration is backed up at `/home/erik/caddy_staging/Caddyfile.backup-20260720-before-10000`. The maintained staging file is `/home/erik/caddy_staging/Caddyfile`.

To update the game, edit the files in `/home/erik/sites/10000`, bump the shared `v=` asset marker in `index.html`, `app.js`, `game.js`, and `cpu.js`, then run `npm test`. The asset marker keeps browsers from combining files from different releases; `tests/assets.test.js` verifies that every browser entry and module import uses the same marker. Reload Caddy only if its configuration itself changed. Static asset edits are served immediately.

To remove the game, remove the two 10000 matchers/handlers from the staging Caddyfile, validate and deploy it, reload Caddy, verify the existing landing page, and then remove `/home/erik/sites/10000` after confirming deletion. Record the operational change in `/home/erik/ops_log.md`.
