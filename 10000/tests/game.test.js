import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../game.js";

function game(names = ["Ada", "Bo"]) {
  return GameEngine.create(names);
}

function keep(engine, dice, indices) {
  const result = engine.roll(dice);
  assert.equal(result.farkle, false);
  engine.state.turn.selected = indices;
  return engine.confirmSelection();
}

test("setup supports 2–6 cleaned player names", () => {
  assert.throws(() => GameEngine.create(["Solo"]), /between 2 and 6/);
  assert.throws(() => GameEngine.create(Array(7).fill("Player")), /between 2 and 6/);
  const engine = GameEngine.create(["  Ada   Lovelace  ", ""]);
  assert.equal(engine.state.players[0].name, "Ada Lovelace");
  assert.equal(engine.state.players[1].name, "Player 2");
  assert.equal(engine.state.players[0].type, "human");
  assert.equal(engine.state.players[0].strategy, null);
});

test("setup and saved games support CPU player metadata", () => {
  const engine = GameEngine.create([
    { name: "Ada", type: "human" },
    { name: "CPU Bo", type: "cpu" },
  ]);
  assert.deepEqual(
    engine.state.players.map(({ name, type, strategy }) => ({ name, type, strategy })),
    [
      { name: "Ada", type: "human", strategy: null },
      { name: "CPU Bo", type: "cpu", strategy: "balanced" },
    ],
  );

  delete engine.state.players[0].type;
  delete engine.state.players[0].strategy;
  const restored = GameEngine.restore(engine.serialize());
  assert.equal(restored.state.players[0].type, "human");
  assert.equal(restored.state.players[0].strategy, null);
  assert.equal(restored.state.players[1].type, "cpu");
  assert.equal(restored.state.players[1].strategy, "balanced");
});

test("restore repairs names corrupted by mixed cached releases", () => {
  const engine = GameEngine.create([
    { name: "Ada", type: "human" },
    { name: "CPU Bo", type: "cpu" },
  ]);
  engine.state.players.forEach((player) => { player.name = "[object Object]"; });
  engine.state.events[0].data.players = ["[object Object]", "[object Object]"];
  engine.state.events[0].message = "[object Object], [object Object] started a game.";

  const restored = GameEngine.restore(engine.serialize(), {
    fallbackPlayerName: (index) => `Spelare ${index + 1}`,
  });

  assert.deepEqual(restored.state.players.map((player) => player.name), ["Spelare 1", "Spelare 2"]);
  assert.deepEqual(restored.state.events[0].data.players, ["Spelare 1", "Spelare 2"]);
  assert.equal(restored.state.events[0].message, "Spelare 1, Spelare 2 started a game.");
});

test("break-in prevents banking below 1000", () => {
  const engine = game();
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  assert.equal(engine.state.turn.points, 100);
  assert.throws(() => engine.bank(), /need 1000 points/);
  assert.equal(engine.state.players[0].score, 0);
});

test("first qualifying bank does not offer continuation to an unbroken player", () => {
  const engine = game();
  keep(engine, [1, 1, 1, 2, 3, 4], [0, 1, 2]);
  const result = engine.bank();
  assert.equal(result.points, 1000);
  assert.equal(result.offered, false);
  assert.equal(engine.state.players[0].brokenIn, true);
  assert.equal(engine.state.players[0].score, 1000);
  assert.equal(engine.state.phase, "await-roll");
  assert.equal(engine.player.name, "Bo");
});

test("a player who breaks in by banking immediately offers continuation to an eligible next player", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[0].score = 2000;
  engine.state.currentPlayer = 1;

  keep(engine, [5, 5, 5, 5, 1, 2], [0, 1, 2, 3, 4]);
  assert.equal(engine.state.turn.points, 1100);
  assert.equal(engine.state.turn.diceRemaining, 1);
  const result = engine.bank();

  assert.equal(engine.state.players[1].brokenIn, true);
  assert.equal(engine.state.players[1].score, 1100);
  assert.equal(result.offered, true);
  assert.equal(engine.player.name, "Ada");
  assert.equal(engine.state.phase, "offer");
  assert.deepEqual(engine.state.offer, {
    score: 1100,
    diceRemaining: 1,
    fromPlayer: "Bo",
    fromPlayerId: "player-2",
  });
});

test("established player offers banked turn points and remaining dice", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  engine.state.players[0].score = 1000;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  const result = engine.bank();
  assert.equal(result.offered, true);
  assert.equal(engine.state.phase, "offer");
  assert.deepEqual(engine.state.offer, {
    score: 100,
    diceRemaining: 5,
    fromPlayer: "Ada",
    fromPlayerId: "player-1",
  });
});

test("continuation is not offered when the following player has not broken in", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[0].score = 1000;

  keep(engine, [3, 3, 3, 2, 4, 6], [0, 1, 2]);
  keep(engine, [1, 5, 5], [0, 1, 2]);
  keep(engine, [2, 2, 2, 5, 3, 4], [0, 1, 2, 3]);
  assert.equal(engine.state.turn.points, 750);
  assert.equal(engine.state.turn.diceRemaining, 2);

  const result = engine.bank();
  assert.equal(result.offered, false);
  assert.equal(engine.player.name, "Bo");
  assert.equal(engine.state.phase, "await-roll");
  assert.equal(engine.state.offer, null);
  assert.equal(engine.state.turn.points, 0);
  assert.equal(engine.state.turn.diceRemaining, 6);
});

test("restore discards a legacy offer to an unbroken player", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  assert.equal(engine.state.phase, "offer");

  engine.state.players[1].brokenIn = false;
  const restored = GameEngine.restore(engine.serialize());
  assert.equal(restored.player.name, "Bo");
  assert.equal(restored.state.phase, "await-roll");
  assert.equal(restored.state.offer, null);
  assert.equal(restored.state.turn.diceRemaining, 6);
});

test("inherited score requires a successful add before banking", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  engine.inheritOffer();
  assert.equal(engine.state.turn.points, 100);
  assert.equal(engine.state.turn.diceRemaining, 5);
  assert.equal(engine.state.turn.canBank, false);
  assert.throws(() => engine.bank(), /Score dice/);
});

test("inherited turn awards the entire inherited total after adding and banking", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  engine.inheritOffer();
  keep(engine, [5, 2, 3, 4, 6], [0]);
  engine.bank();
  assert.equal(engine.state.players[0].score, 100);
  assert.equal(engine.state.players[1].score, 150);
  assert.equal(engine.state.offer.score, 150);
  assert.equal(engine.state.offer.diceRemaining, 4);
});

test("farkle loses inherited points without touching the previous bank", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  engine.state.players[0].score = 1000;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  engine.inheritOffer();
  const result = engine.roll([2, 3, 4, 6, 2]);
  assert.equal(result.farkle, true);
  assert.equal(result.lost, 100);
  assert.equal(engine.state.players[0].score, 1100);
  assert.equal(engine.state.players[1].score, 0);
  assert.equal(engine.state.phase, "farkled");
  assert.equal(engine.player.name, "Bo");
  assert.deepEqual(engine.state.turn.roll, [2, 3, 4, 6, 2]);
  assert.equal(engine.state.turn.farkleLost, 100);
  assert.equal(engine.state.players[1].turns, 0);

  const restored = GameEngine.restore(engine.serialize());
  assert.equal(restored.state.phase, "farkled");
  assert.deepEqual(restored.state.turn.roll, [2, 3, 4, 6, 2]);
  restored.advanceAfterFarkle();
  assert.equal(restored.state.players[1].turns, 1);
  assert.equal(restored.player.name, "Ada");
});

test("hot dice force another six-dice roll before banking", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  const result = keep(engine, [1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5]);
  assert.equal(result.hotDice, true);
  assert.equal(engine.state.turn.diceRemaining, 6);
  assert.deepEqual(engine.state.turn.heldDice, []);
  assert.equal(engine.state.turn.hotDice, true);
  assert.equal(engine.state.turn.canBank, false);
  assert.throws(() => engine.bank(), /Hot dice must be rolled/);

  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  assert.equal(engine.state.turn.points, 1600);
  assert.equal(engine.state.turn.diceRemaining, 5);
  assert.equal(engine.state.turn.hotDice, false);
  assert.equal(engine.state.turn.canBank, true);
  engine.bank();
  assert.equal(engine.state.offer.diceRemaining, 5);
  assert.equal(engine.state.offer.score, 1600);
});

test("a farkle on the forced hot-dice roll loses the entire turn score", () => {
  const engine = game();
  keep(engine, [1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5]);

  const result = engine.roll([2, 3, 4, 6, 2, 3]);
  assert.equal(result.farkle, true);
  assert.equal(result.lost, 1500);
  assert.equal(engine.state.phase, "farkled");
  assert.equal(engine.state.turn.farkleLost, 1500);
  assert.equal(engine.state.players[0].score, 0);
});

test("restore migrates a saved bankable hot-dice turn to the mandatory-roll state", () => {
  const engine = game();
  keep(engine, [1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 4, 5]);
  delete engine.state.turn.hotDice;
  engine.state.turn.canBank = true;

  const restored = GameEngine.restore(engine.serialize());
  assert.equal(restored.state.turn.hotDice, true);
  assert.equal(restored.state.turn.canBank, false);
  assert.equal(restored.state.turn.points, 1500);
  assert.throws(() => restored.bank(), /Hot dice must be rolled/);
});

test("restore discards a legacy continuation that passed six hot dice", () => {
  const engine = game();
  engine.state.players[0].brokenIn = true;
  engine.state.players[1].brokenIn = true;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  engine.state.offer.diceRemaining = 6;

  const restored = GameEngine.restore(engine.serialize());
  assert.equal(restored.state.phase, "await-roll");
  assert.equal(restored.state.offer, null);
  assert.equal(restored.state.turn.points, 0);
  assert.equal(restored.state.turn.diceRemaining, 6);
});

test("toggle interaction never leaves a non-scoring selection", () => {
  const engine = game();
  engine.roll([2, 2, 2, 2, 3, 4]);
  engine.toggleDie(0);
  assert.equal(engine.state.turn.selected.length, 3);
  assert.equal(engine.selectionResult().score, 200);
  engine.toggleDie(3);
  assert.equal(engine.state.turn.selected.length, 4);
  assert.equal(engine.selectionResult().score, 400);
  engine.toggleDie(0);
  assert.equal(engine.state.turn.selected.length, 3);
  engine.clearSelection();
  assert.deepEqual(engine.state.turn.selected, []);
  assert.equal(engine.toggleDie(4).changed, false);
});

test("final round gives players enough turns to equal the trigger player", () => {
  const engine = game(["Ada", "Bo", "Cy"]);
  for (const player of engine.state.players) {
    player.brokenIn = true;
    player.turns = 2;
  }
  engine.state.players[0].score = 9900;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  assert.equal(engine.state.finalRound.mode, "final");
  assert.equal(engine.state.finalRound.targetTurns, 3);
  assert.equal(engine.player.name, "Bo");
  engine.startFresh();
  engine.roll([2, 3, 4, 6, 2, 3]);
  assert.equal(engine.state.phase, "farkled");
  assert.equal(engine.player.name, "Bo");
  engine.advanceAfterFarkle();
  assert.equal(engine.player.name, "Cy");
  engine.roll([2, 3, 4, 6, 2, 3]);
  assert.equal(engine.state.phase, "farkled");
  engine.advanceAfterFarkle();
  assert.equal(engine.state.phase, "game-over");
  assert.equal(engine.state.winnerId, "player-1");
  assert.deepEqual(engine.state.players.map((player) => player.turns), [3, 3, 3]);
});

test("tied leaders receive complete extra turns until one winner remains", () => {
  const engine = game();
  for (const player of engine.state.players) {
    player.brokenIn = true;
    player.turns = 2;
  }
  engine.state.players[0].score = 9900;
  engine.state.players[1].score = 10000;
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  engine.bank();
  engine.startFresh();
  engine.roll([2, 3, 4, 6, 2, 3]);
  assert.equal(engine.state.phase, "farkled");
  engine.advanceAfterFarkle();
  assert.equal(engine.state.finalRound.mode, "tiebreak");
  assert.equal(engine.player.name, "Ada");
  engine.roll([2, 3, 4, 6, 2, 3]);
  assert.equal(engine.state.phase, "farkled");
  engine.advanceAfterFarkle();
  assert.equal(engine.player.name, "Bo");
  keep(engine, [5, 2, 3, 4, 6, 2], [0]);
  engine.bank();
  assert.equal(engine.state.phase, "game-over");
  assert.equal(engine.state.winnerId, "player-2");
  assert.equal(engine.state.players[1].score, 10050);
});

test("serialized unfinished games restore with the active turn intact", () => {
  const engine = game();
  keep(engine, [1, 2, 3, 4, 6, 6], [0]);
  const restored = GameEngine.restore(engine.serialize());
  assert.equal(restored.player.name, "Ada");
  assert.equal(restored.state.turn.points, 100);
  assert.equal(restored.state.turn.diceRemaining, 5);
  assert.equal(restored.state.turn.canBank, true);
});
