import { RESPINS_PER_PLAYER } from './data/roles.js';

const CODE_ALPHABET = 'ACDEFGHJKLMNPQRTUVWXY34679';
const CODE_LENGTH = 4;
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DISCONNECT_GRACE_MS = 90 * 1000;

/** @type {Map<string, Room>} */
export const rooms = new Map();
/** @type {Map<string, { code: string, slot: number }>} */
const sessionIndex = new Map();

function generateCode() {
  let code;
  do {
    code = Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function makePlayer(displayName, socketId, sessionId) {
  return {
    sessionId,
    socketId,
    displayName,
    connected: true,
    disconnectedAt: null,
    squad: Array(11).fill(null),
    respinsLeft: RESPINS_PER_PLAYER,
    nationCounts: {},
    ready: false,
    pendingWheel: null, // { nation, segments, landedIndex, spinDuration, seed }
    pendingCandidates: null, // { slot, players }
  };
}

export function createRoom(displayName, socketId) {
  const code = generateCode();
  const sessionId = crypto.randomUUID();
  const room = {
    code,
    phase: 'LOBBY',
    players: [makePlayer(displayName, socketId, sessionId)],
    currentSlot: 0,
    seed: Math.floor(Math.random() * 2 ** 31),
    config: { oversPerSide: 20 },
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
  rooms.set(code, room);
  sessionIndex.set(sessionId, { code, slot: 0 });
  return { room, sessionId, slot: 0 };
}

export function joinRoom(code, displayName, socketId) {
  const room = rooms.get(code);
  if (!room) return { error: { code: 'ROOM_NOT_FOUND', message: 'This room doesn\'t exist.' } };
  if (room.players.length >= 2) return { error: { code: 'ROOM_FULL', message: 'This room is full.' } };
  const sessionId = crypto.randomUUID();
  const player = makePlayer(displayName, socketId, sessionId);
  room.players.push(player);
  room.lastActivity = Date.now();
  sessionIndex.set(sessionId, { code, slot: 1 });
  return { room, sessionId, slot: 1 };
}

export function getRoom(code) {
  return rooms.get(code) ?? null;
}

export function resumeSession(sessionId, newSocketId) {
  const entry = sessionIndex.get(sessionId);
  if (!entry) return null;
  const room = rooms.get(entry.code);
  if (!room) {
    sessionIndex.delete(sessionId);
    return null;
  }
  const player = room.players[entry.slot];
  if (!player) return null;
  player.socketId = newSocketId;
  player.connected = true;
  player.disconnectedAt = null;
  room.lastActivity = Date.now();
  return { room, slot: entry.slot, player };
}

export function findBySocket(socketId) {
  for (const room of rooms.values()) {
    const slot = room.players.findIndex((p) => p && p.socketId === socketId);
    if (slot !== -1) return { room, slot, player: room.players[slot] };
  }
  return null;
}

export function markDisconnected(socketId) {
  const found = findBySocket(socketId);
  if (!found) return null;
  found.player.connected = false;
  found.player.disconnectedAt = Date.now();
  return found;
}

export function opponentSlot(slot) {
  return slot === 0 ? 1 : 0;
}

export function touch(room) {
  room.lastActivity = Date.now();
}

export function removeRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  for (const p of room.players) {
    if (p) sessionIndex.delete(p.sessionId);
  }
  rooms.delete(code);
}

export function slotsFilled(player) {
  return player.squad.filter((s) => s !== null).length;
}

/** Client-safe room snapshot. Opponent data is a public view only — never the squad. */
export function buildRoomState(room, forSlot) {
  const you = room.players[forSlot];
  const opp = room.players[opponentSlot(forSlot)];
  return {
    code: room.code,
    phase: room.phase,
    you: you && {
      displayName: you.displayName,
      squad: you.squad,
      respinsLeft: you.respinsLeft,
      nationCounts: you.nationCounts,
      ready: you.ready,
      isHost: forSlot === 0,
    },
    opponent: opp && {
      name: opp.displayName,
      connected: opp.connected,
      slotsFilled: slotsFilled(opp),
      ready: opp.ready,
    },
    currentSlot: room.currentSlot,
    config: room.config,
  };
}

export function disconnectGraceExpired(player) {
  return player.disconnectedAt !== null && Date.now() - player.disconnectedAt > DISCONNECT_GRACE_MS;
}

export function startGc() {
  setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
      if (now - room.lastActivity > IDLE_TIMEOUT_MS) removeRoom(code);
    }
  }, 5 * 60 * 1000).unref();
}

export const DISCONNECT_GRACE_MS_EXPORT = DISCONNECT_GRACE_MS;
