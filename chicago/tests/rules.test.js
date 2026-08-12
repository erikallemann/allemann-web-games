import test from "node:test";
import assert from "node:assert/strict";
import {
  chicagoEligible,
  legalCardIndexes,
  lowRedealEligible,
  normalWinner,
  trickWinner,
  validateCardPlay,
} from "../rules.js";
import { cards } from "./helpers.js";

test("following suit is mandatory", () => {
  const hand = cards("As 9h 2s");
  assert.deepEqual(legalCardIndexes(hand, "spades"), [0, 2]);
  assert.equal(validateCardPlay(hand, 1, "spades").valid, false);
  assert.equal(validateCardPlay(hand, 2, "spades").valid, true);
});

test("any card is legal when unable to follow suit", () => {
  const hand = cards("Ah 9h 2c");
  assert.deepEqual(legalCardIndexes(hand, "spades"), [0, 1, 2]);
});

test("off-suit face-down cards cannot win and highest led suit wins", () => {
  const plays = [
    { playerIndex: 0, card: cards("9s")[0], faceUp: true },
    { playerIndex: 1, card: cards("Ah")[0], faceUp: false },
    { playerIndex: 2, card: cards("Ks")[0], faceUp: true },
  ];
  assert.equal(trickWinner(plays, "spades"), 2);
});

test("Chicago is unavailable below 15, available at 15, and only before exchange", () => {
  assert.equal(chicagoEligible({ score: 14 }, "exchange_1"), false);
  assert.equal(chicagoEligible({ score: 15 }, "exchange_1"), true);
  assert.equal(chicagoEligible({ score: 15 }, "exchange_2"), false);
  assert.equal(chicagoEligible({ score: 15 }, "exchange_1", true), false);
});

test("normal victory belongs only to the fifth-trick winner", () => {
  const players = [{ score: 60 }, { score: 51 }];
  assert.equal(normalWinner(players, 1), null);
  players[1].score = 52;
  assert.equal(normalWinner(players, 1), 1);
});

test("low redeal checks ranks only, even for a scoring hand", () => {
  assert.equal(lowRedealEligible(cards("9s 9d 8h 7c 2s")), true);
  assert.equal(lowRedealEligible(cards("9s 8s 7s 6s 5s")), true);
  assert.equal(lowRedealEligible(cards("Ts 9d 8h 7c 2s")), false);
});
