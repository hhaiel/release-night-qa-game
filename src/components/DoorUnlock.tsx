import { useEffect } from 'react';

interface Props {
  roomNumber: number;
  onDone: () => void;
}

/** Short "access granted" animation between solving a room and its debrief. */
export function DoorUnlock({ roomNumber, onDone }: Props) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(onDone, reduced ? 700 : 2200);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="vault" role="status">
      <div className="vault__light" aria-hidden="true" />
      <div className="vault__panel vault__panel--left" aria-hidden="true" />
      <div className="vault__panel vault__panel--right" aria-hidden="true" />
      <div className="vault__lock" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="56" height="56">
          <path className="vault__shackle" d="M15 22v-6a9 9 0 0 1 18 0" fill="none" strokeWidth="4" strokeLinecap="round" />
          <rect x="10" y="22" width="28" height="20" rx="4" />
          <circle cx="24" cy="32" r="3" className="vault__keyhole" />
        </svg>
      </div>
      <p className="vault__text">
        <span className="vault__room">Door {String(roomNumber).padStart(2, '0')}</span>
        Access granted
      </p>
    </div>
  );
}
