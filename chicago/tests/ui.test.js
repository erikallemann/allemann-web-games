import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("mobile score ribbon and compact opponent card backs stay wired", async () => {
  const [html, app, styles] = await Promise.all([
    readFile(resolve(root, "index.html"), "utf8"),
    readFile(resolve(root, "app.js"), "utf8"),
    readFile(resolve(root, "styles.css"), "utf8"),
  ]);

  assert.match(html, /id="score-ribbon"/);
  assert.match(html, /id="scoreboard-toggle"/);
  assert.match(html, /id="name-list"/);
  assert.match(html, /id="family-roster"/);
  assert.match(app, /scoreDetailsOpen/);
  assert.match(app, /nextRosterPlayer/);
  assert.match(app, /confirmFinalTrick/);
  assert.match(styles, /\.score-section\.details-open \.scoreboard/);
  assert.match(styles, /\.card-backs \.face-down/);
  assert.match(styles, /\.final-trick-confirm/);
});
