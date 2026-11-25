import { useEffect, useRef, useState } from 'react';
import type { RoomDefinition } from '../game/types';

/*
 * The bug in this room: "Add to cart" shows a success toast, but the cart update that runs
 * afterwards throws a TypeError, so the item never lands in the cart. The page looks fine.
 * Only the console tells the truth, and it includes the trace ID the player needs.
 *
 * Unlike most rooms, this one opens with the keypad under the page, not with this component.
 * This component never calls onSolved.
 */

const PRODUCT = { id: 'hoodie-midnight', sku: 'SR-HD-001', name: 'Midnight Hoodie', price: 40 };
const SIZES = ['S', 'M', 'L', 'XL'] as const;

/** The trace ID, built from character codes so a quick search of the JS bundle doesn't find it. */
function traceId(): string {
  return [84, 82, 67, 45, 55, 81, 52, 77, 45, 50, 66].map((c) => String.fromCharCode(c)).join('');
}

/** The "real" cart, keyed by product id. The buggy code below looks lines up by SKU instead. */
const cart: { items: Record<string, { qty: number }> } = { items: {} };

function ConsoleCorridor() {
  const [size, setSize] = useState<(typeof SIZES)[number]>('M');
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function addToCart() {
    // BUG 1: the success toast is shown before the cart has actually been updated.
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2600);

    // The cart sync runs a moment later, the way a real network call would.
    setTimeout(() => {
      try {
        // BUG 2: looks the line up by SKU, but the cart is keyed by product id, so `line` is undefined.
        const line = cart.items[PRODUCT.sku];
        line.qty += 1;
        setCount(line.qty);
      } catch (err) {
        // Shows up in the console as "Uncaught TypeError: ...", like an unhandled error would.
        if (typeof window.reportError === 'function') window.reportError(err);
        else setTimeout(() => { throw err; });
        console.error(`[cart] sync failed. Report this trace ID to the on-call dev: ${traceId()}`);
      }
    }, 120);
  }

  return (
    <div className="fake-app shop">
      <div className="fake-app__bar">
        <span className="fake-app__logo">ShopRight</span>
        <nav className="shop__nav" aria-label="Store">
          <span>New in</span>
          <span>Hoodies</span>
          <span>Sale</span>
        </nav>
        <span className="shop__cart" aria-label={`Cart, ${count} items`}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="10" cy="20" r="1.4" fill="currentColor" />
            <circle cx="17" cy="20" r="1.4" fill="currentColor" />
          </svg>
          <span className="shop__cart-count">{count}</span>
        </span>
      </div>

      <div className="shop__crumbs">Home / Hoodies / {PRODUCT.name}</div>

      <div className="shop__product">
        <div className="shop__image" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <path
              d="M70 38c8 10 20 15 30 15s22-5 30-15l34 16 18 46-24 10-10-22v84H52V88l-10 22-24-10 18-46z"
              fill="#24304a"
            />
            <path d="M80 40c4 16 12 26 20 26s16-10 20-26" fill="none" stroke="#3b4a6b" strokeWidth="5" />
            <path d="M84 120h32v22H84z" fill="#1b2438" />
            <circle cx="100" cy="94" r="10" fill="#ffb547" opacity="0.9" />
          </svg>
          <span className="shop__tag">New</span>
        </div>

        <div className="shop__details">
          <h2>{PRODUCT.name}</h2>
          <p className="shop__price">${PRODUCT.price.toFixed(2)}</p>
          <p className="shop__desc">
            Heavyweight fleece for late shifts. Glow-in-the-dark logo, so you can find your desk after the lights go
            out.
          </p>

          <fieldset className="shop__sizes">
            <legend>Size</legend>
            {SIZES.map((s) => (
              <label key={s} className={s === size ? 'is-selected' : undefined}>
                <input type="radio" name="size" value={s} checked={s === size} onChange={() => setSize(s)} />
                {s}
              </label>
            ))}
          </fieldset>

          <button className="shop__add" onClick={addToCart}>
            Add to cart
          </button>
          <p className="shop__ship">Free shipping on orders over $50</p>
        </div>
      </div>

      {toast && (
        <div className="shop__toast" role="status">
          <span aria-hidden="true">✓</span> Added to cart!
        </div>
      )}
    </div>
  );
}

export const consoleCorridor: RoomDefinition = {
  id: 'console-corridor',
  number: 2,
  title: 'Console Corridor',
  skill: 'Checking the console',
  url: 'staging.shopright.app/p/midnight-hoodie',
  briefing: 'QA signed off on Add to Cart this morning. The page says it works. Does it?',
  hints: [
    'The screen says success. Is the screen the only thing you can trust? Check the cart, too.',
    'Press F12 and open the Console tab, then click Add to cart again.',
    'Look for the red TypeError and the [cart] line right next to it. The trace ID starts with TRC-.',
  ],
  door: {
    prompt: 'Trace ID of the failure (the release lead needs it for the incident)',
    placeholder: 'TRC-XXXX-XX',
  },
  debrief: {
    bug: 'Add to cart says "Added!" but the item never reaches the cart',
    whatWasWrong:
      'The click handler showed the success message before the cart was updated. The update then crashed with a TypeError (it looked the item up by SKU, but the cart is keyed by product id), so nothing was added. The error only appeared in the console.',
    whyItMatters:
      'Customers think the hoodie is in their cart and only find out at checkout, or never buy it at all. Nobody notices in a quick demo because the green message looks right. Silent failures like this cost sales and are hard to trace without the error text.',
    howYouFoundIt:
      'You didn’t trust the success message. You checked the result (the cart count stayed at 0) and opened the Console, where the real error was waiting.',
    report: {
      title: 'Product page: Add to cart shows success, but the item isn’t added (TypeError in console)',
      severity: 'High',
      category: 'Functional',
      steps: [
        'Open the Midnight Hoodie product page.',
        'Open DevTools and go to the Console tab.',
        'Select size M and click Add to cart.',
        'Check the cart count in the header and the Console.',
      ],
      expected: 'The cart count goes to 1, the item is in the cart, and the Console shows no errors.',
      actual:
        '"Added to cart!" is shown, but the cart count stays at 0. The Console logs "Uncaught TypeError: Cannot read properties of undefined (reading \'qty\')", followed by "[cart] sync failed" and the trace ID.',
    },
    testerTip:
      'Keep the Console open during every test session, not just when something looks broken. When you find an error, paste the full text, the stack trace and any trace or request ID into the report. That can save the developer an hour of guessing.',
  },
  Component: ConsoleCorridor,
};
