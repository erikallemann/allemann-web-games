import { GameEngine, STORAGE_KEY } from "./game.js?v=20260815-1";
import { strategyForPlayer } from "./cpu.js?v=20260815-1";
import { farkleProbability, specialCombination } from "./scoring.js?v=20260815-1";
import {
  FAMILY_ROSTER,
  LINEUP_KEY,
  nextRosterPlayer,
  normalizeLineup,
  restoreLineup,
} from "./setup.js?v=20260815-1";
import {
  LANGUAGE_KEY,
  SUPPORTED_LANGUAGES,
  formatNumber,
  t,
  translateEvent,
  translateRuntimeText,
  translateScoreLabel,
} from "./i18n.js?v=20260815-1";

const DICE_GLYPHS = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const PROBABILITY_KEY = "ten-thousand-show-probability";
const CPU_SPEED_KEY = "ten-thousand-cpu-speed";
const CPU_DELAYS = Object.freeze({ normal: 650, fast: 220, instant: 60 });
const $ = (selector) => document.querySelector(selector);
const RELEASE_VERSION = new URL(import.meta.url).searchParams.get("v") || "dev";
$("#release-version").textContent = `v${RELEASE_VERSION}`;
let language = SUPPORTED_LANGUAGES.includes(localStorage.getItem(LANGUAGE_KEY))
  ? localStorage.getItem(LANGUAGE_KEY)
  : "en";
let engine = null;
let setupPlayers = restoreLineup(localStorage.getItem(LINEUP_KEY), defaultPlayerName);
let rolling = false;
let messageTimer = null;
let showProbability = localStorage.getItem(PROBABILITY_KEY) === "true";
let cpuPaused = false;
let cpuTimer = null;
let scoreDetailsOpen = false;
let cpuSpeed = Object.hasOwn(CPU_DELAYS, localStorage.getItem(CPU_SPEED_KEY))
  ? localStorage.getItem(CPU_SPEED_KEY)
  : "normal";

function formatScore(score) {
  return formatNumber(language, score);
}

function formatProbability(value) {
  return new Intl.NumberFormat(language === "sv" ? "sv-SE" : "en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function tr(key, variables = {}) {
  return t(language, key, variables);
}

function defaultPlayerName(index) {
  return t(language, "player.default", { number: index + 1 });
}

function captureSetupPlayers() {
  return [...$("#name-list").querySelectorAll(".name-row")].map((row) => ({
    name: row.querySelector("input").value,
    type: row.querySelector("[data-player-type]").value === "cpu" ? "cpu" : "human",
  }));
}

function rememberLineup(entries = captureSetupPlayers()) {
  setupPlayers = normalizeLineup(entries, defaultPlayerName);
  localStorage.setItem(LINEUP_KEY, JSON.stringify(setupPlayers));
  return setupPlayers;
}

function isCpuTurn() {
  return Boolean(engine && engine.state.phase !== "game-over" && engine.player?.type === "cpu");
}

function applyStaticTranslations() {
  document.documentElement.lang = language;
  document.title = tr("meta.title");
  $("meta[name='description']").content = tr("meta.description");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = tr(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((node) => {
    node.innerHTML = tr(node.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((node) => {
    node.setAttribute("aria-label", tr(node.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((node) => {
    node.title = tr(node.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-score]").forEach((node) => {
    node.textContent = formatScore(Number(node.dataset.score));
  });
  $("#language-toggle").textContent = language === "en" ? "SV" : "EN";
  $("#language-toggle").setAttribute("aria-label", tr("language.switch"));
}

function save() {
  if (engine) localStorage.setItem(STORAGE_KEY, engine.serialize());
  else localStorage.removeItem(STORAGE_KEY);
}

function showMessage(text, kind = "error") {
  const node = $("#message");
  node.textContent = translateRuntimeText(language, text);
  node.className = `message ${kind}`;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { node.textContent = ""; }, 4500);
}

function perform(action, successMessage = "") {
  try {
    const result = action();
    save();
    renderGame();
    if (successMessage) showMessage(successMessage, "success");
    return result;
  } catch (error) {
    showMessage(error.message);
    return null;
  }
}

function renderSetup() {
  clearTimeout(cpuTimer);
  cpuTimer = null;
  $("#setup-view").hidden = false;
  $("#game-view").hidden = true;
  $("#new-game").hidden = !engine;
  $("#family-roster").innerHTML = FAMILY_ROSTER.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
  const list = $("#name-list");
  list.innerHTML = setupPlayers.map((setupPlayer, index) => `
    <div class="name-row">
      <span class="name-index">${index + 1}</span>
      <div class="player-fields">
        <input name="player-${index}" value="${escapeHtml(setupPlayer.name)}" maxlength="24" autocomplete="off" list="family-roster" aria-label="${escapeHtml(tr("player.nameLabel", { number: index + 1 }))}">
        <select class="player-type-select" data-player-type="${index}" aria-label="${escapeHtml(tr("player.typeLabel", { number: index + 1 }))}">
          <option value="human" ${setupPlayer.type === "human" ? "selected" : ""}>${tr("player.human")}</option>
          <option value="cpu" ${setupPlayer.type === "cpu" ? "selected" : ""}>${tr("player.cpu")}</option>
        </select>
      </div>
      <button class="remove-player" type="button" data-remove="${index}" aria-label="${escapeHtml(tr("player.removeLabel", { number: index + 1 }))}" ${setupPlayers.length <= 2 ? "disabled" : ""}>×</button>
    </div>`).join("");
  $("#player-count").textContent = `${setupPlayers.length} / 6`;
  $("#add-player").disabled = setupPlayers.length >= 6;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[char]);
}

function renderCpuToolbar() {
  const toolbar = $("#cpu-toolbar");
  const hasCpu = engine.state.players.some((player) => player.type === "cpu");
  toolbar.hidden = !hasCpu;
  if (!hasCpu) return;

  $("#cpu-speed").value = cpuSpeed;
  const pauseButton = $("#cpu-pause");
  pauseButton.textContent = cpuPaused ? tr("cpu.resume") : tr("cpu.pause");
  pauseButton.setAttribute("aria-pressed", String(cpuPaused));
  pauseButton.disabled = engine.state.phase === "game-over";

  const status = $("#cpu-status");
  if (engine.state.phase === "game-over") {
    status.textContent = tr("cpu.status.complete");
  } else if (cpuPaused) {
    status.textContent = tr("cpu.status.paused");
  } else if (isCpuTurn()) {
    status.textContent = tr("cpu.status.playing", { player: engine.player.name });
  } else {
    status.textContent = tr("cpu.status.waiting", { player: engine.player.name });
  }
}

function roundText(state) {
  if (state.finalRound?.mode === "tiebreak") return tr("round.tie");
  if (state.finalRound) return tr("round.final");
  return tr("round.normal", { number: Math.min(...state.players.map((item) => item.turns)) + 1 });
}

function renderScoreboard(state) {
  const isActive = (index) => index === state.currentPlayer && state.phase !== "game-over";
  const cards = state.players.map((item, index) => `
    <article class="player-card ${isActive(index) ? "current" : ""}" ${isActive(index) ? 'aria-current="true"' : ""}>
      <span class="player-name">${escapeHtml(item.name)}</span>
      <strong class="score">${formatScore(item.score)}</strong>
      <span class="player-meta">
        <span class="break-badge ${item.brokenIn ? "in" : ""}">${item.brokenIn ? tr("status.in") : tr("status.needs")}</span>
        ${item.type === "cpu" ? `<span class="cpu-badge">${tr("player.cpu")}</span>` : ""}
      </span>
    </article>`).join("");
  $("#scoreboard").innerHTML = cards;

  const ribbon = $("#score-ribbon");
  ribbon.className = `score-ribbon score-count-${state.players.length}`;
  ribbon.innerHTML = state.players.map((item, index) => {
    const status = item.brokenIn ? tr("status.in") : tr("status.needs");
    const type = item.type === "cpu" ? `, ${tr("player.cpu")}` : "";
    return `<div class="score-chip ${isActive(index) ? "current" : ""} ${item.brokenIn ? "in" : "needs"}" role="listitem" ${isActive(index) ? 'aria-current="true"' : ""} aria-label="${escapeHtml(`${item.name}, ${formatScore(item.score)}, ${status}${type}`)}">
      <span class="score-chip-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
      <strong>${formatScore(item.score)}</strong>
      <span class="score-chip-state" aria-hidden="true">${item.brokenIn ? "✓" : "○"}</span>
    </div>`;
  }).join("");

  const currentRound = roundText(state);
  $("#round-label").textContent = currentRound;
  $("#mobile-round-label").textContent = currentRound;
  const toggle = $("#scoreboard-toggle");
  toggle.setAttribute("aria-expanded", String(scoreDetailsOpen));
  toggle.textContent = tr(scoreDetailsOpen ? "scoreboard.close" : "scoreboard.details");
  $("#score-section").classList.toggle("details-open", scoreDetailsOpen);
}

function renderGame() {
  if (!engine) return renderSetup();
  const state = engine.state;
  const player = engine.player;
  const turn = state.turn;
  $("#setup-view").hidden = true;
  $("#game-view").hidden = false;
  $("#new-game").hidden = false;
  renderCpuToolbar();
  renderScoreboard(state);

  const finalBanner = $("#final-banner");
  if (state.finalRound?.mode === "final") {
    const trigger = state.players.find((item) => item.id === state.finalRound.triggerPlayerId);
    finalBanner.hidden = false;
    finalBanner.textContent = tr("final.banner", { player: trigger.name });
  } else if (state.finalRound?.mode === "tiebreak") {
    finalBanner.hidden = false;
    finalBanner.textContent = tr("tie.banner");
  } else {
    finalBanner.hidden = true;
  }
  $("#turn-title").textContent = player.name;
  $("#turn-eyebrow").textContent = turn?.inherited
    ? tr("inheritedTurn")
    : player.type === "cpu"
      ? tr("cpu.player")
      : tr("currentPlayer");
  $("#turn-card").classList.toggle("cpu-active", isCpuTurn());
  $("#turn-score").textContent = formatScore(state.phase === "farkled" ? 0 : (turn?.points ?? state.offer?.score ?? 0));
  $("#dice-remaining").textContent = turn?.diceRemaining ?? state.offer?.diceRemaining ?? "—";
  $("#player-total").textContent = formatScore(player.score);
  $("#break-in-status").textContent = player.brokenIn ? tr("status.in") : tr("status.needs");

  const offerMode = state.phase === "offer";
  $("#offer-card").hidden = !offerMode;
  $("#play-area").hidden = offerMode || state.phase === "game-over";
  if (offerMode) {
    $("#offer-title").textContent = tr(state.offer.diceRemaining === 1 ? "offer.titleOne" : "offer.title", {
      score: formatScore(state.offer.score),
      dice: state.offer.diceRemaining,
    });
    $("#offer-copy").textContent = tr("offer.copy", { player: state.offer.fromPlayer });
  }
  $("#inherit-button").disabled = isCpuTurn();
  $("#fresh-button").disabled = isCpuTurn();

  const winner = state.players.find((item) => item.id === state.winnerId);
  $("#winner-card").hidden = !winner;
  if (winner) {
    const detailsKey = winner.turns === 1 ? "winner.detailsOne" : "winner.details";
    $("#winner-card").innerHTML = `<span class="trophy" aria-hidden="true">🏆</span><p>${tr("winner.over")}</p><h3>${escapeHtml(tr("winner.title", { player: winner.name }))}</h3><p>${tr(detailsKey, { score: formatScore(winner.score), turns: winner.turns })}</p>`;
  }

  if (turn && state.phase !== "game-over") renderDice();
  renderLog();
  scheduleCpuTurn();
}

function renderDice() {
  const state = engine.state;
  const turn = state.turn;
  const cpuTurn = isCpuTurn();
  const stage = $("#dice-stage");
  const held = turn.heldDice.map((value, index) => `
    <button class="die held" type="button" disabled aria-label="${escapeHtml(tr("die.scoredLabel", { number: index + 1, value }))}">${DICE_GLYPHS[value]}<span class="die-label">${tr("dice.scored")}</span></button>`);
  let active;
  if (state.phase === "rolled" || state.phase === "farkled") {
    const farkled = state.phase === "farkled";
    active = turn.roll.map((value, index) => {
      const selected = turn.selected.includes(index);
      const stateClass = farkled ? "farkled" : (selected ? "selected" : "available");
      const stateLabel = farkled ? tr("dice.farkle") : (selected ? tr("dice.selected") : tr("dice.available"));
      return `<button class="die ${stateClass} ${rolling ? "rolling" : ""}" type="button" ${farkled ? "disabled" : `data-die="${index}" aria-pressed="${selected}"`} aria-label="${escapeHtml(tr("die.label", { number: index + 1, value, state: stateLabel.toLowerCase() }))}">${DICE_GLYPHS[value]}<span class="die-label">${stateLabel}</span></button>`;
    });
  } else {
    active = Array.from({ length: turn.diceRemaining }, (_, index) => `
      <button class="die reroll ${rolling ? "rolling" : ""}" type="button" disabled aria-label="${escapeHtml(tr("die.rerollLabel", { number: index + 1 }))}">↻<span class="die-label">${tr("dice.reroll")}</span></button>`);
  }
  stage.innerHTML = [...held, ...active].join("");

  const probabilityToggle = $("#probability-toggle");
  const probabilityResult = $("#probability-result");
  probabilityToggle.checked = showProbability;
  probabilityResult.hidden = !showProbability || state.phase !== "await-roll";
  if (!probabilityResult.hidden) {
    $("#probability-value").textContent = formatProbability(farkleProbability(turn.diceRemaining));
    $("#probability-dice").textContent = tr(turn.diceRemaining === 1 ? "probability.die" : "probability.dice", {
      dice: turn.diceRemaining,
    });
  }

  const result = engine.selectionResult();
  const feedback = $("#selection-feedback");
  if (state.phase === "farkled") {
    feedback.className = "selection-feedback farkle-feedback";
    feedback.innerHTML = `<strong>${tr("feedback.farkle")}</strong><span>${turn.farkleLost ? tr("feedback.lost", { score: formatScore(turn.farkleLost) }) : tr("feedback.noPoints")} ${tr("feedback.review")}</span>`;
  } else if (state.phase === "rolled" && turn.selected.length) {
    feedback.className = `selection-feedback ${result.valid ? "valid" : ""}`;
    feedback.innerHTML = result.valid
      ? `<strong>+${formatScore(result.score)} ${tr("feedback.points")}</strong><span>${escapeHtml(translateScoreLabel(language, result.label))}</span>`
      : `<strong>${tr("feedback.notScore")}</strong><span>${escapeHtml(translateScoreLabel(language, result.label))}</span>`;
  } else if (state.phase === "rolled") {
    feedback.className = "selection-feedback";
    feedback.innerHTML = cpuTurn
      ? `<strong>${tr("cpu.thinking")}</strong><span>${tr("cpu.choosingDice")}</span>`
      : `<strong>${tr("feedback.choose")}</strong><span>${tr("feedback.chooseHelp")}</span>`;
  } else if (turn.hotDice) {
    feedback.className = "selection-feedback hot-feedback";
    feedback.innerHTML = `<strong>${tr("feedback.hotDice")}</strong><span>${tr("feedback.hotDiceHelp", { score: formatScore(turn.points) })}</span>`;
  } else if (turn.canBank) {
    feedback.className = "selection-feedback valid";
    feedback.innerHTML = `<strong>${tr("feedback.added", { score: formatScore(turn.lastActionPoints) })}</strong><span>${tr(turn.diceRemaining === 1 ? "feedback.bankOrRollOne" : "feedback.bankOrRoll", { score: formatScore(turn.points), dice: turn.diceRemaining })}</span>`;
  } else {
    feedback.className = "selection-feedback";
    feedback.innerHTML = `<strong>${tr("feedback.ready")}</strong><span>${turn.inherited ? tr("feedback.mustAdd") : tr(turn.diceRemaining === 1 ? "feedback.rollOne" : "feedback.roll", { dice: turn.diceRemaining })}</span>`;
  }

  const special = state.phase === "rolled" && turn.roll.length === 6 ? specialCombination(turn.roll) : null;
  const specialButton = $("#special-button");
  specialButton.hidden = !special;
  if (special) specialButton.textContent = tr("special.select", {
    label: translateScoreLabel(language, special.label),
    score: formatScore(special.score),
  });
  specialButton.disabled = cpuTurn;

  $("#roll-button").hidden = state.phase !== "await-roll";
  $("#confirm-button").hidden = state.phase !== "rolled";
  $("#undo-button").hidden = state.phase !== "rolled";
  $("#bank-button").hidden = state.phase !== "await-roll";
  $("#next-player-button").hidden = state.phase !== "farkled";
  $("#roll-button").disabled = rolling || cpuTurn;
  $("#confirm-button").disabled = rolling || cpuTurn || !result.valid;
  $("#undo-button").disabled = rolling || cpuTurn || turn.selected.length === 0;
  $("#bank-button").disabled = rolling || cpuTurn || !turn.canBank;
  $("#next-player-button").disabled = cpuTurn;
}

function renderLog() {
  $("#event-log").innerHTML = engine.state.events.slice(0, 9).map((event) => `
    <li class="${event.type}">${escapeHtml(translateEvent(language, event))}<time datetime="${new Date(event.at).toISOString()}">${new Date(event.at).toLocaleTimeString(language === "sv" ? "sv-SE" : "en-US", { hour: "2-digit", minute: "2-digit" })}</time></li>`).join("");
}

function scheduleCpuTurn() {
  clearTimeout(cpuTimer);
  cpuTimer = null;
  if (!isCpuTurn() || cpuPaused || rolling) return;
  cpuTimer = setTimeout(runCpuStep, CPU_DELAYS[cpuSpeed]);
}

function runCpuStep() {
  cpuTimer = null;
  if (!isCpuTurn() || cpuPaused || rolling) return;

  try {
    const state = engine.state;
    const player = engine.player;
    const strategy = strategyForPlayer(player);

    if (state.phase === "offer") {
      const decision = strategy.chooseContinuation({ state, player, offer: state.offer });
      perform(() => decision === "inherit" ? engine.inheritOffer() : engine.startFresh());
      return;
    }

    if (state.phase === "await-roll") {
      const decision = strategy.chooseAction({ state, player, turn: state.turn });
      if (decision === "bank") perform(() => engine.bank());
      else rollDice();
      return;
    }

    if (state.phase === "rolled") {
      if (state.turn.selected.length) {
        perform(() => engine.confirmSelection());
      } else {
        state.turn.selected = strategy.chooseSelection({ state, player, turn: state.turn, roll: state.turn.roll });
        save();
        renderGame();
      }
      return;
    }

    if (state.phase === "farkled") perform(() => engine.advanceAfterFarkle());
  } catch (error) {
    cpuPaused = true;
    showMessage(error.message);
    renderGame();
  }
}

function rollDice() {
  if (!engine || engine.state.phase !== "await-roll" || rolling) return;
  const animationDelay = isCpuTurn()
    ? { normal: 320, fast: 150, instant: 50 }[cpuSpeed]
    : 320;
  rolling = true;
  const result = perform(() => engine.roll());
  if (!result) { rolling = false; return; }
  renderGame();
  setTimeout(() => {
    rolling = false;
    renderGame();
    if (result.farkle) showMessage(tr("message.farkle", {
      dice: result.dice.join(" · "),
      result: result.lost ? tr("feedback.lost", { score: formatScore(result.lost) }) : tr("message.turnOver"),
    }));
  }, animationDelay);
}

function confirmReset() {
  if (!engine || window.confirm(tr("reset.confirm"))) {
    engine = null;
    cpuPaused = false;
    scoreDetailsOpen = false;
    setupPlayers = restoreLineup(localStorage.getItem(LINEUP_KEY), defaultPlayerName);
    save();
    renderSetup();
  }
}

$("#setup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  rememberLineup();
  cpuPaused = false;
  engine = GameEngine.create(setupPlayers);
  save();
  renderGame();
});

$("#add-player").addEventListener("click", () => {
  rememberLineup();
  if (setupPlayers.length < 6) setupPlayers.push(nextRosterPlayer(setupPlayers));
  rememberLineup(setupPlayers);
  renderSetup();
  $("#name-list input:last-of-type")?.focus();
});

$("#name-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button || setupPlayers.length <= 2) return;
  rememberLineup();
  setupPlayers.splice(Number(button.dataset.remove), 1);
  rememberLineup(setupPlayers);
  renderSetup();
});

$("#name-list").addEventListener("change", () => rememberLineup());

$("#dice-stage").addEventListener("click", (event) => {
  const die = event.target.closest("[data-die]");
  if (!die || rolling || isCpuTurn()) return;
  const response = engine.toggleDie(Number(die.dataset.die));
  if (!response.changed) showMessage(response.reason);
  save();
  renderGame();
});

$("#roll-button").addEventListener("click", rollDice);
$("#confirm-button").addEventListener("click", () => perform(() => engine.confirmSelection()));
$("#undo-button").addEventListener("click", () => perform(() => engine.clearSelection(), tr("message.selectionCleared")));
$("#bank-button").addEventListener("click", () => perform(() => engine.bank()));
$("#next-player-button").addEventListener("click", () => perform(() => engine.advanceAfterFarkle()));
$("#special-button").addEventListener("click", () => perform(() => engine.selectSpecial()));
$("#inherit-button").addEventListener("click", () => perform(() => engine.inheritOffer()));
$("#fresh-button").addEventListener("click", () => perform(() => engine.startFresh()));
$("#new-game").addEventListener("click", confirmReset);
$("#scoreboard-toggle").addEventListener("click", () => {
  scoreDetailsOpen = !scoreDetailsOpen;
  renderScoreboard(engine.state);
});
$("#cpu-pause").addEventListener("click", () => {
  cpuPaused = !cpuPaused;
  renderGame();
});
$("#cpu-speed").addEventListener("change", (event) => {
  cpuSpeed = Object.hasOwn(CPU_DELAYS, event.currentTarget.value) ? event.currentTarget.value : "normal";
  localStorage.setItem(CPU_SPEED_KEY, cpuSpeed);
  renderGame();
});
$("#probability-toggle").addEventListener("change", (event) => {
  showProbability = event.currentTarget.checked;
  localStorage.setItem(PROBABILITY_KEY, String(showProbability));
  renderGame();
});
$("#language-toggle").addEventListener("click", () => {
  const previousLanguage = language;
  if (!engine) {
    setupPlayers = captureSetupPlayers().map((setupPlayer, index) => {
      const previousDefault = t(previousLanguage, "player.default", { number: index + 1 });
      return {
        name: setupPlayer.name === previousDefault
          ? t(previousLanguage === "en" ? "sv" : "en", "player.default", { number: index + 1 })
          : setupPlayer.name,
        type: setupPlayer.type,
      };
    });
  }
  language = language === "en" ? "sv" : "en";
  localStorage.setItem(LANGUAGE_KEY, language);
  if (!engine) rememberLineup(setupPlayers);
  applyStaticTranslations();
  if (engine) renderGame(); else renderSetup();
});

document.addEventListener("keydown", (event) => {
  if (!engine || rolling || isCpuTurn() || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
  if (event.key.toLowerCase() === "r") rollDice();
  if (event.key.toLowerCase() === "b") perform(() => engine.bank());
  if (event.key.toLowerCase() === "n" && engine.state.phase === "farkled") perform(() => engine.advanceAfterFarkle());
  if (event.key === "Enter" && engine.state.phase === "rolled") perform(() => engine.confirmSelection());
  if (event.key === "Enter" && engine.state.phase === "farkled") perform(() => engine.advanceAfterFarkle());
  if (event.key === "Escape") perform(() => engine.clearSelection(), tr("message.selectionCleared"));
  if (/^[1-6]$/.test(event.key) && engine.state.phase === "rolled") {
    const response = engine.toggleDie(Number(event.key) - 1);
    if (!response.changed) showMessage(response.reason);
    save(); renderGame();
  }
});

try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    engine = GameEngine.restore(saved, { fallbackPlayerName: defaultPlayerName });
    const migrated = engine.serialize();
    if (migrated !== saved) localStorage.setItem(STORAGE_KEY, migrated);
    if (!localStorage.getItem(LINEUP_KEY)) {
      rememberLineup(engine.state.players.map(({ name, type }) => ({ name, type })));
    }
  }
} catch (error) {
  console.warn("Could not restore saved game", error);
  localStorage.removeItem(STORAGE_KEY);
}

applyStaticTranslations();
if (engine) renderGame(); else renderSetup();
