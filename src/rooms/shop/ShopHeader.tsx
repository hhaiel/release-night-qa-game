import type { ReactNode } from 'react';

/** ShopRight's logo: a shopping bag with a check mark in it ("Shop" + "Right"). */
export function ShopLogo({ suffix }: { suffix?: string }) {
  return (
    <span className="sr-logo">
      <svg className="sr-logo__mark" viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
        <path d="M5 9h18l-1.4 14.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z" fill="currentColor" />
        <path d="M9.5 9V7.5a4.5 4.5 0 0 1 9 0V9" fill="none" stroke="currentColor" strokeWidth="2" />
        <path className="sr-logo__check" d="M9.6 16.4l3 3 5.8-6" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-logo__word">
        Shop<span>Right</span>
      </span>
      {suffix && <span className="sr-logo__suffix">{suffix}</span>}
    </span>
  );
}

interface Props {
  /** "store": announcement bar, nav and search. "minimal": just the logo and whatever is on the right. */
  variant?: 'store' | 'minimal';
  right?: ReactNode;
}

/** The ShopRight header shared by the store pages inside the rooms. */
export function ShopHeader({ variant = 'minimal', right }: Props) {
  return (
    <>
      {variant === 'store' && (
        <p className="sr-announce">Free delivery over $50 · Free 30-day returns · Staff discount week</p>
      )}
      <div className="fake-app__bar sr-header">
        <ShopLogo />
        {variant === 'store' && (
          <>
            <nav className="sr-nav" aria-label="Store">
              <span>New in</span>
              <span className="is-active">Hoodies</span>
              <span>Basics</span>
              <span className="sr-nav__sale">Sale</span>
            </nav>
            <span className="sr-search">
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
                <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Search hoodies, tees…</span>
            </span>
          </>
        )}
        {right && <div className="sr-header__right">{right}</div>}
      </div>
    </>
  );
}
