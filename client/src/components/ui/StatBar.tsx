interface StatBarProps {
  label: string;
  value: number;
}

export function StatBar({ label, value }: StatBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-medium text-ink/60">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-turf" style={{ width: `${Math.max(4, value)}%` }} />
      </div>
      <span className="tabular w-6 shrink-0 text-right text-xs text-ink/70">{value}</span>
    </div>
  );
}
