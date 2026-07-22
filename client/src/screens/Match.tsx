import { useEffect, useRef, useState } from 'react';
import { Scoreboard } from '../components/match/Scoreboard';
import { Ledger } from '../components/match/Ledger';
import { CommentaryLine } from '../components/match/CommentaryLine';
import { MatchControls } from '../components/match/MatchControls';
import { useGameStore } from '../store/useGameStore';
import { haptics } from '../lib/haptics';

export function Match() {
  const matchData = useGameStore((s) => s.matchData);
  const oversPerSide = useGameStore((s) => s.oversPerSide);
  const revealResult = useGameStore((s) => s.revealResult);

  const [isNight, setIsNight] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [wicketPulse, setWicketPulse] = useState(0);
  const [sixPulse, setSixPulse] = useState(0);
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const combined = matchData ? [...matchData.innings1.log, ...matchData.innings2.log] : [];

  useEffect(() => {
    const t = setTimeout(() => setIsNight(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((s) => (wakeLockRef.current = s)).catch(() => {});
    return () => {
      wakeLockRef.current?.release().catch(() => {});
    };
  }, []);

  // Countdown to the shared startAt so both phones begin animating at the same instant.
  useEffect(() => {
    if (!matchData) return;
    const tick = () => {
      const msLeft = matchData.startAt - Date.now();
      if (msLeft <= 0) {
        setCountdown(null);
        return;
      }
      setCountdown(Math.ceil(msLeft / 1000));
      requestAnimationFrame(tick);
    };
    tick();
  }, [matchData]);

  useEffect(() => {
    if (!matchData || countdown !== null) return;
    if (revealed >= combined.length) {
      const done = setTimeout(() => revealResult(), 1400);
      return () => clearTimeout(done);
    }
    const ball = combined[revealed];
    const baseDelay = 120 / speed;
    const extraPause = ball.outcome === 'WICKET' ? 500 : ball.outcome === 'FOUR' || ball.outcome === 'SIX' ? 250 : 0;
    const timer = setTimeout(() => {
      setRevealed((r) => r + 1);
      if (ball.outcome === 'WICKET') {
        haptics.wicket();
        setWicketPulse((p) => p + 1);
      }
      if (ball.outcome === 'SIX') {
        setSixPulse((p) => p + 1);
      }
    }, baseDelay + extraPause);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, countdown, matchData, speed]);

  if (!matchData) return null;

  const revealedCount1 = Math.min(revealed, matchData.innings1.log.length);
  const revealedCount2 = Math.max(0, revealed - matchData.innings1.log.length);
  const currentBall = combined[Math.max(0, revealed - 1)];
  const inningsNumber: 1 | 2 = revealedCount2 > 0 || revealedCount1 >= matchData.innings1.log.length ? 2 : 1;
  const liveRuns = inningsNumber === 1 ? (combined[revealedCount1 - 1]?.scoreAfter.runs ?? 0) : (combined[matchData.innings1.log.length + revealedCount2 - 1]?.scoreAfter.runs ?? 0);
  const liveWickets = inningsNumber === 1 ? (combined[revealedCount1 - 1]?.scoreAfter.wickets ?? 0) : (combined[matchData.innings1.log.length + revealedCount2 - 1]?.scoreAfter.wickets ?? 0);
  const ballsFaced = inningsNumber === 1 ? revealedCount1 : revealedCount2;
  const target = inningsNumber === 2 ? matchData.innings1.runs + 1 : null;

  return (
    <div className={`paper-night ${isNight ? 'is-night' : ''} min-h-dvh w-full`}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-24 pt-6">
        {countdown !== null ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="font-display text-6xl font-extrabold text-floodlight">{countdown}</span>
          </div>
        ) : (
          <>
            <Scoreboard inningsNumber={inningsNumber} runs={liveRuns} wickets={liveWickets} ballsFaced={ballsFaced} oversPerSide={oversPerSide} target={target} />
            <div className="mt-3">
              <CommentaryLine text={currentBall?.commentary ?? ''} isWicket={currentBall?.outcome === 'WICKET'} />
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              <Ledger
                innings1Log={matchData.innings1.log}
                innings2Log={matchData.innings2.log}
                revealedCount1={revealedCount1}
                revealedCount2={revealedCount2}
                oversPerSide={oversPerSide}
              />
            </div>
          </>
        )}

        <div key={wicketPulse} className={`wicket-blot ${wicketPulse > 0 ? 'is-active' : ''} pointer-events-none fixed inset-0 z-30 bg-scorer-red`} aria-hidden="true">
          {wicketPulse > 0 && (
            <span className="absolute left-1/2 top-1/3 -translate-x-1/2 text-6xl font-black text-ledger">W</span>
          )}
        </div>
        <div
          key={`six-${sixPulse}`}
          className={`six-flash ${sixPulse > 0 ? 'is-active' : ''} pointer-events-none fixed inset-x-0 top-0 z-30 h-32 bg-gradient-to-b from-floodlight to-transparent`}
          aria-hidden="true"
        />

        <MatchControls speed={speed} onSpeedChange={setSpeed} onSkip={revealResult} />
      </div>
    </div>
  );
}
