import { useEffect, useState } from 'react';
import { gameClock, SECONDS_UNTIL_RELEASE } from '../lib/time';

export type DoorState = 'cleared' | 'current' | 'locked';

interface Props {
  startedAt: number;
  doors: { number: number; title: string; state: DoorState }[];
  hintsUsed: number;
  onReset: () => void;
}

function formatCountdown(seconds: number): string {
  const s = Math.abs(seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function Hud({ startedAt, doors, hintsUsed, onReset }: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = now - startedAt;
  const remaining = SECONDS_UNTIL_RELEASE - Math.floor(elapsed / 1000);
  const late = remaining <= 0;
  const urgent = !late && remaining <= 120;

  function handleReset() {
    if (confirm('Restart from Room 1? Your progress will be lost.')) onReset();
  }

  return (
    <header className="hud">
      <div className="hud__brand">
        <span className="live-dot" aria-hidden="true" />
        <span className="hud__title">Release Night</span>
      </div>

      <ol className="hud__doors" aria-label="Rooms">
        {doors.map((door) => (
          <li
            key={door.number}
            className={`door-pip door-pip--${door.state}`}
            aria-label={`Room ${door.number}, ${door.title}: ${door.state}`}
            aria-current={door.state === 'current' ? 'step' : undefined}
            title={`${door.number}. ${door.title}`}
          >
            {door.state === 'cleared' ? '✓' : door.number}
          </li>
        ))}
      </ol>

      <div className="hud__stats">
        <span className="hud__stat" title="Hints used">
          <span className="hud__stat-label">Hints</span> {hintsUsed}
        </span>
        <span className="hud__stat hud__stat--clock" aria-label="Game clock">
          <span className="hud__stat-label">Clock</span> {gameClock(elapsed)}
        </span>
        <span
          className={`hud__countdown${urgent ? ' hud__countdown--urgent' : ''}${late ? ' hud__countdown--late' : ''}`}
          aria-label={late ? 'Version 2.3 has shipped' : 'Time until release'}
        >
          {late ? `SHIPPED +${formatCountdown(remaining)}` : `T−${formatCountdown(remaining)}`}
        </span>
        <button className="btn btn--ghost btn--small" onClick={handleReset}>
          Restart
        </button>
      </div>
    </header>
  );
}
