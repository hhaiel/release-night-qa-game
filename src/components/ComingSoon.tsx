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
      <h1 id="coming-soon-title">The next door is still being built</h1>
      <p>You&rsquo;ve cleared every room that exists so far. Here&rsquo;s what&rsquo;s coming:</p>
      <ol className="plan">
        {plan.map((room) => (
          <li key={room.number} className={room.number <= builtCount ? 'plan__done' : undefined}>
            <span className="plan__title">
              {room.number}. {room.title}
            </span>
            <span className="plan__skill">{room.skill}</span>
            {room.number <= builtCount && <span className="plan__badge">Cleared</span>}
          </li>
        ))}
      </ol>
      <button className="btn btn--ghost" onClick={onReset}>
        Play again from Room 1
      </button>
    </section>
  );
}
