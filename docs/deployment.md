# Deployment

## Model

The repository under `/home/erik/git/allemann-web-games` is the source of truth. Caddy serves separate copies from `/home/erik/sites/10000` and `/home/erik/sites/chicago`. There is no build step and no server-side game state.

Caddy already restricts both routes to `allemann.se` and `www.allemann.se`. Ordinary game releases do not require a Caddy edit or reload.

## Release checklist

1. Run `git status -sb` and review the complete diff for the selected game.
2. Update its `CHANGELOG.md`.
3. Bump the game's shared static-asset marker in every HTML/CSS/JavaScript reference. Its asset test checks marker consistency.
4. Run the selected suite and then root `npm test`.
5. Commit the source and create a game-prefixed release tag when appropriate.
6. Stage a fresh copy of only that game's tracked application files outside its public directory. Do not deploy repository metadata, root documentation, or the other game.
7. Replace the selected public directory only after the staged copy has passed its tests. Retain the previous deployed copy until HTTPS verification succeeds.
8. Verify the game over HTTPS at desktop and mobile widths, including persistence and browser console errors.
9. Confirm the other game and <https://allemann.se/> still return successful responses.
10. Record the live deployment and verification in `/home/erik/ops_log.md`, then remove the temporary previous release when it is no longer needed.

## Rollback

Restore the immediately previous deployed copy, or check out the desired game-prefixed tag and redeploy only that directory. Browser local storage remains associated with the public origin and path; replacing static files does not itself erase saved games. If a release changes saved-state structure, the game must migrate or deliberately reject incompatible state and document that decision.

## Caddy

Change Caddy only when adding, removing, or moving a public route. Follow the host playbook: inspect the current configuration, back it up, edit the maintained staging copy, validate, install, reload, and verify every affected route.
