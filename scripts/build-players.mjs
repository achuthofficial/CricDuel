// Derives the 5 game ratings from each roster entry's tier/flavor tags and
// writes server/data/players.json. This stands in for the spec's §5.1
// "derive-ratings" step: tier/flavor are the hand judgment call that would
// otherwise come from a real cohort z-score, computed once here so every
// player's numbers are consistent and reproducible rather than typed by hand.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ROSTER } from './roster.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, '..', 'server', 'data', 'players.json');

// Deterministic pseudo-jitter from the player id, in [-1, 1].
function jitter(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 2001) / 1000) - 1;
}

const TIER_BAND = { S: [88, 96, 92], A: [77, 88, 82], B: [64, 76, 70], C: [52, 63, 58] };
const FLAVOR_BAND = { H: [80, 92, 86], M: [64, 76, 70], L: [52, 64, 58] };

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

function band(map, key, id, spread = 5) {
  const [lo, hi, base] = map[key];
  return clamp(base + jitter(id) * spread, lo, hi);
}

function deriveField(id, tier, roleBonus) {
  const tierBonus = { S: 15, A: 8, B: 2, C: -5 }[tier];
  return clamp(60 + tierBonus + roleBonus + jitter(id + '_field') * 6, 45, 94);
}

function derive([id, name, nation, era, role, tier, flavor]) {
  let bat = 0, strike = 0, bowl = 0, economy = 0, field;

  if (role === 'PACE' || role === 'SPIN') {
    bowl = band(TIER_BAND, tier, id, 4);
    economy = band(FLAVOR_BAND, flavor, id + '_e', 5);
    const tailBonus = tier === 'S' ? 10 : tier === 'A' ? 6 : 0;
    bat = clamp(35 + tailBonus + jitter(id + '_b') * 8, 25, 55);
    strike = clamp(58 + jitter(id + '_s') * 8, 45, 75);
    field = deriveField(id, tier, 0);
  } else if (role === 'ALL') {
    bat = band(TIER_BAND, tier, id, 4) - 5;
    bowl = band(TIER_BAND, tier, id + '_bowl', 4) - 5;
    strike = band(FLAVOR_BAND, flavor, id + '_s', 5);
    economy = band(FLAVOR_BAND, flavor, id + '_e', 5) - 5;
    field = deriveField(id, tier, 5);
  } else {
    // OPEN, TOP, MID, WK — pure batting roles
    bat = band(TIER_BAND, tier, id, 4);
    strike = band(FLAVOR_BAND, flavor, id + '_s', 5);
    bowl = 0;
    economy = 0;
    field = deriveField(id, tier, role === 'WK' ? 10 : 0);
  }

  return { id, name, nation, era, role, bat, strike, bowl, economy, field };
}

const players = ROSTER.map(derive);

const ids = new Set();
for (const p of players) {
  if (ids.has(p.id)) throw new Error(`Duplicate id: ${p.id}`);
  ids.add(p.id);
}

writeFileSync(OUT_PATH, JSON.stringify(players, null, 2) + '\n');
console.log(`Wrote ${players.length} players to ${OUT_PATH}`);
