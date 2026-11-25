import type { ReactNode } from 'react';

interface Props {
  url: string;
  children: ReactNode;
}

/** A fake browser window around each room, so the room reads as "the app under test". */
export function BrowserFrame({ url, children }: Props) {
  return (
    <div className="browser">
      <div className="browser__bar" aria-hidden="true">
        <span className="dot dot--red" />
        <span className="dot dot--amber" />
        <span className="dot dot--green" />
        <span className="browser__nav">‹ ›</span>
        <span className="browser__url">
          <span className="browser__lock">⚠</span>
          <span className="browser__scheme">https://</span>
          {url}
        </span>
        <span className="browser__badge">QA build</span>
      </div>
      <div className="browser__viewport">{children}</div>
    </div>
  );
}
