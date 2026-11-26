import { test, expect } from '../support/fixtures';
import { ANSWERS, GOOD_REPORT } from '../support/game-page';

/*
 * One describe per room. Each room is solved the way a player would: the tests read the DOM,
 * the console, the network and cookies just like DevTools. Together they are a full walkthrough.
 */

test.describe('Room 1: Login Lobby', () => {
  test('TC-R1-001 the login form contains a leftover test account in an HTML comment @regression', async ({
    game,
  }) => {
    await game.openAtRoom(1);

    const comments = await game.loginFormComments();

    expect(comments.join(' ')).toContain(`${ANSWERS.login.username} / ${ANSWERS.login.password}`);
  });

  test('TC-R1-002 a wrong login is rejected @regression', async ({ game }) => {
    await game.openAtRoom(1);

    await game.logIn('admin', 'admin');

    await expect(game.app.getByRole('alert')).toHaveText('Invalid username or password.');
  });

  test('TC-R1-003 logging in with the leaked account opens the door @smoke', async ({ game }) => {
    await game.openAtRoom(1);

    await game.logIn(ANSWERS.login.username, ANSWERS.login.password);

    await game.expectDebrief('Test account credentials left in an HTML comment');
  });
});

test.describe('Room 2: Console Corridor', () => {
  test('TC-R2-001 Add to cart shows success but the cart stays at 0 and the console logs the error @regression', async ({
    game,
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`Uncaught ${err.name}: ${err.message}`));
    await game.openAtRoom(2);

    await game.addToCart.click();

    await expect(game.app.getByRole('status')).toHaveText(/Added to cart!/);
    await expect(game.cart).toHaveAccessibleName('Cart, 0 items');
    await expect
      .poll(() => consoleErrors.join('\n'))
      .toMatch(/Cannot read properties of undefined \(reading 'qty'\)/);
    expect(consoleErrors.join('\n')).toContain(`[cart] sync failed. Report this trace ID to the on-call dev: ${ANSWERS.traceId}`);
  });

  test('TC-R2-002 the trace ID from the console opens the door @smoke', async ({ game }) => {
    await game.openAtRoom(2);

    await game.enterDoorCode(ANSWERS.traceId);

    await game.expectDebrief(/Add to cart says/);
  });
});

test.describe('Room 3: API Vault', () => {
  test('TC-R3-001 the page shows "No orders yet" while the API answers 200 OK with an error body @regression', async ({
    game,
    page,
  }) => {
    await game.openAtRoom(3);
    await expect(game.emptyOrders).toBeVisible();

    const responsePromise = page.waitForResponse((r) => r.url().endsWith('/api/orders') && r.status() === 200);
    await game.refreshOrders.click();
    const response = await responsePromise;
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.status).toBe('error');
    expect(body.error.code).toBe('UPSTREAM_TIMEOUT');
    expect(body.error.debug.vault_override).toBe(ANSWERS.vaultCode);
    await expect(game.emptyOrders).toBeVisible();
  });

  test('TC-R3-002 the override code from the response opens the door @smoke', async ({ game }) => {
    await game.openAtRoom(3);

    await game.enterDoorCode(ANSWERS.vaultCode);

    await game.expectDebrief(/Order API answers 200 OK/);
  });
});

test.describe('Room 4: Storage Closet', () => {
  test('TC-R4-001 a regular user gets 403 Access denied @regression', async ({ game, page }) => {
    await game.openAtRoom(4);

    await expect(game.adminDenied).toBeVisible();
    await expect(game.app.getByText('403 Forbidden')).toBeVisible();
    const role = (await page.context().cookies()).find((c) => c.name === 'sr_role');
    expect(role?.value).toBe('user');
    expect(role?.httpOnly).toBe(false);
  });

  test('TC-R4-002 changing the sr_role cookie to admin opens the admin panel @regression', async ({
    game,
    page,
  }) => {
    await game.openAtRoom(4);
    await expect(game.adminDenied).toBeVisible();

    await page.context().addCookies([{ name: 'sr_role', value: 'admin', url: page.url() }]);
    await game.adminRetry.click();

    await expect(game.overrideCode).toHaveText(ANSWERS.overrideCode);
  });

  test('TC-R4-003 the override code opens the door @smoke', async ({ game }) => {
    await game.openAtRoom(4);

    await game.enterDoorCode(ANSWERS.overrideCode);

    await game.expectDebrief('Admin access granted by editing a cookie');
  });
});

test.describe('Room 5: Checkout Gate', () => {
  test('TC-R5-001 the browser blocks a discount over 100 @regression', async ({ game }) => {
    await game.openAtRoom(5);

    await game.discountInput.fill('101');

    await expect(game.app.getByText('Discount must be between 0 and 100.')).toBeVisible();
    await expect(game.payButton).toBeDisabled();
  });

  test('TC-R5-002 a 100% discount gives a free order @regression', async ({ game }) => {
    await game.openAtRoom(5);

    await game.discountInput.fill('100');
    await game.payButton.click();

    await expect(game.app.getByText(/Total charged: \$0\.00 \(free order\)/)).toBeVisible();
  });

  test('TC-R5-003 removing the browser-only limits lets 101% through and the store pays the customer @regression', async ({
    game,
  }) => {
    await game.openAtRoom(5);
    await game.discountInput.fill('101');

    await game.removeBrowserOnlyLimits();
    await game.payButton.click();

    await expect(game.app.getByText(/ShopRight owes you/)).toContainText('$0.40');
    await expect(game.refundReference).toHaveText(ANSWERS.refundReference);
  });

  test('TC-R5-004 the refund reference opens the door @smoke', async ({ game }) => {
    await game.openAtRoom(5);

    await game.enterDoorCode(ANSWERS.refundReference);

    await game.expectDebrief('Checkout accepts a 101% discount and pays the customer');
  });
});

test.describe('Room 6: Dark Room', () => {
  test('TC-R6-001 the exit is the first Tab stop in the room and has no accessible name @regression', async ({
    game,
    page,
  }) => {
    await game.openAtRoom(6);
    await page.getByRole('button', { name: 'Restart' }).focus();

    await page.keyboard.press('Tab');

    await expect(game.darkRoomExit).toBeFocused();
    await expect(game.darkRoomExit).toHaveAccessibleName('');
    await expect(game.darkRoomExit).toHaveCSS('outline-style', 'none');
  });

  test('TC-R6-002 pressing the exit puts the code in a hidden live region @regression', async ({ game, page }) => {
    await game.openAtRoom(6);
    await game.darkRoomExit.focus();

    await page.keyboard.press('Enter');

    await expect(game.liveRegion).toHaveText(`Emergency exit code: ${ANSWERS.exitCode}`);
    await expect(game.liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('TC-R6-003 the exit code opens the door @smoke', async ({ game }) => {
    await game.openAtRoom(6);

    await game.enterDoorCode(ANSWERS.exitCode);

    await game.expectDebrief('The only exit has no name, no contrast and no visible focus');
  });
});

test.describe('Room 7: The Release Board', () => {
  test('TC-R7-001 a vague bug report is rejected with tips @regression', async ({ game }) => {
    await game.openAtRoom(7);
    await game.openBugReport();

    await game.fileBugReport({
      bug: GOOD_REPORT.bug,
      title: 'Something is wrong here',
      severity: 'Low',
      category: 'Content',
      steps: ['Open the page', 'Change a thing'],
      expected: 'It should work properly.',
      actual: 'It did not work properly at all.',
    });

    await expect(game.app.getByRole('alert')).toContainText('37/100. The release manager needs 70.');
    await expect(game.app.getByLabel('Title')).toHaveValue('Something is wrong here');
  });

  test('TC-R7-002 a complete bug report blocks the release and shows the ending @smoke', async ({ game }) => {
    await game.openAtRoom(7);
    await game.openBugReport();

    await game.fileBugReport(GOOD_REPORT);
    await expect(game.app.getByText('Report accepted. Release v2.3 is blocked.')).toBeVisible();
    await game.app.getByRole('button', { name: 'Pull the release' }).click();

    await expect(game.rank).toBeVisible({ timeout: 10_000 });
    await expect(game.countdown).toHaveText('BLOCKED');
  });
});
