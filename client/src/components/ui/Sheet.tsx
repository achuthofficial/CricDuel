import { useRef, useState, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  children: ReactNode;
}

/** Bottom sheet, not a centre modal (§7.3, §9) — reachable with a thumb, and
 * swipe-to-dismiss when the content allows closing. */
export function Sheet({ open, onClose, dismissible = false, children }: SheetProps) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  if (!open) return null;

  function onPointerDown(e: React.PointerEvent) {
    if (!dismissible) return;
    startY.current = e.clientY;
    dragging.current = true;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current || startY.current === null) return;
    const delta = Math.max(0, e.clientY - startY.current);
    setDragY(delta);
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragY > 100) onClose?.();
    setDragY(0);
    startY.current = null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-night/50"
        onClick={dismissible ? onClose : undefined}
      />
      <div
        className="safe-bottom relative z-10 w-full max-w-[440px] rounded-t-2xl bg-ledger px-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.25)]"
        style={{ transform: `translateY(${dragY}px)`, transition: dragging.current ? 'none' : 'transform 200ms ease' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {dismissible && <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-ink/20" />}
        {children}
      </div>
    </div>
  );
}
