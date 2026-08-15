import { createDeck, shuffle, sortHand, cardLabel } from "./cards.js?v=20260815-3";
import { comparePokerHands, describePokerCall, describePokerHand } from "./poker.js?v=20260815-3";
import {
  chicagoEligible,
  lowRedealEligible,
  normalWinner,
  trickWinner,
  validateCardPlay,
} from "./rules.js?v=20260815-3";

export const SAVE_VERSION = 3;
export const TARGET_SCORE = 52;
export const PHASES = [
  "low_redeal",
  "exchange_1",
  "exchange_2",
  "exchange_3",
  "trick",
  "round_summary",
  "game_over",
];

function addEvent(state, message, type = "normal") {
  state.events.unshift({
    id: `${Date.now()}-${state.eventCounter += 1}`,
    message,
    type,
  });
  state.events = state.events.slice(0, 80);
}

function draw(state, count) {
  if (state.deck.length < count) {
    throw new Error(`Kortleken har bara ${state.deck.length} kort kvar.`);
  }
  return state.deck.splice(0, count);
}

function clockwiseOrder(dealer, count) {
  return Array.from({ length: count }, (_, offset) => (dealer + 1 + offset) % count);
}

function beginDecisionPhase(state, phase) {
  state.phase = phase;
  state.actionOrder = clockwiseOrder(state.dealer, state.players.length);
  state.actionPosition = 0;
  state.actor = state.actionOrder[0];
}

function advanceDecision(state, onComplete) {
  state.actionPosition += 1;
  if (state.actionPosition < state.actionOrder.length) {
    state.actor = state.actionOrder[state.actionPosition];
    return;
  }
  onComplete();
}

function scorePoker(state, moment) {
  const hands = moment === "slut" ? state.players.map((player) => player.preservedHand) :
    state.players.map((player) => player.hand);
  const result = comparePokerHands(hands);
  const calls = clockwiseOrder(state.dealer, state.players.length).map((playerIndex) => ({
    playerIndex,
    text: describePokerCall(result.evaluations[playerIndex]),
  }));
  const descriptions = clockwiseOrder(state.dealer, state.players.length).map((playerIndex) => ({
    playerIndex,
    text: describePokerHand(result.evaluations[playerIndex]),
  }));
  state.lastPokerResult = {
    moment,
    evaluations: result.evaluations,
    winners: result.winners,
    tied: result.tied,
    points: result.points,
    bestName: result.best.name,
    calls,
    descriptions,
  };
  (moment === "slut" ? descriptions : calls).forEach((description) => {
    const text = moment === "slut" ? `${description.text}.` : `”${description.text}.”`;
    addEvent(state, `${state.players[description.playerIndex].name}: ${text}`, "call");
  });

  if (result.tied) {
    addEvent(state, `Ingen får pokerpoäng: de bästa händerna (${result.best.name}) är lika.`, "score");
    return null;
  }

  const winner = result.winners[0];
  const name = state.players[winner].name;
  if (result.royalWinner !== null) {
    finishGame(state, winner, "royal", `${name} har royal flush och vinner direkt!`);
    return winner;
  }
  if (result.points > 0) {
    state.players[winner].score += result.points;
    addEvent(
      state,
      `${name} har bäst hand med ${result.best.name.toLowerCase()} och får ${result.points} poäng.`,
      "score",
    );
  } else {
    addEvent(state, `${name} har högst kort, men högt kort ger inga poäng.`, "score");
  }
  return null;
}

function finishGame(state, winner, reason, message) {
  state.phase = "game_over";
  state.winner = winner;
  state.winReason = reason;
  state.actor = null;
  addEvent(state, message, "winner");
}

function beginTricks(state) {
  state.players.forEach((player) => {
    player.preservedHand = player.hand.map((card) => ({ ...card }));
    player.tricks = 0;
  });
  state.phase = "trick";
  state.actor = (state.dealer + 1) % state.players.length;
  state.trickNumber = 1;
  state.currentTrick = [];
  state.trickHistory = [];
  state.lastTrickWinner = null;
  addEvent(state, `${state.players[state.actor].name} spelar ut i första sticket.`, "phase");
}

function completeExchangePhase(state) {
  if (state.phase === "exchange_1") {
    scorePoker(state, "första");
    if (state.phase !== "game_over") beginDecisionPhase(state, "exchange_2");
  } else if (state.phase === "exchange_2") {
    beginDecisionPhase(state, "exchange_3");
  } else {
    beginTricks(state);
  }
}

function finishRound(state, fifthWinner) {
  scorePoker(state, "slut");
  if (state.phase === "game_over") return;

  const winner = normalWinner(state.players, fifthWinner, TARGET_SCORE);
  if (winner !== null) {
    finishGame(
      state,
      winner,
      "normal",
      `${state.players[winner].name} har nått ${TARGET_SCORE} poäng och vinner genom att ta sista sticket!`,
    );
    return;
  }

  state.phase = "round_summary";
  state.actor = null;
  state.roundSummary = {
    round: state.round,
    fifthWinner,
    poker: state.lastPokerResult,
    hands: state.players.map((player) => player.preservedHand.map((card) => ({ ...card }))),
    tricks: state.trickHistory.map((trick) => ({
      ...trick,
      plays: trick.plays.map((play) => ({
        ...play,
        card: { ...play.card },
      })),
    })),
  };
  addEvent(state, `Omgång ${state.round} är slut.`, "phase");
}

function beginRound(state, random) {
  state.deck = shuffle(createDeck(), random);
  state.discard = [];
  state.players.forEach((player) => {
    player.hand = sortHand(draw(state, 5));
    player.preservedHand = [];
    player.tricks = 0;
  });
  state.chicago = {
    declarer: null,
    active: false,
    failed: false,
    stoppedBy: null,
  };
  state.lastOpenCard = null;
  state.openCardOffer = null;
  state.lastPokerResult = null;
  state.roundSummary = null;
  state.currentTrick = [];
  state.trickHistory = [];
  beginDecisionPhase(state, "low_redeal");
  addEvent(
    state,
    `Omgång ${state.round}: ${state.players[state.dealer].name} är givare.`,
    "phase",
  );
}

export function createGame(playerRecords, random = Math.random) {
  if (!Array.isArray(playerRecords) || playerRecords.length < 2 || playerRecords.length > 4) {
    throw new Error("Chicago spelas med 2–4 spelare.");
  }
  const humans = playerRecords.filter((player) => player.type === "human").length;
  if (humans !== 1) throw new Error("Spelet kräver exakt en mänsklig spelare.");
  const players = playerRecords.map((player, index) => ({
    id: index,
    name: String(player.name || (player.type === "human" ? "Du" : `CPU ${index}`)).slice(0, 24),
    type: player.type === "human" ? "human" : "cpu",
    score: 0,
    hand: [],
    preservedHand: [],
    tricks: 0,
  }));
  const state = {
    version: SAVE_VERSION,
    players,
    dealer: Math.floor(random() * players.length),
    round: 1,
    phase: "low_redeal",
    actor: null,
    actionOrder: [],
    actionPosition: 0,
    deck: [],
    discard: [],
    events: [],
    eventCounter: 0,
    winner: null,
    winReason: null,
    chicago: null,
    lastOpenCard: null,
    openCardOffer: null,
    lastPokerResult: null,
    roundSummary: null,
    trickNumber: 0,
    currentTrick: [],
    trickHistory: [],
  };
  beginRound(state, random);
  return state;
}

export function canLowRedeal(state, playerIndex = state.actor) {
  return state.phase === "low_redeal" &&
    state.actor === playerIndex &&
    lowRedealEligible(state.players[playerIndex].hand) &&
    state.deck.length >= 5;
}

export function decideLowRedeal(state, accept) {
  if (state.phase !== "low_redeal") throw new Error("Det är inte dags för låg omgiv.");
  const player = state.players[state.actor];
  if (accept) {
    if (!canLowRedeal(state)) throw new Error("Handen kan inte ges om.");
    state.discard.push(...player.hand);
    player.hand = sortHand(draw(state, 5));
    addEvent(state, `${player.name} byter hela den låga handen.`, "exchange");
  } else if (lowRedealEligible(player.hand)) {
    addEvent(state, `${player.name} behåller sin låga hand.`, "exchange");
  }
  advanceDecision(state, () => beginDecisionPhase(state, "exchange_1"));
}

export function canDeclareChicago(state, playerIndex = state.actor) {
  return state.actor === playerIndex &&
    chicagoEligible(state.players[playerIndex], state.phase, state.chicago.declarer !== null);
}

export function decideChicago(state) {
  if (state.phase !== "exchange_1") {
    throw new Error("Chicago kan bara anropas som ditt val i första bytet.");
  }
  const player = state.players[state.actor];
  if (!canDeclareChicago(state)) throw new Error("Chicago är inte tillgängligt.");
  state.chicago.declarer = state.actor;
  state.chicago.active = true;
  state.lastOpenCard = null;
  addEvent(state, `${player.name} anropar Chicago och måste ta alla fem stick!`, "chicago");
  advanceDecision(state, () => completeExchangePhase(state));
}

export function exchangeCards(state, indexes) {
  if (!["exchange_1", "exchange_2", "exchange_3"].includes(state.phase)) {
    throw new Error("Det är inte en bytesfas.");
  }
  const unique = [...new Set(indexes)].sort((left, right) => right - left);
  if (unique.length > 5 || unique.some((index) =>
    !Number.isInteger(index) || index < 0 || index >= state.players[state.actor].hand.length)) {
    throw new Error("Ogiltigt kortval.");
  }
  if (unique.length > state.deck.length) {
    throw new Error(`Bara ${state.deck.length} kort återstår i leken.`);
  }

  const player = state.players[state.actor];
  const discarded = unique.map((index) => player.hand[index]);
  unique.forEach((index) => player.hand.splice(index, 1));
  state.discard.push(...discarded);
  state.lastOpenCard = null;

  if (unique.length === 1) {
    const [card] = draw(state, 1);
    state.openCardOffer = {
      playerIndex: state.actor,
      card,
      phase: state.phase,
    };
    addEvent(state, `${player.name} erbjuds det öppna kortet ${cardLabel(card)}.`, "open");
    return;
  }

  const replacements = draw(state, unique.length);
  player.hand = sortHand([...player.hand, ...replacements]);

  if (unique.length === 0) {
    addEvent(state, `${player.name} står över bytet.`, "exchange");
  } else {
    addEvent(state, `${player.name} byter ${unique.length} kort.`, "exchange");
  }
  advanceDecision(state, () => completeExchangePhase(state));
}

export function decideOpenCard(state, accept) {
  const offer = state.openCardOffer;
  if (!offer || !state.phase.startsWith("exchange") || offer.playerIndex !== state.actor) {
    throw new Error("Det finns inget öppet kort att välja.");
  }
  if (!accept && state.deck.length < 1) {
    throw new Error("Det finns inget dolt kort kvar i leken.");
  }

  const player = state.players[state.actor];
  if (accept) {
    player.hand = sortHand([...player.hand, offer.card]);
    state.lastOpenCard = {
      playerIndex: state.actor,
      card: { ...offer.card },
      phase: offer.phase,
    };
    addEvent(state, `${player.name} behåller det öppna kortet ${cardLabel(offer.card)}.`, "open");
  } else {
    state.discard.push(offer.card);
    player.hand = sortHand([...player.hand, ...draw(state, 1)]);
    state.lastOpenCard = null;
    addEvent(state, `${player.name} avstår det öppna kortet och får nästa kort dolt.`, "exchange");
  }
  state.openCardOffer = null;
  advanceDecision(state, () => completeExchangePhase(state));
}

export function playCard(state, cardIndex) {
  if (state.phase !== "trick") throw new Error("Det är inte stickspel.");
  const player = state.players[state.actor];
  const ledSuit = state.currentTrick[0]?.card.suit || null;
  const validation = validateCardPlay(player.hand, cardIndex, ledSuit);
  if (!validation.valid) throw new Error(validation.reason);

  const [card] = player.hand.splice(cardIndex, 1);
  const faceUp = ledSuit === null || card.suit === ledSuit;
  state.currentTrick.push({
    playerIndex: state.actor,
    card,
    faceUp,
  });
  addEvent(
    state,
    faceUp ? `${player.name} spelar ${cardLabel(card)}.` : `${player.name} sakar.`,
    "play",
  );

  if (state.currentTrick.length < state.players.length) {
    state.actor = (state.actor + 1) % state.players.length;
    return;
  }

  const winner = trickWinner(state.currentTrick, state.currentTrick[0].card.suit);
  state.players[winner].tricks += 1;
  state.lastTrickWinner = winner;
  state.trickHistory.push({
    number: state.trickNumber,
    winner,
    plays: state.currentTrick.map((play) => ({
      ...play,
      card: { ...play.card },
    })),
  });
  addEvent(state, `${state.players[winner].name} vinner stick ${state.trickNumber}.`, "trick");

  if (state.chicago.active && winner !== state.chicago.declarer) {
    const declarer = state.chicago.declarer;
    state.chicago.active = false;
    state.chicago.failed = true;
    state.chicago.stoppedBy = winner;
    state.players[declarer].score = 0;
    addEvent(state, `${state.players[winner].name} stoppar Chicago-försöket.`, "chicago-fail");
    addEvent(state, `${state.players[declarer].name}s poäng nollställs.`, "chicago-fail");
  }

  if (state.trickNumber === 5) {
    if (state.chicago.active && state.players[state.chicago.declarer].tricks === 5) {
      finishGame(
        state,
        state.chicago.declarer,
        "chicago",
        `${state.players[state.chicago.declarer].name} tar alla fem stick och vinner med Chicago!`,
      );
      return;
    }
    state.players[winner].score += 5;
    addEvent(state, `${state.players[winner].name} tar femte sticket och får 5 poäng.`, "score");
    finishRound(state, winner);
    return;
  }

  state.trickNumber += 1;
  state.currentTrick = [];
  state.actor = winner;
}

export function nextRound(state, random = Math.random) {
  if (state.phase !== "round_summary") throw new Error("Omgången är inte avslutad.");
  state.round += 1;
  state.dealer = (state.dealer + 1) % state.players.length;
  beginRound(state, random);
}

export function restartGame(state, random = Math.random) {
  return createGame(state.players.map(({ name, type }) => ({ name, type })), random);
}

export function restoreGame(value) {
  if (!value || ![2, SAVE_VERSION].includes(value.version) || !PHASES.includes(value.phase)) return null;
  if (!Array.isArray(value.players) || value.players.length < 2 || value.players.length > 4) return null;

  const needsSummaryMigration = value.roundSummary &&
    (!value.roundSummary.hands || !value.roundSummary.tricks);
  const roundSummary = needsSummaryMigration ? {
    ...value.roundSummary,
    hands: value.roundSummary.hands || value.players.map((player) =>
      (player.preservedHand || []).map((card) => ({ ...card }))),
    tricks: value.roundSummary.tricks || value.trickHistory || [],
  } : value.roundSummary;
  if (value.version === SAVE_VERSION && !needsSummaryMigration) return value;
  return {
    ...value,
    version: SAVE_VERSION,
    openCardOffer: value.openCardOffer || null,
    roundSummary,
  };
}
