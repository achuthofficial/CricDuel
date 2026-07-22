import { useState } from 'react';
import { SLOT_LABELS } from '../../lib/types';
import type { Player } from '../../lib/types';

interface SlotStripProps {
  squad: (Player | null)[];
}

export function SlotStrip({ squad }: SlotStripProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="tap-target flex w-full items-center justify-between rounded-lg bg-ink/5 px-3 py-2 text-left"
      >
        <div className="flex gap-1">
          {squad.map((p, i) => (
            <span
              key={i}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                p ? 'bg-ink text-ledger' : 'bg-ink/10 text-ink/40'
              }`}
            >
              {p ? p.name.slice(0, 1) : i + 1}
            </span>
          ))}
        </div>
        <span className="text-xs font-medium text-ink/60">{expanded ? 'Hide XI' : 'Your XI'}</span>
      </button>
      {expanded && (
        <div className="mt-2 flex flex-col gap-1 rounded-lg bg-ink/5 p-2">
          {squad.map((p, i) => (
            <div key={i} className="flex items-center justify-between px-2 py-1 text-sm">
              <span className="text-ink/50">{SLOT_LABELS[i]}</span>
              <span className="font-medium">{p ? p.name : '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
