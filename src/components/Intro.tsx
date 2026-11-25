import type { CSSProperties } from 'react';

interface Props {
  onStart: () => void;
}

/** Lines of the fake deploy log. `tone` sets the color of the status at the end. */
const LOG: { text: string; status?: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }[] = [
  { text: '$ deploy status shopright@2.3.0' },
  { text: '  build       #2317 ..........', status: 'passed', tone: 'ok' },
  { text: '  unit tests  412/412 ........', status: 'passed', tone: 'ok' },
  { text: '  e2e tests   ................', status: 'skipped', tone: 'warn' },
  { text: '  security    ................', status: 'not run', tone: 'bad' },
  { text: '  qa sign-off ................', status: 'pending', tone: 'warn' },
  { text: '  deploy      ................', status: '00:00:00', tone: 'info' },
  { text: '! 6 known defects not in tracker', tone: 'bad' },
];

const PIPELINE = [
  { label: 'Build', state: 'done' },
  { label: 'Test', state: 'done' },
  { label: 'QA', state: 'you' },
  { label: 'Ship', state: 'next' },
] as const;

export function Intro({ onStart }: Props) {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <div className="intro__story">
        <p className="intro__kicker">
          <span className="live-dot" aria-hidden="true" /> Tue · 23:47 · #release-v2-3
        </p>
        <h1 id="intro-title" className="glitch" data-text="Release Night">
          Release Night
        </h1>
        <p className="intro__lead">
          Version 2.3 of the ShopRight store ships at <strong>midnight</strong>. Everyone else has logged off.
          You&rsquo;re the last QA still online, and the build is full of bugs.
        </p>
        <p className="intro__body">
          Every room is a screen of the broken build, and every door is locked behind a bug. Find the bug, open the
          door. Get through all seven and you block the release before it ships.
        </p>

        <ul className="intro__rules">
          <li>
            <span className="rule-icon" aria-hidden="true">
              F12
            </span>
            DevTools are allowed. You&rsquo;ll need them.
          </li>
          <li>
            <span className="rule-icon" aria-hidden="true">
              ?
            </span>
            Three hints per room. Each one costs 100 points.
          </li>
          <li>
            <span className="rule-icon" aria-hidden="true">
              ⏱
            </span>
            The clock starts when you do.
          </li>
        </ul>

        <button className="btn btn--primary btn--big" onClick={onStart} autoFocus>
          Start the shift <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="intro__side" aria-hidden="true">
        <div className="countdown">
          <span className="countdown__label">Until v2.3 ships</span>
          <span className="countdown__time">00:13:00</span>
        </div>

        <div className="terminal">
          <div className="terminal__bar">
            <span className="dot dot--red" />
            <span className="dot dot--amber" />
            <span className="dot dot--green" />
            <span className="terminal__title">ci@shopright: ~/release</span>
          </div>
          <pre className="terminal__body">
            {LOG.map((line, i) => (
              <span key={i} className="terminal__line" style={{ '--i': i } as CSSProperties}>
                <span className={line.tone && !line.status ? `t-${line.tone}` : undefined}>{line.text}</span>
                {line.status && <span className={`t-${line.tone}`}> {line.status}</span>}
                {'\n'}
              </span>
            ))}
            <span className="terminal__line" style={{ '--i': LOG.length } as CSSProperties}>
              $ <span className="cursor" />
            </span>
          </pre>
        </div>

        <ol className="pipeline">
          {PIPELINE.map((stage) => (
            <li key={stage.label} className={`pipeline__stage pipeline__stage--${stage.state}`}>
              <span className="pipeline__node" />
              <span className="pipeline__label">{stage.state === 'you' ? 'QA (you)' : stage.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
