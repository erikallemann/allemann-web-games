export const SUITS = ["clubs", "diamonds", "hearts", "spades"];
export const SUIT_SYMBOLS = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
export const RANK_LABELS = { 11: "J", 12: "Q", 13: "K", 14: "A" };

export function createDeck() {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({
    id: `${rank}-${suit}`,
    rank,
    suit,
  })));
}

export function shuffle(deck, random = Math.random) {
  const result = deck.map((card) => ({ ...card }));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export function cardLabel(card) {
  return `${RANK_LABELS[card.rank] || card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function sortHand(hand) {
  return [...hand].sort((left, right) =>
    right.rank - left.rank || SUITS.indexOf(left.suit) - SUITS.indexOf(right.suit));
}

