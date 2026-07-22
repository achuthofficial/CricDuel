import { formatMargin } from '../../lib/format';
import type { MatchResult } from '../../lib/types';

interface WinnerCardProps {
  winnerName: string;
  youWon: boolean;
  result: MatchResult;
}

export function WinnerCard({ winnerName, youWon, result }: WinnerCardProps) {
  return (
    <div className={`rounded-2xl px-5 py-6 text-center ${youWon ? 'bg-turf/15' : 'bg-scorer-red/10'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {result.margin.type === 'tie-breaker' ? 'Tie — decided in the super over' : 'Match result'}
      </p>
      <h1 className="font-display mt-1 text-3xl font-extrabold">{winnerName} won</h1>
      <p className="mt-1 text-base text-ink/70">{formatMargin(result.margin)}</p>
    </div>
  );
}
