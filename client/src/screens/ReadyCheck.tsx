import { Button } from '../components/ui/Button';
import { SLOT_LABELS } from '../lib/types';
import { useGameStore } from '../store/useGameStore';
import { setReady } from '../store/useSocket';

export function ReadyCheck() {
  const you = useGameStore((s) => s.you);
  const opponent = useGameStore((s) => s.opponent);

  if (!you) return null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pb-10 pt-8">
      <h1 className="font-display text-center text-xl font-bold">Your XI</h1>
      <div className="mt-4 flex-1 overflow-y-auto rounded-xl bg-ink/5 p-3">
        {you.squad.map((p, i) => (
          <div key={i} className="flex items-center justify-between border-b border-ink/10 py-2 text-sm last:border-0">
            <span className="text-ink/50">{SLOT_LABELS[i]}</span>
            <span className="font-semibold">{p?.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {!you.ready ? (
          <Button onClick={() => setReady(true)}>Ready</Button>
        ) : (
          <div className="text-center">
            <p className="font-display animate-pulse text-lg font-bold text-turf">Waiting for {opponent?.name ?? 'opponent'}…</p>
            <button onClick={() => setReady(false)} className="mt-3 text-xs text-ink/40 underline">
              Cancel ready
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
