// Takes the README screenshots into docs/screenshots/.
// Usage: start the game (npm run dev), then: npm run screenshots -- [base URL]
// Default base URL: http://localhost:5173
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:5173';
const OUT = 'docs/screenshots';
const KEY = 'release-night:progress:v1';
const IDS = ['login-lobby', 'console-corridor', 'api-vault', 'storage-closet', 'checkout-gate', 'dark-room', 'release-board'];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const page = await context.newPage();

/** Opens the game at a room (1–7) with earlier rooms solved; `extra` tweaks the saved progress. */
async function openAt(room, extra = (p) => p) {
  // Write progress on a static file, not the game, so the game can't save over it (race).
  await page.goto(`${BASE}/favicon.svg`);
  await page.evaluate(
    ({ key, ids, index, extraSrc }) => {
      const now = Date.now();
      const rooms = {};
      ids.slice(0, index).forEach((id, i) => {
        rooms[id] = { hintsUsed: 0, enteredAt: now - (index - i) * 60000, solvedAt: now - (index - i) * 45000 };
      });
      const progress = { startedAt: now - index * 70000, currentRoom: index, rooms };
      // eslint-disable-next-line no-new-func
      localStorage.setItem(key, JSON.stringify(new Function('p', `return (${extraSrc})(p)`)(progress)));
    },
    { key: KEY, ids: IDS, index: room - 1, extraSrc: extra.toString() },
  );
  await context.clearCookies();
  await page.goto(BASE);
}

async function shot(name, options = {}) {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...options });
  console.log(`saved ${OUT}/${name}.png`);
}

// 1. Intro
await page.goto(`${BASE}/favicon.svg`);
await page.evaluate((key) => localStorage.removeItem(key), KEY);
await page.goto(BASE);
await page.getByRole('heading', { name: 'Release Night' }).waitFor();
await shot('intro');

// 2. Room 2: success toast, empty cart
await openAt(2);
await page.getByRole('button', { name: 'Add to cart' }).click();
await page.getByText('Added to cart!').waitFor();
await shot('room-2-console-corridor');

// 3. Room 5: the browser blocks 101%
await openAt(5);
await page.getByLabel('Staff discount (%)').fill('101');
await shot('room-5-checkout-gate');

// 4. Room 6: the dark room
await openAt(6);
await page.getByRole('heading', { name: 'Dark Room' }).waitFor();
await shot('room-6-dark-room');

// 5. A debrief (Room 4)
await openAt(4);
await page.locator('.keypad input').fill('OVR-88-KILO');
await page.getByRole('button', { name: 'Unlock' }).click();
// The unlock scene (shown already open with reduced motion, for 0.7 s)
await page.locator('.unlock').waitFor();
await shot('unlock');
await page.getByText(/cleared · Debrief/).waitFor({ timeout: 10000 });
await shot('debrief');

// 6. Room 7: report accepted
await openAt(7);
await page.getByRole('button', { name: /Needs a bug report/ }).click();
await page.getByLabel('Which bug?').selectOption({ label: 'Room 4 · Admin access by editing a cookie' });
await page.getByLabel('Title').fill('Admin panel: access granted by editing the sr_role cookie');
await page.getByLabel('Severity').selectOption('Critical');
await page.getByLabel('Category').selectOption('Security');
await page.getByLabel(/Steps to reproduce/).fill('Sign in as jamie.r\nOpen Admin > Release controls (403)\nChange the sr_role cookie to admin\nClick Retry');
await page.getByLabel('Expected result').fill('The server checks the real session role and keeps returning 403.');
await page.getByLabel('Actual result').fill('With sr_role=admin the admin panel opens and shows the override code.');
await page.getByRole('button', { name: 'File bug report' }).click();
await page.getByText('Report accepted. Release v2.3 is blocked.').scrollIntoViewIfNeeded();
await shot('room-7-release-board');

// 7. Ending (2 hints used, report 100, before midnight)
await openAt(7, (p) => {
  const now = Date.now();
  p.rooms['console-corridor'].hintsUsed = 1;
  p.rooms['dark-room'].hintsUsed = 1;
  p.rooms['release-board'] = { hintsUsed: 0, enteredAt: now - 40000, solvedAt: now - 1000, reportScore: 100 };
  p.startedAt = now - 17 * 60000;
  p.currentRoom = 6;
  return p;
});
await page.getByRole('heading', { name: /^Signed off as/ }).waitFor();
await page.waitForFunction(() => /7,300/.test(document.querySelector('.ending__score')?.textContent ?? ''));
await shot('ending');

await browser.close();
