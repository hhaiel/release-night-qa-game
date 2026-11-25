/**
 * POST /api/checkout  (Room 5: Checkout Gate)
 * Body: { "discount": <percent> }
 *
 * DELIBERATELY BROKEN. Don't fix it: finding this is the puzzle.
 * The page limits the staff discount to 0–100 in the browser only. This endpoint checks that the
 * discount is a number and isn't negative, but has NO upper limit. Send 101 and the total goes
 * negative: the store confirms the order and "refunds" the customer.
 *
 * Below 0 and non-numbers are rejected correctly on purpose, so the player has to find the right
 * boundary. The refund reference is readable here in the public repo, accepted like Rooms 3–4.
 */
const PRICE = 40;

export async function POST(request: Request): Promise<Response> {
  const headers = { 'cache-control': 'no-store' };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400, headers });
  }

  const discount = (body as { discount?: unknown } | null)?.discount;
  if (typeof discount !== 'number' || !Number.isFinite(discount)) {
    return Response.json({ error: '"discount" must be a number' }, { status: 400, headers });
  }
  if (discount < 0) {
    return Response.json({ error: 'Discount can’t be negative' }, { status: 400, headers });
  }
  // BUG: no check for discount > 100.

  const total = Math.round(PRICE * (1 - discount / 100) * 100) / 100;
  const orderId = `SR-${10480 + Math.floor(Math.random() * 500)}`;

  if (total < 0) {
    return Response.json(
      {
        status: 'confirmed',
        orderId,
        subtotal: PRICE,
        discountPercent: discount,
        total,
        refund: { amount: -total, reference: 'REF-101-NEG', method: 'original payment card' },
      },
      { headers },
    );
  }

  return Response.json({ status: 'confirmed', orderId, subtotal: PRICE, discountPercent: discount, total }, { headers });
}
