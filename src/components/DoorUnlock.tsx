import { useEffect } from 'react';

interface Props {
  roomNumber: number;
  /** What the caption says once the door is open. Defaults to "Unlocked". */
  label?: string;
  /** Game clock at the moment the door opened, e.g. "23:51:07". */
  time?: string;
  onDone: () => void;
}

/**
 * The door to the next room: the badge reader turns green, the door swings open, light spills
 * into the corridor. Pure CSS (3D transform on the door); reduced motion shows it already open.
 */
export function DoorUnlock({ roomNumber, label = 'Unlocked', time, onDone }: Props) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = setTimeout(onDone, reduced ? 700 : 2400);
    return () => clearTimeout(id);
  }, [onDone]);

  const number = String(roomNumber).padStart(2, '0');

  return (
    <div className="unlock" role="status">
      <div className="unlock__scene" aria-hidden="true">
        <div className="unlock__wall">
          <div className="unlock__reader">
            <span className="unlock__reader-led" />
            <span className="unlock__reader-slot" />
          </div>
          <div className="unlock__frame">
            <div className="unlock__room" />
            <div className="unlock__door">
              <span className="unlock__plate">{number}</span>
              <span className="unlock__window" />
              <span className="unlock__handle" />
              <span className="unlock__kick" />
            </div>
          </div>
        </div>
        <div className="unlock__floor">
          <span className="unlock__spill" />
        </div>
      </div>
      <p className="unlock__caption">
        <span className="unlock__caption-door">Door {number}</span>
        <span className="unlock__caption-label">{label}</span>
        {time && <span className="unlock__caption-time">{time}</span>}
      </p>
    </div>
  );
}
