const CATEGORY_NAMES = [
  "Högt kort",
  "Ett par",
  "Två par",
  "Triss",
  "Stege",
  "Färg",
  "Kåk",
  "Fyrtal",
  "Färgstege",
  "Royal flush",
];

export const POKER_POINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0];

function descending(values) {
  return [...values].sort((left, right) => right - left);
}

function straightHigh(ranks) {
  const unique = [...new Set(ranks)].sort((left, right) => left - right);
  if (unique.length !== 5) return null;
  if (unique.join(",") === "2,3,4,5,14") return 5;
  return unique[4] - unique[0] === 4 ? unique[4] : null;
}

export function evaluatePoker(hand) {
  if (!Array.isArray(hand) || hand.length !== 5) {
    throw new Error("En pokerhand måste bestå av fem kort.");
  }

  const ranks = hand.map((card) => card.rank);
  const counts = new Map();
  ranks.forEach((rank) => counts.set(rank, (counts.get(rank) || 0) + 1));
  const groups = [...counts.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((left, right) => right.count - left.count || right.rank - left.rank);
  const flush = hand.every((card) => card.suit === hand[0].suit);
  const high = straightHigh(ranks);
  const royal = flush && high === 14 && Math.min(...ranks) === 10;

  let category;
  let tie;
  if (royal) {
    category = 9;
    tie = [];
  } else if (flush && high) {
    category = 8;
    tie = [high];
  } else if (groups[0].count === 4) {
    category = 7;
    tie = [groups[0].rank, groups[1].rank];
  } else if (groups[0].count === 3 && groups[1].count === 2) {
    category = 6;
    tie = [groups[0].rank, groups[1].rank];
  } else if (flush) {
    category = 5;
    tie = descending(ranks);
  } else if (high) {
    category = 4;
    tie = [high];
  } else if (groups[0].count === 3) {
    category = 3;
    tie = [groups[0].rank, ...descending(groups.slice(1).map((group) => group.rank))];
  } else if (groups[0].count === 2 && groups[1].count === 2) {
    const pairs = descending([groups[0].rank, groups[1].rank]);
    category = 2;
    tie = [...pairs, groups[2].rank];
  } else if (groups[0].count === 2) {
    category = 1;
    tie = [groups[0].rank, ...descending(groups.slice(1).map((group) => group.rank))];
  } else {
    category = 0;
    tie = descending(ranks);
  }

  return {
    category,
    name: CATEGORY_NAMES[category],
    tie,
    points: POKER_POINTS[category],
    royal: category === 9,
  };
}

export function compareEvaluations(left, right) {
  if (left.category !== right.category) return Math.sign(left.category - right.category);
  const length = Math.max(left.tie.length, right.tie.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left.tie[index] || 0) - (right.tie[index] || 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}

export function comparePokerHands(hands) {
  const evaluations = hands.map(evaluatePoker);
  let best = evaluations[0];
  evaluations.slice(1).forEach((evaluation) => {
    if (compareEvaluations(evaluation, best) > 0) best = evaluation;
  });
  const winners = evaluations
    .map((evaluation, index) => compareEvaluations(evaluation, best) === 0 ? index : -1)
    .filter((index) => index >= 0);
  return {
    evaluations,
    winners,
    best,
    tied: winners.length > 1,
    points: winners.length === 1 ? best.points : 0,
    royalWinner: winners.length === 1 && best.royal ? winners[0] : null,
  };
}

function heightWord(rank, plural = false) {
  if (rank <= 6) return plural ? "låga" : "lågt";
  if (rank <= 10) return plural ? "ganska låga" : "ganska lågt";
  if (rank <= 12) return plural ? "ganska höga" : "ganska högt";
  return plural ? "höga" : "högt";
}

const SINGULAR_RANK_NAMES = {
  2: "tvåa",
  3: "trea",
  4: "fyra",
  5: "femma",
  6: "sexa",
  7: "sjua",
  8: "åtta",
  9: "nia",
  10: "tia",
  11: "knekt",
  12: "dam",
  13: "kung",
  14: "ess",
};

const PLURAL_RANK_NAMES = {
  2: "tvåor",
  3: "treor",
  4: "fyror",
  5: "femmor",
  6: "sexor",
  7: "sjuor",
  8: "åttor",
  9: "nior",
  10: "tior",
  11: "knektar",
  12: "damer",
  13: "kungar",
  14: "ess",
};

export function describePokerHand(evaluation) {
  const singular = (rank) => SINGULAR_RANK_NAMES[rank] || String(rank);
  const plural = (rank) => PLURAL_RANK_NAMES[rank] || String(rank);
  switch (evaluation.category) {
    case 0: return `Högt kort, ${singular(evaluation.tie[0])}`;
    case 1: return `Ett par, ${plural(evaluation.tie[0])}`;
    case 2: return `Två par, ${plural(evaluation.tie[0])} över ${plural(evaluation.tie[1])}`;
    case 3: return `Triss, ${plural(evaluation.tie[0])}`;
    case 4: return `Stege till ${singular(evaluation.tie[0])}`;
    case 5: return `Färg med ${singular(evaluation.tie[0])} högst`;
    case 6: return `Kåk, ${plural(evaluation.tie[0])} över ${plural(evaluation.tie[1])}`;
    case 7: return `Fyrtal, ${plural(evaluation.tie[0])}`;
    case 8: return `Färgstege till ${singular(evaluation.tie[0])}`;
    case 9: return "Royal flush";
    default: return evaluation.name;
  }
}

export function describePokerCall(evaluation) {
  switch (evaluation.category) {
    case 0: return "Inget";
    case 1: return `Ett par, ${heightWord(evaluation.tie[0])}`;
    case 2: return `Två par, ${heightWord(evaluation.tie[0], true)}`;
    case 3: return `Triss, ${heightWord(evaluation.tie[0])}`;
    case 4: return `Stege, ${heightWord(evaluation.tie[0])}`;
    case 5: return `Färg, ${heightWord(evaluation.tie[0])}`;
    case 6: return `Kåk, ${heightWord(evaluation.tie[0])}`;
    case 7: return `Fyrtal, ${heightWord(evaluation.tie[0])}`;
    case 8: return `Färgstege, ${heightWord(evaluation.tie[0])}`;
    case 9: return "Royal flush";
    default: return evaluation.name;
  }
}
