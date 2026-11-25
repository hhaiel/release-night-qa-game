import { useEffect } from 'react';

interface Props {
  onDone: () => void;
}

/** Short "access granted" animation between solving a room and its debrief. */
export function DoorUnlock({ onDone }: Props) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(onDone, reduced ? 600 : 1800);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="door" role="status">
      <div className="door__panel door__panel--left" />
      <div className="door__panel door__panel--right" />
      <p className="door__text">Access granted</p>
    </div>
  );
}
