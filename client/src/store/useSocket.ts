import { io } from 'socket.io-client';
import { useGameStore } from './useGameStore';
import { haptics } from '../lib/haptics';
import type { ApiError, CandidatesPayload, ConfirmedPickPayload, MatchStartPayload, RoomState, WheelResult } from '../lib/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const SESSION_KEY = 'cricduel:sessionId';

function getSessionId() {
  return sessionStorage.getItem(SESSION_KEY) ?? undefined;
}

export const socket = io(SERVER_URL, {
  autoConnect: true,
  auth: (cb) => cb({ sessionId: getSessionId() }),
});

socket.on('connect', () => useGameStore.getState().setConnectionStatus('connected'));
socket.on('disconnect', () => useGameStore.getState().setConnectionStatus('disconnected'));
socket.io.on('reconnect_attempt', () => useGameStore.getState().setConnectionStatus('connecting'));

socket.on('session:resumed', ({ sessionId }: { sessionId: string }) => {
  sessionStorage.setItem(SESSION_KEY, sessionId);
});

socket.on('room:state', (state: RoomState) => useGameStore.getState().applyRoomState(state));

socket.on('draft:wheel', (wheel: WheelResult) => {
  useGameStore.getState().setSpinning(true);
  useGameStore.getState().setWheel(wheel);
  useGameStore.getState().bumpSpinToken();
});

socket.on('draft:candidates', (candidates: CandidatesPayload) => {
  useGameStore.getState().setSpinning(false);
  useGameStore.getState().setCandidates(candidates);
  haptics.wheelStop();
});

socket.on('draft:confirmed', (pick: ConfirmedPickPayload) => {
  useGameStore.getState().setLastConfirmedPick(pick);
  useGameStore.getState().setCandidates(null);
  useGameStore.getState().setWheel(null);
  if (pick.autoPicked) useGameStore.getState().pushToast(`Time's up — auto-picked ${pick.player.name}`);
});

socket.on('draft:progress', ({ opponentSlotsFilled }: { opponentSlotsFilled: number }) => {
  useGameStore.setState((s) => (s.opponent ? { opponent: { ...s.opponent, slotsFilled: opponentSlotsFilled } } : {}));
});

socket.on('match:start', (payload: MatchStartPayload) => useGameStore.getState().setMatchStart(payload));

socket.on('error', (err: ApiError) => useGameStore.getState().pushError(err));

export function createRoom(displayName: string) {
  socket.emit('room:create', { displayName });
}

export function joinRoom(code: string, displayName: string) {
  socket.emit('room:join', { code, displayName });
}

export function startDraft() {
  socket.emit('room:start', {});
}

export function spinWheel(useRespin = false) {
  socket.emit('draft:spin', { useRespin });
}

export function pickPlayer(playerId: string) {
  socket.emit('draft:pick', { playerId });
}

export function setReady(ready: boolean) {
  socket.emit('player:ready', { ready });
}

export function requestRematch() {
  socket.emit('room:rematch', {});
}

export function leaveRoom() {
  socket.emit('room:leave', {});
}
