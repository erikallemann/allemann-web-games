import test from "node:test";
import assert from "node:assert/strict";
import {
  canDeclareChicago,
  canLowRedeal,
  confirmFinalTrick,
  createGame,
  decideChicago,
  decideLowRedeal,
  decideOpenCard,
  exchangeCards,
  nextRound,
  playCard,
} from "../game.js";
import {
  cpuAcceptLowRedeal,
  cpuChooseCard,
  cpuDeclareChicago,
  cpuExchangeIndexes,
} from "../cpu.js";
import { cards, seededRandom } from "./helpers.js";

test("CPU keeps made hands and improves weak hands sensibly", () => {
  assert.equal(cpuAcceptLowRedeal(cards("9s 9d 8h 8c 2s")), false);
  assert.equal(cpuAcceptLowRedeal(cards("9s 8d 7h 4c 2s")), true);
  assert.deepEqual(cpuExchangeIndexes(cards("As Ad 9h 6c 2s"), 1, 5).sort(), [2, 3, 4]);
  assert.deepEqual(cpuExchangeIndexes(cards("9s 8s 7s 6s 5s"), 1, 5), []);
});

test("CPU declares Chicago only with score and a strong hand", () => {
  assert.equal(cpuDeclareChicago({ score: 14, hand: cards("As Ks Qs Js Ts") }), false);
  assert.equal(cpuDeclareChicago({ score: 15, hand: cards("As Ks Qs Js Ts") }), true);
  assert.equal(cpuDeclareChicago({ score: 15, hand: cards("As Kd 9h 6c 2s") }), false);
});

test("CPU follows suit and uses the lowest card that stops Chicago", () => {
  const hand = cards("2s Ks Ah");
  const index = cpuChooseCard({
    hand,
    currentTrick: [{ playerIndex: 0, card: cards("9s")[0], faceUp: true }],
    trickNumber: 2,
    chicago: { active: true, declarer: 0 },
    playerIndex: 1,
  });
  assert.equal(index, 1);
});

test("seeded complete game reaches a winner against CPU opponents", () => {
  const random = seededRandom(20260730);
  const state = createGame([
    { name: "Testare", type: "human" },
    { name: "CPU 1", type: "cpu" },
    { name: "CPU 2", type: "cpu" },
    { name: "CPU 3", type: "cpu" },
  ], random);
  let actions = 0;
  while (state.phase !== "game_over" && actions < 10000) {
    const player = state.players[state.actor];
    if (state.phase === "low_redeal") {
      decideLowRedeal(state, canLowRedeal(state) && cpuAcceptLowRedeal(player.hand));
    } else if (state.phase.startsWith("exchange")) {
      if (state.openCardOffer) {
        decideOpenCard(state, true);
      } else if (state.phase === "exchange_1" && canDeclareChicago(state) && cpuDeclareChicago(player)) {
        decideChicago(state);
      } else {
        exchangeCards(state, cpuExchangeIndexes(player.hand, Number(state.phase.at(-1)), state.deck.length));
      }
    } else if (state.phase === "trick") {
      playCard(state, cpuChooseCard({
        hand: player.hand,
        currentTrick: state.currentTrick,
        trickNumber: state.trickNumber,
        chicago: state.chicago,
        playerIndex: state.actor,
      }));
    } else if (state.phase === "final_trick") {
      confirmFinalTrick(state);
    } else if (state.phase === "round_summary") {
      nextRound(state, random);
    }
    actions += 1;
  }
  assert.equal(state.phase, "game_over");
  assert.ok(Number.isInteger(state.winner));
  assert.ok(actions < 10000);
});
