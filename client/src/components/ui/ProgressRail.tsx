interface ProgressRailProps {
  label: string;
  filled: number;
  total?: number;
  tone: 'you' | 'opponent';
}

/** 11-dot progress rail. Opponent rail is dots only — never names, nations, or ratings (§3.3, §7.3). */
export function ProgressRail({ label, filled, total = 11, tone }: ProgressRailProps) {
  const color = tone === 'you' ? 'bg-ink' : 'bg-scorer-red';
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-ink/60">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${i < filled ? color : 'bg-ink/15'}`}
          />
        ))}
      </div>
    </div>
  );
}
