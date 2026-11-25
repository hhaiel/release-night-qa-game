import { useState, type FormEvent } from 'react';
import type { RoomDefinition } from '../game/types';

/*
 * The bug in this room: the 0–100 limit on the staff discount only exists in the browser
 * (the input's max="100" and the Pay button's disabled attribute). POST /api/checkout has no
 * upper limit, so a discount of 101% gives a negative total and a refund reference.
 *
 * Ways past the browser check: delete max="100" and disabled in Elements, or copy the checkout
 * request from the Network tab and resend it with "discount": 101.
 *
 * Opens with the keypad under the page. This component never calls onSolved.
 */

const PRICE = 40;

interface CheckoutResult {
  orderId: string;
  total: number;
  refund?: { amount: number; reference: string; method: string };
}

type Status =
  | { kind: 'idle' }
  | { kind: 'paying' }
  | { kind: 'done'; result: CheckoutResult }
  | { kind: 'error'; message: string };

const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.abs(n).toFixed(2)}`;

function CheckoutGate() {
  const [discount, setDiscount] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const parsed = discount === '' ? 0 : Number(discount);
  const invalid = Number.isNaN(parsed) || parsed < 0 || parsed > 100;
  const discountAmount = invalid ? null : Math.round(PRICE * (parsed / 100) * 100) / 100;
  const total = discountAmount === null ? null : PRICE - discountAmount;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus({ kind: 'paying' });
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ discount: discount === '' ? 0 : Number(discount) }),
      });
      const data = (await response.json()) as CheckoutResult & { error?: string };
      if (!response.ok) {
        setStatus({ kind: 'error', message: data.error ?? 'Payment failed.' });
        return;
      }
      setStatus({ kind: 'done', result: data });
    } catch {
      setStatus({ kind: 'error', message: 'Couldn’t reach the payment server.' });
    }
  }

  return (
    <div className="fake-app checkout">
      <div className="fake-app__bar">
        <span className="fake-app__logo">ShopRight</span>
        <ol className="checkout__steps" aria-label="Checkout steps">
          <li className="is-done">Cart</li>
          <li className="is-done">Shipping</li>
          <li className="is-current" aria-current="step">
            Payment
          </li>
        </ol>
      </div>

      {status.kind === 'done' ? (
        <Confirmation result={status.result} onBack={() => setStatus({ kind: 'idle' })} />
      ) : (
        <form className="checkout__layout" onSubmit={handleSubmit}>
          <section className="checkout__card" aria-labelledby="pay-heading">
            <h2 id="pay-heading">Payment</h2>
            <div className="checkout__saved">
              <span className="checkout__card-brand" aria-hidden="true">
                VISA
              </span>
              <span>Staff card ending in 0000</span>
              <span className="checkout__card-test">Test card</span>
            </div>

            <label htmlFor="staff-discount" className="checkout__label">
              Staff discount (%)
            </label>
            <input
              id="staff-discount"
              name="discount"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              placeholder="0"
              value={discount}
              onChange={(e) => {
                setDiscount(e.target.value);
                if (status.kind === 'error') setStatus({ kind: 'idle' });
              }}
              aria-invalid={invalid}
              aria-describedby="discount-help"
              className="checkout__input"
            />
            <p id="discount-help" className={invalid ? 'checkout__help is-error' : 'checkout__help'}>
              {invalid ? 'Discount must be between 0 and 100.' : 'Staff get up to 100% off during release testing.'}
            </p>

            {status.kind === 'error' && (
              <p className="checkout__error" role="alert">
                {status.message}
              </p>
            )}

            <button type="submit" className="checkout__pay" disabled={invalid || status.kind === 'paying'}>
              {status.kind === 'paying' ? 'Processing…' : total === null ? 'Pay' : `Pay ${money(total)}`}
            </button>
          </section>

          <aside className="checkout__summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Order summary</h2>
            <div className="checkout__item">
              <span className="checkout__thumb" aria-hidden="true" />
              <span>
                Midnight Hoodie
                <small>Size M · Qty 1</small>
              </span>
              <span>{money(PRICE)}</span>
            </div>
            <dl className="checkout__totals">
              <dt>Subtotal</dt>
              <dd>{money(PRICE)}</dd>
              <dt>Staff discount</dt>
              <dd>{discountAmount === null ? '—' : `−${money(discountAmount)}`}</dd>
              <dt>Shipping</dt>
              <dd>Free</dd>
              <dt className="checkout__grand">Total</dt>
              <dd className="checkout__grand">{total === null ? '—' : money(total)}</dd>
            </dl>
          </aside>
        </form>
      )}
    </div>
  );
}

function Confirmation({ result, onBack }: { result: CheckoutResult; onBack: () => void }) {
  const refund = result.refund;
  return (
    <div className="checkout__done" role="status">
      <div className={refund ? 'checkout__done-icon is-refund' : 'checkout__done-icon'} aria-hidden="true">
        {refund ? '!' : '✓'}
      </div>
      <h2>Order confirmed</h2>
      <p className="checkout__order-id">Order {result.orderId}</p>
      {refund ? (
        <>
          <p>
            Total charged: <strong>{money(result.total)}</strong>. ShopRight owes you{' '}
            <strong>{money(refund.amount)}</strong>, refunded to your {refund.method}.
          </p>
          <p className="checkout__refund">
            Refund reference <span>{refund.reference}</span>
          </p>
        </>
      ) : (
        <p>
          Total charged: <strong>{money(result.total)}</strong>
          {result.total === 0 ? ' (free order).' : '.'} Thanks for shopping with ShopRight!
        </p>
      )}
      <button className="checkout__back" onClick={onBack}>
        Back to checkout
      </button>
    </div>
  );
}

export const checkoutGate: RoomDefinition = {
  id: 'checkout-gate',
  number: 5,
  title: 'Checkout Gate',
  skill: 'Boundary values and client-side validation',
  url: 'staging.shopright.app/checkout/payment',
  briefing:
    'Finance asked for one thing before release: make sure nobody can get paid to shop. Check the staff discount.',
  hints: [
    'The browser says no to anything over 100. Does the server agree? Try 100 first and watch the Network tab.',
    'The limit lives in the page’s HTML. Find the discount input and the Pay button in DevTools > Elements.',
    'Delete max="100" from the input and disabled from the Pay button, then pay with 101. (Or copy the checkout request from the Network tab and resend it with "discount": 101.)',
  ],
  door: {
    prompt: 'Refund reference from the order confirmation',
    placeholder: 'REF-XXX-XXX',
  },
  debrief: {
    bug: 'Checkout accepts a 101% discount and pays the customer',
    whatWasWrong:
      'The 0–100 limit on the staff discount only existed in the browser: the input’s max="100" and a disabled Pay button. The server checked that the discount was a number and not negative, but had no upper limit. With 101% the total became −$0.40, and the order was confirmed with a refund.',
    whyItMatters:
      'Anything in the browser can be changed: HTML attributes, JavaScript checks, the request itself. Client-side validation is for convenience, not security. Here, anyone with DevTools could make the store pay them, and a bigger number means a bigger refund.',
    howYouFoundIt:
      'You tested the boundary (100 works, 101 is blocked), then got past the browser’s check and sent 101 to the server anyway. The server, which should have been the real gate, said yes.',
    report: {
      title: 'Checkout: server accepts a discount over 100%, giving a negative total and a refund',
      severity: 'Critical',
      category: 'Functional',
      steps: [
        'Add the Midnight Hoodie ($40.00) to the cart and go to Payment.',
        'Enter 100 in Staff discount and note the POST /api/checkout request in the Network tab.',
        'Resend that request with the body {"discount": 101} (or remove max="100" and disabled in Elements and pay with 101).',
        'Read the response.',
      ],
      expected: 'The server rejects any discount above 100 with a 400 error, whatever the browser sends.',
      actual:
        'The server returns 200 with "status": "confirmed", a total of −0.40 and a refund of $0.40 to the customer’s card.',
    },
    testerTip:
      'For any number field, test the boundaries: −1, 0, 1, 99, 100, 101, a decimal, a huge number and an empty value. Then send the invalid ones straight to the API, skipping the UI. If only the browser says no, it’s a bug.',
  },
  Component: CheckoutGate,
};
