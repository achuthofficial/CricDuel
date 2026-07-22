interface MatchControlsProps {
  speed: 1 | 2;
  onSpeedChange: (speed: 1 | 2) => void;
  onSkip: () => void;
}

export function MatchControls({ speed, onSpeedChange, onSkip }: MatchControlsProps) {
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-ledger/95 px-4 py-3 backdrop-blur">
      <button
        onClick={onSkip}
        className="tap-target rounded-lg border-2 border-ink/20 px-4 py-2 text-sm font-semibold active:bg-ink/10"
      >
        Skip to result
      </button>
      <div className="flex overflow-hidden rounded-lg border-2 border-ink/20">
        {([1, 2] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`tap-target px-4 py-2 text-sm font-semibold ${speed === s ? 'bg-ink text-ledger' : 'active:bg-ink/10'}`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
