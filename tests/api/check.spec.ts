import { test, expect } from '@playwright/test';

/*
 * POST /api/check: the answer checker behind every door.
 * Contract (docs/game-design.md): wrong answers are a normal 200 result; malformed requests are 400.
 * These use Playwright's `request` fixture: plain HTTP calls, no browser.
 */

const check = (room: string, answer: string) => ({ data: { room, answer } });

test.describe('POST /api/check', () => {
  const correct: [string, string][] = [
    ['login-lobby', 'qa_temp:Midnight#23'],
    ['console-corridor', 'TRC-7Q4M-2B'],
    ['api-vault', 'VAULT-0412'],
    ['storage-closet', 'OVR-88-KILO'],
    ['checkout-gate', 'REF-101-NEG'],
    ['dark-room', 'LUMEN-6'],
  ];

  for (const [room, answer] of correct) {
    test(`TC-API-001 accepts the right answer for ${room} @smoke`, async ({ request }) => {
      const response = await request.post('/api/check', check(room, answer));
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ correct: true });
    });
  }

  test('TC-API-002 a wrong answer is 200 with correct: false @regression', async ({ request }) => {
    const response = await request.post('/api/check', check('api-vault', 'VAULT-0000'));
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ correct: false });
  });

  test('TC-API-003 Room 1 usernames ignore case and spaces but passwords are exact @regression', async ({
    request,
  }) => {
    const user = await request.post('/api/check', check('login-lobby', '  QA_Temp :Midnight#23'));
    expect(await user.json()).toEqual({ correct: true });

    const pass = await request.post('/api/check', check('login-lobby', 'qa_temp:midnight#23'));
    expect(await pass.json()).toEqual({ correct: false });
  });

  for (const variant of ['trc-7q4m-2b', 'TRC 7Q4M 2B', 'TRC7Q4M2B', ' t r c - 7 q 4 m - 2 b ']) {
    test(`TC-API-004 door codes ignore case, spaces and dashes: "${variant}" @regression`, async ({ request }) => {
      const response = await request.post('/api/check', check('console-corridor', variant));
      expect(await response.json()).toEqual({ correct: true });
    });
  }

  test('TC-API-005 unknown room is 404 @regression', async ({ request }) => {
    const response = await request.post('/api/check', check('basement', 'x'));
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: 'Unknown room' });
  });

  test('TC-API-006 body that is not JSON is 400 @regression', async ({ request }) => {
    const response = await request.post('/api/check', {
      data: 'not json',
      headers: { 'content-type': 'application/json' },
    });
    expect(response.status()).toBe(400);
  });

  test('TC-API-007 missing or non-string fields are 400 @regression', async ({ request }) => {
    for (const data of [{}, { room: 'dark-room' }, { room: 'dark-room', answer: 6 }, { room: 1, answer: 'x' }]) {
      const response = await request.post('/api/check', { data });
      expect(response.status(), JSON.stringify(data)).toBe(400);
    }
  });

  test('TC-API-008 an answer over 200 characters is 400 @regression', async ({ request }) => {
    const ok = await request.post('/api/check', check('dark-room', 'x'.repeat(200)));
    expect(ok.status()).toBe(200);
    const tooLong = await request.post('/api/check', check('dark-room', 'x'.repeat(201)));
    expect(tooLong.status()).toBe(400);
  });

  test('TC-API-009 GET is not allowed @regression', async ({ request }) => {
    const response = await request.get('/api/check');
    expect(response.status()).toBe(405);
  });
});
