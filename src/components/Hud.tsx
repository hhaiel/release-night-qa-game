import { useEffect, useState } from 'react';
import { gameClock, SECONDS_UNTIL_RELEASE } from '../lib/time';

interface Props {
  startedAt: number;
  roomNumber: number;
  totalRooms: number;
  onReset: () => void;
}

export function Hud({ startedAt, roomNumber, totalRooms, onReset }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - startedAt;
  const late = elapsed / 1000 >= SECONDS_UNTIL_RELEASE;

  function handleReset() {
    if (confirm('Restart from Room 1? Your progress will be lost.')) onReset();
  }

  return (
    <header className="hud">
      <span className="hud__title">Release Night</span>
      <span className="hud__room">
        Room {Math.min(roomNumber, totalRooms)} / {totalRooms}
      </span>
      <span className={`hud__clock${late ? ' hud__clock--late' : ''}`} aria-label="Game clock">
        {gameClock(elapsed)}
        {late && <span className="hud__shipped"> v2.3 shipped</span>}
      </span>
      <button className="btn btn--ghost btn--small" onClick={handleReset}>
        Restart
      </button>
    </header>
  );
}
