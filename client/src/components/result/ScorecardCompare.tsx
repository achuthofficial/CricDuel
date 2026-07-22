import type { InningsResult, Player } from '../../lib/types';
import { formatOvers, formatScore } from '../../lib/format';

interface ScorecardCompareProps {
  yourName: string;
  opponentName: string;
  yourIsFirstInnings: boolean;
  innings1: InningsResult;
  innings2: InningsResult;
  yourSquad: Player[];
  opponentSquad: Player[];
  playerOfMatchId: string;
}

export function ScorecardCompare({
  yourName,
  opponentName,
  yourIsFirstInnings,
  innings1,
  innings2,
  yourSquad,
  opponentSquad,
  playerOfMatchId,
}: ScorecardCompareProps) {
  const yourInnings = yourIsFirstInnings ? innings1 : innings2;
  const oppInnings = yourIsFirstInnings ? innings2 : innings1;
  const pom = [...yourSquad, ...opponentSquad].find((p) => p.id === playerOfMatchId);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-ink">{yourName} (you)</p>
          <p className="tabular font-mono text-xl font-bold text-ink">
            {formatScore(yourInnings.runs, yourInnings.wickets)}
            <span className="ml-1 text-xs font-normal text-ink/60">({formatOvers(yourInnings.balls)})</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-scorer-red">{opponentName}</p>
          <p className="tabular font-mono text-xl font-bold text-scorer-red">
            {formatScore(oppInnings.runs, oppInnings.wickets)}
            <span className="ml-1 text-xs font-normal text-scorer-red/70">({formatOvers(oppInnings.balls)})</span>
          </p>
        </div>
      </div>

      {pom && (
        <div className="rounded-lg bg-ink/5 px-3 py-2 text-sm">
          <span className="text-ink/50">Player of the match: </span>
          <span className="font-semibold">{pom.name}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <ul className="flex flex-col gap-1 text-sm text-ink">
          {yourSquad.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
        <ul className="flex flex-col gap-1 text-sm text-scorer-red">
          {opponentSquad.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
