/**
 * GET /api/orders  (Room 3: API Vault)
 *
 * DELIBERATELY BROKEN. Don't fix it: finding this is the puzzle.
 * Bug 1: the order service "times out", but the endpoint still answers 200 OK.
 *        It should answer 5xx (e.g. 503) so the client and monitoring know it failed.
 * Bug 2: internal debug data, including the vault override code, is sent to the browser.
 *
 * The override code is readable here in the public repo. That's accepted: anyone can also see it by
 * playing the room. The door still checks a hash of it on the server (api/_lib/answers.ts).
 */
export async function GET(): Promise<Response> {
  // Pretend to wait on a slow upstream service, so the page shows its loading state.
  await new Promise((resolve) => setTimeout(resolve, 650));

  const body = {
    status: 'error',
    customer: { id: 'cus_0040', name: 'Jamie R.' },
    orders: [],
    error: {
      code: 'UPSTREAM_TIMEOUT',
      message: 'Order service did not respond within 3000ms',
      debug: {
        service: 'orders-v2',
        host: 'ord-db-replica-2.internal',
        retry_after_ms: 30000,
        vault_override: 'VAULT-0412',
      },
    },
  };

  return Response.json(body, {
    status: 200,
    headers: {
      'cache-control': 'no-store',
      'x-request-id': 'req_7f3a91c2',
    },
  });
}
