import test from "node:test";
import assert from "node:assert/strict";
import {
  canDeclareChicago,
  canLowRedeal,
  createGame,
  decideChicago,
  decideLowRedeal,
  decideOpenCard,
  exchangeCards,
  nextRound,
  playCard,
  restoreGame,
  SAVE_VERSION,
} from "../game.js";
import { legalCardIndexes } from "../rules.js";
import { cards, seededRandom } from "./helpers.js";

function twoPlayerGame() {
  return createGame([
    { name: "Människa", type: "human" },
    { name: "CPU", type: "cpu" },
  ], seededRandom(7));
}

function configuredTrickGame() {
  const state = twoPlayerGame();
  state.phase = "trick";
  state.actor = 0;
  state.dealer = 1;
  state.trickNumber = 1;
  state.currentTrick = [];
  state.trickHistory = [];
  state.players[0].tricks = 0;
  state.players[1].tricks = 0;
  return state;
}

test("a player can decline an eligible low redeal", () => {
  const state = twoPlayerGame();
  state.actor = 0;
  state.actionOrder = [0, 1];
  state.actionPosition = 0;
  state.players[0].hand = cards("9s 8d 7h 6c 2s");
  assert.equal(canLowRedeal(state), true);
  const original = state.players[0].hand.map((card) => card.id);
  decideLowRedeal(state, false);
  assert.deepEqual(state.players[0].hand.map((card) => card.id), original);
});

test("Chicago is a first-exchange choice that skips the declarer's exchange", () => {
  const state = twoPlayerGame();
  state.phase = "exchange_1";
  state.actor = 0;
  state.actionOrder = [0, 1];
  state.actionPosition = 0;
  state.players[0].score = 15;
  const original = state.players[0].hand.map((card) => card.id);
  assert.equal(canDeclareChicago(state), true);
  decideChicago(state);
  assert.equal(state.chicago.declarer, 0);
  assert.equal(state.phase, "exchange_1");
  assert.equal(state.actor, 1);
  assert.deepEqual(state.players[0].hand.map((card) => card.id), original);
  assert.throws(() => decideChicago(state), /inte tillgängligt/);
});

test("one-card exchange offers a public card that can be accepted", () => {
  const state = twoPlayerGame();
  state.phase = "exchange_1";
  state.actor = 0;
  state.actionOrder = [0, 1];
  state.actionPosition = 0;
  const discarded = state.players[0].hand[0].id;
  exchangeCards(state, [0]);
  assert.equal(state.openCardOffer.playerIndex, 0);
  assert.equal(state.players[0].hand.length, 4);
  const offered = state.openCardOffer.card.id;
  decideOpenCard(state, true);
  assert.equal(state.lastOpenCard.playerIndex, 0);
  assert.equal(state.lastOpenCard.card.id, offered);
  assert.equal(state.players[0].hand.length, 5);
  assert.equal(state.discard.some((card) => card.id === discarded), true);
  assert.equal(state.deck.some((card) => card.id === discarded), false);
});

test("rejecting a public replacement discards it and deals the next card face-down", () => {
  const state = twoPlayerGame();
  state.phase = "exchange_1";
  state.actor = 0;
  state.actionOrder = [0, 1];
  state.actionPosition = 0;
  exchangeCards(state, [0]);
  const offered = state.openCardOffer.card.id;
  const next = state.deck[0].id;
  decideOpenCard(state, false);
  assert.equal(state.openCardOffer, null);
  assert.equal(state.lastOpenCard, null);
  assert.equal(state.discard.some((card) => card.id === offered), true);
  assert.equal(state.players[0].hand.some((card) => card.id === next), true);
});

test("first poker scoring publishes spoken calls without publishing hands", () => {
  const state = twoPlayerGame();
  state.phase = "exchange_1";
  state.actor = 0;
  state.actionOrder = [0, 1];
  state.actionPosition = 0;
  exchangeCards(state, []);
  exchangeCards(state, []);
  assert.equal(state.phase, "exchange_2");
  assert.equal(state.lastPokerResult.calls.length, 2);
  assert.equal("hands" in state.lastPokerResult, false);
  assert.ok(state.lastPokerResult.calls.every((call) => typeof call.text === "string"));
});

test("successful Chicago sweep wins immediately regardless of score", () => {
  const state = configuredTrickGame();
  state.players[0].score = 15;
  state.players[0].hand = cards("As Ah Ac Ad Ks");
  state.players[1].hand = cards("2s 2h 2c 2d Qs");
  state.players.forEach((player) => { player.preservedHand = [...player.hand]; });
  state.chicago = { declarer: 0, active: true, failed: false, stoppedBy: null };
  for (let trick = 0; trick < 5; trick += 1) {
    playCard(state, 0);
    playCard(state, 0);
  }
  assert.equal(state.phase, "game_over");
  assert.equal(state.winner, 0);
  assert.equal(state.winReason, "chicago");
});

test("losing any trick fails Chicago, resets score, and play continues", () => {
  const state = configuredTrickGame();
  state.players[0].score = 22;
  state.players[0].hand = cards("2s Kh Qc Jd 9s");
  state.players[1].hand = cards("As 3h 4c 5d 8s");
  state.players[0].preservedHand = cards("Ks Kd Qh Jc 9s");
  state.players[1].preservedHand = cards("As Qd Jh 8c 7s");
  state.chicago = { declarer: 0, active: true, failed: false, stoppedBy: null };
  playCard(state, 0);
  playCard(state, 0);
  assert.equal(state.chicago.failed, true);
  assert.equal(state.players[0].score, 0);
  assert.equal(state.phase, "trick");

  while (state.phase === "trick") {
    const ledSuit = state.currentTrick[0]?.card.suit || null;
    playCard(state, legalCardIndexes(state.players[state.actor].hand, ledSuit)[0]);
  }
  assert.ok(state.players[0].score >= 1, "final poker points can be added after the reset");
});

test("the first four tricks score zero and the fifth scores five", () => {
  const state = configuredTrickGame();
  state.players[0].hand = cards("As Kh Qc Jd 9s");
  state.players[1].hand = cards("Ah Kc Qd Js 9h");
  state.players.forEach((player) => { player.preservedHand = [...player.hand]; });
  state.chicago = { declarer: null, active: false, failed: false, stoppedBy: null };
  for (let trick = 1; trick <= 5; trick += 1) {
    while (state.phase === "trick" && state.trickNumber === trick) {
      const ledSuit = state.currentTrick[0]?.card.suit || null;
      playCard(state, legalCardIndexes(state.players[state.actor].hand, ledSuit)[0]);
    }
    const total = state.players.reduce((sum, player) => sum + player.score, 0);
    assert.equal(total, trick < 5 ? 0 : 5);
    if (trick < 5) {
      assert.equal(state.actor, state.trickHistory.at(-1).winner, "trick winner leads next");
    }
  }
  assert.equal(state.phase, "round_summary");
  assert.deepEqual(
    state.roundSummary.hands.map((hand) => hand.length),
    [5, 5],
    "all complete hands are retained for the pre-round reveal",
  );
  assert.deepEqual(
    state.roundSummary.tricks.map((trick) => [trick.number, trick.plays.length]),
    [[1, 2], [2, 2], [3, 2], [4, 2], [5, 2]],
    "all five tricks are retained in chronological order",
  );
});

test("an off-suit hidden play is announced as a discard", () => {
  const state = configuredTrickGame();
  state.players[0].hand = cards("As");
  state.players[1].hand = cards("2h");
  state.chicago = { declarer: null, active: false, failed: false, stoppedBy: null };
  playCard(state, 0);
  playCard(state, 0);
  assert.equal(state.events.some((event) => event.message === "CPU sakar."), true);
});

test("52 without fifth trick does not win; fifth-trick award can produce victory", () => {
  const state = configuredTrickGame();
  state.players[0].score = 52;
  state.players[1].score = 47;
  state.players[0].hand = cards("2s 3h 4c 5d 7s");
  state.players[1].hand = cards("As Ah Ac Ad Ks");
  state.players[0].preservedHand = cards("As Kd Qh Jc 9s");
  state.players[1].preservedHand = cards("Ah Kc Qd Js 9h");
  state.chicago = { declarer: null, active: false, failed: false, stoppedBy: null };
  for (let trick = 0; trick < 5; trick += 1) {
    while (state.phase === "trick" && state.currentTrick.length < 2) {
      const ledSuit = state.currentTrick[0]?.card.suit || null;
      playCard(state, legalCardIndexes(state.players[state.actor].hand, ledSuit)[0]);
    }
  }
  assert.equal(state.winner, 1);
  assert.equal(state.players[1].score, 52);
  assert.equal(state.players[0].score, 52);
});

test("final poker reaches 52 only for the player who also won the fifth trick", () => {
  const winning = configuredTrickGame();
  winning.trickNumber = 5;
  winning.players[0].score = 46;
  winning.players[0].hand = cards("As");
  winning.players[1].hand = cards("2s");
  winning.players[0].preservedHand = cards("Ks Kd Qh Jc 9s");
  winning.players[1].preservedHand = cards("As Qd Jh 8c 7s");
  winning.chicago = { declarer: null, active: false, failed: false, stoppedBy: null };
  playCard(winning, 0);
  playCard(winning, 0);
  assert.equal(winning.players[0].score, 52);
  assert.equal(winning.winner, 0);

  const continuing = configuredTrickGame();
  continuing.trickNumber = 5;
  continuing.actor = 1;
  continuing.players[0].score = 51;
  continuing.players[0].hand = cards("2s");
  continuing.players[1].hand = cards("As");
  continuing.players[0].preservedHand = cards("Ks Kd Qh Jc 9s");
  continuing.players[1].preservedHand = cards("As Qd Jh 8c 7s");
  continuing.chicago = { declarer: null, active: false, failed: false, stoppedBy: null };
  playCard(continuing, 0);
  playCard(continuing, 0);
  assert.equal(continuing.players[0].score, 52);
  assert.equal(continuing.phase, "round_summary");
  assert.equal(continuing.winner, null);
});

test("saved games are versioned", () => {
  const state = twoPlayerGame();
  assert.equal(restoreGame(state), state);
  assert.equal(restoreGame({ ...state, version: SAVE_VERSION + 1 }), null);
});

test("version 2 saves migrate to the open-card state model", () => {
  const state = twoPlayerGame();
  delete state.openCardOffer;
  state.version = 2;
  const restored = restoreGame(state);
  assert.equal(restored.version, SAVE_VERSION);
  assert.equal(restored.openCardOffer, null);
});
