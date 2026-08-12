import { evaluatePoker } from "./poker.js?v=20260730-2";
import { legalCardIndexes } from "./rules.js?v=20260730-2";

export function cpuAcceptLowRedeal(hand) {
  const evaluation = evaluatePoker(hand);
  if (evaluation.category >= 2) return false;
  if (evaluation.category === 1 && evaluation.tie[0] >= 7) return false;
  return true;
}

function bestStraightKeep(hand) {
  const windows = [
    [14, 2, 3, 4, 5],
    [2, 3, 4, 5, 6],
    [3, 4, 5, 6, 7],
    [4, 5, 6, 7, 8],
    [5, 6, 7, 8, 9],
    [6, 7, 8, 9, 10],
    [7, 8, 9, 10, 11],
    [8, 9, 10, 11, 12],
    [9, 10, 11, 12, 13],
    [10, 11, 12, 13, 14],
  ];
  let best = [];
  windows.forEach((window) => {
    const seen = new Set();
    const indexes = hand
      .map((card, index) => window.includes(card.rank) && !seen.has(card.rank) ?
        (seen.add(card.rank), index) : -1)
      .filter((index) => index >= 0);
    if (indexes.length > best.length) best = indexes;
  });
  return best;
}

export function cpuExchangeIndexes(hand, exchangeNumber = 1, available = 5) {
  if (available <= 0) return [];
  const evaluation = evaluatePoker(hand);
  if (evaluation.category >= 4 || evaluation.category === 6 || evaluation.category >= 7) return [];

  const rankCounts = new Map();
  hand.forEach((card) => rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1));
  let keep = hand
    .map((card, index) => rankCounts.get(card.rank) > 1 ? index : -1)
    .filter((index) => index >= 0);

  if (!keep.length) {
    const suits = new Map();
    hand.forEach((card, index) => {
      if (!suits.has(card.suit)) suits.set(card.suit, []);
      suits.get(card.suit).push(index);
    });
    const flushDraw = [...suits.values()].find((indexes) => indexes.length === 4);
    const straightDraw = bestStraightKeep(hand);
    if (flushDraw) keep = flushDraw;
    else if (straightDraw.length >= 4) keep = straightDraw;
    else {
      keep = hand
        .map((card, index) => card.rank >= (exchangeNumber === 3 ? 12 : 11) ? index : -1)
        .filter((index) => index >= 0)
        .slice(0, 2);
    }
  }

  return hand
    .map((_, index) => keep.includes(index) ? -1 : index)
    .filter((index) => index >= 0)
    .sort((left, right) => hand[left].rank - hand[right].rank)
    .slice(0, available);
}

export function cpuDeclareChicago(player) {
  const evaluation = evaluatePoker(player.hand);
  if (player.score < 15) return false;
  return evaluation.category >= 4 ||
    evaluation.category === 3 && evaluation.tie[0] >= 10 ||
    evaluation.category === 2 && evaluation.tie[0] >= 12;
}

function currentWinningRank(currentTrick, ledSuit) {
  return currentTrick
    .filter((play) => play.faceUp && play.card.suit === ledSuit)
    .reduce((highest, play) => Math.max(highest, play.card.rank), 0);
}

export function cpuChooseCard({
  hand,
  currentTrick,
  trickNumber,
  chicago,
  playerIndex,
}) {
  const ledSuit = currentTrick[0]?.card.suit || null;
  const legal = legalCardIndexes(hand, ledSuit);
  const ascending = [...legal].sort((left, right) => hand[left].rank - hand[right].rank);
  const descending = [...ascending].reverse();

  if (!ledSuit) {
    if (chicago?.active && chicago.declarer === playerIndex) return descending[0];
    return trickNumber === 5 ? descending[0] : ascending[0];
  }

  const winnerRank = currentWinningRank(currentTrick, ledSuit);
  const winners = ascending.filter((index) =>
    hand[index].suit === ledSuit && hand[index].rank > winnerRank);
  const stoppingChicago = chicago?.active && chicago.declarer !== playerIndex;
  if (winners.length && (stoppingChicago || trickNumber === 5 ||
      chicago?.declarer === playerIndex || currentTrick.length === hand.length - 1)) {
    return winners[0];
  }
  if (winners.length) return winners[0];
  return ascending[0];
}
