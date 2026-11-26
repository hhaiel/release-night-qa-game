import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect } from '../support/fixtures';
import { ANSWERS } from '../support/game-page';

/*
 * Automated accessibility checks with axe-core, against WCAG 2.1 A and AA.
 * Every screen must pass, EXCEPT Room 6 (the Dark Room), whose bug is accessibility itself:
 * that test asserts it fails with exactly the expected rules.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page) {
  // Let entrance animations finish so colors are measured at their final values.
  // Capped at 3 s, and cancelled animations (e.g. on an element React removed) don't count.
  await page.evaluate(() => {
    const finite = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined));
    return Promise.race([Promise.all(finite), new Promise((r) => setTimeout(r, 3000))]);
  });
  return new AxeBuilder({ page }).withTags(WCAG).analyze();
}

const summary = (violations: { id: string; nodes: { target: unknown }[] }[]) =>
  violations.map((v) => `${v.id}: ${v.nodes.map((n) => JSON.stringify(n.target)).join(', ')}`).join('\n');

test.describe('Accessibility (axe, WCAG 2.1 AA)', () => {
  // An axe scan takes 8–13 s per screen (color-contrast checks every text node), more when the
  // UI tests run alongside. 60 s leaves plenty of room without hiding a real hang.
  test.describe.configure({ timeout: 60_000 });

  test('TC-A11Y-001 intro screen has no violations @regression', async ({ game, page }) => {
    await game.openFresh();
    await expect(game.introHeading).toBeVisible();
    const { violations } = await scan(page);
    expect(violations, summary(violations)).toEqual([]);
  });

  const rooms: [number, string][] = [
    [1, 'Login Lobby'],
    [2, 'Console Corridor'],
    [3, 'API Vault'],
    [4, 'Storage Closet'],
    [5, 'Checkout Gate'],
    [7, 'The Release Board'],
  ];

  for (const [n, title] of rooms) {
    test(`TC-A11Y-0${10 + n} Room ${n} (${title}) has no violations @regression`, async ({ game, page }) => {
      await game.openAtRoom(n);
      await expect(game.roomHeading(title)).toBeVisible();
      if (n === 3) await expect(game.emptyOrders).toBeVisible();
      if (n === 4) await expect(game.adminDenied).toBeVisible();
      if (n === 7) await game.openBugReport();
      const { violations } = await scan(page);
      expect(violations, summary(violations)).toEqual([]);
    });
  }

  test('TC-A11Y-020 a debrief screen has no violations @regression', async ({ game, page }) => {
    await game.openAtRoom(2);
    await game.enterDoorCode(ANSWERS.traceId);
    await game.expectDebrief(/Add to cart says/);
    const { violations } = await scan(page);
    expect(violations, summary(violations)).toEqual([]);
  });

  test('TC-A11Y-016 Room 6 (Dark Room) FAILS axe on purpose: button-name and color-contrast @regression', async ({
    game,
    page,
  }) => {
    await game.openAtRoom(6);
    await expect(game.roomHeading('Dark Room')).toBeVisible();
    const { violations } = await scan(page);
    const ids = violations.map((v) => v.id).sort();
    expect(ids).toEqual(['button-name', 'color-contrast']);
    // Both violations come from inside the fake page, not from the game's own UI.
    for (const v of violations) {
      for (const node of v.nodes) expect(JSON.stringify(node.target)).toMatch(/dark-room/);
    }
  });
});
