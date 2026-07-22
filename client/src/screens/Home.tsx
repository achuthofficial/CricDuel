import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useGameStore } from '../store/useGameStore';
import { createRoom, joinRoom, socket } from '../store/useSocket';
import type { ApiError } from '../lib/types';

function deepLinkCode(): string {
  const match = window.location.pathname.match(/\/j\/([A-Za-z0-9]{4})/);
  return match ? match[1].toUpperCase() : '';
}

export function Home() {
  const displayName = useGameStore((s) => s.displayName);
  const setDisplayName = useGameStore((s) => s.setDisplayName);
  const [mode, setMode] = useState<'idle' | 'join'>('idle');
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const linked = deepLinkCode();
    if (linked) {
      setCode(linked);
      setMode('join');
      window.history.replaceState(null, '', '/');
    }
  }, []);

  useEffect(() => {
    if (code.length === 4 && mode === 'join' && displayName.trim()) {
      joinRoom(code, displayName.trim());
    }
  }, [code, mode, displayName]);

  useEffect(() => {
    function handleError(_err: ApiError) {
      if (mode !== 'join') return;
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 400);
    }
    socket.on('error', handleError);
    return () => {
      socket.off('error', handleError);
    };
  }, [mode]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col px-6 pb-10">
      <div className="flex-1" />
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">CRICDUEL</h1>
        <p className="mt-1 text-sm text-ink/60">Head-to-head cricket draft</p>
      </div>

      <label className="mb-2 block text-xs font-medium text-ink/60" htmlFor="name">
        Your name
      </label>
      <input
        id="name"
        autoComplete="nickname"
        enterKeyHint="go"
        maxLength={20}
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Enter your name"
        className="tap-target mb-4 w-full rounded-xl border-2 border-ink/15 bg-ledger px-4 py-3 text-base outline-none focus:border-ink"
      />

      <div className="flex flex-col gap-3">
        <Button
          disabled={!displayName.trim()}
          onClick={() => createRoom(displayName.trim())}
        >
          Create room
        </Button>
        <Button variant="secondary" disabled={!displayName.trim()} onClick={() => setMode('join')}>
          Join room
        </Button>
      </div>

      {mode === 'join' && (
        <div className="mt-4">
          <label className="mb-2 block text-xs font-medium text-ink/60" htmlFor="code">
            Room code
          </label>
          <input
            id="code"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className={`tap-target w-full rounded-xl border-2 border-ink/15 bg-ledger px-4 py-3 text-center font-mono text-2xl tracking-[0.3em] outline-none focus:border-ink ${
              shake ? 'animate-pulse border-scorer-red' : ''
            }`}
            placeholder="ABCD"
          />
        </div>
      )}

      <div className="flex-1" />
      <p className="text-center text-xs leading-relaxed text-ink/50">
        Draft an XI in secret, one spin at a time. Both ready up, then watch the match play out.
      </p>
    </div>
  );
}
