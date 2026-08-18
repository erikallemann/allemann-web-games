import test from "node:test";
import assert from "node:assert/strict";
import {
  FAMILY_ROSTER,
  defaultLineup,
  nextRosterPlayer,
  normalizeLineup,
  restoreLineup,
} from "../setup.js";

test("Chicago uses the shared family names with one human", () => {
  assert.deepEqual(FAMILY_ROSTER, [
    "Erik", "Hanna", "Esther", "Ingrid", "Jon", "Johanna", "Bill", "Olle",
  ]);
  assert.deepEqual(defaultLineup(), [
    { name: "Erik", type: "human" },
    { name: "Hanna", type: "cpu" },
  ]);
});

test("edited names are cleaned while Chicago player roles stay fixed", () => {
  assert.deepEqual(normalizeLineup([
    { name: "  Erik  Allemann ", type: "cpu" },
    { name: "Karin", type: "human" },
    { name: "", type: "human" },
  ]), [
    { name: "Erik Allemann", type: "human" },
    { name: "Karin", type: "cpu" },
    { name: "Esther", type: "cpu" },
  ]);
});

test("invalid saved lineups fall back and new seats use unused family names", () => {
  assert.deepEqual(restoreLineup("not json"), defaultLineup());
  assert.deepEqual(restoreLineup(JSON.stringify([{ name: "Solo" }])), defaultLineup());
  assert.deepEqual(
    nextRosterPlayer([{ name: "erik" }, { name: "HANNA" }]),
    { name: "Esther", type: "cpu" },
  );
});
