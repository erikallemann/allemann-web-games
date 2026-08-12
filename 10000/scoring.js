export const SCORE_TABLE = Object.freeze({
  1: Object.freeze({ 3: 1000, 4: 2000, 5: 4000, 6: 8000 }),
  2: Object.freeze({ 3: 200, 4: 400, 5: 800, 6: 1600 }),
  3: Object.freeze({ 3: 300, 4: 600, 5: 1200, 6: 2400 }),
  4: Object.freeze({ 3: 400, 4: 800, 5: 1600, 6: 3200 }),
  5: Object.freeze({ 3: 500, 4: 1000, 5: 2000, 6: 4000 }),
  6: Object.freeze({ 3: 600, 4: 1200, 5: 2400, 6: 4800 }),
});

function countsFor(dice) {
  const counts = Array(7).fill(0);
  for (const die of dice) {
    if (!Number.isInteger(die) || die < 1 || die > 6) return null;
    counts[die] += 1;
  }
  return counts;
}

export function specialCombination(dice) {
  if (dice.length !== 6) return null;
  const counts = countsFor(dice);
  if (!counts) return null;
  const groups = counts.slice(1).filter(Boolean).sort((a, b) => a - b);

  if (counts.slice(1).every((count) => count === 1)) {
    return { kind: "straight", score: 1500, label: "Straight" };
  }
  if (groups.length === 3 && groups.every((count) => count === 2)) {
    return { kind: "three-pairs", score: 1500, label: "Three pairs" };
  }
  if (groups.length === 2 && groups.every((count) => count === 3)) {
    return { kind: "two-triples", score: 1500, label: "Two triples" };
  }
  return null;
}

/**
 * Scores a selection only when every selected die is consumed by a scoring
 * group. Special combinations are available only when all six dice from the
 * current roll were selected (the caller controls this with allowSpecial).
 */
export function scoreSelection(dice, { allowSpecial = false } = {}) {
  if (!Array.isArray(dice) || dice.length === 0 || dice.length > 6) {
    return { valid: false, score: 0, label: "No scoring dice selected", kind: null };
  }
  const counts = countsFor(dice);
  if (!counts) {
    return { valid: false, score: 0, label: "Invalid dice", kind: null };
  }

  if (allowSpecial) {
    const special = specialCombination(dice);
    if (special) return { valid: true, ...special };
  }

  let score = 0;
  const parts = [];
  for (let face = 1; face <= 6; face += 1) {
    const count = counts[face];
    if (!count) continue;

    if (count >= 3) {
      score += SCORE_TABLE[face][count];
      parts.push(`${count} × ${face}`);
      continue;
    }
    if (face === 1) {
      score += count * 100;
      parts.push(`${count} single ${count === 1 ? "1" : "1s"}`);
      continue;
    }
    if (face === 5) {
      score += count * 50;
      parts.push(`${count} single ${count === 1 ? "5" : "5s"}`);
      continue;
    }
    return { valid: false, score: 0, label: `${face}s need a group of at least three`, kind: null };
  }

  return {
    valid: score > 0,
    score,
    label: parts.join(" + "),
    kind: "standard",
  };
}

export function hasScoringOption(dice) {
  if (!Array.isArray(dice) || dice.length === 0) return false;
  if (dice.length === 6 && specialCombination(dice)) return true;
  const counts = countsFor(dice);
  if (!counts) return false;
  return counts[1] > 0 || counts[5] > 0 || counts.slice(1).some((count) => count >= 3);
}

const farkleProbabilityCache = new Map();

/**
 * Exact chance that a roll of diceCount dice contains no scoring option.
 * Enumeration deliberately uses hasScoringOption so probability and game
 * rules—including six-dice special combinations—stay in sync.
 */
export function farkleProbability(diceCount) {
  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 6) {
    throw new Error("Dice count must be between 1 and 6.");
  }
  if (farkleProbabilityCache.has(diceCount)) return farkleProbabilityCache.get(diceCount);

  const dice = Array(diceCount).fill(1);
  let farkles = 0;
  const countRolls = (index) => {
    if (index === diceCount) {
      if (!hasScoringOption(dice)) farkles += 1;
      return;
    }
    for (let face = 1; face <= 6; face += 1) {
      dice[index] = face;
      countRolls(index + 1);
    }
  };
  countRolls(0);

  const probability = farkles / (6 ** diceCount);
  farkleProbabilityCache.set(diceCount, probability);
  return probability;
}
