import { useState, type FormEvent } from 'react';
import { checkAnswer } from '../lib/api';
import type { RoomDefinition, RoomProps } from '../game/types';

/*
 * The bug in this room: a developer left a test account in an HTML comment.
 * React doesn't render comments from JSX, so the comment is injected as raw HTML.
 * It is invisible on the page but shows up in DevTools > Elements. (It is added after the page loads,
 * so View Source / Ctrl+U does not show it. Only the live DOM in Elements does.)
 */
const LEFTOVER_DEV_COMMENT =
  '<!-- TODO(dev): remove before release!! temp QA login for staging: qa_temp / Midnight#23 -->';

type Status = 'idle' | 'checking' | 'wrong' | 'error';

function LoginLobby({ onSolved }: RoomProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('checking');
    try {
      const correct = await checkAnswer('login-lobby', `${username}:${password}`);
      if (correct) onSolved();
      else setStatus('wrong');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="fake-app">
      <div className="fake-app__bar">
        <span className="fake-app__logo">ShopRight</span>
        <span className="fake-app__env">staging · v2.3.0-rc4</span>
      </div>

      <div className="fake-app__body">
        <form className="login-card" onSubmit={handleSubmit} aria-labelledby="login-heading">
          <h2 id="login-heading">Sign in to ShopRight</h2>
          <p className="login-card__sub">Staging is locked for release night. Authorized accounts only.</p>

          <span className="contents" dangerouslySetInnerHTML={{ __html: LEFTOVER_DEV_COMMENT }} />

          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            name="username"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {status === 'wrong' && (
            <p className="login-card__error" role="alert">
              Invalid username or password.
            </p>
          )}
          {status === 'error' && (
            <p className="login-card__error" role="alert">
              Couldn't reach the server. Is it running?
            </p>
          )}

          <button type="submit" disabled={status === 'checking'}>
            {status === 'checking' ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="login-card__foot">
            <span aria-disabled="true">Forgot password?</span> (disabled during code freeze)
          </p>
        </form>
      </div>
    </div>
  );
}

export const loginLobby: RoomDefinition = {
  id: 'login-lobby',
  number: 1,
  title: 'Login Lobby',
  skill: 'Reading the page in DevTools (Elements)',
  url: 'staging.shopright.app/login',
  briefing:
    'Your QA account was deleted in this afternoon’s "cleanup". The staging login is the first door. Find another way in.',
  hints: [
    'Developers leave notes in places users never look. The page may be saying more than it shows.',
    'Right-click the login card and choose Inspect (or press F12 and open the Elements panel).',
    'Expand the <form> in the Elements panel. Look for a green <!-- comment --> between the heading and the inputs.',
  ],
  debrief: {
    bug: 'Test account credentials left in an HTML comment',
    whatWasWrong:
      'A developer left a working username and password in an HTML comment on the login page. Comments aren’t shown on screen, but they ship to every visitor’s browser as part of the page source.',
    whyItMatters:
      'Anyone can open DevTools and read the page markup. If that account exists in production, or the same password is used elsewhere, an attacker gets in without any hacking. Leaked test accounts often have extra permissions, which makes it worse.',
    howYouFoundIt:
      'You looked past the rendered page and read the raw markup in DevTools > Elements. Checking the source is a quick habit worth doing on any login, checkout or admin page.',
    report: {
      title: 'Login page: working test account credentials exposed in an HTML comment',
      severity: 'Critical',
      category: 'Security',
      steps: [
        'Open the staging login page.',
        'Press F12 and open the Elements panel.',
        'Expand the login <form>.',
        'Sign in with the username and password from the comment.',
      ],
      expected: 'The page source contains no credentials, internal notes or TODOs.',
      actual:
        'An HTML comment contains the username and password of an active QA account, and signing in with them works.',
    },
    testerTip:
      'Don’t stop at "remove the comment". In the report, ask for the account to be disabled and the password rotated, and ask whether the same account exists in production. Deleting the comment doesn’t un-leak a password that already shipped.',
  },
  Component: LoginLobby,
};
