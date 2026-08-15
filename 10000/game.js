import { hasScoringOption, scoreSelection, specialCombination } from "./scoring.js?v=20260815-1";

export const STORAGE_KEY = "ten-thousand-game-v1";
export const GAME_VERSION = 1;

function newTurn(points = 0, diceRemaining = 6, inherited = false) {
  return {
    points,
    diceRemaining,
    inherited,
    heldDice: [],
    roll: [],
    selected: [],
    canBank: false,
    hotDice: false,
    lastActionPoints: 0,
  };
}

function cleanName(name, index) {
  const normalized = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
  return normalized || `Player ${index + 1}`;
}

function cleanPlayerType(type) {
  return type === "cpu" ? "cpu" : "human";
}

function diceWord(count) {
  return count === 1 ? "die" : "dice";
}

function secureDie() {
  const values = new Uint32Array(1);
  const limit = 0x100000000 - (0x100000000 % 6);
  do globalThis.crypto.getRandomValues(values); while (values[0] >= limit);
  return (values[0] % 6) + 1;
}

export class GameEngine {
  constructor(state) {
    this.state = state;
  }

  static create(entries) {
    if (!Array.isArray(entries) || entries.length < 2 || entries.length > 6) {
      throw new Error("Choose between 2 and 6 players.");
    }
    const players = entries.map((entry, index) => {
      const details = typeof entry === "object" && entry !== null ? entry : { name: entry };
      return {
        id: `player-${index + 1}`,
        name: cleanName(details.name, index),
        type: cleanPlayerType(details.type),
        strategy: details.type === "cpu" ? "balanced" : null,
        score: 0,
        brokenIn: false,
        turns: 0,
      };
    });
    return new GameEngine({
      version: GAME_VERSION,
      phase: "await-roll",
      players,
      currentPlayer: 0,
      turn: newTurn(),
      offer: null,
      finalRound: null,
      winnerId: null,
      events: [{
        id: 1,
        type: "start",
        message: `${players.map((player) => player.name).join(", ")} started a game.`,
        data: { players: players.map((player) => player.name) },
        at: Date.now(),
      }],
      nextEventId: 2,
    });
  }

  static restore(serialized, options = {}) {
    const state = typeof serialized === "string" ? JSON.parse(serialized) : serialized;
    if (!state || state.version !== GAME_VERSION || !Array.isArray(state.players)) {
      throw new Error("Saved game is not compatible.");
    }
    if (state.players.length < 2 || state.players.length > 6) {
      throw new Error("Saved game has an invalid player count.");
    }
    const repairedNames = new Set();
    for (const [index, player] of state.players.entries()) {
      if (player.name === "[object Object]") {
        const fallback = typeof options.fallbackPlayerName === "function"
          ? options.fallbackPlayerName(index)
          : "";
        player.name = cleanName(fallback, index);
        repairedNames.add(index);
      }
      player.type = cleanPlayerType(player.type);
      player.strategy = player.type === "cpu" ? (player.strategy || "balanced") : null;
    }
    if (repairedNames.size > 0) {
      for (const event of state.events ?? []) {
        if (event.type === "start") {
          event.data = { ...(event.data ?? {}), players: state.players.map((player) => player.name) };
          event.message = `${state.players.map((player) => player.name).join(", ")} started a game.`;
        }
      }
      if (state.offer?.fromPlayer === "[object Object]") {
        const previousIndex = (state.currentPlayer - 1 + state.players.length) % state.players.length;
        state.offer.fromPlayer = state.players[previousIndex].name;
      }
    }
    if (state.turn && typeof state.turn.hotDice !== "boolean") {
      const legacyHotDice = state.phase === "await-roll"
        && state.turn.canBank === true
        && state.turn.diceRemaining === 6
        && state.turn.roll?.length === 0
        && state.turn.heldDice?.length === 0
        && state.turn.lastActionPoints > 0;
      state.turn.hotDice = legacyHotDice;
      if (legacyHotDice) state.turn.canBank = false;
    }
    const invalidOffer = state.phase === "offer"
      && (state.offer?.diceRemaining === 6 || !state.players[state.currentPlayer]?.brokenIn);
    if (invalidOffer) {
      state.phase = "await-roll";
      state.offer = null;
      state.turn = newTurn();
    }
    return new GameEngine(state);
  }

  serialize() {
    return JSON.stringify(this.state);
  }

  get player() {
    return this.state.players[this.state.currentPlayer];
  }

  addEvent(type, message, data = {}) {
    this.state.events.unshift({ id: this.state.nextEventId++, type, message, data, at: Date.now() });
    this.state.events = this.state.events.slice(0, 18);
  }

  startFresh() {
    if (this.state.phase !== "offer") throw new Error("There is no continuation offer.");
    const from = this.state.offer.fromPlayer;
    this.state.offer = null;
    this.state.turn = newTurn();
    this.state.phase = "await-roll";
    this.addEvent("fresh", `${this.player.name} declined ${from}'s continuation and starts fresh.`, { player: this.player.name, from });
  }

  inheritOffer() {
    if (this.state.phase !== "offer") throw new Error("There is no continuation offer.");
    if (!this.player.brokenIn) throw new Error("You must have broken in before inheriting a continuation.");
    const offer = this.state.offer;
    this.state.turn = newTurn(offer.score, offer.diceRemaining, true);
    this.state.offer = null;
    this.state.phase = "await-roll";
    this.addEvent("inherit", `${this.player.name} inherited ${offer.score} points and ${offer.diceRemaining} ${diceWord(offer.diceRemaining)} from ${offer.fromPlayer}.`, {
      player: this.player.name,
      score: offer.score,
      diceRemaining: offer.diceRemaining,
      from: offer.fromPlayer,
    });
  }

  roll(forcedDice = null) {
    if (this.state.phase !== "await-roll" || !this.state.turn) {
      throw new Error("Dice cannot be rolled right now.");
    }
    const count = this.state.turn.diceRemaining;
    const dice = forcedDice ? [...forcedDice] : Array.from({ length: count }, secureDie);
    if (dice.length !== count || dice.some((die) => !Number.isInteger(die) || die < 1 || die > 6)) {
      throw new Error(`Expected ${count} valid dice.`);
    }

    this.state.turn.roll = dice;
    this.state.turn.selected = [];
    this.state.turn.canBank = false;
    this.state.turn.hotDice = false;
    this.state.turn.lastActionPoints = 0;
    this.state.phase = "rolled";
    this.addEvent("roll", `${this.player.name} rolled ${dice.join(" · ")}.`, { player: this.player.name, dice });

    if (!hasScoringOption(dice)) {
      const lost = this.state.turn.points;
      const playerName = this.player.name;
      this.state.turn.farkleLost = lost;
      this.state.phase = "farkled";
      this.addEvent("farkle", `${playerName} farkled${lost ? ` and lost ${lost} turn points` : ""}.`, { player: playerName, lost });
      return { dice, farkle: true, lost };
    }
    return { dice, farkle: false };
  }

  advanceAfterFarkle() {
    if (this.state.phase !== "farkled") throw new Error("There is no farkle to finish.");
    const playerName = this.player.name;
    this.completeTurn({ offer: null });
    return { playerName, nextPlayerName: this.state.phase === "game-over" ? null : this.player.name };
  }

  selectionResult(indices = this.state.turn?.selected ?? []) {
    if (!this.state.turn) return { valid: false, score: 0, label: "No active turn" };
    const values = indices.map((index) => this.state.turn.roll[index]);
    return scoreSelection(values, {
      allowSpecial: this.state.turn.roll.length === 6 && indices.length === 6,
    });
  }

  toggleDie(index) {
    if (this.state.phase !== "rolled") return { changed: false, reason: "Roll first." };
    const turn = this.state.turn;
    if (!Number.isInteger(index) || index < 0 || index >= turn.roll.length) {
      return { changed: false, reason: "That die is not available." };
    }
    const selected = new Set(turn.selected);
    const face = turn.roll[index];

    if (selected.has(index)) {
      selected.delete(index);
      let candidate = [...selected].sort((a, b) => a - b);
      if (candidate.length && !this.selectionResult(candidate).valid) {
        candidate = candidate.filter((dieIndex) => turn.roll[dieIndex] !== face);
      }
      if (candidate.length && !this.selectionResult(candidate).valid) {
        return { changed: false, reason: "That would leave a non-scoring selection." };
      }
      turn.selected = candidate;
      return { changed: true, result: this.selectionResult(candidate) };
    }

    selected.add(index);
    let candidate = [...selected].sort((a, b) => a - b);
    if (this.selectionResult(candidate).valid) {
      turn.selected = candidate;
      return { changed: true, result: this.selectionResult(candidate) };
    }

    const sameFace = turn.roll
      .map((die, dieIndex) => ({ die, dieIndex }))
      .filter((entry) => entry.die === face && !selected.has(entry.dieIndex))
      .map((entry) => entry.dieIndex);
    const selectedSame = candidate.filter((dieIndex) => turn.roll[dieIndex] === face).length;
    if (face !== 1 && face !== 5 && selectedSame < 3 && selectedSame + sameFace.length >= 3) {
      candidate = [...candidate, ...sameFace.slice(0, 3 - selectedSame)].sort((a, b) => a - b);
      if (this.selectionResult(candidate).valid) {
        turn.selected = candidate;
        return { changed: true, result: this.selectionResult(candidate) };
      }
    }

    if (turn.roll.length === 6 && specialCombination(turn.roll)) {
      turn.selected = turn.roll.map((_, dieIndex) => dieIndex);
      return { changed: true, result: this.selectionResult(turn.selected) };
    }

    return { changed: false, reason: `${face} does not score by itself.` };
  }

  clearSelection() {
    if (this.state.phase !== "rolled") return false;
    this.state.turn.selected = [];
    return true;
  }

  selectSpecial() {
    if (this.state.phase !== "rolled" || this.state.turn.roll.length !== 6) return false;
    if (!specialCombination(this.state.turn.roll)) return false;
    this.state.turn.selected = this.state.turn.roll.map((_, index) => index);
    return true;
  }

  confirmSelection() {
    if (this.state.phase !== "rolled") throw new Error("Roll before confirming dice.");
    const turn = this.state.turn;
    const result = this.selectionResult();
    if (!result.valid) throw new Error("Select a complete scoring die or combination.");

    const selectedSet = new Set(turn.selected);
    const selectedDice = turn.roll.filter((_, index) => selectedSet.has(index));
    const remaining = turn.roll.length - selectedDice.length;
    turn.points += result.score;
    turn.lastActionPoints = result.score;
    turn.canBank = true;
    turn.heldDice.push(...selectedDice);
    turn.roll = [];
    turn.selected = [];

    if (remaining === 0) {
      turn.diceRemaining = 6;
      turn.heldDice = [];
      turn.hotDice = true;
      turn.canBank = false;
      this.addEvent("hot-dice", `${this.player.name} scored ${result.score} and has hot dice—all six must roll again.`, {
        player: this.player.name,
        score: result.score,
      });
    } else {
      turn.diceRemaining = remaining;
      turn.hotDice = false;
      this.addEvent("score", `${this.player.name} kept ${selectedDice.join(" · ")} for ${result.score} points; ${remaining} ${diceWord(remaining)} remain.`, {
        player: this.player.name,
        dice: selectedDice,
        score: result.score,
        diceRemaining: remaining,
      });
    }
    this.state.phase = "await-roll";
    return { ...result, hotDice: remaining === 0, diceRemaining: turn.diceRemaining };
  }

  bank() {
    if (this.state.phase === "await-roll" && this.state.turn?.hotDice) {
      throw new Error("Hot dice must be rolled before banking.");
    }
    if (this.state.phase !== "await-roll" || !this.state.turn?.canBank) {
      throw new Error("Score dice from the current roll before banking.");
    }
    const player = this.player;
    const turn = this.state.turn;
    if (!player.brokenIn && turn.points < 1000) {
      throw new Error(`You need 1000 points in one turn to break in (${1000 - turn.points} more needed).`);
    }

    const points = turn.points;
    const diceRemaining = turn.diceRemaining;
    player.score += points;
    if (!player.brokenIn) player.brokenIn = true;
    player.turns += 1;
    this.addEvent("bank", `${player.name} banked ${points} points (${player.score} total) with ${diceRemaining} ${diceWord(diceRemaining)} left.`, {
      player: player.name,
      points,
      total: player.score,
      diceRemaining,
    });

    const offer = {
      score: points,
      diceRemaining,
      fromPlayer: player.name,
      fromPlayerId: player.id,
    };

    if (!this.state.finalRound && player.score >= 10000) {
      this.state.finalRound = {
        mode: "final",
        triggerPlayerId: player.id,
        targetTurns: player.turns,
        contenders: null,
        pending: null,
      };
      this.addEvent("final", `${player.name} reached ${player.score}. Final round started!`, { player: player.name, total: player.score });
    }
    this.completeTurn({ offer });
    const offered = this.state.phase === "offer" && this.state.offer?.fromPlayerId === player.id;
    return { points, score: player.score, offered };
  }

  completeTurn({ offer }) {
    const completedIndex = this.state.currentPlayer;
    const completedPlayer = this.state.players[completedIndex];
    if (this.state.phase === "rolled" || this.state.phase === "farkled") completedPlayer.turns += 1;

    if (this.state.finalRound?.mode === "tiebreak") {
      this.state.finalRound.pending = this.state.finalRound.pending.filter((id) => id !== completedPlayer.id);
      if (this.state.finalRound.pending.length === 0) {
        this.resolveStandings(completedIndex, offer);
        return;
      }
      const next = this.findNext(completedIndex, (player) => this.state.finalRound.pending.includes(player.id));
      this.preparePlayer(next, offer);
      return;
    }

    if (this.state.finalRound?.mode === "final") {
      const target = this.state.finalRound.targetTurns;
      const eligible = this.state.players.some((player) => player.turns < target);
      if (!eligible) {
        this.resolveStandings(completedIndex, offer);
        return;
      }
      const next = this.findNext(completedIndex, (player) => player.turns < target);
      this.preparePlayer(next, offer);
      return;
    }

    this.preparePlayer((completedIndex + 1) % this.state.players.length, offer);
  }

  findNext(fromIndex, predicate) {
    for (let offset = 1; offset <= this.state.players.length; offset += 1) {
      const index = (fromIndex + offset) % this.state.players.length;
      if (predicate(this.state.players[index])) return index;
    }
    throw new Error("Could not find the next player.");
  }

  preparePlayer(index, offer) {
    this.state.currentPlayer = index;
    this.state.winnerId = null;
    if (offer && this.state.players[index].brokenIn) {
      this.state.offer = offer;
      this.state.turn = null;
      this.state.phase = "offer";
    } else {
      this.state.offer = null;
      this.state.turn = newTurn();
      this.state.phase = "await-roll";
    }
  }

  resolveStandings(completedIndex, offer) {
    const highScore = Math.max(...this.state.players.map((player) => player.score));
    const leaders = this.state.players.filter((player) => player.score === highScore);
    if (leaders.length === 1) {
      this.state.winnerId = leaders[0].id;
      this.state.phase = "game-over";
      this.state.turn = null;
      this.state.offer = null;
      this.state.finalRound = { ...this.state.finalRound, mode: "complete" };
      this.addEvent("winner", `${leaders[0].name} wins with ${highScore} points!`, { player: leaders[0].name, total: highScore });
      return;
    }

    const ids = leaders.map((player) => player.id);
    this.state.finalRound = {
      ...this.state.finalRound,
      mode: "tiebreak",
      contenders: ids,
      pending: [...ids],
    };
    this.addEvent("tie", `${leaders.map((player) => player.name).join(" and ")} are tied at ${highScore}; each gets another turn.`, {
      players: leaders.map((player) => player.name),
      total: highScore,
    });
    const next = this.findNext(completedIndex, (player) => ids.includes(player.id));
    this.preparePlayer(next, offer);
  }
}
