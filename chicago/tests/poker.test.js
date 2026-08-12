import test from "node:test";
import assert from "node:assert/strict";
import { compareEvaluations, comparePokerHands, describePokerCall, evaluatePoker } from "../poker.js";
import { cards } from "./helpers.js";

const categories = [
  ["As Kd 9h 6c 2s", 0, "Högt kort"],
  ["As Ad 9h 6c 2s", 1, "Ett par"],
  ["As Ad 9h 9c 2s", 2, "Två par"],
  ["As Ad Ah 6c 2s", 3, "Triss"],
  ["9s 8d 7h 6c 5s", 4, "Stege"],
  ["As 9s 7s 5s 2s", 5, "Färg"],
  ["As Ad Ah 6c 6s", 6, "Kåk"],
  ["As Ad Ah Ac 2s", 7, "Fyrtal"],
  ["9s 8s 7s 6s 5s", 8, "Färgstege"],
  ["As Ks Qs Js Ts", 9, "Royal flush"],
];

test("evaluates every poker category and its points", () => {
  categories.forEach(([hand, category, name]) => {
    const result = evaluatePoker(cards(hand));
    assert.equal(result.category, category);
    assert.equal(result.name, name);
    assert.equal(result.points, category > 0 && category < 9 ? category : 0);
  });
});

test("ace-high and five-high straights work without ace wrapping", () => {
  assert.deepEqual(evaluatePoker(cards("As Kd Qh Jc Ts")).tie, [14]);
  assert.deepEqual(evaluatePoker(cards("As 2d 3h 4c 5s")).tie, [5]);
  assert.equal(evaluatePoker(cards("Qs Kd Ah 2c 3s")).category, 0);
});

test("all specified tie-breakers are applied", () => {
  const comparisons = [
    ["Ks Kd Ah 8c 2s", "Qs Qd Ah 8c 2s"],
    ["Ks Kd 8h 8c 2s", "Qs Qd Jh Jc As"],
    ["Ks Kd Kh 8c 2s", "Qs Qd Qh Ac Js"],
    ["9s 8d 7h 6c 5s", "8s 7d 6h 5c 4s"],
    ["As Js 8s 5s 2s", "Ks Qs 8s 5s 2s"],
    ["Ks Kd Kh 8c 8s", "Qs Qd Qh Ac As"],
    ["Ks Kd Kh Kc 2s", "Qs Qd Qh Qc As"],
    ["9s 8s 7s 6s 5s", "8h 7h 6h 5h 4h"],
  ];
  comparisons.forEach(([better, worse]) => {
    assert.equal(compareEvaluations(evaluatePoker(cards(better)), evaluatePoker(cards(worse))), 1);
  });
});

test("kickers distinguish otherwise equal categories", () => {
  assert.equal(compareEvaluations(
    evaluatePoker(cards("As Ad Kh 8c 3s")),
    evaluatePoker(cards("Ac Ah Qh 8d 3c")),
  ), 1);
});

test("exactly equal hands tie and suits never break the tie", () => {
  const result = comparePokerHands([
    cards("As Kd Qh Jc 9s"),
    cards("Ah Kc Qd Js 9h"),
  ]);
  assert.equal(result.tied, true);
  assert.deepEqual(result.winners, [0, 1]);
  assert.equal(result.points, 0);
});

test("equal royal flushes do not create an arbitrary winner", () => {
  const result = comparePokerHands([cards("As Ks Qs Js Ts"), cards("Ah Kh Qh Jh Th")]);
  assert.equal(result.tied, true);
  assert.equal(result.royalWinner, null);
});

test("spoken poker calls describe strength without revealing the hand", () => {
  assert.equal(describePokerCall(evaluatePoker(cards("As Kd 9h 6c 2s"))), "Inget");
  assert.equal(describePokerCall(evaluatePoker(cards("5s 5d 9h 6c 2s"))), "Ett par, lågt");
  assert.equal(describePokerCall(evaluatePoker(cards("Ks Kd 9h 6c 2s"))), "Ett par, högt");
  assert.equal(describePokerCall(evaluatePoker(cards("9s 8d 7h 6c 5s"))), "Stege, ganska lågt");
});
