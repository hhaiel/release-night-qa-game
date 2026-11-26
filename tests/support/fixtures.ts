import { test as base } from '@playwright/test';
import { GamePage } from './game-page';

/**
 * Custom fixture: every test can ask for `game` and gets a ready GamePage.
 * Usage: test('…', async ({ game }) => { await game.openFresh(); … })
 */
export const test = base.extend<{ game: GamePage }>({
  game: async ({ page }, use) => {
    await use(new GamePage(page));
  },
});

export { expect } from '@playwright/test';
