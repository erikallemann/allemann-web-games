export const LINEUP_KEY = "chicago-lineup-v1";

export const FAMILY_ROSTER = Object.freeze([
  "Erik",
  "Hanna",
  "Esther",
  "Ingrid",
  "Jon",
  "Johanna",
  "Bill",
  "Olle",
]);

function cleanName(name, fallback) {
  const normalized = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 24);
  return normalized || fallback;
}

export function defaultLineup() {
  return [
    { name: "Erik", type: "human" },
    { name: "Hanna", type: "cpu" },
  ];
}

export function normalizeLineup(entries) {
  if (!Array.isArray(entries) || entries.length < 2 || entries.length > 4) return defaultLineup();
  return entries.map((entry, index) => ({
    name: cleanName(entry?.name, FAMILY_ROSTER[index] ?? `Spelare ${index + 1}`),
    type: index === 0 ? "human" : "cpu",
  }));
}

export function restoreLineup(serialized) {
  if (!serialized) return defaultLineup();
  try {
    return normalizeLineup(JSON.parse(serialized));
  } catch {
    return defaultLineup();
  }
}

export function nextRosterPlayer(entries) {
  const used = new Set(entries.map((entry) =>
    String(entry.name).trim().toLocaleLowerCase("sv-SE")));
  const name = FAMILY_ROSTER.find((candidate) =>
    !used.has(candidate.toLocaleLowerCase("sv-SE"))) ?? `Spelare ${entries.length + 1}`;
  return { name, type: "cpu" };
}
