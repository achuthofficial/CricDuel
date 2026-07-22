import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SLOT_ROLES, NATIONS, MAX_PER_NATION } from './data/roles.js';
import { slotsFilled, touch, opponentSlot } from './rooms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ALL_PLAYERS = JSON.parse(readFileSync(path.join(__dirname, 'data', 'players.json'), 'utf8'));

const bucketCache = new Map();
function bucketFor(nation, role) {
  const key = `${nation}|${role}`;
  if (!bucketCache.has(key)) {
    bucketCache.set(key, ALL_PLAYERS.filter((p) => p.nation === nation && p.role === role));
  }
  return bucketCache.get(key);
}

function alreadyOwned(player, candidate) {
  return player.squad.some((s) => s && s.id === candidate.id);
}

function remainingInBucket(player, nation, role) {
  return bucketFor(nation, role).filter((p) => !alreadyOwned(player, p));
}

function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function currentRole(player) {
  return SLOT_ROLES[slotsFilled(player)];
}

/** Segments for the wheel: greyed out if the nation is at its 3-use cap, or
 * (defensively, beyond what the spec requires) has no fresh candidate left
 * for the role currently being filled. */
export function availableSegments(player) {
  const role = currentRole(player);
  return NATIONS.map((nation) => ({
    nation,
    available: (player.nationCounts[nation] || 0) < MAX_PER_NATION && remainingInBucket(player, nation, role).length > 0,
  }));
}

export function spin(room, slot, useRespin) {
  const player = room.players[slot];
  if (slotsFilled(player) >= 11) return { error: { code: 'DRAFT_COMPLETE', message: 'Your XI is already full.' } };
  if (useRespin) {
    if (player.respinsLeft <= 0) return { error: { code: 'NO_RESPINS', message: 'No re-spins left.' } };
    player.respinsLeft -= 1;
  }
  const segments = availableSegments(player);
  const availableIdx = segments.map((s, i) => (s.available ? i : -1)).filter((i) => i >= 0);
  const landedIndex = availableIdx[Math.floor(Math.random() * availableIdx.length)];
  const nation = segments[landedIndex].nation;
  const wheel = {
    segments,
    landedIndex,
    spinDuration: 3200,
    seed: Math.floor(Math.random() * 2 ** 31),
  };
  player.pendingWheel = { nation, role: currentRole(player), slot: slotsFilled(player) };
  player.pendingCandidates = null;
  touch(room);
  return { wheel };
}

export function revealCandidates(room, slot) {
  const player = room.players[slot];
  if (!player.pendingWheel) return { error: { code: 'NO_PENDING_SPIN', message: 'Spin the wheel first.' } };
  const { nation, role, slot: forSlot } = player.pendingWheel;
  const pool = shuffle(remainingInBucket(player, nation, role)).slice(0, 6);
  const candidates = { slot: forSlot, players: pool };
  player.pendingCandidates = candidates;
  touch(room);
  return { candidates };
}

export function ratingScore(p) {
  return p.bat + p.bowl + p.strike * 0.3 + p.economy * 0.3;
}

export function confirmPick(room, slot, playerId) {
  const player = room.players[slot];
  if (!player.pendingCandidates) return { error: { code: 'NO_PENDING_CANDIDATES', message: 'Spin before picking.' } };
  const candidate = player.pendingCandidates.players.find((p) => p.id === playerId);
  if (!candidate) return { error: { code: 'INVALID_PICK', message: 'That player is not an available candidate.' } };
  return applyPick(room, slot, candidate);
}

export function autoPick(room, slot) {
  const player = room.players[slot];
  if (!player.pendingCandidates || player.pendingCandidates.players.length === 0) return null;
  const best = player.pendingCandidates.players.reduce((a, b) => (ratingScore(b) > ratingScore(a) ? b : a));
  return applyPick(room, slot, best);
}

function applyPick(room, slot, candidate) {
  const player = room.players[slot];
  const targetSlot = player.pendingCandidates.slot;
  player.squad[targetSlot] = candidate;
  player.nationCounts[candidate.nation] = (player.nationCounts[candidate.nation] || 0) + 1;
  player.pendingWheel = null;
  player.pendingCandidates = null;
  touch(room);

  if (room.players.length === 2 && room.players.every((p) => slotsFilled(p) >= 11)) {
    room.phase = 'READY_CHECK';
  }
  return { slot: targetSlot, player: candidate };
}
