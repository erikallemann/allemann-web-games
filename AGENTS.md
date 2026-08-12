# Project Instructions

- This repository is the source of truth for the static games deployed at `https://allemann.se/10000/` and `https://allemann.se/chicago/`.
- Read the selected game's README and `docs/deployment.md` before changing or deploying it.
- Run `git status -sb` before editing. Preserve unrelated work and never revert changes you did not create.
- Keep each game self-contained and dependency-free unless a dependency has a clear, documented benefit.
- Run the selected game's tests while developing and root `npm test` before committing or deploying.
- Each game deliberately versions every browser asset/module edge with one coherent marker. Bump all occurrences together for browser-facing releases; the asset tests must pass.
- The Git working tree is not the public document root. Do not modify `/home/erik/sites/*`, Caddy, or other services unless deployment or routing changes were explicitly requested.
- For a deployment, copy only the selected game, verify its public HTTPS URL and a mobile viewport, confirm the other game and landing page still load, and record the live change in `/home/erik/ops_log.md`.
- Never commit credentials, private keys, browser storage, Caddy's complete host configuration, or unrelated server operational data.
