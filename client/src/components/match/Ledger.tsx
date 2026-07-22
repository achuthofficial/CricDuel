import type { BallEvent } from '../../lib/types';

interface LedgerGridProps {
  log: BallEvent[];
  revealedCount: number;
  oversPerSide: number;
  tone: 'you' | 'opponent';
  label: string;
}

function cellContent(ball: BallEvent) {
  switch (ball.outcome) {
    case 'DOT':
      return '·';
    case 'WICKET':
      return 'W';
    case 'WIDE':
      return 'wd';
    case 'NOBALL':
      return 'nb';
    case 'FOUR':
      return '4';
    case 'SIX':
      return '6';
    default:
      return ball.outcome;
  }
}

// Cells are rendered as little scorebook stamps — a light paper chip so the
// navy/red ink stays legible against the floodlit night background behind them.
function LedgerGrid({ log, revealedCount, oversPerSide, tone, label }: LedgerGridProps) {
  const ink = tone === 'you' ? 'text-ink' : 'text-scorer-red';
  const rows = Array.from({ length: oversPerSide }, (_, over) => {
    const cells = Array.from({ length: 6 }, (_, ball) => {
      const index = over * 6 + ball;
      const event = index < revealedCount ? log[index] : null;
      return { event, index };
    });
    return { over, cells };
  });

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ledger/60">{label}</p>
      <div className="grid grid-cols-6 gap-[3px]">
        {rows.flatMap(({ over, cells }) =>
          cells.map(({ event, index }) => (
            <div
              key={`${over}-${index}`}
              className={`ledger-cell flex aspect-square items-center justify-center rounded-[3px] text-[10px] font-bold tabular ${
                event
                  ? `bg-ledger ${ink} ${event.outcome === 'SIX' ? 'bg-floodlight' : ''} ${
                      event.outcome === 'WICKET' ? 'rounded-full ring-2 ring-scorer-red text-scorer-red' : ''
                    }`
                  : 'bg-ledger/10 text-transparent'
              }`}
              style={{ '--stagger': `${(index % 6) * 80}ms` } as React.CSSProperties}
            >
              {event ? cellContent(event) : '·'}
            </div>
          )),
        )}
      </div>
    </div>
  );
}

interface LedgerProps {
  innings1Log: BallEvent[];
  innings2Log: BallEvent[];
  revealedCount1: number;
  revealedCount2: number;
  oversPerSide: number;
}

/** The signature element (§8): a scorebook grid stamping in ball by ball,
 * innings 1 in navy and innings 2 in red so the two races are visibly compared. */
export function Ledger({ innings1Log, innings2Log, revealedCount1, revealedCount2, oversPerSide }: LedgerProps) {
  return (
    <div className="flex flex-col gap-4 overflow-x-auto">
      <LedgerGrid log={innings1Log} revealedCount={revealedCount1} oversPerSide={oversPerSide} tone="you" label="Innings 1" />
      <LedgerGrid log={innings2Log} revealedCount={revealedCount2} oversPerSide={oversPerSide} tone="opponent" label="Innings 2" />
    </div>
  );
}
