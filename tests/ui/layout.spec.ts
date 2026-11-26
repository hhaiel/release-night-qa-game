import { test, expect } from '../support/fixtures';

/*
 * Responsive layout of the store pages (the app under test) inside the game frame.
 * The store sits next to the hints panel, so its own width doesn't follow the window width:
 * a 1024px window gives the store only ~660px. These widths are the ones that broke before
 * (DEF-011) plus the usual desktop, tablet and phone sizes.
 */
const WIDTHS = [1600, 1024, 960, 768, 375];

for (const width of WIDTHS) {
  test(`TC-GAME-008 store pages fit and don't overlap at a ${width}px window @regression`, async ({ game, page }) => {
    await page.setViewportSize({ width, height: 900 });

    for (const room of [1, 2, 3, 4, 5]) {
      await game.openAtRoom(room);
      await expect(game.app).toBeVisible();
      expect(await game.appOverflow(), `Room ${room} sticks out of the frame`).toBe(0);
      if (room === 2) {
        expect(await game.productColumnsOverlap(), 'Room 2 photo overlaps the product details').toBe(false);
      }
    }
  });
}
