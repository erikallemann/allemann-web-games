import assert from "node:assert/strict";
import test from "node:test";
import {
  FAMILY_ROSTER,
  defaultLineup,
  nextRosterPlayer,
  normalizeLineup,
  restoreLineup,
} from "../setup.js";

test("the family roster has the requested fixed names", () => {
  assert.deepEqual(FAMILY_ROSTER, [
    "Erik", "Hanna", "Esther", "Ingrid", "Jon", "Johanna", "Bill", "Olle",
  ]);
  assert.deepEqual(defaultLineup(), [
    { name: "Erik", type: "human" },
    { name: "Hanna", type: "cpu" },
  ]);
});

test("remembered lineups retain edited names and safe player types", () => {
  assert.deepEqual(normalizeLineup([
    { name: "  Erik  Allemann ", type: "human" },
    { name: "Karin", type: "cpu" },
    { name: "Olle", type: "unexpected" },
  ]), [
    { name: "Erik Allemann", type: "human" },
    { name: "Karin", type: "cpu" },
    { name: "Olle", type: "human" },
  ]);
});

test("invalid remembered data falls back to the family lineup", () => {
  assert.deepEqual(restoreLineup("not json"), defaultLineup());
  assert.deepEqual(restoreLineup(JSON.stringify([{ name: "Solo", type: "human" }])), defaultLineup());
});

test("new CPU seats use the next unused family name", () => {
  const lineup = [
    { name: "Erik", type: "human" },
    { name: "Hanna", type: "cpu" },
    { name: "Esther", type: "cpu" },
    { name: "Ingrid", type: "cpu" },
    { name: "Jon", type: "cpu" },
    { name: "Johanna", type: "cpu" },
  ];
  assert.deepEqual(nextRosterPlayer(lineup), { name: "Bill", type: "cpu" });
  assert.deepEqual(nextRosterPlayer([{ name: "erik" }, { name: "HANNA" }]), { name: "Esther", type: "cpu" });
});
