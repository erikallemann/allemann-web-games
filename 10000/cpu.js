import { farkleProbability, scoreSelection } from "./scoring.js?v=20260730-3";

export function scoringSelections(roll) {
  if (!Array.isArray(roll) || roll.length === 0 || roll.length > 6) return [];
  const selections = [];
  for (let mask = 1; mask < (1 << roll.length); mask += 1) {
    const indices = [];
    const dice = [];
    for (let index = 0; index < roll.length; index += 1) {
      if (mask & (1 << index)) {
        indices.push(index);
        dice.push(roll[index]);
      }
    }
    const result = scoreSelection(dice, {
      allowSpecial: roll.length === 6 && indices.length === 6,
    });
    if (result.valid) {
      selections.push({
        indices,
        dice,
        score: result.score,
        kind: result.kind,
        label: result.label,
        diceRemaining: indices.length === roll.length ? 6 : roll.length - indices.length,
        hotDice: indices.length === roll.length,
      });
    }
  }
  return selections;
}

function chooseBalancedSelection({ roll, turn }) {
  const options = scoringSelections(roll);
  if (!options.length) throw new Error("CPU received a roll without a scoring selection.");

  return options.reduce((best, option) => {
    const risk = farkleProbability(option.diceRemaining);
    const accumulated = turn.points + option.score;
    const flexibility = option.diceRemaining * 45 * (1 - risk);
    const riskCost = accumulated * risk * 0.22;
    const utility = option.score + flexibility - riskCost;
    const ranked = { ...option, utility };
    if (!best || ranked.utility > best.utility) return ranked;
    if (ranked.utility === best.utility && ranked.score > best.score) return ranked;
    if (ranked.utility === best.utility && ranked.indices.length < best.indices.length) return ranked;
    return best;
  }, null).indices;
}

function chooseBalancedAction({ state, player, turn }) {
  if (!turn.canBank) return "roll";
  if (!player.brokenIn) {
    if (turn.points < 1000) return "roll";
    if (turn.points >= 1200 || turn.diceRemaining <= 2) return "bank";
    return "roll";
  }

  const projected = player.score + turn.points;
  const rivalHigh = Math.max(...state.players
    .filter((candidate) => candidate.id !== player.id)
    .map((candidate) => candidate.score));

  if (projected >= 10000 && !state.finalRound) return "bank";
  if (state.finalRound) return projected > rivalHigh ? "bank" : "roll";

  const thresholds = { 1: 250, 2: 400, 3: 550, 4: 700, 5: 850, 6: Infinity };
  let threshold = thresholds[turn.diceRemaining];
  const lead = player.score - rivalHigh;
  if (lead >= 1500) threshold -= 150;
  if (lead <= -2000) threshold += 150;
  if (turn.inherited) threshold -= 100;
  return turn.points >= Math.max(200, threshold) ? "bank" : "roll";
}

function chooseBalancedContinuation({ state, player, offer }) {
  const thresholds = { 1: 1500, 2: 850, 3: 500, 4: 300, 5: 150, 6: Infinity };
  if (state.finalRound) {
    const rivalHigh = Math.max(...state.players
      .filter((candidate) => candidate.id !== player.id)
      .map((candidate) => candidate.score));
    const needed = Math.max(0, rivalHigh + 50 - player.score);
    if (offer.score >= needed) return "inherit";
  }
  return offer.score >= thresholds[offer.diceRemaining] ? "inherit" : "fresh";
}

export const balancedStrategy = Object.freeze({
  id: "balanced",
  name: "Balanced",
  chooseContinuation: chooseBalancedContinuation,
  chooseSelection: chooseBalancedSelection,
  chooseAction: chooseBalancedAction,
});

export const CPU_STRATEGIES = Object.freeze({
  balanced: balancedStrategy,
});

export function strategyForPlayer(player) {
  return CPU_STRATEGIES[player?.strategy] || balancedStrategy;
}
