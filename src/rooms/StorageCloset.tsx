import { useCallback, useEffect, useState } from 'react';
import { ShopLogo } from './shop/ShopHeader';
import type { RoomDefinition } from '../game/types';

/*
 * The bug in this room: the server decides who's an admin by reading the sr_role cookie.
 * The cookie is set to "user" by /api/session, but it's a plain cookie the player can edit in
 * DevTools > Application > Cookies. Change it to "admin", click Retry, and the panel opens,
 * showing the release override code.
 *
 * Opens with the keypad under the page. This component never calls onSolved.
 */

interface AdminData {
  release: { version: string; scheduledFor: string; status: string };
  pipeline: { stage: string; status: string }[];
  overrideCode: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'denied'; role: string }
  | { kind: 'admin'; data: AdminData }
  | { kind: 'failed' };

function StorageCloset() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  const loadAdmin = useCallback(async (signal?: AbortSignal) => {
    setState({ kind: 'loading' });
    try {
      const response = await fetch('/api/admin', { signal, credentials: 'same-origin' });
      if (response.status === 403) {
        const body = (await response.json()) as { role?: string };
        setState({ kind: 'denied', role: body.role ?? 'user' });
        return;
      }
      if (!response.ok) {
        setState({ kind: 'failed' });
        return;
      }
      setState({ kind: 'admin', data: (await response.json()) as AdminData });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setState({ kind: 'failed' });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Get a session cookie first (only set if there isn't one), then ask for the admin panel.
    fetch('/api/session', { signal: controller.signal, credentials: 'same-origin' })
      .then(() => loadAdmin(controller.signal))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setState({ kind: 'failed' });
      });
    return () => controller.abort();
  }, [loadAdmin]);

  return (
    <div className="fake-app admin">
      <div className="fake-app__bar admin__bar">
        <ShopLogo suffix="Admin" />
        <span className="account__user">
          <span className="account__avatar" aria-hidden="true">
            JR
          </span>
          jamie.r
        </span>
      </div>

      <div className="account__layout">
        <nav className="account__side" aria-label="Admin">
          <span>Dashboard</span>
          <span>Products</span>
          <span>Orders</span>
          <span className="is-active" aria-current="page">
            Release controls
          </span>
          <span>Users</span>
        </nav>

        <section className="account__main" aria-labelledby="admin-heading" aria-busy={state.kind === 'loading'}>
          <p className="admin__crumbs">Admin / Release controls</p>
          <h2 id="admin-heading" className="admin__title">
            Release controls
          </h2>

          {state.kind === 'loading' && (
            <div className="account__skeleton" aria-label="Loading">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton-row">
                  <span />
                  <span />
                  <span />
                </div>
              ))}
            </div>
          )}

          {state.kind === 'denied' && (
            <div className="denied">
              <div className="denied__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="30" height="30">
                  <rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <p className="denied__code">403 Forbidden</p>
              <h3>Access denied</h3>
              <p>
                You&rsquo;re signed in as <strong>jamie.r</strong> (role: <code>{state.role}</code>). Release controls
                are for admins only.
              </p>
              <button className="admin__btn" onClick={() => loadAdmin()}>
                Retry
              </button>
            </div>
          )}

          {state.kind === 'failed' && (
            <p className="account__error" role="alert">
              Something went wrong loading this page. Try again.
            </p>
          )}

          {state.kind === 'admin' && (
            <div className="admin__panel">
              <div className="admin__release">
                <div>
                  <p className="admin__label">Next release</p>
                  <p className="admin__version">v{state.data.release.version}</p>
                </div>
                <div>
                  <p className="admin__label">Scheduled for</p>
                  <p className="admin__value">{state.data.release.scheduledFor}</p>
                </div>
                <span className="admin__status">{state.data.release.status}</span>
              </div>

              <ol className="admin__pipeline">
                {state.data.pipeline.map((p) => (
                  <li key={p.stage} className={`admin__stage admin__stage--${p.status}`}>
                    <span className="admin__stage-dot" aria-hidden="true" />
                    {p.stage} <span className="admin__stage-status">{p.status}</span>
                  </li>
                ))}
              </ol>

              <div className="admin__override">
                <p className="admin__label">Release override code</p>
                <p className="admin__code">{state.data.overrideCode}</p>
                <p className="admin__note">Enter this code at the release lock to pause the deploy.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export const storageCloset: RoomDefinition = {
  id: 'storage-closet',
  number: 4,
  title: 'Storage Closet',
  skill: 'Security and authorization testing',
  url: 'staging.shopright.app/admin/release',
  briefing:
    'The kill switch for tonight’s release is in the admin panel. You’re not an admin. Or are you?',
  hints: [
    'How does the server know who you are? Something stored in your browser tells it, on every request.',
    'Open DevTools > Application (Chrome/Edge) or Storage (Firefox) > Cookies, and look at what’s stored for this site.',
    'Double-click the value of sr_role, change it to admin, press Enter, then click Retry on the page.',
  ],
  door: {
    prompt: 'Release override code from the admin panel',
    placeholder: 'OVR-XX-XXXX',
  },
  debrief: {
    bug: 'Admin access granted by editing a cookie',
    whatWasWrong:
      'The server decided who’s an admin by reading a cookie called sr_role. That cookie lives in the browser, isn’t signed and isn’t HttpOnly, so you could change "user" to "admin" in DevTools. The server believed it and opened the admin panel.',
    whyItMatters:
      'Any customer can make themselves an admin and reach release controls, other users’ data or refunds. This is broken access control, number 1 in the OWASP Top 10. It’s one of the most common serious bugs in real apps.',
    howYouFoundIt:
      'You asked how the server identifies you, found the role stored in a cookie under DevTools > Application, changed it, and retried the request.',
    report: {
      title: 'Admin panel: access granted by editing the client-side sr_role cookie',
      severity: 'Critical',
      category: 'Security',
      steps: [
        'Sign in as a regular customer (jamie.r).',
        'Go to Admin > Release controls. Access is denied (403).',
        'Open DevTools > Application > Cookies and change sr_role from user to admin.',
        'Click Retry.',
      ],
      expected:
        'The server checks the role from the signed-in user’s session. Editing a cookie changes nothing, and the page stays 403.',
      actual:
        'With sr_role=admin, GET /api/admin returns 200 and the admin panel opens, including the release override code.',
    },
    testerTip:
      'For every page or action with a permission check, try it as a lower role, and look for anything the client controls that sounds like a permission: cookies, localStorage, hidden form fields, request bodies (role, isAdmin, userId). If changing it changes what the server allows, it’s a bug.',
  },
  Component: StorageCloset,
};
