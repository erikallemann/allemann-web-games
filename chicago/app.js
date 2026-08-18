import { cardLabel, RANK_LABELS, SUIT_SYMBOLS } from "./cards.js?v=20260818-4";
import {
  canDeclareChicago,
  canLowRedeal,
  confirmFinalTrick,
  createGame,
  decideChicago,
  decideLowRedeal,
  decideOpenCard,
  exchangeCards,
  nextRound,
  playCard,
  restartGame,
  restoreGame,
} from "./game.js?v=20260818-4";
import { legalCardIndexes } from "./rules.js?v=20260818-4";
import { describePokerHand } from "./poker.js?v=20260818-4";
import {
  cpuAcceptLowRedeal,
  cpuChooseCard,
  cpuDeclareChicago,
  cpuExchangeIndexes,
} from "./cpu.js?v=20260818-4";
import {
  FAMILY_ROSTER,
  LINEUP_KEY,
  nextRosterPlayer,
  normalizeLineup,
  restoreLineup,
} from "./setup.js?v=20260818-4";

const SAVE_KEY = "chicago-game-v4";
const LEGACY_SAVE_KEYS = ["chicago-game-v3", "chicago-game-v2"];
const SPEED_KEY = "chicago-cpu-speed-v1";
const PHASE_LABELS = {
  low_redeal: "Låg omgiv",
  exchange_1: "Första bytet",
  exchange_2: "Andra bytet",
  exchange_3: "Tredje bytet",
  trick: "Stickspel",
  final_trick: "Sista sticket",
  round_summary: "Omgången avslutad",
  game_over: "Partiet avslutat",
};
const SPEEDS = { normal: 850, fast: 260, instant: 0 };
const RELEASE_VERSION = new URL(import.meta.url).searchParams.get("v") || "dev";

let state = loadGame();
let setupPlayers = restoreLineup(localStorage.getItem(LINEUP_KEY));
let selected = new Set();
let selectionKey = "";
let cpuPaused = false;
let cpuTimer = null;
let message = "";
let scoreDetailsOpen = false;

const byId = (id) => document.getElementById(id);
const elements = {
  setupView: byId("setup-view"),
  setupForm: byId("setup-form"),
  playerCount: byId("player-count"),
  nameList: byId("name-list"),
  familyRoster: byId("family-roster"),
  addPlayer: byId("add-player"),
  gameView: byId("game-view"),
  restartGame: byId("restart-game"),
  newGame: byId("new-game"),
  phaseLabel: byId("phase-label"),
  cpuSpeed: byId("cpu-speed"),
  cpuPause: byId("cpu-pause"),
  roundLabel: byId("round-label"),
  mobileRoundLabel: byId("mobile-round-label"),
  scoreSection: byId("score-section"),
  scoreboard: byId("scoreboard"),
  scoreboardToggle: byId("scoreboard-toggle"),
  scoreRibbon: byId("score-ribbon"),
  turnEyebrow: byId("turn-eyebrow"),
  turnTitle: byId("turn-title"),
  deckCount: byId("deck-count"),
  announcement: byId("announcement"),
  opponents: byId("opponents"),
  revealPanel: byId("reveal-panel"),
  revealTitle: byId("reveal-title"),
  revealedHands: byId("revealed-hands"),
  trickStage: byId("trick-stage"),
  trickKicker: byId("trick-kicker"),
  trickTitle: byId("trick-title"),
  leaderLabel: byId("leader-label"),
  trickCards: byId("trick-cards"),
  handTitle: byId("hand-title"),
  selectionCount: byId("selection-count"),
  humanHand: byId("human-hand"),
  actionPanel: byId("action-panel"),
  message: byId("message"),
  roundSummary: byId("round-summary"),
  summaryTitle: byId("summary-title"),
  summaryHands: byId("summary-hands"),
  summaryTricks: byId("summary-tricks"),
  summaryTrickList: byId("summary-trick-list"),
  nextRound: byId("next-round"),
  winnerCard: byId("winner-card"),
  eventLog: byId("event-log"),
  releaseVersion: byId("release-version"),
};
elements.releaseVersion.textContent = `v${RELEASE_VERSION}`;

function loadGame() {
  try {
    const current = localStorage.getItem(SAVE_KEY);
    const legacy = LEGACY_SAVE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
    const restored = restoreGame(JSON.parse(current || legacy));
    if (restored && !current) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(restored));
      LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
    }
    return restored;
  } catch {
    localStorage.removeItem(SAVE_KEY);
    LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
    return null;
  }
}

function saveGame() {
  if (state) localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function captureSetupPlayers() {
  return [...elements.nameList.querySelectorAll("input")].map((input, index) => ({
    name: input.value,
    type: index === 0 ? "human" : "cpu",
  }));
}

function rememberLineup(entries = captureSetupPlayers()) {
  setupPlayers = normalizeLineup(entries);
  localStorage.setItem(LINEUP_KEY, JSON.stringify(setupPlayers));
  return setupPlayers;
}

function renderSetup() {
  elements.familyRoster.innerHTML = FAMILY_ROSTER.map((name) =>
    `<option value="${escapeHtml(name)}"></option>`).join("");
  elements.nameList.innerHTML = setupPlayers.map((player, index) => `
    <div class="name-row">
      <span class="name-index">${index + 1}</span>
      <div class="player-fields">
        <input name="player-${index}" value="${escapeHtml(player.name)}" maxlength="24" autocomplete="off" list="family-roster" aria-label="Namn på spelare ${index + 1}" required>
        <span class="setup-player-role">${index === 0 ? "Du" : "CPU"}</span>
      </div>
      <button class="remove-player" type="button" data-remove="${index}" aria-label="Ta bort spelare ${index + 1}" ${index === 0 || setupPlayers.length <= 2 ? "disabled" : ""}>×</button>
    </div>`).join("");
  elements.playerCount.textContent = `${setupPlayers.length} / 4`;
  elements.addPlayer.disabled = setupPlayers.length >= 4;
}

function actionButton(label, className, action, disabled = false) {
  const button = make("button", `button ${className}`, label);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", action);
  return button;
}

function humanIndex() {
  return state.players.findIndex((player) => player.type === "human");
}

function currentPlayer() {
  return Number.isInteger(state.actor) ? state.players[state.actor] : null;
}

function syncSelection() {
  const nextKey = `${state?.phase}-${state?.actor}-${state?.round}-${state?.trickNumber}`;
  if (selectionKey !== nextKey) {
    selected.clear();
    selectionKey = nextKey;
    message = "";
  }
}

function cardElement(card, { button = false, selected: isSelected = false, disabled = false } = {}) {
  const element = make(button ? "button" : "div", `playing-card ${["diamonds", "hearts"].includes(card.suit) ? "red" : ""}`);
  if (button) {
    element.type = "button";
    element.disabled = disabled;
    element.setAttribute("aria-pressed", String(isSelected));
  }
  if (isSelected) element.classList.add("selected");
  element.setAttribute("aria-label", cardLabel(card));
  const corner = make("span", "card-corner");
  corner.append(make("span", "", RANK_LABELS[card.rank] || String(card.rank)), make("span", "", SUIT_SYMBOLS[card.suit]));
  element.append(corner, make("span", "card-suit", SUIT_SYMBOLS[card.suit]));
  return element;
}

function faceDownElement() {
  const element = make("div", "face-down");
  element.setAttribute("aria-label", "Dolt kort");
  return element;
}

function renderScoreboard() {
  elements.scoreboard.replaceChildren();
  elements.scoreRibbon.replaceChildren();
  elements.scoreRibbon.className = `score-ribbon score-count-${state.players.length}`;
  state.players.forEach((player, index) => {
    const card = make("article", `player-card ${index === state.actor ? "current" : ""}`);
    card.append(make("span", "player-name", player.name), make("strong", "score", String(player.score)));
    const meta = make("div", "player-meta");
    meta.append(make("span", "badge", player.type === "human" ? "Du" : "CPU"));
    if (index === state.dealer) meta.append(make("span", "badge dealer", "Givare"));
    if (state.phase === "trick" && index === state.actor) meta.append(make("span", "badge", "På tur"));
    if (state.chicago?.declarer === index) {
      meta.append(make("span", "badge chicago", state.chicago.active ? "Chicago" : "Chicago misslyckad"));
    }
    if (player.tricks) meta.append(make("span", "badge", `${player.tricks} ${player.tricks === 1 ? "stick" : "stick"}`));
    card.append(meta);
    elements.scoreboard.append(card);

    const active = index === state.actor;
    const statuses = [
      index === state.dealer ? "givare" : "",
      active ? "på tur" : "",
      state.chicago?.declarer === index ? "Chicago" : "",
    ].filter(Boolean);
    const chip = make("div", `score-chip ${active ? "current" : ""}`);
    chip.setAttribute("role", "listitem");
    if (active) chip.setAttribute("aria-current", "true");
    chip.setAttribute("aria-label", `${player.name}, ${player.score} poäng${statuses.length ? `, ${statuses.join(", ")}` : ""}`);
    const name = make("span", "score-chip-name", player.name);
    name.title = player.name;
    chip.append(
      name,
      make("strong", "", String(player.score)),
      make("span", "score-chip-state", index === state.dealer ? "G" : ""),
    );
    elements.scoreRibbon.append(chip);
  });
  elements.mobileRoundLabel.textContent = `Omgång ${state.round}`;
  elements.scoreboardToggle.textContent = scoreDetailsOpen ? "Dölj" : "Detaljer";
  elements.scoreboardToggle.setAttribute("aria-expanded", String(scoreDetailsOpen));
  elements.scoreSection.classList.toggle("details-open", scoreDetailsOpen);
}

function renderOpponents() {
  elements.opponents.replaceChildren();
  const visible = !["final_trick", "round_summary", "game_over"].includes(state.phase);
  elements.opponents.hidden = !visible;
  if (!visible) return;
  state.players.forEach((player, index) => {
    if (player.type === "human") return;
    const panel = make("article", "opponent-hand");
    panel.append(make("strong", "", `${player.name} · ${player.hand.length} kort`));
    const backs = make("div", "card-backs");
    player.hand.forEach(() => backs.append(faceDownElement()));
    panel.append(backs);
    elements.opponents.append(panel);
  });
}

function renderPokerReveal() {
  const result = state.lastPokerResult;
  const visible = result && ["exchange_2", "exchange_3"].includes(state.phase);
  elements.revealPanel.hidden = !visible;
  if (!visible) return;
  elements.revealTitle.textContent = result.tied
    ? `${result.bestName} — lika utrop`
    : `${state.players[result.winners[0]].name} har bäst hand`;
  elements.revealedHands.replaceChildren();
  result.calls.forEach((call) => {
    const panel = make("article", "poker-call");
    panel.append(
      make("strong", "", state.players[call.playerIndex].name),
      make("span", "", `”${call.text}.”`),
    );
    elements.revealedHands.append(panel);
  });
}

function displayTrickPlays() {
  if (state.currentTrick.length) return state.currentTrick;
  return state.trickHistory.at(-1)?.plays || [];
}

function renderTrick() {
  const visible = ["trick", "final_trick"].includes(state.phase);
  elements.trickStage.hidden = !visible;
  if (!visible) return;
  elements.trickTitle.textContent = state.phase === "final_trick" ? "Sista sticket" :
    `Stick ${state.trickNumber} av 5`;
  const leader = state.currentTrick.length ? state.currentTrick[0].playerIndex :
    (state.trickHistory.at(-1)?.winner ?? state.actor);
  elements.leaderLabel.textContent = `${state.players[leader].name} spelar ut`;
  elements.trickCards.replaceChildren();
  displayTrickPlays().forEach((play) => {
    const panel = make("div", "trick-play");
    panel.append(play.faceUp ? cardElement(play.card) : faceDownElement());
    panel.append(make("span", "", state.players[play.playerIndex].name));
    elements.trickCards.append(panel);
  });
}

function humanCanInteract() {
  return currentPlayer()?.type === "human" && !cpuPaused && !["round_summary", "game_over"].includes(state.phase);
}

function renderHumanHand() {
  const index = humanIndex();
  const player = state.players[index];
  const interactive = humanCanInteract();
  const exchangePhase = state.phase.startsWith("exchange");
  const trickPhase = state.phase === "trick";
  const ledSuit = state.currentTrick[0]?.card.suit || null;
  const legal = trickPhase ? legalCardIndexes(player.hand, ledSuit) : [];
  elements.humanHand.replaceChildren();

  player.hand.forEach((card, cardIndex) => {
    const isLegal = !trickPhase || legal.includes(cardIndex);
    const button = cardElement(card, {
      button: true,
      selected: selected.has(cardIndex),
      disabled: !interactive || index !== state.actor || (!exchangePhase && !trickPhase) ||
        (exchangePhase && Boolean(state.openCardOffer)) || !isLegal,
    });
    if (!isLegal) {
      button.title = "Du måste följa färg.";
      button.classList.add("illegal");
    }
    button.addEventListener("click", () => {
      if (trickPhase) {
        selected.clear();
        selected.add(cardIndex);
      } else if (selected.has(cardIndex)) {
        selected.delete(cardIndex);
      } else {
        selected.add(cardIndex);
      }
      render();
    });
    elements.humanHand.append(button);
  });
  elements.selectionCount.textContent = exchangePhase && selected.size ? `${selected.size} behålls` : "";
  elements.handTitle.textContent = trickPhase ? "Välj ett kort att spela" :
    state.openCardOffer ? "Din hand utan ersättningskortet" :
    exchangePhase ? "Välj kort att behålla" : "Dina fem kort";
}

function renderAnnouncement() {
  const visible = !["round_summary", "game_over"].includes(state.phase);
  elements.announcement.hidden = !visible;
  if (!visible) return;
  let text = "";
  let chicago = false;
  const actor = currentPlayer();
  if (state.phase === "final_trick") {
    text = `${state.players[state.pendingFifthWinner].name} vann sista sticket. Granska korten och visa sedan resultatet.`;
  } else if (state.chicago?.active) {
    text = `${state.players[state.chicago.declarer].name} har anropat Chicago och måste ta alla fem stick.`;
    chicago = true;
  } else if (state.chicago?.failed) {
    text = `${state.players[state.chicago.stoppedBy].name} stoppade Chicago. Deklarantens poäng nollställdes.`;
  } else if (state.openCardOffer) {
    text = `${state.players[state.openCardOffer.playerIndex].name} väljer om ${cardLabel(state.openCardOffer.card)} ska behållas.`;
  } else if (state.lastOpenCard) {
    text = `${state.players[state.lastOpenCard.playerIndex].name} fick öppna kortet ${cardLabel(state.lastOpenCard.card)}.`;
  } else if (actor) {
    text = `${actor.name} är på tur i ${PHASE_LABELS[state.phase].toLowerCase()}.`;
  }
  elements.announcement.textContent = text;
  elements.announcement.classList.toggle("chicago", chicago);
}

function perform(action) {
  clearTimeout(cpuTimer);
  cpuTimer = null;
  const wasTrick = state?.phase === "trick";
  try {
    action();
    selected.clear();
    message = "";
    saveGame();
    render();
    if (wasTrick && ["trick", "final_trick"].includes(state.phase)) {
      requestAnimationFrame(() => elements.trickStage.scrollIntoView({ block: "nearest" }));
    }
    scheduleCpu();
  } catch (error) {
    message = error.message;
    render();
  }
}

function renderActions() {
  const panel = elements.actionPanel;
  panel.replaceChildren();
  if (["round_summary", "game_over"].includes(state.phase)) return;
  if (state.phase === "final_trick") {
    const confirmation = make("div", "final-trick-confirm");
    confirmation.append(
      make("h3", "", "Sista sticket är spelat"),
      make("p", "", "Korten ligger kvar på bordet tills du är redo att se poäng och händer."),
      actionButton("Visa resultat", "button-primary wide", () => perform(() => confirmFinalTrick(state))),
    );
    panel.append(confirmation);
    return;
  }
  const actor = currentPlayer();
  if (!actor || actor.type === "cpu") {
    panel.append(make("p", "action-copy", cpuPaused
      ? "CPU-spelet är pausat. Tryck Fortsätt CPU ovan för att gå vidare."
      : `${actor?.name || "CPU"} tänker…`));
    return;
  }

  if (state.phase === "low_redeal") {
    if (canLowRedeal(state)) {
      panel.append(make("p", "action-copy", "Alla dina kort är 9 eller lägre. Du får frivilligt byta hela handen en gång."));
      panel.append(
        actionButton("Byt alla fem", "button-primary", () => perform(() => decideLowRedeal(state, true))),
        actionButton("Behåll handen", "button-secondary", () => perform(() => decideLowRedeal(state, false))),
      );
    } else {
      panel.append(make("p", "action-copy", "Låg omgiv är inte tillgänglig eftersom minst ett kort är 10 eller högre."));
      panel.append(actionButton("Fortsätt", "button-primary wide", () => perform(() => decideLowRedeal(state, false))));
    }
  } else if (state.phase.startsWith("exchange")) {
    if (state.openCardOffer) {
      const offer = make("div", "open-card-choice");
      offer.append(make("p", "action-copy", "Ett öppet: behåll kortet, eller avstå och få nästa kort dolt."));
      const card = cardElement(state.openCardOffer.card);
      card.classList.add("offered-card");
      offer.append(card);
      panel.append(offer);
      panel.append(
        actionButton("Behåll öppna kortet", "button-primary", () => perform(() => decideOpenCard(state, true))),
        actionButton(
          "Ta nästa dolt",
          "button-secondary",
          () => perform(() => decideOpenCard(state, false)),
          state.deck.length < 1,
        ),
      );
      return;
    }
    const keepCount = selected.size;
    const exchangeCount = actor.hand.length - keepCount;
    const chicagoAvailable = state.phase === "exchange_1" && canDeclareChicago(state);
    panel.append(make("p", "action-copy",
      chicagoAvailable
        ? "Du har minst 15 poäng. Säg Chicago eller markera korten du vill behålla."
        : exchangeCount === 1
        ? "Ett öppet: du får välja det synliga kortet eller ta nästa dolt."
        : exchangeCount > 1 ? `${exchangeCount} ersättningskort delas dolt.` :
          "Alla kort är markerade och behålls. Kasserade kort återkommer inte."));
    if (chicagoAvailable) {
      panel.append(actionButton(
        "Chicago",
        "button-chicago wide",
        () => perform(() => decideChicago(state)),
      ));
    }
    panel.append(
      actionButton("Behåll alla", "button-secondary", () => perform(() => exchangeCards(state, []))),
      actionButton(
        exchangeCount === 5 ? "Byt alla kort" : `Behåll ${keepCount} · byt ${exchangeCount}`,
        "button-primary",
        () => perform(() => exchangeCards(state,
          actor.hand.map((_, index) => selected.has(index) ? -1 : index).filter((index) => index >= 0))),
        exchangeCount === 0 || exchangeCount > state.deck.length,
      ),
    );
  } else if (state.phase === "trick") {
    const chosen = [...selected][0];
    const ledSuit = state.currentTrick[0]?.card.suit;
    panel.append(make("p", "action-copy", ledSuit
      ? `Utspelsfärg: ${SUIT_SYMBOLS[ledSuit]}. Du måste följa färg om du kan.`
      : "Du spelar ut och får välja vilket kort som helst."));
    panel.append(actionButton(
      "Spela kort",
      "button-primary wide",
      () => perform(() => playCard(state, chosen)),
      chosen === undefined,
    ));
  }
}

function renderRoundSummary() {
  const visible = state.phase === "round_summary";
  elements.roundSummary.hidden = !visible;
  if (!visible) return;
  const summary = state.roundSummary;
  elements.summaryTitle.textContent = `${state.players[summary.fifthWinner].name} tog sista sticket`;
  elements.summaryHands.replaceChildren();
  summary.poker.calls.forEach((call) => {
    const description = summary.poker.descriptions?.find((item) =>
      item.playerIndex === call.playerIndex)?.text ||
      describePokerHand(summary.poker.evaluations[call.playerIndex]);
    const panel = make("article", "summary-hand");
    panel.append(
      make("strong", "", state.players[call.playerIndex].name),
      make("span", "", description),
    );
    const hand = make("div", "mini-hand");
    summary.hands[call.playerIndex].forEach((card) => hand.append(cardElement(card)));
    panel.append(hand);
    elements.summaryHands.append(panel);
  });

  if (elements.summaryTricks.dataset.round !== String(summary.round)) {
    elements.summaryTricks.open = !window.matchMedia("(max-width: 640px)").matches;
    elements.summaryTricks.dataset.round = String(summary.round);
  }
  elements.summaryTrickList.replaceChildren();
  summary.tricks.forEach((trick) => {
    const panel = make("article", "summary-trick");
    const heading = make("div", "summary-trick-heading");
    heading.append(
      make("strong", "", `Stick ${trick.number}`),
      make("span", "", `${state.players[trick.winner].name} vann`),
    );
    const plays = make("div", "summary-trick-plays");
    trick.plays.forEach((play) => {
      const item = make("div", "summary-trick-play");
      item.append(
        cardElement(play.card),
        make("span", "", `${state.players[play.playerIndex].name}${play.faceUp ? "" : " · sakade"}`),
      );
      plays.append(item);
    });
    panel.append(heading, plays);
    elements.summaryTrickList.append(panel);
  });
}

function renderWinner() {
  const visible = state.phase === "game_over";
  elements.winnerCard.hidden = !visible;
  if (!visible) return;
  const winner = state.players[state.winner];
  const reason = state.winReason === "chicago" ? "vann med Chicago" :
    state.winReason === "royal" ? "vann med royal flush" : "nådde 52 och tog sista sticket";
  elements.winnerCard.replaceChildren(
    make("span", "trophy", "♠"),
    make("h3", "", `${winner.name} vinner!`),
    make("p", "", `${winner.name} ${reason}.`),
  );
}

function renderLog() {
  elements.eventLog.replaceChildren();
  state.events.slice(0, 18).forEach((event) => {
    elements.eventLog.append(make("li", event.type, event.message));
  });
}

function render() {
  const hasGame = Boolean(state);
  elements.setupView.hidden = hasGame;
  elements.gameView.hidden = !hasGame;
  elements.restartGame.hidden = !hasGame;
  if (!state) {
    renderSetup();
    return;
  }
  syncSelection();
  elements.phaseLabel.textContent = PHASE_LABELS[state.phase];
  elements.roundLabel.textContent = `Omgång ${state.round}`;
  elements.deckCount.textContent = String(state.deck.length);
  elements.deckCount.parentElement.hidden = ["final_trick", "round_summary", "game_over"].includes(state.phase);
  const actor = currentPlayer();
  elements.turnEyebrow.textContent = actor ? "På tur" : "Status";
  elements.turnTitle.textContent = actor?.name || PHASE_LABELS[state.phase];
  elements.message.textContent = message;
  elements.cpuPause.textContent = cpuPaused ? "Fortsätt CPU" : "Pausa CPU";
  renderScoreboard();
  renderOpponents();
  renderAnnouncement();
  renderPokerReveal();
  renderTrick();
  renderHumanHand();
  elements.humanHand.closest(".hand-area").hidden = ["final_trick", "round_summary", "game_over"].includes(state.phase);
  renderActions();
  renderRoundSummary();
  renderWinner();
  renderLog();
}

function cpuAction() {
  if (!state || cpuPaused || currentPlayer()?.type !== "cpu") return;
  const player = currentPlayer();
  if (state.phase === "low_redeal") {
    decideLowRedeal(state, canLowRedeal(state) && cpuAcceptLowRedeal(player.hand));
  } else if (state.phase.startsWith("exchange")) {
    if (state.openCardOffer) {
      decideOpenCard(state, true);
    } else if (state.phase === "exchange_1" && canDeclareChicago(state) && cpuDeclareChicago(player)) {
      decideChicago(state);
    } else {
      const exchangeNumber = Number(state.phase.at(-1));
      exchangeCards(state, cpuExchangeIndexes(player.hand, exchangeNumber, state.deck.length));
    }
  } else if (state.phase === "trick") {
    playCard(state, cpuChooseCard({
      hand: player.hand,
      currentTrick: state.currentTrick,
      trickNumber: state.trickNumber,
      chicago: state.chicago,
      playerIndex: state.actor,
    }));
  }
  saveGame();
  render();
  scheduleCpu();
}

function scheduleCpu() {
  clearTimeout(cpuTimer);
  cpuTimer = null;
  if (!state || cpuPaused || currentPlayer()?.type !== "cpu") return;
  cpuTimer = setTimeout(cpuAction, SPEEDS[elements.cpuSpeed.value] ?? SPEEDS.normal);
}

elements.setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  rememberLineup();
  state = createGame(setupPlayers);
  saveGame();
  render();
  scheduleCpu();
});

elements.addPlayer.addEventListener("click", () => {
  rememberLineup();
  if (setupPlayers.length < 4) setupPlayers.push(nextRosterPlayer(setupPlayers));
  rememberLineup(setupPlayers);
  renderSetup();
  elements.nameList.querySelector("input:last-of-type")?.focus();
});
elements.nameList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button || setupPlayers.length <= 2 || Number(button.dataset.remove) === 0) return;
  rememberLineup();
  setupPlayers.splice(Number(button.dataset.remove), 1);
  rememberLineup(setupPlayers);
  renderSetup();
});
elements.nameList.addEventListener("change", () => rememberLineup());

elements.nextRound.addEventListener("click", () => perform(() => nextRound(state)));
elements.scoreboardToggle.addEventListener("click", () => {
  scoreDetailsOpen = !scoreDetailsOpen;
  renderScoreboard();
});
elements.cpuSpeed.value = localStorage.getItem(SPEED_KEY) || "normal";
elements.cpuSpeed.addEventListener("change", () => {
  localStorage.setItem(SPEED_KEY, elements.cpuSpeed.value);
  scheduleCpu();
});
elements.cpuPause.addEventListener("click", () => {
  cpuPaused = !cpuPaused;
  render();
  scheduleCpu();
});
elements.restartGame.addEventListener("click", () => {
  if (!state || !confirm("Starta om hela partiet med samma spelare och noll poäng?")) return;
  state = restartGame(state);
  saveGame();
  render();
  scheduleCpu();
});
elements.newGame.addEventListener("click", () => {
  if (state && !confirm("Avsluta det sparade partiet och skapa ett nytt?")) return;
  clearTimeout(cpuTimer);
  state = null;
  selected.clear();
  scoreDetailsOpen = false;
  setupPlayers = restoreLineup(localStorage.getItem(LINEUP_KEY));
  localStorage.removeItem(SAVE_KEY);
  LEGACY_SAVE_KEYS.forEach((key) => localStorage.removeItem(key));
  render();
});

render();
scheduleCpu();
