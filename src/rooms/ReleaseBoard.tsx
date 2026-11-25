import { useState, type FormEvent } from 'react';
import type { RoomDefinition, RoomProps } from '../game/types';

/*
 * Room 7, the final boss. Not a bug hunt: the player writes a bug report for one of the bugs
 * they found. POST /api/report scores it out of 100 (rules in api/_lib/report-rules.ts).
 * 70 or more blocks the release. This room is its own door: it calls onSolved itself.
 */

const BUGS = [
  { id: 'login-lobby', label: 'Room 1 · Test account left in the login page' },
  { id: 'console-corridor', label: 'Room 2 · Add to cart says "Added!" but nothing is added' },
  { id: 'api-vault', label: 'Room 3 · Order API answers 200 OK with an error' },
  { id: 'storage-closet', label: 'Room 4 · Admin access by editing a cookie' },
  { id: 'checkout-gate', label: 'Room 5 · Checkout accepts a 101% discount' },
  { id: 'dark-room', label: 'Room 6 · Exit button with no name, contrast or focus' },
];
const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];
const CATEGORIES = [
  'Functional',
  'Security',
  'UI/Display',
  'Accessibility',
  'Content',
  'Data Discrepancy',
  'Performance',
  'Error',
];

interface Check {
  id: string;
  label: string;
  points: number;
  earned: number;
  tip: string;
}
interface ReportResult {
  score: number;
  passed: boolean;
  passMark: number;
  checks: Check[];
}

const EMPTY = { bug: '', title: '', severity: '', category: '', steps: '', expected: '', actual: '' };

function ReleaseBoard({ onSolved }: RoomProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');

  const update = (field: keyof typeof EMPTY) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('sending');
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as ReportResult & { error?: string };
      if (!response.ok) {
        setErrorText(data.error ?? 'The report couldn’t be filed.');
        setStatus('error');
        return;
      }
      setResult(data);
      setStatus('idle');
    } catch {
      setErrorText('Couldn’t reach the tracker. Is the server running?');
      setStatus('error');
    }
  }

  return (
    <div className="fake-app board">
      <div className="fake-app__bar board__bar">
        <span className="board__logo">
          <span className="board__logo-mark" aria-hidden="true">
            ◆
          </span>
          Tracker
        </span>
        <span className="board__project">SHOP · Release v2.3</span>
      </div>

      <div className="board__columns" aria-label="Release v2.3 board">
        <section className="board__col" aria-labelledby="col-done">
          <h2 id="col-done">Done</h2>
          <div className="board__card">
            <span className="board__key">SHOP-2288</span> New checkout page
          </div>
          <div className="board__card">
            <span className="board__key">SHOP-2291</span> Order history v2
          </div>
        </section>
        <section className="board__col" aria-labelledby="col-qa">
          <h2 id="col-qa">In QA</h2>
          <div className="board__card">
            <span className="board__key">SHOP-2296</span> Floor 3 dark mode
          </div>
        </section>
        <section className="board__col board__col--ship" aria-labelledby="col-ship">
          <h2 id="col-ship">Ready to ship · 00:00</h2>
          <div className="board__card board__card--release">
            <span className="board__key">SHOP-2300</span> Release v2.3 to production
            <span className="board__tag">Deploys at midnight</span>
          </div>
          <button
            className="board__blocker"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="bug-report"
          >
            <span className="board__blocker-label">Blocker</span>
            Needs a bug report to stop this release
            <span className="board__blocker-cta">{open ? 'Writing…' : 'Write report →'}</span>
          </button>
        </section>
      </div>

      {open && (
        <div id="bug-report" className="report-form-wrap">
          {result?.passed ? (
            <div className="report-pass" role="status">
              <div className="report-pass__score">
                {result.score}
                <small>/100</small>
              </div>
              <h3>Report accepted. Release v2.3 is blocked.</h3>
              <p>SHOP-2300 has been moved back to &ldquo;In QA&rdquo;. Nothing ships tonight.</p>
              <ScoreList checks={result.checks} />
              <button className="report-form__submit" onClick={() => onSolved({ reportScore: result.score })}>
                Pull the release
              </button>
            </div>
          ) : (
            <form className="report-form" onSubmit={handleSubmit} aria-labelledby="report-heading">
              <h3 id="report-heading">New bug report</h3>

              {result && !result.passed && (
                <div className="report-fail" role="alert">
                  <p>
                    <strong>
                      {result.score}/100. The release manager needs {result.passMark}.
                    </strong>{' '}
                    Fix the items below and file it again.
                  </p>
                  <ScoreList checks={result.checks} />
                </div>
              )}

              <label htmlFor="r-bug">Which bug?</label>
              <select id="r-bug" value={form.bug} onChange={(e) => update('bug')(e.target.value)} required>
                <option value="" disabled>
                  Choose a bug you found tonight
                </option>
                {BUGS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>

              <label htmlFor="r-title">Title</label>
              <input
                id="r-title"
                value={form.title}
                onChange={(e) => update('title')(e.target.value)}
                placeholder="Page: what goes wrong"
                required
              />

              <div className="report-form__row">
                <div>
                  <label htmlFor="r-severity">Severity</label>
                  <select
                    id="r-severity"
                    value={form.severity}
                    onChange={(e) => update('severity')(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose
                    </option>
                    {SEVERITIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="r-category">Category</label>
                  <select
                    id="r-category"
                    value={form.category}
                    onChange={(e) => update('category')(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Choose
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label htmlFor="r-steps">Steps to reproduce (one per line)</label>
              <textarea
                id="r-steps"
                rows={4}
                value={form.steps}
                onChange={(e) => update('steps')(e.target.value)}
                placeholder={'1. Open …\n2. Click …\n3. …'}
                required
              />

              <label htmlFor="r-expected">Expected result</label>
              <textarea
                id="r-expected"
                rows={2}
                value={form.expected}
                onChange={(e) => update('expected')(e.target.value)}
                required
              />

              <label htmlFor="r-actual">Actual result</label>
              <textarea
                id="r-actual"
                rows={2}
                value={form.actual}
                onChange={(e) => update('actual')(e.target.value)}
                required
              />

              {status === 'error' && (
                <p className="report-form__error" role="alert">
                  {errorText}
                </p>
              )}

              <button type="submit" className="report-form__submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Filing…' : 'File bug report'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreList({ checks }: { checks: Check[] }) {
  return (
    <ul className="score-list">
      {checks.map((c) => {
        const full = c.earned === c.points;
        return (
          <li key={c.id} className={full ? 'is-full' : c.earned > 0 ? 'is-partial' : 'is-zero'}>
            <span className="score-list__mark" aria-hidden="true">
              {full ? '✓' : c.earned > 0 ? '½' : '✕'}
            </span>
            <span className="score-list__text">
              {c.label}
              {!full && <small>{c.tip}</small>}
            </span>
            <span className="score-list__pts">
              {c.earned}/{c.points}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export const releaseBoard: RoomDefinition = {
  id: 'release-board',
  number: 7,
  title: 'The Release Board',
  skill: 'Defect reporting',
  url: 'tracker.shopright.app/board/SHOP-v2.3',
  briefing:
    'You found the bugs. Now make them count. I can only pull the release for a proper bug report. Pick one and write it up.',
  hints: [
    'Look back at any debrief: the sample reports show every field you need. You can report any of the six bugs.',
    'A developer should be able to reproduce it from your steps alone. Write at least 3 steps, one action per line.',
    'Expected is what should happen; actual is what did happen. Put the evidence you saw (error text, status code, cookie value, number) in the actual result.',
  ],
  debrief: {
    bug: 'You blocked the release',
    whatWasWrong: 'Six bugs were heading to production at midnight.',
    whyItMatters: 'A bug that isn’t reported clearly doesn’t get fixed.',
    howYouFoundIt: 'You found them, then wrote a report good enough to stop the release.',
    report: {
      title: 'Release v2.3 blocked',
      severity: 'Critical',
      category: 'Functional',
      steps: ['Find the bugs.', 'Report them clearly.', 'Block the release.'],
      expected: 'Nothing broken ships.',
      actual: 'Nothing broken shipped.',
    },
    testerTip:
      'A good bug report is a gift to the developer: a clear title that says where and what, steps anyone can follow, expected vs. actual, and the evidence. The faster they can reproduce it, the faster it gets fixed.',
  },
  Component: ReleaseBoard,
};
