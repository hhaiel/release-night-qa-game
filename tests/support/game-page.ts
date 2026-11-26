import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page Object for Release Night.
 * Every locator lives here, so specs read like test steps and never contain raw selectors.
 * Prefer getByRole / getByLabel / getByText; CSS is only used where the page has no accessible
 * hook on purpose (e.g. Room 6's unnamed button, which is the bug).
 */

export const ROOM_IDS = [
  'login-lobby',
  'console-corridor',
  'api-vault',
  'storage-closet',
  'checkout-gate',
  'dark-room',
  'release-board',
] as const;

export const STORAGE_KEY = 'release-night:progress:v1';

/**
 * Saved progress is written while on a static file from the same site, not the game itself.
 * If the game were open, it could save its own state over ours a moment later (a race).
 */
const SEED_PAGE = '/favicon.svg';

/** The answers, as a player would find them. The tests double as a walkthrough. */
export const ANSWERS = {
  login: { username: 'qa_temp', password: 'Midnight#23' },
  traceId: 'TRC-7Q4M-2B',
  vaultCode: 'VAULT-0412',
  overrideCode: 'OVR-88-KILO',
  refundReference: 'REF-101-NEG',
  exitCode: 'LUMEN-6',
};

export class GamePage {
  constructor(readonly page: Page) {}

  // ---------- Navigation and setup ----------

  async open() {
    await this.page.goto('/');
  }

  /** Fresh game: clears saved progress and room cookies, then shows the intro. */
  async openFresh() {
    await this.page.goto(SEED_PAGE);
    await this.page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
    await this.page.context().clearCookies();
    await this.page.goto('/');
  }

  /**
   * Jumps straight to a room (1–7) with the earlier rooms already solved, no hints used.
   * Lets each room's tests run on their own instead of replaying the whole game.
   */
  async openAtRoom(roomNumber: number) {
    await this.page.goto(SEED_PAGE);
    await this.page.context().clearCookies();
    await this.page.evaluate(
      ({ key, ids, index }) => {
        const now = Date.now();
        const rooms: Record<string, unknown> = {};
        ids.slice(0, index).forEach((id, i) => {
          rooms[id] = { hintsUsed: 0, enteredAt: now - (index - i) * 20000, solvedAt: now - (index - i) * 10000 };
        });
        localStorage.setItem(key, JSON.stringify({ startedAt: now - index * 20000, currentRoom: index, rooms }));
      },
      { key: STORAGE_KEY, ids: [...ROOM_IDS], index: roomNumber - 1 },
    );
    await this.page.goto('/');
  }

  async startShift() {
    await this.page.getByRole('button', { name: 'Start the shift' }).click();
  }

  // ---------- Game frame ----------

  get introHeading(): Locator {
    return this.page.getByRole('heading', { level: 1, name: 'Release Night' });
  }

  roomHeading(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }

  get hintsCounter(): Locator {
    return this.page.getByTitle('Hints used');
  }

  get countdown(): Locator {
    return this.page.getByLabel(/Time until release|Release blocked|Midnight has passed/);
  }

  hintButton(): Locator {
    return this.page.getByRole('button', { name: /^Decrypt hint/ });
  }

  /** The list of hints that have been decrypted so far. */
  get openHints(): Locator {
    return this.page.getByRole('complementary', { name: 'Debug notes' }).getByRole('listitem').filter({
      hasNot: this.page.getByText(/locked$/),
    });
  }

  async restart() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByRole('button', { name: 'Restart' }).click();
  }

  /** The fake ShopRight app inside the browser frame. */
  get app(): Locator {
    return this.page.locator('.browser__viewport');
  }

  // ---------- Door keypad (Rooms 2–6) ----------

  doorInput(): Locator {
    return this.page.locator('.keypad').getByRole('textbox');
  }

  async enterDoorCode(code: string) {
    await this.doorInput().fill(code);
    await this.page.getByRole('button', { name: 'Unlock' }).click();
  }

  get accessDenied(): Locator {
    return this.page.getByText('Access denied. That code doesn’t open this door.');
  }

  // ---------- Debrief ----------

  /** Waits through the server check and the 2.2 s door animation, so it allows 10 s. */
  async expectDebrief(bugTitle: string | RegExp) {
    await expect(this.page.getByText(/cleared · Debrief/)).toBeVisible({ timeout: 10_000 });
    await expect(this.page.getByRole('heading', { level: 1, name: bugTitle })).toBeVisible();
  }

  async nextDoor() {
    await this.page.getByRole('button', { name: 'Next door' }).click();
  }

  // ---------- Room 1: Login Lobby ----------

  /** Reads every HTML comment inside the login form, the way you'd spot one in DevTools > Elements. */
  async loginFormComments(): Promise<string[]> {
    return this.app.getByRole('form', { name: 'Sign in to ShopRight' }).evaluate((form) => {
      const walker = document.createTreeWalker(form, NodeFilter.SHOW_COMMENT);
      const found: string[] = [];
      while (walker.nextNode()) found.push(walker.currentNode.nodeValue ?? '');
      return found;
    });
  }

  async logIn(username: string, password: string) {
    await this.app.getByLabel('Username').fill(username);
    await this.app.getByLabel('Password').fill(password);
    await this.app.getByRole('button', { name: 'Sign in' }).click();
  }

  // ---------- Room 2: Console Corridor ----------

  get addToCart(): Locator {
    return this.app.getByRole('button', { name: 'Add to cart' });
  }

  get cart(): Locator {
    return this.app.getByLabel(/^Cart, \d+ items$/);
  }

  // ---------- Room 3: API Vault ----------

  get emptyOrders(): Locator {
    return this.app.getByRole('heading', { name: 'No orders yet' });
  }

  get refreshOrders(): Locator {
    return this.app.getByRole('button', { name: /Refresh/ });
  }

  // ---------- Room 4: Storage Closet ----------

  get adminDenied(): Locator {
    return this.app.getByRole('heading', { name: 'Access denied' });
  }

  get adminRetry(): Locator {
    return this.app.getByRole('button', { name: 'Retry' });
  }

  get overrideCode(): Locator {
    return this.app.getByText(/^OVR-/);
  }

  // ---------- Room 5: Checkout Gate ----------

  get discountInput(): Locator {
    return this.app.getByLabel('Staff discount (%)');
  }

  get payButton(): Locator {
    return this.app.getByRole('button', { name: /^Pay/ });
  }

  /** What a player does in DevTools > Elements: delete max="100" and disabled. */
  async removeBrowserOnlyLimits() {
    await this.discountInput.evaluate((el) => el.removeAttribute('max'));
    await this.payButton.evaluate((el) => el.removeAttribute('disabled'));
  }

  get refundReference(): Locator {
    return this.app.getByText('Refund reference').locator('span');
  }

  // ---------- Room 6: Dark Room ----------

  /** The real exit. CSS on purpose: it has no accessible name, which is the bug. */
  get darkRoomExit(): Locator {
    return this.app.locator('button.dark-room__exit');
  }

  get liveRegion(): Locator {
    return this.app.locator('[aria-live]');
  }

  // ---------- Room 7: Release Board ----------

  async openBugReport() {
    await this.app.getByRole('button', { name: /Needs a bug report/ }).click();
  }

  async fileBugReport(report: {
    bug: string;
    title: string;
    severity: string;
    category: string;
    steps: string[];
    expected: string;
    actual: string;
  }) {
    await this.app.getByLabel('Which bug?').selectOption({ label: report.bug });
    await this.app.getByLabel('Title').fill(report.title);
    await this.app.getByLabel('Severity').selectOption(report.severity);
    await this.app.getByLabel('Category').selectOption(report.category);
    await this.app.getByLabel(/Steps to reproduce/).fill(report.steps.join('\n'));
    await this.app.getByLabel('Expected result').fill(report.expected);
    await this.app.getByLabel('Actual result').fill(report.actual);
    await this.app.getByRole('button', { name: 'File bug report' }).click();
  }

  // ---------- Ending ----------

  get rank(): Locator {
    return this.page.getByRole('heading', { level: 1, name: /Your rank/ });
  }

  /** Screen-reader text with the final score, e.g. "Total score: 7,500 points". */
  get totalScore(): Locator {
    return this.page.getByText(/^Total score: [\d,]+ points$/);
  }
}

/** A report that scores 100/100 for Room 4's bug. Reused by the Room 7 tests and the walkthrough. */
export const GOOD_REPORT = {
  bug: 'Room 4 · Admin access by editing a cookie',
  title: 'Admin panel: access granted by editing the sr_role cookie',
  severity: 'Critical',
  category: 'Security',
  steps: [
    'Sign in as jamie.r',
    'Open Admin > Release controls (403)',
    'Change the sr_role cookie to admin in DevTools',
    'Click Retry',
  ],
  expected: 'The server checks the real session role and keeps returning 403.',
  actual: 'With sr_role=admin the admin panel opens and shows the override code.',
};
