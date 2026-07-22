import { ProgressRail } from '../components/ui/ProgressRail';
import { Wheel } from '../components/draft/Wheel';
import { CandidateSheet } from '../components/draft/CandidateSheet';
import { PickTimer } from '../components/draft/PickTimer';
import { SlotStrip } from '../components/draft/SlotStrip';
import { useGameStore } from '../store/useGameStore';
import { pickPlayer, spinWheel } from '../store/useSocket';
import { SLOT_LABELS } from '../lib/types';

export function Draft() {
  const you = useGameStore((s) => s.you);
  const opponent = useGameStore((s) => s.opponent);
  const wheel = useGameStore((s) => s.wheel);
  const spinning = useGameStore((s) => s.spinning);
  const spinToken = useGameStore((s) => s.spinToken);
  const candidates = useGameStore((s) => s.candidates);
  const pickTimerStartedAt = useGameStore((s) => s.pickTimerStartedAt);

  if (!you) return null;

  const slotsFilled = you.squad.filter(Boolean).length;
  const draftComplete = slotsFilled >= 11;
  const currentSlot = Math.min(slotsFilled, 10);
  const currentNation = wheel && wheel.landedIndex !== null ? wheel.segments[wheel.landedIndex]?.nation ?? null : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-4 pb-32 pt-4">
      <div className="mb-4 flex items-start justify-between">
        <ProgressRail label="You" filled={slotsFilled} tone="you" />
        <span className="mt-3 text-xs font-medium text-ink/40">vs</span>
        <ProgressRail label={opponent?.name ?? 'them'} filled={opponent?.slotsFilled ?? 0} tone="opponent" />
      </div>

      <SlotStrip squad={you.squad} />

      {draftComplete ? (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <p className="font-display text-xl font-bold">Your XI is set</p>
          <p className="mt-2 text-sm text-ink/60">
            {opponent && opponent.slotsFilled >= 11 ? 'Heading to the ready check…' : 'Waiting for your opponent to finish drafting…'}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              Slot {currentSlot + 1} · {SLOT_LABELS[currentSlot]}
            </p>
          </div>
          <div className="mt-2">
            <PickTimer startedAt={pickTimerStartedAt} />
          </div>

          <div className="mt-6">
            <Wheel segments={wheel?.segments ?? null} landedIndex={wheel?.landedIndex ?? null} spinToken={spinToken} />
          </div>

          <div className="mt-8">
            <button
              onClick={() => spinWheel(false)}
              disabled={spinning || !!candidates}
              className="tap-target w-full rounded-xl bg-ink py-4 text-lg font-bold text-ledger disabled:opacity-40"
            >
              {spinning ? 'Spinning…' : 'SPIN'}
            </button>
            <div className="mt-3 flex justify-center gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full ${i < you.respinsLeft ? 'bg-ink' : 'bg-ink/15'}`}
                />
              ))}
              <span className="ml-1 text-xs text-ink/50">re-spins left</span>
            </div>
          </div>
        </>
      )}

      <CandidateSheet
        open={!!candidates}
        slotLabel={SLOT_LABELS[candidates?.slot ?? currentSlot]}
        nation={currentNation}
        candidates={candidates?.players ?? []}
        respinsLeft={you.respinsLeft}
        onConfirm={(id) => pickPlayer(id)}
        onRespin={() => spinWheel(true)}
      />
    </div>
  );
}
