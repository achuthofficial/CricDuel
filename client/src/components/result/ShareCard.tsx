import { useRef } from 'react';
import { Button } from '../ui/Button';
import { shareImage } from '../../lib/share';
import { useGameStore } from '../../store/useGameStore';
import { formatMargin, formatScore } from '../../lib/format';
import type { InningsResult } from '../../lib/types';

interface ShareCardProps {
  winnerName: string;
  margin: { type: 'runs' | 'wickets' | 'tie-breaker'; value: number };
  innings1: InningsResult;
  innings2: InningsResult;
  code: string | null;
}

export function ShareCard({ winnerName, margin, innings1, innings2, code }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pushToast = useGameStore((s) => s.pushToast);

  async function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;
    ctx.fillStyle = '#071A14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFE9B0';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText('CRICDUEL', 40, 70);
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`${winnerName} won`, 40, 160);
    ctx.font = '28px sans-serif';
    ctx.fillText(formatMargin(margin), 40, 205);
    ctx.font = '32px monospace';
    ctx.fillText(`Innings 1: ${formatScore(innings1.runs, innings1.wickets)}`, 40, 280);
    ctx.fillText(`Innings 2: ${formatScore(innings2.runs, innings2.wickets)}`, 40, 320);
    if (code) {
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#FFE9B0AA';
      ctx.fillText(`Room ${code}`, 40, 460);
    }

    const outcome = await shareImage(canvas, 'cricduel-result.png');
    if (outcome === 'downloaded') pushToast('Result image downloaded');
    if (outcome === 'shared') pushToast('Shared!');
    if (outcome === 'failed') pushToast('Could not share the result image');
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Button variant="secondary" onClick={handleShare}>
        Share result
      </Button>
    </>
  );
}
