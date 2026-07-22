import { formatOvers, formatScore, requiredRunRate } from '../../lib/format';

interface ScoreboardProps {
  inningsNumber: 1 | 2;
  runs: number;
  wickets: number;
  ballsFaced: number;
  oversPerSide: number;
  target: number | null;
}

export function Scoreboard({ inningsNumber, runs, wickets, ballsFaced, oversPerSide, target }: ScoreboardProps) {
  const rrr = target !== null ? requiredRunRate(target, runs, ballsFaced, oversPerSide) : null;
  return (
    <div className="rounded-xl bg-night px-4 py-3 text-floodlight">
      <div className="flex items-baseline justify-between">
        <span className="tabular font-mono text-2xl font-bold" aria-live="polite">
          {formatScore(runs, wickets)}
        </span>
        <span className="tabular font-mono text-sm text-floodlight/70">
          ({formatOvers(ballsFaced)} ov)
        </span>
      </div>
      {target !== null && (
        <div className="mt-1 flex justify-between text-xs text-floodlight/70">
          <span>Target {target}</span>
          {rrr && <span>RRR {rrr}</span>}
        </div>
      )}
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-floodlight/50">Innings {inningsNumber}</p>
    </div>
  );
}
