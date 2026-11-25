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
    progress.enteredAt && progress.solvedAt ? formatDuration(progress.solvedAt - progress.enteredAt) : '—';
  const ticketId = `SHOP-${2300 + room.number}`;

  return (
    <article className="debrief" aria-labelledby="debrief-title">
      <p className="eyebrow">
        Room {String(room.number).padStart(2, '0')} cleared · Debrief
      </p>

      <div className="ticket">
        <div className="ticket__stamp" aria-hidden="true">
          Bug found
        </div>
        <div className="ticket__head">
          <span className="ticket__id">{ticketId}</span>
          <span className="chip chip--bug">Bug</span>
          <span className={`chip sev sev--${debrief.report.severity.toLowerCase()}`}>{debrief.report.severity}</span>
          <span className="chip">{debrief.report.category}</span>
        </div>
        <h1 id="debrief-title" ref={headingRef} tabIndex={-1}>
          {debrief.bug}
        </h1>

        <dl className="stat-tiles">
          <div className="stat-tile">
            <dt>Time in room</dt>
            <dd>{time}</dd>
          </div>
          <div className="stat-tile">
            <dt>Hints used</dt>
            <dd>
              {progress.hintsUsed}
              {progress.hintsUsed > 0 && <small> (&minus;{progress.hintsUsed * HINT_COST})</small>}
            </dd>
          </div>
          <div className="stat-tile stat-tile--wide">
            <dt>Skill</dt>
            <dd>{room.skill}</dd>
          </div>
        </dl>
      </div>

      <div className="explain">
        <section className="explain__card">
          <span className="explain__icon" aria-hidden="true">
            ✕
          </span>
          <h2>What was wrong</h2>
          <p>{debrief.whatWasWrong}</p>
        </section>
        <section className="explain__card">
          <span className="explain__icon" aria-hidden="true">
            !
          </span>
          <h2>Why it matters</h2>
          <p>{debrief.whyItMatters}</p>
        </section>
        <section className="explain__card">
          <span className="explain__icon" aria-hidden="true">
            ⌕
          </span>
          <h2>How you found it</h2>
          <p>{debrief.howYouFoundIt}</p>
        </section>
      </div>

      <section className="report-card" aria-labelledby="report-title">
        <h2 id="report-title">
          How you&rsquo;d report it <span className="report-card__id">{ticketId}</span>
        </h2>
        <dl className="report">
          <dt>Title</dt>
          <dd className="report__title">{debrief.report.title}</dd>
          <dt>Severity</dt>
          <dd>
            <span className={`chip sev sev--${debrief.report.severity.toLowerCase()}`}>
              {debrief.report.severity}
            </span>
          </dd>
          <dt>Category</dt>
          <dd>{debrief.report.category}</dd>
          <dt>Steps</dt>
          <dd>
            <ol className="report__steps">
              {debrief.report.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </dd>
          <dt>Expected</dt>
          <dd className="report__expected">{debrief.report.expected}</dd>
          <dt>Actual</dt>
          <dd className="report__actual">{debrief.report.actual}</dd>
        </dl>
      </section>

      <aside className="tip">
        <h2>Tester tip</h2>
        <p>{debrief.testerTip}</p>
      </aside>

      <button className="btn btn--primary btn--big" onClick={onContinue}>
        Next door <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}
