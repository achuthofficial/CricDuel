import { useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { WinnerCard } from '../components/result/WinnerCard';
import { ScorecardCompare } from '../components/result/ScorecardCompare';
import { ShareCard } from '../components/result/ShareCard';
import { useGameStore } from '../store/useGameStore';
import { requestRematch } from '../store/useSocket';
import { haptics } from '../lib/haptics';

export function Result() {
  const matchData = useGameStore((s) => s.matchData);
  const you = useGameStore((s) => s.you);
  const opponent = useGameStore((s) => s.opponent);
  const code = useGameStore((s) => s.code);

  const yourIdx: 0 | 1 = you?.isHost ? 0 : 1;
  const youWon = matchData ? matchData.result.winnerIdx === yourIdx : false;

  useEffect(() => {
    if (youWon) haptics.win();
  }, [youWon]);

  if (!matchData || !you) return null;

  const winnerName = matchData.result.winnerIdx === yourIdx ? you.displayName : (opponent?.name ?? 'Opponent');

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-5 px-4 pb-10 pt-6">
      <WinnerCard winnerName={winnerName} youWon={youWon} result={matchData.result} />

      <ScorecardCompare
        yourName={you.displayName}
        opponentName={opponent?.name ?? 'Opponent'}
        yourIsFirstInnings={matchData.innings1.battingIdx === yourIdx}
        innings1={matchData.innings1}
        innings2={matchData.innings2}
        yourSquad={matchData.squads[yourIdx]}
        opponentSquad={matchData.squads[yourIdx === 0 ? 1 : 0]}
        playerOfMatchId={matchData.playerOfMatchId}
      />

      <div className="mt-auto flex flex-col gap-3">
        <Button onClick={requestRematch}>Rematch</Button>
        <ShareCard winnerName={winnerName} margin={matchData.result.margin} innings1={matchData.innings1} innings2={matchData.innings2} code={code} />
      </div>
    </div>
  );
}
