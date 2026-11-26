import { test, expect } from '@playwright/test';

/*
 * The room endpoints. Rooms 3–5 are deliberately broken; these tests pin down exactly HOW they're
 * broken (so an accidental "fix" fails the build) and that everything around the bug works.
 */

test.describe('GET /api/orders (Room 3, broken on purpose)', () => {
  test('TC-API-020 answers 200 OK with an error body and leaked debug data @regression', async ({ request }) => {
    const response = await request.get('/api/orders');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-store');
    const body = await response.json();
    expect(body).toMatchObject({
      status: 'error',
      orders: [],
      error: { code: 'UPSTREAM_TIMEOUT', debug: { vault_override: 'VAULT-0412' } },
    });
  });

  test('TC-API-021 only GET is allowed @regression', async ({ request }) => {
    expect((await request.post('/api/orders')).status()).toBe(405);
  });
});

test.describe('GET /api/session and /api/admin (Room 4, broken on purpose)', () => {
  test('TC-API-030 session sets sr_role=user only when there is no cookie yet @regression', async ({ request }) => {
    const fresh = await request.get('/api/session', { headers: { cookie: '' } });
    expect(fresh.headers()['set-cookie']).toContain('sr_role=user');
    expect(fresh.headers()['set-cookie']).not.toContain('HttpOnly');

    const existing = await request.get('/api/session', { headers: { cookie: 'sr_role=admin' } });
    expect(existing.headers()['set-cookie']).toBeUndefined();
    expect(await existing.json()).toMatchObject({ role: 'admin' });
  });

  for (const cookie of ['', 'sr_role=user', 'sr_role=Admin', 'sr_role=superuser']) {
    test(`TC-API-031 admin is 403 for cookie "${cookie || '(none)'}" @regression`, async ({ request }) => {
      const response = await request.get('/api/admin', { headers: { cookie } });
      expect(response.status()).toBe(403);
      expect(await response.json()).toMatchObject({ error: 'Forbidden' });
    });
  }

  test('TC-API-032 admin trusts sr_role=admin from the client and returns the override code @regression', async ({
    request,
  }) => {
    const response = await request.get('/api/admin', { headers: { cookie: 'other=1; sr_role=admin' } });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ overrideCode: 'OVR-88-KILO' });
  });
});

test.describe('POST /api/checkout (Room 5, broken on purpose)', () => {
  const boundaries: { discount: unknown; status: number; total?: number; refund?: boolean }[] = [
    { discount: -1, status: 400 },
    { discount: 0, status: 200, total: 40 },
    { discount: 1, status: 200, total: 39.6 },
    { discount: 12.5, status: 200, total: 35 },
    { discount: 99, status: 200, total: 0.4 },
    { discount: 100, status: 200, total: 0 },
    { discount: 101, status: 200, total: -0.4, refund: true }, // THE BUG: should be 400
    { discount: 150, status: 200, total: -20, refund: true }, // THE BUG
    { discount: '50', status: 400 },
    { discount: null, status: 400 },
  ];

  for (const b of boundaries) {
    test(`TC-API-040 discount ${JSON.stringify(b.discount)} → ${b.status}${b.refund ? ' with refund' : ''} @regression`, async ({
      request,
    }) => {
      const response = await request.post('/api/checkout', { data: { discount: b.discount } });
      expect(response.status()).toBe(b.status);
      const body = await response.json();
      if (b.status === 200) {
        expect(body.total).toBe(b.total);
        expect(body.status).toBe('confirmed');
        if (b.refund) expect(body.refund).toMatchObject({ reference: 'REF-101-NEG', amount: -b.total! });
        else expect(body.refund).toBeUndefined();
      } else {
        expect(body.error).toBeTruthy();
      }
    });
  }

  test('TC-API-041 missing discount and invalid JSON are 400; GET is 405 @regression', async ({ request }) => {
    expect((await request.post('/api/checkout', { data: {} })).status()).toBe(400);
    expect(
      (await request.post('/api/checkout', { data: 'x', headers: { 'content-type': 'application/json' } })).status(),
    ).toBe(400);
    expect((await request.get('/api/checkout')).status()).toBe(405);
  });
});

test.describe('POST /api/report (Room 7 judge)', () => {
  const strong = {
    bug: 'checkout-gate',
    title: 'Checkout: server accepts a 101% discount and refunds the customer',
    severity: 'Critical',
    category: 'Functional',
    steps: 'Go to checkout\nEnter 100 and watch the request\nResend it with discount 101',
    expected: 'Server rejects discounts over 100 with a 400.',
    actual: 'Server returns 200, total -0.40 and a refund reference.',
  };

  test('TC-API-050 a complete report scores 100 and passes @smoke', async ({ request }) => {
    const response = await request.post('/api/report', { data: strong });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ score: 100, passed: true, passMark: 70 });
    expect(body.checks).toHaveLength(6);
  });

  test('TC-API-051 partial credit: short steps and a generic title fail at 62 @regression', async ({ request }) => {
    const body = await (
      await request.post('/api/report', {
        data: {
          ...strong,
          title: 'The page is broken when I do stuff',
          steps: 'Open it\nDo the thing',
          actual: 'It was wrong and should not be like that.',
        },
      })
    ).json();
    expect(body).toMatchObject({ score: 62, passed: false });
    const earned = Object.fromEntries(body.checks.map((c: { id: string; earned: number }) => [c.id, c.earned]));
    expect(earned).toEqual({ title: 7, steps: 10, 'expected-actual': 20, severity: 15, category: 10, evidence: 0 });
  });

  test('TC-API-052 identical expected and actual earn nothing for that check @regression', async ({ request }) => {
    const body = await (
      await request.post('/api/report', { data: { ...strong, expected: 'It works fine here.', actual: 'it works fine here.' } })
    ).json();
    expect(body.checks.find((c: { id: string }) => c.id === 'expected-actual').earned).toBe(0);
  });

  test('TC-API-053 bad input is 400 @regression', async ({ request }) => {
    const cases = [
      { ...strong, bug: 'basement' },
      { ...strong, title: undefined },
      { ...strong, severity: 3 },
      { ...strong, title: 'x'.repeat(201) },
    ];
    for (const data of cases) {
      expect((await request.post('/api/report', { data })).status()).toBe(400);
    }
    expect(
      (await request.post('/api/report', { data: 'x', headers: { 'content-type': 'application/json' } })).status(),
    ).toBe(400);
  });
});
