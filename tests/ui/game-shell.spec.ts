import { test, expect } from '../support/fixtures';
import { ANSWERS } from '../support/game-page';

test.describe('Game shell', () => {
  test('TC-GAME-001 intro shows the story and Start opens Room 1 @smoke', async ({ game }) => {
    await game.openFresh();
    await expect(game.introHeading).toBeVisible();

    await game.startShift();

    await expect(game.roomHeading('Login Lobby')).toBeVisible();
    await expect(game.countdown).toHaveText(/^T−1[23]:\d\d$/);
    await expect(game.hintsCounter).toHaveText(/0$/);
  });

  test('TC-GAME-002 progress survives a page reload @regression', async ({ game, page }) => {
    await game.openAtRoom(3);
    await expect(game.roomHeading('API Vault')).toBeVisible();

    await page.reload();

    await expect(game.roomHeading('API Vault')).toBeVisible();
  });

  test('TC-GAME-003 Restart returns to the intro and clears progress @regression', async ({ game, page }) => {
    await game.openAtRoom(4);
    await expect(game.roomHeading('Storage Closet')).toBeVisible();

    await game.restart();

    await expect(game.introHeading).toBeVisible();
    await page.reload();
    await expect(game.introHeading).toBeVisible();
  });

  test('TC-GAME-004 hints decrypt one at a time and are counted @regression', async ({ game }) => {
    await game.openAtRoom(1);
    await expect(game.hintButton()).toHaveAccessibleName(/^Decrypt hint 1\s?−100 pts$/);

    await game.hintButton().click();
    await expect(game.openHints).toHaveCount(1);
    await expect(game.hintsCounter).toHaveText(/1$/);

    await game.hintButton().click();
    await game.hintButton().click();
    await expect(game.openHints).toHaveCount(3);
    await expect(game.hintButton()).toHaveCount(0);
    await expect(game.hintsCounter).toHaveText(/3$/);
  });

  test('TC-GAME-005 a wrong door code is rejected and the room stays locked @regression', async ({ game }) => {
    await game.openAtRoom(2);

    await game.enterDoorCode('TRC-0000-00');

    await expect(game.accessDenied).toBeVisible();
    await expect(game.roomHeading('Console Corridor')).toBeVisible();
  });

  test('TC-GAME-006 door codes ignore case, spaces and dashes @regression', async ({ game }) => {
    await game.openAtRoom(2);

    await game.enterDoorCode(' trc 7q4m 2b ');

    await game.expectDebrief(/Add to cart says/);
    expect(ANSWERS.traceId).toBe('TRC-7Q4M-2B');
  });

  test('TC-GAME-007 Restart clears the Room 4 admin cookie so a replay starts locked @regression', async ({
    game,
    page,
  }) => {
    await game.openAtRoom(4);
    await expect(game.adminDenied).toBeVisible();
    await page.context().addCookies([{ name: 'sr_role', value: 'admin', url: page.url() }]);

    await game.restart();

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'sr_role')).toBeUndefined();
  });
});
