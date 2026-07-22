import { useEffect, useRef, useState } from 'react';
import type { WheelSegment } from '../../lib/types';

interface WheelProps {
  segments: WheelSegment[] | null;
  landedIndex: number | null;
  spinToken: number;
}

// Geometric marks in an original palette — never flags or board crests (§5.1, §8).
const SEGMENT_COLORS = ['#14213D', '#C1121F', '#1FA97C', '#EDE6D6', '#071A14', '#FFE9B0', '#8C5E3C', '#5B7DB1'];
const NATION_MARKS: Record<string, string> = {
  India: '◆',
  Australia: '▲',
  England: '●',
  'West Indies': '■',
  Pakistan: '◈',
  'South Africa': '▼',
  'Sri Lanka': '◉',
  'New Zealand': '★',
};

export function Wheel({ segments, landedIndex, spinToken }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const lastToken = useRef(0);

  useEffect(() => {
    if (segments === null || landedIndex === null || spinToken === lastToken.current) return;
    lastToken.current = spinToken;
    const segAngle = 360 / segments.length;
    const targetMod = (360 - landedIndex * segAngle) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360;
    const spins = 4 + (spinToken % 3);
    setRotation((r) => r + spins * 360 + delta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinToken, segments, landedIndex]);

  const displaySegments = segments ?? [
    'India', 'Australia', 'England', 'West Indies', 'Pakistan', 'South Africa', 'Sri Lanka', 'New Zealand',
  ].map((nation) => ({ nation, available: true }));
  const segAngle = 360 / displaySegments.length;

  const gradient = displaySegments
    .map((s, i) => {
      const color = s.available ? SEGMENT_COLORS[i % SEGMENT_COLORS.length] : '#9c9284';
      return `${color} ${i * segAngle}deg ${(i + 1) * segAngle}deg`;
    })
    .join(', ');

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
      <div
        aria-hidden="true"
        className="absolute -top-1 left-1/2 z-10 h-4 w-4 -translate-x-1/2 rotate-45 border-2 border-ledger bg-ink"
      />
      <div
        className="wheel-dial h-full w-full rounded-full border-4 border-ink shadow-[0_6px_20px_rgba(7,26,20,0.25)]"
        style={{ transform: `rotate(${rotation}deg)`, background: `conic-gradient(${gradient})` }}
        role="img"
        aria-label="Squad wheel"
      >
        {displaySegments.map((s, i) => {
          const mid = i * segAngle + segAngle / 2;
          return (
            <div
              key={s.nation}
              className="absolute left-1/2 top-1/2 h-0 w-0"
              style={{ transform: `rotate(${mid}deg) translate(0, -76px) rotate(${-mid}deg)` }}
            >
              <span
                className={`wheel-label -translate-x-1/2 -translate-y-1/2 text-lg ${s.available ? 'text-ledger' : 'text-ledger/50'}`}
                style={{ transform: `rotate(${-rotation}deg)`, display: 'inline-block' }}
              >
                {NATION_MARKS[s.nation]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="absolute h-14 w-14 rounded-full border-4 border-ledger bg-ink" />
    </div>
  );
}
