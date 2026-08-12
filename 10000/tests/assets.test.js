import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(file) {
  return readFile(new URL(file, root), "utf8");
}

test("browser assets use one coherent cache-busting release marker", async () => {
  const files = {
    "index.html": await source("index.html"),
    "app.js": await source("app.js"),
    "game.js": await source("game.js"),
    "cpu.js": await source("cpu.js"),
  };
  const expectedImports = {
    "index.html": ["styles.css", "app.js"],
    "app.js": ["game.js", "cpu.js", "scoring.js", "setup.js", "i18n.js"],
    "game.js": ["scoring.js"],
    "cpu.js": ["scoring.js"],
  };
  const versions = new Set();

  for (const [file, assets] of Object.entries(expectedImports)) {
    for (const asset of assets) {
      const match = files[file].match(
        new RegExp(`(?:href|src|from)=[\"']?[^\"']*${asset.replace(".", "\\.")}\\?v=([^\"']+)`),
      ) ?? files[file].match(
        new RegExp(`from\\s+[\"'][^\"']*${asset.replace(".", "\\.")}\\?v=([^\"']+)[\"']`),
      );
      assert.ok(match, `${file} must version ${asset}`);
      versions.add(match[1]);
    }
  }

  assert.equal(versions.size, 1, "all browser assets must use the same release marker");
});
