import test from "node:test";
import assert from "node:assert/strict";
import {
  formatNumber,
  t,
  translateEvent,
  translateRuntimeText,
  translateScoreLabel,
} from "../i18n.js";

test("static Swedish translations and variables are resolved", () => {
  assert.equal(t("sv", "newGame"), "Nytt spel");
  assert.match(t("sv", "setup.title"), /setup-title-copy\">Först till/);
  assert.match(t("sv", "setup.title"), /setup-title-score\">10 000/);
  assert.equal(t("sv", "offer.title", { score: "1 500", dice: 3 }), "1 500 poäng, 3 tärningar");
  assert.equal(t("en", "winner.title", { player: "Ada" }), "Ada wins!");
  assert.equal(t("en", "probability.die"), "with 1 die");
  assert.equal(t("sv", "probability.dice", { dice: 3 }), "med 3 tärningar");
  assert.equal(t("en", "player.human"), "Human");
  assert.equal(t("sv", "player.human"), "Människa");
  assert.equal(t("sv", "scoreboard.details"), "Detaljer");
  assert.match(t("sv", "setup.rosterHint"), /sparas på den här enheten/);
  assert.equal(t("sv", "cpu.status.playing", { player: "Bo" }), "Bo spelar sin CPU-tur");
  assert.equal(t("sv", "offer.kicker"), "Vill du ta chansen?");
  assert.equal(t("sv", "winner.detailsOne", { score: "1 000" }), "1 000 poäng · 1 omgång");
  assert.equal(t("sv", "winner.details", { score: "13 100", turns: 13 }), "13 100 poäng · 13 omgångar");
  assert.match(t("sv", "rules.turn"), /<strong>Din tur:<\/strong>/);
  assert.match(t("sv", "rules.passed"), /<strong>Ärvda tärningar:<\/strong>/);
  assert.match(t("en", "rules.passed"), /when that bank completes their break-in/);
  assert.match(t("sv", "rules.passed"), /även om det sker genom den aktuella omgången/);
});

test("score formatting follows the selected locale", () => {
  assert.equal(formatNumber("en", 10000), "10,000");
  assert.match(formatNumber("sv", 10000), /^10\s000$/);
});

test("scoring feedback is translated without changing values", () => {
  assert.equal(translateScoreLabel("sv", "Straight"), "Stege");
  assert.equal(translateScoreLabel("sv", "Three pairs"), "Tre par");
  assert.equal(translateScoreLabel("sv", "3 × 2 + 1 single 1"), "3 × 2 + 1 × 1 (enskilda)");
  assert.equal(translateScoreLabel("en", "Two triples"), "Two triples");
});

test("structured and legacy events render in Swedish", () => {
  const structured = {
    type: "bank",
    message: "Ada banked 1500 points (2500 total) with 3 dice left.",
    data: { player: "Ada", points: 1500, total: 2500, diceRemaining: 3 },
  };
  assert.match(translateEvent("sv", structured), /^Ada stannade på 1\s500 poäng \(2\s500 totalt\) med 3 tärningar kvar\.$/);
  assert.equal(translateEvent("en", structured), structured.message);

  const legacy = { type: "roll", message: "Bo rolled 1 · 5 · 2." };
  assert.equal(translateEvent("sv", legacy), "Bo slog 1 · 5 · 2.");
});

test("runtime rule messages are localized", () => {
  assert.equal(translateRuntimeText("sv", "Roll first."), "Slå först.");
  assert.match(
    translateRuntimeText("sv", "You need 1000 points in one turn to break in (850 more needed)."),
    /^Du behöver 1 000 poäng.*\(850 poäng till behövs\)\.$/,
  );
});
