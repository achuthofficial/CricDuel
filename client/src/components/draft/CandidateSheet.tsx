import { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { StatBar } from '../ui/StatBar';
import type { Player } from '../../lib/types';

interface CandidateSheetProps {
  open: boolean;
  slotLabel: string;
  nation: string | null;
  candidates: Player[];
  respinsLeft: number;
  onConfirm: (playerId: string) => void;
  onRespin: () => void;
}

export function CandidateSheet({ open, slotLabel, nation, candidates, respinsLeft, onConfirm, onRespin }: CandidateSheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Sheet open={open}>
      <div className="pb-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/60">
              {slotLabel} · {nation}
            </p>
            <h2 className="font-display text-lg font-bold">Pick your player</h2>
          </div>
          <button
            onClick={onRespin}
            disabled={respinsLeft <= 0}
            className="tap-target shrink-0 rounded-lg border-2 border-ink/20 px-3 py-1.5 text-xs font-semibold disabled:opacity-30"
          >
            Re-spin ({respinsLeft})
          </button>
        </div>
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {candidates.map((p) => {
            const selected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`tap-target rounded-xl border-2 p-3 text-left transition-colors ${
                  selected ? 'border-turf bg-turf/10' : 'border-ink/15 bg-ledger active:bg-ink/5'
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="font-display font-bold">{p.name}</span>
                  <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-medium">{p.era}</span>
                </div>
                <p className="mb-2 text-xs text-ink/60">{p.nation}</p>
                <div className="flex flex-col gap-1">
                  <StatBar label="Bat" value={p.bat} />
                  <StatBar label="Strike" value={p.strike} />
                  <StatBar label="Bowl" value={p.bowl} />
                  <StatBar label="Economy" value={p.economy} />
                </div>
              </button>
            );
          })}
        </div>
        <Button
          className="safe-bottom mt-4"
          disabled={!selectedId}
          onClick={() => {
            if (selectedId) {
              onConfirm(selectedId);
              setSelectedId(null);
            }
          }}
        >
          Confirm pick
        </Button>
      </div>
    </Sheet>
  );
}
