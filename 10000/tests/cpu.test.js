import test from "node:test";
import assert from "node:assert/strict";
import { balancedStrategy, scoringSelections, strategyForPlayer } from "../cpu.js";
import { GameEngine } from "../game.js";
import { scoreSelection } from "../scoring.js";

function state(players, finalRound = null) {
  return { players, finalRound };
}

test("CPU selection enumeration returns only complete valid scores", () => {
  const roll = [1, 2, 3, 4, 5, 6];
  const options = scoringSelections(roll);
  assert.ok(options.length > 2);
  assert.ok(options.every((option) => scoreSelection(option.dice, {
    allowSpecial: option.indices.length === 6,
  }).valid));
  assert.ok(options.some((option) => option.kind === "straight" && option.score === 1500));
});

test("Balanced CPU recognizes a six-dice special combination", () => {
  const roll = [1, 2, 3, 4, 5, 6];
  const indices = balancedStrategy.chooseSelection({
    roll,
    turn: { points: 0 },
    player: { id: "cpu", score: 0 },
    state: state([]),
  });
  assert.deepEqual(indices, [0, 1, 2, 3, 4, 5]);
});

test("Balanced CPU obeys break-in and hot-dice banking constraints", () => {
  const player = { id: "cpu", score: 0, brokenIn: false };
  const players = [player, { id: "other", score: 0 }];
  assert.equal(balancedStrategy.chooseAction({
    state: state(players),
    player,
    turn: { points: 950, diceRemaining: 2, canBank: true, inherited: false },
  }), "roll");
  assert.equal(balancedStrategy.chooseAction({
    state: state(players),
    player,
    turn: { points: 1200, diceRemaining: 4, canBank: true, inherited: false },
  }), "bank");
  assert.equal(balancedStrategy.chooseAction({
    state: state(players),
    player: { ...player, brokenIn: true },
    turn: { points: 1600, diceRemaining: 6, canBank: false, inherited: false },
  }), "roll");
});

test("Balanced CPU banks a winning score and evaluates continuations by dice risk", () => {
  const player = { id: "cpu", score: 9800, brokenIn: true };
  const players = [player, { id: "other", score: 9000 }];
  assert.equal(balancedStrategy.chooseAction({
    state: state(players),
    player,
    turn: { points: 250, diceRemaining: 5, canBank: true, inherited: false },
  }), "bank");
  assert.equal(balancedStrategy.chooseAction({
    state: state(players, { mode: "final" }),
    player: { ...player, score: 8500 },
    turn: { points: 400, diceRemaining: 1, canBank: true, inherited: false },
  }), "roll");

  assert.equal(balancedStrategy.chooseContinuation({
    state: state(players),
    player,
    offer: { score: 200, diceRemaining: 5 },
  }), "inherit");
  assert.equal(balancedStrategy.chooseContinuation({
    state: state(players),
    player,
    offer: { score: 200, diceRemaining: 1 },
  }), "fresh");
});

test("strategy lookup falls back to Balanced for future or missing strategy ids", () => {
  assert.equal(strategyForPlayer({ strategy: "balanced" }), balancedStrategy);
  assert.equal(strategyForPlayer({ strategy: "future-strategy" }), balancedStrategy);
  assert.equal(strategyForPlayer(null), balancedStrategy);
});

test("two Balanced CPU players can complete a deterministic game", () => {
  const engine = GameEngine.create([
    { name: "CPU Ada", type: "cpu" },
    { name: "CPU Bo", type: "cpu" },
  ]);
  let seed = 0x10000;
  const nextDice = (count) => Array.from({ length: count }, () => {
    seed = ((seed * 1664525) + 1013904223) >>> 0;
    return (seed % 6) + 1;
  });

  let steps = 0;
  while (engine.state.phase !== "game-over" && steps < 20000) {
    steps += 1;
    const strategy = strategyForPlayer(engine.player);
    if (engine.state.phase === "offer") {
      const choice = strategy.chooseContinuation({
        state: engine.state,
        player: engine.player,
        offer: engine.state.offer,
      });
      if (choice === "inherit") engine.inheritOffer();
      else engine.startFresh();
    } else if (engine.state.phase === "await-roll") {
      const choice = strategy.chooseAction({
        state: engine.state,
        player: engine.player,
        turn: engine.state.turn,
      });
      if (choice === "bank") engine.bank();
      else engine.roll(nextDice(engine.state.turn.diceRemaining));
    } else if (engine.state.phase === "rolled") {
      engine.state.turn.selected = strategy.chooseSelection({
        state: engine.state,
        player: engine.player,
        turn: engine.state.turn,
        roll: engine.state.turn.roll,
      });
      engine.confirmSelection();
    } else if (engine.state.phase === "farkled") {
      engine.advanceAfterFarkle();
    }
  }

  assert.equal(engine.state.phase, "game-over", `game did not finish after ${steps} decisions`);
  assert.ok(engine.state.winnerId);
  assert.ok(engine.state.players.some((player) => player.score >= 10000));
});
