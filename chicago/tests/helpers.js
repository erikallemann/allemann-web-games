const SUIT_SHORT = { c: "clubs", d: "diamonds", h: "hearts", s: "spades" };
const RANKS = { A: 14, K: 13, Q: 12, J: 11, T: 10 };

export function cards(text) {
  return text.split(/\s+/).filter(Boolean).map((token) => {
    const suit = SUIT_SHORT[token.at(-1)];
    const rankText = token.slice(0, -1);
    const rank = RANKS[rankText] || Number(rankText);
    return { id: `${rank}-${suit}-${token}`, rank, suit };
  });
}

export function seededRandom(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

