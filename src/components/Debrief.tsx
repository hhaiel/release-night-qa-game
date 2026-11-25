import { useEffect, useRef } from 'react';
import type { RoomDefinition } from '../game/types';
import type { RoomProgress } from '../game/progress';
import { formatDuration } from '../lib/time';
import { HINT_COST } from './HintPanel';

interface Props {
  room: RoomDefinition;
  progress: RoomProgress;
  onContinue: () => void;
}

export function Debrief({ room, progress, onContinue }: Props) {
  const { debrief } = room;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Start at the top, and move keyboard/screen-reader focus to the heading.
  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);
  const time =
    progress.enteredAt && progress.solvedAt ? formatDuration(progress.solvedAt - progress.enteredAt) : null;

  return (
    <article className="debrief" aria-labelledby="debrief-title">
      <p className="eyebrow">Room {room.number} cleared · Debrief</p>
      <h1 id="debrief-title" ref={headingRef} tabIndex={-1}>{debrief.bug}</h1>
      <p className="debrief__stats">
        {time && <span>Time: {time}</span>}
        <span>
          Hints: {progress.hintsUsed}
          {progress.hintsUsed > 0 && ` (−${progress.hintsUsed * HINT_COST} pts)`}
        </span>
        <span>Skill: {room.skill}</span>
      </p>

      <section>
        <h2>What was wrong</h2>
        <p>{debrief.whatWasWrong}</p>
      </section>
      <section>
        <h2>Why it matters</h2>
        <p>{debrief.whyItMatters}</p>
      </section>
      <section>
        <h2>How you found it</h2>
        <p>{debrief.howYouFoundIt}</p>
      </section>

      <section>
        <h2>How you&rsquo;d report it</h2>
        <dl className="report">
          <dt>Title</dt>
          <dd>{debrief.report.title}</dd>
          <dt>Severity</dt>
          <dd>
            <span className={`sev sev--${debrief.report.severity.toLowerCase()}`}>{debrief.report.severity}</span>
          </dd>
          <dt>Category</dt>
          <dd>{debrief.report.category}</dd>
          <dt>Steps to reproduce</dt>
          <dd>
            <ol>
              {debrief.report.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </dd>
          <dt>Expected</dt>
          <dd>{debrief.report.expected}</dd>
          <dt>Actual</dt>
          <dd>{debrief.report.actual}</dd>
        </dl>
      </section>

      <aside className="tip">
        <h2>Tester tip</h2>
        <p>{debrief.testerTip}</p>
      </aside>

      <button className="btn btn--primary" onClick={onContinue}>
        Next room &rarr;
      </button>
    </article>
  );
}
