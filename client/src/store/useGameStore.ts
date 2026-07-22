import { create } from 'zustand';
import type {
  ApiError,
  CandidatesPayload,
  ConfirmedPickPayload,
  MatchStartPayload,
  OpponentView,
  Phase,
  RoomState,
  WheelResult,
  YouView,
} from '../lib/types';

export interface Toast {
  id: number;
  message: string;
}

interface GameState {
  displayName: string;
  phase: Phase;
  code: string | null;
  you: YouView | null;
  opponent: OpponentView | null;
  currentSlot: number;
  oversPerSide: number;
  opponentGraceExpired: boolean;
  roomClosedReason: string | null;

  connectionStatus: 'connected' | 'connecting' | 'disconnected';

  wheel: WheelResult | null;
  spinning: boolean;
  spinToken: number;
  candidates: CandidatesPayload | null;
  pickTimerStartedAt: number | null;
  lastConfirmedPick: ConfirmedPickPayload | null;

  matchData: MatchStartPayload | null;
  viewingResult: boolean;

  toasts: Toast[];

  setDisplayName: (name: string) => void;
  applyRoomState: (state: RoomState) => void;
  setPhaseHome: () => void;
  setConnectionStatus: (status: GameState['connectionStatus']) => void;
  setWheel: (wheel: WheelResult | null) => void;
  setSpinning: (spinning: boolean) => void;
  bumpSpinToken: () => void;
  setCandidates: (candidates: CandidatesPayload | null) => void;
  setLastConfirmedPick: (pick: ConfirmedPickPayload | null) => void;
  setMatchStart: (payload: MatchStartPayload) => void;
  revealResult: () => void;
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
  pushError: (error: ApiError) => void;
  resetRoom: (reason?: string) => void;
}

let toastId = 0;

export const useGameStore = create<GameState>((set, get) => ({
  displayName: localStorage.getItem('cricduel:name') ?? '',
  phase: 'HOME',
  code: null,
  you: null,
  opponent: null,
  currentSlot: 0,
  oversPerSide: 20,
  opponentGraceExpired: false,
  roomClosedReason: null,

  connectionStatus: 'connecting',

  wheel: null,
  spinning: false,
  spinToken: 0,
  candidates: null,
  pickTimerStartedAt: null,
  lastConfirmedPick: null,

  matchData: null,
  viewingResult: false,

  toasts: [],

  setDisplayName: (name) => {
    localStorage.setItem('cricduel:name', name);
    set({ displayName: name });
  },

  applyRoomState: (state) => {
    set({
      phase: state.phase,
      code: state.code,
      you: state.you,
      opponent: state.opponent,
      currentSlot: state.currentSlot,
      oversPerSide: state.config?.oversPerSide ?? 20,
      opponentGraceExpired: !!state.opponentGraceExpired,
      ...(state.phase === 'DRAFTING' ? { matchData: null, viewingResult: false } : {}),
    });
    if (state.hostLeft) {
      get().resetRoom('The host left the room.');
    } else if (state.opponentLeft) {
      get().resetRoom('Your opponent left the room.');
    }
  },

  setPhaseHome: () => set({ phase: 'HOME' }),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setWheel: (wheel) => set({ wheel }),
  setSpinning: (spinning) => set({ spinning }),
  bumpSpinToken: () => set((s) => ({ spinToken: s.spinToken + 1 })),
  setCandidates: (candidates) => set({ candidates, pickTimerStartedAt: candidates ? Date.now() : null }),
  setLastConfirmedPick: (pick) => set({ lastConfirmedPick: pick }),

  setMatchStart: (payload) => set({ matchData: payload, phase: 'SIMULATING', viewingResult: false }),
  revealResult: () => set({ viewingResult: true }),

  pushToast: (message) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  pushError: (error) => get().pushToast(error.message),

  resetRoom: (reason) => {
    sessionStorage.removeItem('cricduel:sessionId');
    set({
      phase: 'HOME',
      code: null,
      you: null,
      opponent: null,
      wheel: null,
      candidates: null,
      matchData: null,
      roomClosedReason: reason ?? null,
    });
    if (reason) get().pushToast(reason);
  },
}));
