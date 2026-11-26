import { useEffect, useRef, useState } from 'react';
import type { Progress } from '../game/progress';
import type { RoomDefinition } from '../game/types';
import { FINAL_ROOM_ID, MIDNIGHT_BONUS, totalScore } from '../game/score';
import { formatDuration, gameClock } from '../lib/time';

const REPO_URL = 'https://github.com/hhaiel/release-night-qa-game';

interface Props {
  rooms: RoomDefinition[];
  progress: Progress;
  onPlayAgain: () => void;
}

/** Counts a number up from 0, unless the player prefers reduced motion. */
function useCountUp(target: number, durationMs = 1400): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return value;
}

export function Ending({ rooms, progress, onPlayAgain }: Props) {
  const { perRoom, bonus, beforeMidnight, total, rank } = totalScore(rooms, progress);
  const shown = useCountUp(total);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, []);

  const endedAt = progress.rooms[FINAL_ROOM_ID]?.solvedAt ?? Date.now();
  const realTime = progress.startedAt ? endedAt - progress.startedAt : 0;
  const hintsUsed = Object.values(progress.rooms).reduce((sum, r) => sum + r.hintsUsed, 0);
  const reportScore = progress.rooms[FINAL_ROOM_ID]?.reportScore ?? 0;
  const bugs = rooms.filter((r) => r.id !== FINAL_ROOM_ID);

  return (
    <article className="ending" aria-labelledby="ending-title">
      <div className="ending__hero">
        <p className="eyebrow">
          {beforeMidnight ? 'Release blocked before midnight' : 'Release blocked (after midnight)'}
        </p>
        <h1 id="ending-title" ref={headingRef} tabIndex={-1}>
          <span className="ending__rank-label">Your rank</span>
          <span className="ending__rank">{rank.title}</span>
        </h1>
        <p className="ending__blurb">{rank.blurb}</p>
        {/* aria-label on a plain <p> is ignored by screen readers, so the real score is hidden text. */}
        <p className="ending__score">
          <span className="visually-hidden">Total score: {total.toLocaleString()} points</span>
          <span aria-hidden="true">{shown.toLocaleString()}</span>
          <small aria-hidden="true">pts</small>
        </p>
      </div>

      <dl className="stat-tiles ending__tiles">
        <div className="stat-tile">
          <dt>Time</dt>
          <dd>{formatDuration(realTime)}</dd>
        </div>
        <div className="stat-tile">
          <dt>Clock at finish</dt>
          <dd className={beforeMidnight ? 'is-ok' : 'is-late'}>{gameClock(realTime)}</dd>
        </div>
        <div className="stat-tile">
          <dt>Hints used</dt>
          <dd>{hintsUsed}</dd>
        </div>
        <div className="stat-tile">
          <dt>Bug report</dt>
          <dd>{reportScore}/100</dd>
        </div>
      </dl>

      <div className="ending__grid">
        <section className="ending__card" aria-labelledby="breakdown-title">
          <h2 id="breakdown-title">Score breakdown</h2>
          <ol className="breakdown">
            {perRoom.map(({ room, base, hintPenalty, points }) => (
              <li key={room.id}>
                <span className="breakdown__num">{String(room.number).padStart(2, '0')}</span>
                <span className="breakdown__title">
                  {room.title}
                  {hintPenalty > 0 && (
                    <small>
                      {base.toLocaleString()} &minus; {hintPenalty} for hints
                    </small>
                  )}
                </span>
                <span className="breakdown__pts">{points.toLocaleString()}</span>
              </li>
            ))}
            <li className={bonus ? 'breakdown__bonus' : 'breakdown__bonus is-missed'}>
              <span className="breakdown__num">★</span>
              <span className="breakdown__title">
                Before-midnight bonus
                {!bonus && <small>Missed: finished after 00:00</small>}
              </span>
              <span className="breakdown__pts">{bonus ? `+${MIDNIGHT_BONUS}` : '0'}</span>
            </li>
            <li className="breakdown__total">
              <span className="breakdown__num" />
              <span className="breakdown__title">Total</span>
              <span className="breakdown__pts">{total.toLocaleString()}</span>
            </li>
          </ol>
        </section>

        <section className="ending__card" aria-labelledby="bugs-title">
          <h2 id="bugs-title">Bugs you found tonight</h2>
          <ul className="found-bugs">
            {bugs.map((room) => (
              <li key={room.id}>
                <span className={`chip sev sev--${room.debrief.report.severity.toLowerCase()}`}>
                  {room.debrief.report.severity}
                </span>
                <span className="found-bugs__text">
                  {room.debrief.bug}
                  <small>{room.skill}</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="tip">
        <h2>Last tester tip</h2>
        <p>{rooms.find((r) => r.id === FINAL_ROOM_ID)?.debrief.testerTip}</p>
      </aside>

      <div className="ending__actions">
        <button className="btn btn--primary btn--big" onClick={onPlayAgain}>
          Play again <span aria-hidden="true">↻</span>
        </button>
        <a className="btn btn--ghost btn--big" href={REPO_URL} target="_blank" rel="noreferrer">
          See how it was built and tested
        </a>
      </div>
    </article>
  );
}
