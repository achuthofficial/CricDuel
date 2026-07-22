export type Role = 'OPEN' | 'TOP' | 'MID' | 'WK' | 'ALL' | 'PACE' | 'SPIN';

export const SLOT_ROLES: Role[] = ['OPEN', 'OPEN', 'TOP', 'MID', 'MID', 'WK', 'ALL', 'ALL', 'PACE', 'PACE', 'SPIN'];

export const SLOT_LABELS: Record<number, string> = {
  0: 'Opener',
  1: 'Opener',
  2: 'Top order',
  3: 'Middle order',
  4: 'Middle order',
  5: 'Wicketkeeper',
  6: 'All-rounder',
  7: 'All-rounder',
  8: 'Pace',
  9: 'Pace',
  10: 'Spin',
};

export interface Player {
  id: string;
  name: string;
  nation: string;
  era: string;
  role: Role;
  bat: number;
  strike: number;
  bowl: number;
  economy: number;
  field: number;
}

export type Phase = 'HOME' | 'LOBBY' | 'DRAFTING' | 'READY_CHECK' | 'SIMULATING' | 'RESULT';

export interface OpponentView {
  name: string;
  connected: boolean;
  slotsFilled: number;
  ready: boolean;
}

export interface YouView {
  displayName: string;
  squad: (Player | null)[];
  respinsLeft: number;
  nationCounts: Record<string, number>;
  ready: boolean;
  isHost: boolean;
}

export interface RoomState {
  code: string;
  phase: Exclude<Phase, 'HOME'>;
  you: YouView;
  opponent: OpponentView | null;
  currentSlot: number;
  config: { oversPerSide: number };
  opponentGraceExpired?: boolean;
  opponentLeft?: boolean;
  hostLeft?: boolean;
}

export interface WheelSegment {
  nation: string;
  available: boolean;
}

export interface WheelResult {
  segments: WheelSegment[];
  landedIndex: number;
  spinDuration: number;
  seed: number;
}

export interface CandidatesPayload {
  slot: number;
  players: Player[];
}

export interface ConfirmedPickPayload {
  slot: number;
  player: Player;
  autoPicked: boolean;
}

export type BallOutcome = 'DOT' | '1' | '2' | '3' | 'FOUR' | 'SIX' | 'WICKET' | 'WIDE' | 'NOBALL';

export interface BallEvent {
  innings: 1 | 2;
  over: number;
  ball: number;
  strikerId: string;
  bowlerId: string;
  outcome: BallOutcome;
  dismissal?: 'bowled' | 'caught' | 'lbw' | 'run out' | 'stumped';
  scoreAfter: { runs: number; wickets: number };
  commentary: string;
}

export interface InningsResult {
  battingIdx: 0 | 1;
  runs: number;
  wickets: number;
  balls: number;
  log: BallEvent[];
}

export interface MatchResult {
  winnerIdx: 0 | 1;
  margin: { type: 'runs' | 'wickets' | 'tie-breaker'; value: number };
  superOver: { runsA: number; runsB: number } | null;
}

export interface MatchStartPayload {
  startAt: number;
  innings1: InningsResult;
  innings2: InningsResult;
  result: MatchResult;
  playerOfMatchId: string;
  squads: [Player[], Player[]];
}

export interface ApiError {
  code: string;
  message: string;
}
