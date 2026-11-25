interface Props {
  onStart: () => void;
}

export function Intro({ onStart }: Props) {
  return (
    <section className="intro" aria-labelledby="intro-title">
      <p className="intro__time" aria-hidden="true">23:47</p>
      <h1 id="intro-title">Release Night</h1>
      <p className="intro__lead">
        Version 2.3 of the ShopRight store ships at midnight. Everyone else has logged off. You&rsquo;re the last QA
        still online, and the build is full of bugs.
      </p>
      <p>
        Every room is a screen of the broken build, and every door is locked behind a bug. Find the bug, open the door.
        Get through them all and you can block the release before it ships.
      </p>
      <ul className="intro__rules">
        <li>Your browser&rsquo;s DevTools are allowed. You&rsquo;ll need them.</li>
        <li>Each room has 3 hints. Hints cost points.</li>
        <li>The clock is running from the moment you start.</li>
      </ul>
      <button className="btn btn--primary" onClick={onStart} autoFocus>
        Start the shift
      </button>
    </section>
  );
}
