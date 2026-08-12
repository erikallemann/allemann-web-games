import test from "node:test";
import assert from "node:assert/strict";
import { SCORE_TABLE, farkleProbability, hasScoringOption, scoreSelection, specialCombination } from "../scoring.js";

test("single 1s and 5s score and other singles do not", () => {
  assert.equal(scoreSelection([1]).score, 100);
  assert.equal(scoreSelection([5]).score, 50);
  assert.equal(scoreSelection([1, 1, 5, 5]).score, 300);
  for (const face of [2, 3, 4, 6]) assert.equal(scoreSelection([face]).valid, false);
});

test("every three-, four-, five-, and six-of-a-kind table entry", () => {
  for (let face = 1; face <= 6; face += 1) {
    for (let count = 3; count <= 6; count += 1) {
      const result = scoreSelection(Array(count).fill(face), { allowSpecial: count === 6 });
      assert.equal(result.valid, true, `${count} × ${face} should be valid`);
      assert.equal(result.score, SCORE_TABLE[face][count], `${count} × ${face}`);
    }
  }
});

test("straight has first precedence and consumes all dice", () => {
  const result = scoreSelection([1, 2, 3, 4, 5, 6], { allowSpecial: true });
  assert.deepEqual({ score: result.score, kind: result.kind }, { score: 1500, kind: "straight" });
  assert.equal(scoreSelection([1, 2, 3, 4, 5, 6]).valid, false);
});

test("three pairs have precedence over singles", () => {
  for (const dice of [[1, 1, 3, 3, 6, 6], [2, 2, 4, 4, 5, 5]]) {
    const result = scoreSelection(dice, { allowSpecial: true });
    assert.deepEqual({ score: result.score, kind: result.kind }, { score: 1500, kind: "three-pairs" });
  }
});

test("two triples have precedence over two ordinary groups", () => {
  for (const dice of [[2, 2, 2, 5, 5, 5], [1, 1, 1, 4, 4, 4]]) {
    const result = scoreSelection(dice, { allowSpecial: true });
    assert.deepEqual({ score: result.score, kind: result.kind }, { score: 1500, kind: "two-triples" });
  }
  assert.equal(scoreSelection([1, 1, 1, 5, 5, 5], { allowSpecial: true }).score, 1500);
});

test("six of a kind is not treated as two triples", () => {
  assert.equal(specialCombination([3, 3, 3, 3, 3, 3]), null);
  assert.equal(scoreSelection([3, 3, 3, 3, 3, 3], { allowSpecial: true }).score, 2400);
});

test("mixed standard selections score without double-counting", () => {
  assert.equal(scoreSelection([2, 2, 2, 1]).score, 300);
  assert.equal(scoreSelection([3, 3, 3]).score, 300);
  assert.equal(scoreSelection([4, 4, 4]).score, 400);
  assert.equal(scoreSelection([5, 5, 5, 1]).score, 600);
  assert.equal(scoreSelection([1, 1, 1, 1, 5]).score, 2050);
});

test("a selection with any unconsumed die is rejected", () => {
  assert.equal(scoreSelection([1, 2]).valid, false);
  assert.equal(scoreSelection([2, 2]).valid, false);
  assert.equal(scoreSelection([2, 2, 2, 3]).valid, false);
  assert.equal(scoreSelection([]).valid, false);
  assert.equal(scoreSelection([0]).valid, false);
  assert.equal(scoreSelection([7]).valid, false);
});

test("scoring-option detection includes specials, groups, and singles", () => {
  assert.equal(hasScoringOption([2, 3, 4, 6, 2, 3]), false);
  assert.equal(hasScoringOption([1, 2, 3]), true);
  assert.equal(hasScoringOption([5, 2]), true);
  assert.equal(hasScoringOption([4, 4, 4]), true);
  assert.equal(hasScoringOption([2, 2, 3, 3, 6, 6]), true);
  assert.equal(hasScoringOption([1, 2, 3, 4, 5, 6]), true);
});

test("farkle probability is exact for every available dice count", () => {
  const expected = [
    [4, 6],
    [16, 36],
    [60, 216],
    [204, 1296],
    [600, 7776],
    [1080, 46656],
  ];
  expected.forEach(([farkles, outcomes], index) => {
    assert.equal(farkleProbability(index + 1), farkles / outcomes, `${index + 1} dice`);
  });
  assert.throws(() => farkleProbability(0), /between 1 and 6/);
  assert.throws(() => farkleProbability(7), /between 1 and 6/);
});
