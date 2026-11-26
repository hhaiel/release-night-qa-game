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

/** The ending: the release decision on the left, an itemised receipt of the score on the right. */
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
  const finishedAt = gameClock(realTime);
  const hintsUsed = Object.values(progress.rooms).reduce((sum, r) => sum + r.hintsUsed, 0);
  const reportScore = progress.rooms[FINAL_ROOM_ID]?.reportScore ?? 0;
  const bugs = rooms.filter((r) => r.id !== FINAL_ROOM_ID);

  return (
    <article className="ending" aria-labelledby="ending-title">
      <div className="ending__decision">
        <p className="ending__kicker">
          <span className={`led ${beforeMidnight ? 'led--green' : 'led--amber'}`} aria-hidden="true" />
          {beforeMidnight ? 'Release blocked before midnight' : 'Release blocked (after midnight)'}
        </p>
        <p className="ending__verdict" aria-hidden="true">
          <span className="ending__version">v2.3</span>
          <span>Blocked</span>
        </p>

        <h1 id="ending-title" ref={headingRef} tabIndex={-1} className="ending__rank">
          <span className="ending__rank-label">Signed off as</span>
          <span className="ending__rank-title">{rank.title}</span>
        </h1>
        <p className="ending__blurb">{rank.blurb}</p>

        <p className="ending__score">
          <span className="visually-hidden">Total score: {total.toLocaleString()} points</span>
          <span aria-hidden="true">{shown.toLocaleString()}</span>
          <small aria-hidden="true">points</small>
        </p>

        <div className="ending__actions">
          <button className="btn btn--primary btn--big" onClick={onPlayAgain}>
            Play again
          </button>
          <a className="btn btn--ghost btn--big" href={REPO_URL} target="_blank" rel="noreferrer">
            How it was built and tested
          </a>
        </div>
      </div>

      <section className="receipt" aria-labelledby="receipt-title">
        <header className="receipt__head">
          <h2 id="receipt-title">ShopRight QA</h2>
          <p>Release night · v2.3</p>
          <p>
            Shift {formatDuration(realTime)} · ended {finishedAt}
          </p>
        </header>

        <ol className="receipt__lines">
          {perRoom.map(({ room, base, hintPenalty, points }) => (
            <li key={room.id}>
              <span className="receipt__item">
                <span className="receipt__num">{String(room.number).padStart(2, '0')}</span> {room.title}
              </span>
              <span className="receipt__amt">{base.toLocaleString()}</span>
              {hintPenalty > 0 && (
                <>
                  <span className="receipt__item receipt__sub">
                    {hintPenalty / 100} hint{hintPenalty > 100 ? 's' : ''}
                  </span>
                  <span className="receipt__amt receipt__sub">&minus;{hintPenalty}</span>
                </>
              )}
              <span className="visually-hidden">: {points} points</span>
            </li>
          ))}
          <li className={bonus ? undefined : 'receipt__missed'}>
            <span className="receipt__item">Before-midnight bonus{!bonus && ' (missed)'}</span>
            <span className="receipt__amt">{bonus ? `+${MIDNIGHT_BONUS}` : '0'}</span>
          </li>
        </ol>

        <p className="receipt__total">
          <span>Total</span>
          <span>{total.toLocaleString()}</span>
        </p>

        <dl className="receipt__meta">
          <dt>Hints used</dt>
          <dd>{hintsUsed}</dd>
          <dt>Bug report</dt>
          <dd>{reportScore}/100</dd>
          <dt>Clock at finish</dt>
          <dd>{finishedAt}</dd>
        </dl>

        <p className="receipt__thanks">Thank you for testing</p>
        <span className="receipt__barcode" aria-hidden="true" />
      </section>

      <section className="found" aria-labelledby="found-title">
        <h2 id="found-title">Bugs you found tonight</h2>
        <ol className="found__list">
          {bugs.map((room) => (
            <li key={room.id}>
              <span className="found__num">{String(room.number).padStart(2, '0')}</span>
              <span className="found__text">
                {room.debrief.bug}
                <small>{room.skill}</small>
              </span>
              <span className={`sev sev--${room.debrief.report.severity.toLowerCase()}`}>
                {room.debrief.report.severity}
              </span>
            </li>
          ))}
        </ol>
        <aside className="found__tip">
          <h3>Last note</h3>
          <p>{rooms.find((r) => r.id === FINAL_ROOM_ID)?.debrief.testerTip}</p>
        </aside>
      </section>
    </article>
  );
}
