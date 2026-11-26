import { useEffect, useRef } from 'react';
import type { RoomDefinition } from '../game/types';
import type { RoomProgress } from '../game/progress';
import { formatDuration } from '../lib/time';
import { HINT_COST } from './HintPanel';

interface Props {
  room: RoomDefinition;
  progress: RoomProgress;
  /** Game clock when the room was solved, e.g. "23:51:07". */
  filedAt?: string;
  onContinue: () => void;
}

/** The debrief as a printed defect report: what was wrong, why it matters, and the report as filed. */
export function Debrief({ room, progress, filedAt, onContinue }: Props) {
  const { debrief } = room;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Start at the top, and move keyboard/screen-reader focus to the heading.
  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);

  const time =
    progress.enteredAt && progress.solvedAt ? formatDuration(progress.solvedAt - progress.enteredAt) : '—';
  const number = String(room.number).padStart(2, '0');
  const ticketId = `SHOP-${2300 + room.number}`;
  const severity = debrief.report.severity;

  return (
    <article className="debrief" aria-labelledby="debrief-title">
      <p className="debrief__kicker">Room {number} cleared · Debrief</p>

      <div className="sheet">
        <div className="sheet__stamp" aria-hidden="true">
          <span>Filed</span>
          {filedAt && <small>{filedAt}</small>}
        </div>

        <header className="sheet__head">
          <span>ShopRight QA · Defect report</span>
          <span>{ticketId}</span>
        </header>

        <h1 id="debrief-title" ref={headingRef} tabIndex={-1} className="sheet__title">
          {debrief.bug}
        </h1>

        <dl className="sheet__fields">
          <div>
            <dt>Severity</dt>
            <dd>
              <span className={`sev sev--${severity.toLowerCase()}`}>{severity}</span>
            </dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{debrief.report.category}</dd>
          </div>
          <div>
            <dt>Time in room</dt>
            <dd>{time}</dd>
          </div>
          <div>
            <dt>Hints used</dt>
            <dd>
              {progress.hintsUsed}
              {progress.hintsUsed > 0 && <span className="sheet__penalty"> (&minus;{progress.hintsUsed * HINT_COST})</span>}
            </dd>
          </div>
          <div className="sheet__fields-wide">
            <dt>Skill</dt>
            <dd>{room.skill}</dd>
          </div>
        </dl>

        <div className="sheet__body">
          <div className="sheet__notes">
            <section>
              <h2>
                <span aria-hidden="true">1</span> What was wrong
              </h2>
              <p>{debrief.whatWasWrong}</p>
            </section>
            <section>
              <h2>
                <span aria-hidden="true">2</span> Why it matters
              </h2>
              <p>{debrief.whyItMatters}</p>
            </section>
            <section>
              <h2>
                <span aria-hidden="true">3</span> How you found it
              </h2>
              <p>{debrief.howYouFoundIt}</p>
            </section>
          </div>

          <section className="sheet__form" aria-labelledby="as-filed">
            <h2 id="as-filed">How you&rsquo;d report it</h2>
            <dl>
              <dt>Title</dt>
              <dd className="sheet__form-title">{debrief.report.title}</dd>
              <dt>Steps</dt>
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
        </div>

        <aside className="sheet__review">
          <h2>Reviewer&rsquo;s note</h2>
          <p>{debrief.testerTip}</p>
        </aside>
      </div>

      <div className="debrief__actions">
        <button className="btn btn--primary btn--big" onClick={onContinue}>
          Next door <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}
