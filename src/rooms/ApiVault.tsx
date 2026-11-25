import { useCallback, useEffect, useState } from 'react';
import type { RoomDefinition } from '../game/types';

/*
 * The bug in this room: GET /api/orders answers 200 OK with an error in the body.
 * This page only checks the status code (response.ok), so it reads `orders: []` and shows
 * a friendly "No orders yet" empty state. The real error, and a leaked override code,
 * are only visible in DevTools > Network > the response body.
 *
 * Opens with the keypad under the page. This component never calls onSolved.
 */

interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
}

type State = { kind: 'loading' } | { kind: 'loaded'; orders: Order[]; name: string } | { kind: 'failed' };

function ApiVault() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const load = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' });
    try {
      const response = await fetch('/api/orders', { signal });
      // BUG (client side): only the status code is checked. A 200 with an error body passes.
      if (!response.ok) {
        setState({ kind: 'failed' });
        return;
      }
      const data = (await response.json()) as { orders?: Order[]; customer?: { name?: string } };
      setState({ kind: 'loaded', orders: data.orders ?? [], name: data.customer?.name ?? 'there' });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setState({ kind: 'failed' });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <div className="fake-app account">
      <div className="fake-app__bar">
        <span className="fake-app__logo">ShopRight</span>
        <span className="account__user">
          <span className="account__avatar" aria-hidden="true">
            JR
          </span>
          My account
        </span>
      </div>

      <div className="account__layout">
        <nav className="account__side" aria-label="Account">
          <span>Profile</span>
          <span className="is-active" aria-current="page">
            Orders
          </span>
          <span>Addresses</span>
          <span>Payment methods</span>
          <span>Sign out</span>
        </nav>

        <section className="account__main" aria-labelledby="orders-heading" aria-busy={state.kind === 'loading'}>
          <div className="account__head">
            <h2 id="orders-heading">Order history</h2>
            <button className="account__refresh" onClick={() => load()} disabled={state.kind === 'loading'}>
              ↻ Refresh
            </button>
          </div>

          {state.kind === 'loading' && (
            <div className="account__skeleton" aria-label="Loading orders">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton-row">
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          )}

          {state.kind === 'failed' && (
            <p className="account__error" role="alert">
              We couldn&rsquo;t load your orders. Please try again.
            </p>
          )}

          {state.kind === 'loaded' && state.orders.length === 0 && (
            <div className="empty">
              <svg viewBox="0 0 120 100" width="120" height="100" aria-hidden="true">
                <path d="M20 38 60 22l40 16v40L60 94 20 78z" fill="#e8edf3" stroke="#c4cdd8" strokeWidth="2" />
                <path d="M20 38l40 16 40-16M60 54v40" fill="none" stroke="#c4cdd8" strokeWidth="2" />
                <path d="M40 30l40 16" stroke="#d6dde6" strokeWidth="6" />
              </svg>
              <h3>No orders yet</h3>
              <p>Hi {state.name}, looks like you haven&rsquo;t placed an order. Your next favorite hoodie is waiting.</p>
              <span className="empty__cta">Start shopping</span>
            </div>
          )}

          {state.kind === 'loaded' && state.orders.length > 0 && (
            <ul className="orders">
              {state.orders.map((o) => (
                <li key={o.id}>
                  {o.id} · {o.date} · ${o.total.toFixed(2)} · {o.status}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export const apiVault: RoomDefinition = {
  id: 'api-vault',
  number: 3,
  title: 'API Vault',
  skill: 'Network tab and API testing',
  url: 'staging.shopright.app/account/orders',
  briefing:
    'A customer says their order history is empty. They’ve ordered 40 times. Support checked and says the page "loads fine".',
  hints: [
    '"Loads fine" and "works" aren’t the same thing. What did the page actually receive from the server?',
    'Open DevTools > Network, then click Refresh on the page. Click the orders request in the list.',
    'Open the Response (or Preview) tab for that request and read the whole body, not just the 200 status.',
  ],
  door: {
    prompt: 'Override code from the order service',
    placeholder: 'VAULT-XXXX',
  },
  debrief: {
    bug: 'Order API answers 200 OK with an error, and the page shows "No orders yet"',
    whatWasWrong:
      'The order service timed out, but the API still answered 200 OK and put the error inside the response body. The page only checked the status code, so it treated the failure as "this customer has no orders". The response also leaked internal debug data: a hostname and an override code.',
    whyItMatters:
      'Customers think their orders are gone and call support. Monitoring and alerts count 200s as healthy, so the outage doesn’t show up on any dashboard. And anyone can read the leaked debug details in their browser.',
    howYouFoundIt:
      'You looked past the friendly empty state and checked what the server actually sent, in DevTools > Network. The status said success; the body said failure.',
    report: {
      title: 'Order history: API returns 200 OK with an error body, so the page shows "No orders yet"',
      severity: 'High',
      category: 'Error',
      steps: [
        'Sign in as a customer who has placed orders.',
        'Open DevTools and go to the Network tab.',
        'Go to My account > Orders.',
        'Click the GET /api/orders request and open its Response tab.',
      ],
      expected:
        'The API returns a 5xx status (e.g. 503) when the order service is down, and the page shows "We couldn’t load your orders". No internal details are in the response.',
      actual:
        'The API returns 200 OK with "status": "error" and error code UPSTREAM_TIMEOUT in the body. The page shows "No orders yet". The response includes a debug object with an internal hostname and an override code.',
    },
    testerTip:
      'In API testing, always assert on the response body as well as the status code. A 200 is not a pass. Also scan every response for things that shouldn’t be there: stack traces, internal hostnames, tokens, other users’ data.',
  },
  Component: ApiVault,
};
