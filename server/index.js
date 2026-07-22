import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import {
  createRoom,
  joinRoom,
  getRoom,
  resumeSession,
  findBySocket,
  markDisconnected,
  removeRoom,
  buildRoomState,
  opponentSlot,
  slotsFilled,
  touch,
  startGc,
} from './rooms.js';
import { spin, revealCandidates, confirmPick, autoPick } from './draft.js';
import { RESPINS_PER_PLAYER, PICK_TIMER_SECONDS } from './data/roles.js';
import { simulateMatch } from './sim/engine.js';

const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } });

startGc();

function emitRoomState(room) {
  for (const [slot, player] of room.players.entries()) {
    if (player && player.connected) {
      io.to(player.socketId).emit('room:state', buildRoomState(room, slot));
    }
  }
}

function emitOpponentProgress(room, fromSlot) {
  const oppSlot = opponentSlot(fromSlot);
  const opponent = room.players[oppSlot];
  const you = room.players[fromSlot];
  if (opponent && opponent.connected) {
    io.to(opponent.socketId).emit('draft:progress', { opponentSlotsFilled: slotsFilled(you) });
  }
}

function clearPickTimer(player) {
  if (player._pickTimer) {
    clearTimeout(player._pickTimer);
    player._pickTimer = null;
  }
}

function startPickTimer(room, slot) {
  const player = room.players[slot];
  clearPickTimer(player);
  player._pickTimer = setTimeout(() => {
    const result = autoPick(room, slot);
    if (!result) return;
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) socket.emit('draft:confirmed', { slot: result.slot, player: result.player, autoPicked: true });
    emitOpponentProgress(room, slot);
    emitRoomState(room);
  }, PICK_TIMER_SECONDS * 1000);
}

function startSimulationIfReady(room) {
  if (room.phase !== 'READY_CHECK') return;
  if (!room.players.every((p) => p && p.ready)) return;

  room.phase = 'SIMULATING';
  const sim = simulateMatch(room.players[0].squad, room.players[1].squad, room.seed, room.config);
  const startAt = Date.now() + 1500;
  room.lastResult = sim;
  room.phase = 'RESULT';

  const payload = {
    startAt,
    innings1: sim.innings1,
    innings2: sim.innings2,
    result: sim.result,
    playerOfMatchId: sim.playerOfMatchId,
    squads: [room.players[0].squad, room.players[1].squad],
  };
  for (const player of room.players) {
    if (player.connected) io.to(player.socketId).emit('match:start', payload);
  }
}

function startDisconnectGrace(room, slot) {
  const player = room.players[slot];
  if (player._disconnectTimer) clearTimeout(player._disconnectTimer);
  player._disconnectTimer = setTimeout(() => {
    const opp = room.players[opponentSlot(slot)];
    if (opp && opp.connected) {
      io.to(opp.socketId).emit('room:state', { ...buildRoomState(room, opponentSlot(slot)), opponentGraceExpired: true });
    }
  }, 90 * 1000);
}

io.on('connection', (socket) => {
  const { sessionId } = socket.handshake.auth || {};

  if (sessionId) {
    const resumed = resumeSession(sessionId, socket.id);
    if (resumed) {
      const { room, slot, player } = resumed;
      if (player._disconnectTimer) clearTimeout(player._disconnectTimer);
      socket.join(room.code);
      socket.emit('session:resumed', { sessionId });
      emitRoomState(room);
    }
  }

  socket.on('room:create', ({ displayName }) => {
    const { room, sessionId: newSessionId, slot } = createRoom(displayName || 'Player 1', socket.id);
    socket.join(room.code);
    socket.emit('session:resumed', { sessionId: newSessionId });
    socket.emit('room:state', buildRoomState(room, slot));
  });

  socket.on('room:join', ({ code, displayName }) => {
    const normalizedCode = String(code || '').toUpperCase();
    const { room, sessionId: newSessionId, slot, error } = joinRoom(normalizedCode, displayName || 'Player 2', socket.id);
    if (error) return socket.emit('error', error);
    socket.join(room.code);
    socket.emit('session:resumed', { sessionId: newSessionId });
    emitRoomState(room);
  });

  socket.on('room:start', () => {
    const found = findBySocket(socket.id);
    if (!found) return socket.emit('error', { code: 'NO_ROOM', message: 'Not in a room.' });
    const { room, slot } = found;
    if (slot !== 0) return socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can start the draft.' });
    if (room.players.length < 2) return socket.emit('error', { code: 'WAITING_FOR_OPPONENT', message: 'Waiting for an opponent to join.' });
    if (room.phase !== 'LOBBY') return;
    room.phase = 'DRAFTING';
    touch(room);
    emitRoomState(room);
  });

  socket.on('draft:spin', ({ useRespin }) => {
    const found = findBySocket(socket.id);
    if (!found) return socket.emit('error', { code: 'NO_ROOM', message: 'Not in a room.' });
    const { room, slot } = found;
    if (room.phase !== 'DRAFTING') return socket.emit('error', { code: 'NOT_DRAFTING', message: 'The draft hasn\'t started yet.' });
    const { wheel, error } = spin(room, slot, !!useRespin);
    if (error) return socket.emit('error', error);
    socket.emit('draft:wheel', wheel);
    setTimeout(() => {
      const { candidates, error: candErr } = revealCandidates(room, slot);
      if (candErr) return socket.emit('error', candErr);
      socket.emit('draft:candidates', candidates);
      startPickTimer(room, slot);
    }, wheel.spinDuration);
  });

  socket.on('draft:pick', ({ playerId }) => {
    const found = findBySocket(socket.id);
    if (!found) return socket.emit('error', { code: 'NO_ROOM', message: 'Not in a room.' });
    const { room, slot } = found;
    clearPickTimer(room.players[slot]);
    const { slot: filledSlot, player, error } = confirmPick(room, slot, playerId);
    if (error) return socket.emit('error', error);
    socket.emit('draft:confirmed', { slot: filledSlot, player, autoPicked: false });
    emitOpponentProgress(room, slot);
    emitRoomState(room);
  });

  socket.on('player:ready', ({ ready }) => {
    const found = findBySocket(socket.id);
    if (!found) return socket.emit('error', { code: 'NO_ROOM', message: 'Not in a room.' });
    const { room, slot } = found;
    if (room.phase !== 'READY_CHECK') return socket.emit('error', { code: 'NOT_READY_CHECK', message: 'Draft is not complete yet.' });
    room.players[slot].ready = !!ready;
    touch(room);
    emitRoomState(room);
    startSimulationIfReady(room);
  });

  socket.on('room:rematch', () => {
    const found = findBySocket(socket.id);
    if (!found) return socket.emit('error', { code: 'NO_ROOM', message: 'Not in a room.' });
    const { room } = found;
    room.phase = 'DRAFTING';
    room.seed = Math.floor(Math.random() * 2 ** 31);
    room.lastResult = null;
    for (const player of room.players) {
      player.squad = Array(11).fill(null);
      player.respinsLeft = RESPINS_PER_PLAYER;
      player.nationCounts = {};
      player.ready = false;
      player.pendingWheel = null;
      player.pendingCandidates = null;
    }
    touch(room);
    emitRoomState(room);
  });

  socket.on('room:leave', () => {
    const found = findBySocket(socket.id);
    if (!found) return;
    const { room, slot } = found;
    const opp = room.players[opponentSlot(slot)];
    if (opp && opp.connected) io.to(opp.socketId).emit('room:state', { ...buildRoomState(room, opponentSlot(slot)), opponentLeft: true });
    removeRoom(room.code);
    socket.leave(room.code);
  });

  socket.on('disconnect', () => {
    const found = markDisconnected(socket.id);
    if (!found) return;
    const { room, slot } = found;
    startDisconnectGrace(room, slot);
    const opp = room.players[opponentSlot(slot)];
    if (opp && opp.connected) io.to(opp.socketId).emit('room:state', buildRoomState(room, opponentSlot(slot)));
    if (room.phase === 'LOBBY') {
      // host left before the game started — close the room for the other side
      if (slot === 0 && opp) {
        io.to(opp.socketId).emit('room:state', { ...buildRoomState(room, opponentSlot(slot)), hostLeft: true });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`CricDuel server listening on :${PORT}`);
});
