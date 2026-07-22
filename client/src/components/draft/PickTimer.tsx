import { useEffect, useState } from 'react';

interface PickTimerProps {
  startedAt: number | null;
  durationMs?: number;
}

export function PickTimer({ startedAt, durationMs = 40000 }: PickTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [startedAt]);

  if (startedAt === null) return <div className="h-1.5 w-full rounded-full bg-ink/10" />;

  const elapsed = now - startedAt;
  const remaining = Math.max(0, durationMs - elapsed);
  const pct = Math.max(0, Math.min(100, (remaining / durationMs) * 100));
  const urgent = remaining <= 8000;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${urgent ? 'bg-scorer-red' : 'bg-turf'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular w-8 text-right text-xs text-ink/60">{Math.ceil(remaining / 1000)}s</span>
    </div>
  );
}
