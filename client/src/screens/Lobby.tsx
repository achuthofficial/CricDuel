import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/useGameStore';
import { leaveRoom, startDraft } from '../store/useSocket';
import { shareOrCopy } from '../lib/share';

export function Lobby() {
  const code = useGameStore((s) => s.code);
  const you = useGameStore((s) => s.you);
  const opponent = useGameStore((s) => s.opponent);
  const pushToast = useGameStore((s) => s.pushToast);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  async function handleShare() {
    if (!code) return;
    const url = `${window.location.origin}/j/${code}`;
    const outcome = await shareOrCopy({ title: 'Join my CricDuel room', text: `Join my cricket draft — code ${code}`, url });
    if (outcome === 'copied') pushToast('Invite link copied');
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pb-10">
      <div className="flex-1" />

      <p className="text-center text-xs font-medium uppercase tracking-wide text-ink/50">Room code</p>
      <button
        onClick={handleCopy}
        className="tap-target font-mono my-2 rounded-2xl border-2 border-dashed border-ink/30 py-6 text-center text-5xl font-bold tracking-[0.3em]"
      >
        {code}
      </button>
      <p className="mb-6 text-center text-xs text-ink/50">{copied ? 'Copied!' : 'Tap to copy'}</p>

      <Button variant="secondary" onClick={handleShare} className="mb-6">
        Share invite
      </Button>

      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-ink/5 p-4 text-center">
          <p className="text-xs text-ink/50">You</p>
          <p className="mt-1 font-semibold">{you?.displayName}</p>
        </div>
        <div className={`rounded-xl border-2 p-4 text-center ${opponent ? 'bg-ink/5' : 'border-dashed border-ink/25'}`}>
          <p className="text-xs text-ink/50">Opponent</p>
          <p className={`mt-1 font-semibold ${opponent ? '' : 'animate-pulse text-ink/40'}`}>
            {opponent?.name ?? 'Waiting…'}
          </p>
        </div>
      </div>

      {you?.isHost ? (
        <Button disabled={!opponent} onClick={startDraft}>
          {opponent ? 'Start draft' : 'Waiting for opponent…'}
        </Button>
      ) : (
        <p className="text-center text-sm text-ink/60">Waiting for host to start the draft…</p>
      )}

      <div className="flex-1" />
      <button onClick={leaveRoom} className="text-center text-xs text-ink/40 underline">
        Leave room
      </button>
    </div>
  );
}
