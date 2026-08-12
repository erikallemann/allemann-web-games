export function lowRedealEligible(hand) {
  return Array.isArray(hand) && hand.length === 5 && hand.every((card) => card.rank <= 9);
}

export function chicagoEligible(player, phase, alreadyDeclared = false) {
  return phase === "exchange_1" && !alreadyDeclared && player.score >= 15;
}

export function legalCardIndexes(hand, ledSuit) {
  if (!ledSuit) return hand.map((_, index) => index);
  const following = hand
    .map((card, index) => card.suit === ledSuit ? index : -1)
    .filter((index) => index >= 0);
  return following.length ? following : hand.map((_, index) => index);
}

export function validateCardPlay(hand, cardIndex, ledSuit) {
  if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= hand.length) {
    return { valid: false, reason: "Kortet finns inte på handen." };
  }
  const legal = legalCardIndexes(hand, ledSuit);
  return legal.includes(cardIndex)
    ? { valid: true }
    : { valid: false, reason: "Du måste följa färg." };
}

export function trickWinner(plays, ledSuit) {
  if (!plays.length || !ledSuit) throw new Error("Ett stick måste ha en utspelsfärg.");
  let winner = null;
  plays.forEach((play) => {
    if (!play.faceUp || play.card.suit !== ledSuit) return;
    if (!winner || play.card.rank > winner.card.rank) winner = play;
  });
  return winner.playerIndex;
}

export function normalWinner(players, fifthTrickWinner, target = 52) {
  return players[fifthTrickWinner]?.score >= target ? fifthTrickWinner : null;
}
