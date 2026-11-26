import { test, expect } from '../support/fixtures';
import { ANSWERS, GOOD_REPORT } from '../support/game-page';

/*
 * The whole game in one go, from the intro to the ending, with no hints.
 * Expected score: 6 rooms × 1000 + report 100 × 10 + 500 midnight bonus = 7,500 → Release Blocker.
 */
test('TC-GAME-010 full playthrough with no hints ends as Release Blocker with 7,500 points @smoke', async ({
  game,
  page,
}) => {
  test.slow(); // seven door animations

  await game.openFresh();
  await game.startShift();

  // Room 1: log in with the account from the HTML comment
  await game.logIn(ANSWERS.login.username, ANSWERS.login.password);
  await game.expectDebrief('Test account credentials left in an HTML comment');
  await game.nextDoor();

  // Room 2: trace ID from the console
  await expect(game.roomHeading('Console Corridor')).toBeVisible();
  await game.enterDoorCode(ANSWERS.traceId);
  await game.expectDebrief(/Add to cart says/);
  await game.nextDoor();

  // Room 3: override code from the API response body
  await expect(game.roomHeading('API Vault')).toBeVisible();
  await game.enterDoorCode(ANSWERS.vaultCode);
  await game.expectDebrief(/Order API answers 200 OK/);
  await game.nextDoor();

  // Room 4: edit the cookie, read the code, enter it
  await expect(game.adminDenied).toBeVisible();
  await page.context().addCookies([{ name: 'sr_role', value: 'admin', url: page.url() }]);
  await game.adminRetry.click();
  await game.enterDoorCode((await game.overrideCode.textContent()) ?? '');
  await game.expectDebrief('Admin access granted by editing a cookie');
  await game.nextDoor();

  // Room 5: get past the browser-only limit and pay with 101%
  await game.discountInput.fill('101');
  await game.removeBrowserOnlyLimits();
  await game.payButton.click();
  await game.enterDoorCode((await game.refundReference.textContent()) ?? '');
  await game.expectDebrief('Checkout accepts a 101% discount and pays the customer');
  await game.nextDoor();

  // Room 6: Tab to the unnamed exit, press it, read the live region
  await page.getByRole('button', { name: 'Restart' }).focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  const message = (await game.liveRegion.textContent()) ?? '';
  await game.enterDoorCode(message.replace('Emergency exit code: ', ''));
  await game.expectDebrief('The only exit has no name, no contrast and no visible focus');
  await game.nextDoor();

  // Room 7: file a complete bug report
  await game.openBugReport();
  await game.fileBugReport(GOOD_REPORT);
  await game.app.getByRole('button', { name: 'Pull the release' }).click();

  // Ending
  await expect(game.rank).toHaveText(/Release Blocker/, { timeout: 10_000 });
  await expect(game.totalScore).toHaveText('Total score: 7,500 points');
  await expect(page.getByText('Release blocked before midnight')).toBeVisible();
});
