# Allemann Web Games

Browser-based games for friends and family, built with vanilla HTML, CSS, and JavaScript.

## Games

| Game | Public URL | Source | Description |
| --- | --- | --- | --- |
| 10000 | <https://allemann.se/10000/> | [`10000/`](./10000/) | Local push-your-luck dice game for human and CPU players. |
| Chicago | <https://allemann.se/chicago/> | [`chicago/`](./chicago/) | Swedish Chicago card game for one human and up to three CPU opponents. |

Each game is a self-contained, dependency-free static application with its own README and test suite. Browser game state is stored locally on the player's device.

## Test everything

Node.js 18 or newer is sufficient. No package installation is required.

```sh
npm test
```

Individual suites can be run with `npm run test:10000` or `npm run test:chicago`.

## Source and deployment

This repository is the source of truth. The public Caddy-served directories on `erik.roxen.com` are deliberately separate deployment copies:

```text
Repository                         Public deployment
10000/                       ->    /home/erik/sites/10000
chicago/                     ->    /home/erik/sites/chicago
```

This separation prevents an unfinished edit, branch switch, or merge from immediately changing a public game. See [`docs/deployment.md`](./docs/deployment.md) for the release checklist and rollback notes.

## Releases

Keep changes to each game within its directory where practical. Record player-visible changes in that game's `CHANGELOG.md`, use game-prefixed tags such as `10000-v1.1.0` and `chicago-v1.0.1`, and bump that game's coherent static-asset marker whenever browser files change.
