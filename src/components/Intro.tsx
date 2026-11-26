interface Props {
  onStart: () => void;
}

type ItemState = 'done' | 'skipped' | 'open' | 'you';

/** The printed release checklist pinned next to the title. Red notes are "handwritten" by QA. */
const CHECKLIST: { label: string; detail: string; state: ItemState; note?: string }[] = [
  { label: 'Build', detail: '#2317', state: 'done' },
  { label: 'Unit tests', detail: '412 / 412', state: 'done' },
  { label: 'End-to-end tests', detail: 'skipped', state: 'skipped', note: 'skipped??' },
  { label: 'Security scan', detail: 'not run', state: 'open', note: 'not run!' },
  { label: 'QA sign-off', detail: '', state: 'you', note: '← you' },
];

const RULES = [
  'DevTools are allowed. You’ll need them.',
  'Three hints per room. Each one costs 100 points.',
  'The clock starts when you do. Midnight is a hard stop.',
];

export function Intro({ onStart }: Props) {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <p className="intro__meta">
        <span className="led led--red led--blink" aria-hidden="true" />
        <span>ShopRight</span>
        <span>Release v2.3</span>
        <span>Tue 23:47</span>
        <span className="intro__meta-deploy">Deploys 00:00</span>
      </p>

      <h1 id="intro-title" className="intro__title">
        <span>Release</span> <span>Night</span>
      </h1>

      <div className="intro__grid">
        <div className="intro__story">
          <p className="intro__lead">
            Version 2.3 of the ShopRight store ships at midnight. Everyone else has logged off. You&rsquo;re the last
            QA still online, and the build is full of bugs.
          </p>
          <p>
            Every room is a screen of the broken build, and every door is locked behind a bug. Find the bug, open the
            door. Get through all seven and you can block the release before it ships.
          </p>

          <ol className="intro__rules">
            {RULES.map((rule, i) => (
              <li key={rule}>
                <span className="intro__rule-num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {rule}
              </li>
            ))}
          </ol>

          <button className="btn btn--primary btn--big" onClick={onStart} autoFocus>
            Start the shift <span aria-hidden="true">→</span>
          </button>
        </div>

        <figure className="checklist">
          <figcaption className="checklist__head">
            <span>Release checklist</span>
            <span>SHOP-2300 · v2.3</span>
          </figcaption>
          <ul className="checklist__items">
            {CHECKLIST.map((item) => (
              <li key={item.label} className={`checklist__item checklist__item--${item.state}`}>
                <span className="checklist__box" aria-hidden="true">
                  {item.state === 'done' ? '✓' : ''}
                </span>
                <span className="checklist__label">
                  {item.label}
                  {item.detail && <span className="checklist__detail"> {item.detail}</span>}
                  <span className="visually-hidden">
                    {item.state === 'done' ? ' (done)' : item.state === 'you' ? ' (waiting for you)' : ' (not done)'}
                  </span>
                </span>
                {item.note && (
                  <span className="checklist__note" aria-hidden="true">
                    {item.note}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="checklist__foot">
            Auto-deploy at <strong>00:00</strong> if nobody blocks it.
          </p>
        </figure>
      </div>
    </section>
  );
}
