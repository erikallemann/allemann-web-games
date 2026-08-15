import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("all browser assets share one release marker", async () => {
  const files = ["index.html", "app.js", "game.js", "cpu.js"];
  const contents = await Promise.all(files.map((file) => readFile(resolve(root, file), "utf8")));
  const markers = contents.flatMap((content) =>
    [...content.matchAll(/[?&]v=(\d{8}-\d+)/g)].map((match) => match[1]));
  assert.ok(markers.length >= 11);
  assert.equal(new Set(markers).size, 1);
  contents.slice(1).forEach((content) => {
    const localImports = [...content.matchAll(/from\s+["'](\.\/[^"']+\.js[^"']*)["']/g)]
      .map((match) => match[1]);
    assert.ok(localImports.every((path) => path.includes("?v=")));
  });
  assert.match(contents[0], /id="release-version"/);
  assert.match(contents[1], /new URL\(import\.meta\.url\)\.searchParams\.get\("v"\)/);
});
