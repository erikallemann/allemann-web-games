export const LANGUAGE_KEY = "ten-thousand-language";
export const SUPPORTED_LANGUAGES = ["en", "sv"];

const translations = {
  en: {
    "meta.title": "10000 — Dice Game",
    "meta.description": "A local multiplayer browser version of the dice game 10000.",
    "brand.home": "10000 game home",
    "brand.tagline": "push your luck",
    "save.text": "Saved locally",
    "save.title": "Games are saved in this browser",
    "language.switch": "Byt till svenska",
    "newGame": "New game",
    "cpu.controls": "CPU controls",
    "cpu.speed": "Speed",
    "cpu.speed.normal": "Normal",
    "cpu.speed.fast": "Fast",
    "cpu.speed.instant": "Very fast",
    "cpu.pause": "Pause CPU",
    "cpu.resume": "Resume CPU",
    "cpu.status.complete": "CPU play complete",
    "cpu.status.paused": "CPU play is paused",
    "cpu.status.playing": "{player} is taking a CPU turn",
    "cpu.status.waiting": "Waiting for {player}",
    "cpu.player": "CPU player",
    "cpu.thinking": "CPU is thinking",
    "cpu.choosingDice": "Choosing which scoring dice to keep.",
    "setup.title": "<span class=\"setup-title-copy\">Race to</span><span class=\"setup-title-score\">10,000</span>",
    "setup.copy": "Keep scoring dice, roll what remains, and bank before you farkle. Add 2–6 players to begin.",
    "players": "Players",
    "setup.who": "Who’s playing?",
    "setup.add": "Add player",
    "setup.start": "Start game",
    "scoreboard": "Scoreboard",
    "scoreboard.title": "First to 10,000",
    "currentPlayer": "Current player",
    "inheritedTurn": "Inherited turn",
    "turnScore": "Turn score",
    "offer.kicker": "Continuation offered",
    "offer.take": "Take the risk",
    "offer.fresh": "Start fresh",
    "turn.details": "Current turn details",
    "dice.remaining": "Dice remaining",
    "bankedTotal": "Banked total",
    "status": "Status",
    "status.in": "In the game",
    "status.needs": "Needs 1,000",
    "probability.toggle": "Show farkle probability",
    "probability.risk": "Farkle risk",
    "probability.dice": "with {dice} dice",
    "probability.die": "with 1 die",
    "dice.legend": "Dice state legend",
    "dice.available": "Available",
    "dice.selected": "Selected",
    "dice.scored": "Scored",
    "dice.reroll": "To reroll",
    "dice.farkle": "Farkle",
    "dice.group": "Dice",
    "feedback.ready": "Ready to roll",
    "feedback.rollSix": "Roll all six dice to begin.",
    "controls.label": "Turn actions",
    "controls.roll": "Roll",
    "controls.keep": "Keep dice",
    "controls.undo": "Undo selection",
    "controls.bank": "Bank points",
    "controls.next": "Next player",
    "log.kicker": "Table talk",
    "log.title": "Recent events",
    "rules.reference": "Reference",
    "rules.title": "Rules & scoring",
    "rules.turn": "<strong>On your turn:</strong> roll, select a complete scoring die or group, and keep it. Bank after a successful keep or risk the remaining dice. No score on a roll is a farkle: all turn points are lost; review the failed dice, then pass play to the next player.",
    "rules.breakIn": "<strong>Break in:</strong> your first bank must be at least 1,000 points in one turn. Once in, any scored turn may be banked.",
    "rules.hot": "<strong>Hot dice:</strong> after scoring all six, you must roll all six again before banking. A farkle on that roll loses the entire turn score.",
    "rules.passed": "<strong>Passed dice:</strong> a continuation is offered when the banking player is in the game—including when that bank completes their break-in—and the next player had already broken in. The next player may start fresh or inherit the turn score and remaining dice, but must add a score before banking.",
    "rules.kindScores": "Of-a-kind scores",
    "rules.face": "Face",
    "rules.ones": "1s",
    "rules.twos": "2s",
    "rules.threes": "3s",
    "rules.fours": "4s",
    "rules.fives": "5s",
    "rules.sixes": "6s",
    "score.single1": "Single 1",
    "score.single5": "Single 5",
    "score.straight": "Straight",
    "score.threePairs": "Three pairs",
    "score.twoTriples": "Two triples",
    "rules.note": "Special combinations use the entire six-die roll. First to 10,000 starts the equal-turn final round; tied leaders continue until one winner remains.",
    "footer": "10000 · Local multiplayer · No data leaves your browser",
    "round.normal": "Round {number}",
    "round.final": "Final round",
    "round.tie": "Tie-break",
    "final.banner": "Final round — {player} crossed 10,000. Remaining players get enough turns to finish the round.",
    "tie.banner": "Tie-break — tied leaders each take another turn until one winner remains.",
    "offer.title": "{score} points, {dice} dice",
    "offer.titleOne": "{score} points, 1 die",
    "offer.copy": "{player} banked safely. Inherit their turn score and roll the remaining dice, or begin at zero with all six.",
    "winner.over": "Game over",
    "winner.title": "{player} wins!",
    "winner.detailsOne": "{score} points · 1 turn",
    "winner.details": "{score} points · {turns} turns",
    "player.default": "Player {number}",
    "player.nameLabel": "Player {number} name",
    "player.typeLabel": "Player {number} type",
    "player.human": "Human",
    "player.cpu": "CPU",
    "player.removeLabel": "Remove player {number}",
    "die.scoredLabel": "Scored die {number}: {value}",
    "die.label": "Die {number}: {value}, {state}",
    "die.rerollLabel": "Die {number} ready to reroll",
    "feedback.farkle": "Farkle — turn over",
    "feedback.lost": "{score} turn points lost.",
    "feedback.noPoints": "No points scored.",
    "feedback.review": "Review the dice, then pass play on.",
    "feedback.added": "{score} added",
    "feedback.hotDice": "Hot dice — roll all six",
    "feedback.hotDiceHelp": "Your {score} turn points stay at risk; banking is unavailable until you score again.",
    "feedback.bankOrRoll": "Bank {score} or roll {dice} dice.",
    "feedback.bankOrRollOne": "Bank {score} or roll 1 die.",
    "feedback.choose": "Choose scoring dice",
    "feedback.chooseHelp": "Tap a 1, a 5, or a complete group.",
    "feedback.notScore": "Not a score",
    "feedback.points": "points",
    "feedback.mustAdd": "You must add a score before banking.",
    "feedback.roll": "Roll {dice} dice.",
    "feedback.rollOne": "Roll 1 die.",
    "special.select": "Select {label} — {score} points",
    "message.selectionCleared": "Selection cleared.",
    "message.farkle": "Farkle! {dice}. {result}",
    "message.turnOver": "Turn over.",
    "reset.confirm": "Start a new game? The unfinished game saved in this browser will be erased.",
  },
  sv: {
    "meta.title": "10000 — Tärningsspel",
    "meta.description": "En webbläsarversion av tärningsspelet 10000 för lokalt spel.",
    "brand.home": "Startsida för spelet 10000",
    "brand.tagline": "utmana ödet",
    "save.text": "Sparat lokalt",
    "save.title": "Spelet sparas i den här webbläsaren",
    "language.switch": "Switch to English",
    "newGame": "Nytt spel",
    "cpu.controls": "CPU-kontroller",
    "cpu.speed": "Hastighet",
    "cpu.speed.normal": "Normal",
    "cpu.speed.fast": "Snabb",
    "cpu.speed.instant": "Mycket snabb",
    "cpu.pause": "Pausa CPU",
    "cpu.resume": "Fortsätt CPU",
    "cpu.status.complete": "CPU-spelet är klart",
    "cpu.status.paused": "CPU-spelet är pausat",
    "cpu.status.playing": "{player} spelar sin CPU-tur",
    "cpu.status.waiting": "Väntar på {player}",
    "cpu.player": "CPU-spelare",
    "cpu.thinking": "CPU:n tänker",
    "cpu.choosingDice": "Väljer vilka poängtärningar som ska sparas.",
    "setup.title": "<span class=\"setup-title-copy\">Först till</span><span class=\"setup-title-score\">10 000</span>",
    "setup.copy": "Spara poänggivande tärningar, slå resten och stanna innan du får farkle. Lägg till 2–6 spelare för att börja.",
    "players": "Spelare",
    "setup.who": "Vilka spelar?",
    "setup.add": "Lägg till spelare",
    "setup.start": "Starta spelet",
    "scoreboard": "Poängtavla",
    "scoreboard.title": "Först till 10 000",
    "currentPlayer": "Aktuell spelare",
    "inheritedTurn": "Övertagen omgång",
    "turnScore": "Omgångspoäng",
    "offer.kicker": "Vill du ta chansen?",
    "offer.take": "Ta chansen",
    "offer.fresh": "Börja om",
    "turn.details": "Information om aktuell omgång",
    "dice.remaining": "Tärningar kvar",
    "bankedTotal": "Totalpoäng",
    "status": "Status",
    "status.in": "Inne i spelet",
    "status.needs": "Behöver 1 000",
    "probability.toggle": "Visa sannolikhet för farkle",
    "probability.risk": "Risk för farkle",
    "probability.dice": "med {dice} tärningar",
    "probability.die": "med 1 tärning",
    "dice.legend": "Förklaring av tärningarnas status",
    "dice.available": "Tillgänglig",
    "dice.selected": "Vald",
    "dice.scored": "Sparad",
    "dice.reroll": "Slås om",
    "dice.farkle": "Farkle",
    "dice.group": "Tärningar",
    "feedback.ready": "Klar att slå",
    "feedback.rollSix": "Slå alla sex tärningarna för att börja.",
    "controls.label": "Val under omgången",
    "controls.roll": "Slå",
    "controls.keep": "Spara tärningar",
    "controls.undo": "Ångra val",
    "controls.bank": "Stanna",
    "controls.next": "Nästa spelare",
    "log.kicker": "Vid bordet",
    "log.title": "Senaste händelser",
    "rules.reference": "Referens",
    "rules.title": "Regler och poäng",
    "rules.turn": "<strong>Din tur:</strong> slå, välj en komplett poänggivande tärning eller kombination och spara den. Stanna efter ett lyckat val eller chansa med tärningarna som är kvar. Ett slag utan poäng är farkle: omgångens alla poäng förloras. Granska tärningarna och lämna sedan över till nästa spelare.",
    "rules.breakIn": "<strong>Kom in i spelet:</strong> första gången du stannar måste du ha minst 1 000 poäng under samma omgång. Därefter får du stanna på valfri giltig omgångspoäng.",
    "rules.hot": "<strong>Heta tärningar:</strong> när alla sex ger poäng måste du slå alla sex igen innan du får stanna. En farkle på det slaget förlorar hela omgångspoängen.",
    "rules.passed": "<strong>Ärvda tärningar:</strong> en fortsättning erbjuds när spelaren som stannar är inne i spelet – även om det sker genom den aktuella omgången – och nästa spelare redan hade kommit in. Nästa spelare får börja om eller ta över omgångspoängen och de återstående tärningarna, men måste lägga till poäng innan det går att stanna.",
    "rules.kindScores": "Poäng för lika tärningar",
    "rules.face": "Valör",
    "rules.ones": "Ettor",
    "rules.twos": "Tvåor",
    "rules.threes": "Treor",
    "rules.fours": "Fyror",
    "rules.fives": "Femmor",
    "rules.sixes": "Sexor",
    "score.single1": "Enkel etta",
    "score.single5": "Enkel femma",
    "score.straight": "Stege",
    "score.threePairs": "Tre par",
    "score.twoTriples": "Två tretal",
    "rules.note": "Specialkombinationer använder hela slaget med sex tärningar. Den som först når 10 000 startar slutomgången. Spelare i delad ledning fortsätter tills en vinnare återstår.",
    "footer": "10000 · Lokalt flerspelarläge · Inga uppgifter lämnar din webbläsare",
    "round.normal": "Omgång {number}",
    "round.final": "Slutomgång",
    "round.tie": "Särspel",
    "final.banner": "Slutomgång — {player} passerade 10 000. Övriga spelare får tillräckligt många turer för att avsluta omgången.",
    "tie.banner": "Särspel — spelarna i delad ledning får en extra tur var tills en vinnare återstår.",
    "offer.title": "{score} poäng, {dice} tärningar",
    "offer.titleOne": "{score} poäng, 1 tärning",
    "offer.copy": "{player} stannade säkert. Ta över omgångspoängen och slå de återstående tärningarna, eller börja på noll med alla sex.",
    "winner.over": "Spelet är slut",
    "winner.title": "{player} vinner!",
    "winner.detailsOne": "{score} poäng · 1 omgång",
    "winner.details": "{score} poäng · {turns} omgångar",
    "player.default": "Spelare {number}",
    "player.nameLabel": "Namn på spelare {number}",
    "player.typeLabel": "Typ för spelare {number}",
    "player.human": "Människa",
    "player.cpu": "CPU",
    "player.removeLabel": "Ta bort spelare {number}",
    "die.scoredLabel": "Sparad tärning {number}: {value}",
    "die.label": "Tärning {number}: {value}, {state}",
    "die.rerollLabel": "Tärning {number} klar att slås om",
    "feedback.farkle": "Farkle — omgången är slut",
    "feedback.lost": "{score} omgångspoäng förlorade.",
    "feedback.noPoints": "Inga poäng.",
    "feedback.review": "Granska tärningarna och lämna sedan över.",
    "feedback.added": "{score} tillagda",
    "feedback.hotDice": "Heta tärningar — slå alla sex",
    "feedback.hotDiceHelp": "Dina {score} omgångspoäng är fortfarande i riskzonen; du får inte stanna förrän du har fått nya poäng.",
    "feedback.bankOrRoll": "Stanna på {score} eller slå {dice} tärningar.",
    "feedback.bankOrRollOne": "Stanna på {score} eller slå 1 tärning.",
    "feedback.choose": "Välj poängtärningar",
    "feedback.chooseHelp": "Tryck på en etta, en femma eller en komplett kombination.",
    "feedback.notScore": "Ger inga poäng",
    "feedback.points": "poäng",
    "feedback.mustAdd": "Du måste lägga till poäng innan du kan stanna.",
    "feedback.roll": "Slå {dice} tärningar.",
    "feedback.rollOne": "Slå 1 tärning.",
    "special.select": "Välj {label} — {score} poäng",
    "message.selectionCleared": "Valet har ångrats.",
    "message.farkle": "Farkle! {dice}. {result}",
    "message.turnOver": "Omgången är slut.",
    "reset.confirm": "Starta ett nytt spel? Det pågående spelet som sparats i webbläsaren raderas.",
  },
};

export function t(language, key, variables = {}) {
  const template = translations[language]?.[key] ?? translations.en[key] ?? key;
  return Object.entries(variables).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function formatNumber(language, value) {
  return new Intl.NumberFormat(language === "sv" ? "sv-SE" : "en-US").format(value);
}

export function formatNames(language, names) {
  return new Intl.ListFormat(language === "sv" ? "sv-SE" : "en-US", {
    style: "long",
    type: "conjunction",
  }).format(names);
}

export function translateScoreLabel(language, label) {
  if (language !== "sv") return label;
  const exact = {
    Straight: "Stege",
    "Three pairs": "Tre par",
    "Two triples": "Två tretal",
    "No scoring dice selected": "Inga poängtärningar valda",
    "Invalid dice": "Ogiltiga tärningar",
    "No active turn": "Ingen aktiv omgång",
  };
  if (exact[label]) return exact[label];
  const singles = label.match(/^(\d+) single ([15])s?$/);
  if (singles) return `${singles[1]} × ${singles[2]} (enskilda)`;
  const group = label.match(/^(\d+) × ([1-6])$/);
  if (group) return `${group[1]} × ${group[2]}`;
  const needsGroup = label.match(/^([1-6])s need a group of at least three$/);
  if (needsGroup) return `${needsGroup[1]}:or kräver minst tre lika`;
  return label.split(" + ").map((part) => translateScoreLabel(language, part)).join(" + ");
}

export function translateRuntimeText(language, message) {
  if (language !== "sv" || !message) return message;
  const exact = {
    "Choose between 2 and 6 players.": "Välj mellan 2 och 6 spelare.",
    "There is no continuation offer.": "Det finns inget erbjudande att ta över.",
    "You must have broken in before inheriting a continuation.": "Du måste ha kommit in i spelet innan du kan ta över en fortsättning.",
    "Dice cannot be rolled right now.": "Tärningarna kan inte slås just nu.",
    "There is no farkle to finish.": "Det finns ingen farkle att avsluta.",
    "Roll first.": "Slå först.",
    "That die is not available.": "Den tärningen är inte tillgänglig.",
    "That would leave a non-scoring selection.": "Det skulle lämna ett val som inte ger poäng.",
    "Roll before confirming dice.": "Slå innan du bekräftar tärningarna.",
    "Select a complete scoring die or combination.": "Välj en komplett poängtärning eller kombination.",
    "Score dice from the current roll before banking.": "Spara poängtärningar från det aktuella slaget innan du stannar.",
    "Hot dice must be rolled before banking.": "Heta tärningar måste slås innan du kan stanna.",
    "Could not find the next player.": "Kunde inte hitta nästa spelare.",
    "Selection cleared.": "Valet har ångrats.",
  };
  if (exact[message]) return exact[message];
  let match = message.match(/^Expected (\d+) valid dice\.$/);
  if (match) return `Förväntade ${match[1]} giltiga tärningar.`;
  match = message.match(/^([1-6]) does not score by itself\.$/);
  if (match) return `${match[1]} ger inte poäng på egen hand.`;
  match = message.match(/^You need 1000 points in one turn to break in \((\d+) more needed\)\.$/);
  if (match) return `Du behöver 1 000 poäng under samma omgång för att komma in (${formatNumber("sv", Number(match[1]))} poäng till behövs).`;
  return message;
}

function translateLegacyEvent(event) {
  const message = event.message ?? "";
  let match;
  if (event.type === "start") return message.replace(/ started a game\.$/, " startade ett spel.");
  if (event.type === "fresh" && (match = message.match(/^(.*) declined (.*)'s continuation and starts fresh\.$/))) {
    return `${match[1]} avstod från ${match[2]}s fortsättning och börjar om.`;
  }
  if (event.type === "inherit" && (match = message.match(/^(.*) inherited (\d+) points and (\d+) dice from (.*)\.$/))) {
    return `${match[1]} tog över ${formatNumber("sv", Number(match[2]))} poäng och ${match[3]} tärningar från ${match[4]}.`;
  }
  if (event.type === "roll" && (match = message.match(/^(.*) rolled (.*)\.$/))) return `${match[1]} slog ${match[2]}.`;
  if (event.type === "farkle" && (match = message.match(/^(.*) farkled(?: and lost (\d+) turn points)?\.$/))) {
    return match[2] ? `${match[1]} fick farkle och förlorade ${formatNumber("sv", Number(match[2]))} omgångspoäng.` : `${match[1]} fick farkle.`;
  }
  if (event.type === "hot-dice" && (match = message.match(/^(.*) scored (\d+) and has hot dice—all six (?:must )?roll again\.$/))) {
    return `${match[1]} fick ${formatNumber("sv", Number(match[2]))} poäng och heta tärningar – alla sex måste slås igen.`;
  }
  if (event.type === "score" && (match = message.match(/^(.*) kept (.*) for (\d+) points; (\d+) dice remain\.$/))) {
    return `${match[1]} sparade ${match[2]} för ${formatNumber("sv", Number(match[3]))} poäng; ${match[4]} tärningar kvar.`;
  }
  if (event.type === "bank" && (match = message.match(/^(.*) banked (\d+) points \((\d+) total\) with (\d+) dice left\.$/))) {
    return `${match[1]} stannade på ${formatNumber("sv", Number(match[2]))} poäng (${formatNumber("sv", Number(match[3]))} totalt) med ${match[4]} tärningar kvar.`;
  }
  if (event.type === "final" && (match = message.match(/^(.*) reached (\d+)\. Final round started!$/))) {
    return `${match[1]} nådde ${formatNumber("sv", Number(match[2]))}. Slutomgången har börjat!`;
  }
  if (event.type === "winner" && (match = message.match(/^(.*) wins with (\d+) points!$/))) return `${match[1]} vinner med ${formatNumber("sv", Number(match[2]))} poäng!`;
  if (event.type === "tie" && (match = message.match(/^(.*) are tied at (\d+); each gets another turn\.$/))) {
    return `${match[1].replaceAll(" and ", " och ")} står lika på ${formatNumber("sv", Number(match[2]))}; alla får en extra tur.`;
  }
  return message;
}

export function translateEvent(language, event) {
  if (language === "en") return event.message;
  const data = event.data;
  if (!data || Object.keys(data).length === 0) return translateLegacyEvent(event);
  const number = (value) => formatNumber(language, value);
  const dice = (value) => `${value} ${value === 1 ? "tärning" : "tärningar"}`;
  switch (event.type) {
    case "start": return `${formatNames(language, data.players)} startade ett spel.`;
    case "fresh": return `${data.player} avstod från ${data.from}s fortsättning och börjar om.`;
    case "inherit": return `${data.player} tog över ${number(data.score)} poäng och ${dice(data.diceRemaining)} från ${data.from}.`;
    case "roll": return `${data.player} slog ${data.dice.join(" · ")}.`;
    case "farkle": return data.lost
      ? `${data.player} fick farkle och förlorade ${number(data.lost)} omgångspoäng.`
      : `${data.player} fick farkle.`;
    case "hot-dice": return `${data.player} fick ${number(data.score)} poäng och heta tärningar – alla sex måste slås igen.`;
    case "score": return `${data.player} sparade ${data.dice.join(" · ")} för ${number(data.score)} poäng; ${dice(data.diceRemaining)} kvar.`;
    case "bank": return `${data.player} stannade på ${number(data.points)} poäng (${number(data.total)} totalt) med ${dice(data.diceRemaining)} kvar.`;
    case "final": return `${data.player} nådde ${number(data.total)}. Slutomgången har börjat!`;
    case "winner": return `${data.player} vinner med ${number(data.total)} poäng!`;
    case "tie": return `${formatNames(language, data.players)} står lika på ${number(data.total)}; alla får en extra tur.`;
    default: return translateLegacyEvent(event);
  }
}
