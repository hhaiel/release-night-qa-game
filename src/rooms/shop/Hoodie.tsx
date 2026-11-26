/**
 * The Midnight Hoodie, drawn in SVG so the game has no image files to load.
 * view "front" (with hood opening, drawstrings and pocket), "back", or "detail" (close-up of the logo).
 */
export function Hoodie({ view = 'front' }: { view?: 'front' | 'back' | 'detail' }) {
  if (view === 'detail') {
    return (
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <rect width="200" height="200" fill="#26324a" />
        <path d="M0 150h200v50H0z" fill="#1f2a3f" />
        <path d="M0 150h200" stroke="#33405c" strokeWidth="3" strokeDasharray="2 5" />
        <circle cx="100" cy="88" r="34" fill="#f2b33d" />
        <circle cx="100" cy="88" r="34" fill="none" stroke="#ffd98a" strokeWidth="3" opacity="0.6" />
        <path d="M86 89l10 10 18-20" fill="none" stroke="#26324a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const back = view === 'back';
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true">
      {/* hood, behind the body */}
      <path d="M66 66c-2-26 16-42 34-42s36 16 34 42c-10-8-22-11-34-11s-24 3-34 11z" fill="#1f2a3f" />
      {/* body and sleeves */}
      <path
        d="M66 62 44 74c-6 3-9 8-11 15L20 140l18 6 14-36 1 64c0 4 3 6 6 6h82c3 0 6-2 6-6l1-64 14 36 18-6-13-51c-2-7-5-12-11-15l-22-12c-8 8-20 12-34 12S74 70 66 62z"
        fill="#26324a"
      />
      {/* shading down the sides */}
      <path d="M53 110l1 64c0 4 3 6 6 6h6V104z" fill="#1f2a3f" opacity="0.6" />
      <path d="M147 110l-1 64c0 4-3 6-6 6h-6V104z" fill="#1f2a3f" opacity="0.6" />
      {/* ribbed hem and cuffs */}
      <path d="M53 168h94v8c0 4-3 6-6 6H59c-3 0-6-2-6-6z" fill="#1b2436" />
      <path d="M20 140l18 6-2 6-18-6z" fill="#1b2436" />
      <path d="M180 140l-18 6 2 6 18-6z" fill="#1b2436" />
      {back ? (
        /* the hood seen from behind */
        <path d="M70 64c6-20 18-30 30-30s24 10 30 30c-8 10-18 14-30 14s-22-4-30-14z" fill="#2c3a56" />
      ) : (
        <>
          {/* hood opening */}
          <path d="M78 62c4-16 13-24 22-24s18 8 22 24c-6 8-14 12-22 12s-16-4-22-12z" fill="#141b2a" />
          {/* drawstrings */}
          <path d="M91 72l-2 26M109 72l2 26" stroke="#d9d2c3" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="86.5" y="96" width="5" height="8" rx="2" fill="#f2b33d" />
          <rect x="108.5" y="96" width="5" height="8" rx="2" fill="#f2b33d" />
          {/* kangaroo pocket */}
          <path d="M72 132h56l6 28H66z" fill="#212c42" />
          <path d="M72 132h56l6 28H66z" fill="none" stroke="#33405c" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* glow-in-the-dark logo */}
          <circle cx="122" cy="104" r="6" fill="#f2b33d" />
        </>
      )}
    </svg>
  );
}
