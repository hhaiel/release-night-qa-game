import type { PlannedRoom } from '../game/types';

interface Props {
  plan: PlannedRoom[];
  builtCount: number;
  onReset: () => void;
}

export function ComingSoon({ plan, builtCount, onReset }: Props) {
  return (
    <section className="coming-soon" aria-labelledby="coming-soon-title">
      <p className="eyebrow">End of the playable build</p>
      <h1 id="coming-soon-title">The next door is still under construction</h1>
      <p className="coming-soon__lead">
        You&rsquo;ve cleared every room that exists so far. The rest of the floor is behind the tape.
      </p>

      <ol className="door-grid">
        {plan.map((room) => {
          const cleared = room.number <= builtCount;
          return (
            <li key={room.number} className={`door-card${cleared ? ' door-card--cleared' : ''}`}>
              <span className="door-card__num">{String(room.number).padStart(2, '0')}</span>
              <span className="door-card__icon" aria-hidden="true">
                {cleared ? '✓' : '🔒'}
              </span>
              <span className="door-card__title">{room.title}</span>
              <span className="door-card__skill">{room.skill}</span>
              <span className="door-card__status">{cleared ? 'Cleared' : 'Coming soon'}</span>
            </li>
          );
        })}
      </ol>

      <button className="btn btn--ghost" onClick={onReset}>
        Play again from Room 1
      </button>
    </section>
  );
}
