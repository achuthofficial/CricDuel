import { useGameStore } from '../../store/useGameStore';

export function ToastStack() {
  const toasts = useGameStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-ledger shadow-lg" role="status">
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function ConnectionBanner() {
  const status = useGameStore((s) => s.connectionStatus);
  if (status !== 'disconnected' && status !== 'connecting') return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-scorer-red px-4 py-2 text-center text-sm font-medium text-ledger">
      {status === 'connecting' ? 'Reconnecting…' : 'Connection lost — trying to reconnect…'}
    </div>
  );
}
