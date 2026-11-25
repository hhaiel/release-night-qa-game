import { BUG_RULES, PASS_MARK, scoreReport, type ReportInput } from './_lib/report-rules.js';

/**
 * POST /api/report  (Room 7: The Release Board)
 * Body:  { bug, title, severity, category, steps, expected, actual }   all strings
 *        bug is a room id (e.g. "checkout-gate"); steps are one per line.
 * 200:   { score, passed, passMark, checks: [{ id, label, points, earned, tip }] }
 * 400:   malformed body, unknown bug, or a field over its length limit
 *
 * This endpoint is NOT deliberately broken. It's the final room's judge.
 */
const FIELDS = ['bug', 'title', 'severity', 'category', 'steps', 'expected', 'actual'] as const;
const MAX_LENGTH: Record<(typeof FIELDS)[number], number> = {
  bug: 40,
  title: 200,
  severity: 20,
  category: 40,
  steps: 3000,
  expected: 1500,
  actual: 1500,
};

export async function POST(request: Request): Promise<Response> {
  const headers = { 'cache-control': 'no-store' };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400, headers });
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Body must be a JSON object' }, { status: 400, headers });
  }

  const input = body as Record<string, unknown>;
  for (const field of FIELDS) {
    const value = input[field];
    if (typeof value !== 'string') {
      return Response.json({ error: `"${field}" must be a string` }, { status: 400, headers });
    }
    if (value.length > MAX_LENGTH[field]) {
      return Response.json(
        { error: `"${field}" is too long (max ${MAX_LENGTH[field]} characters)` },
        { status: 400, headers },
      );
    }
  }
  if (!Object.hasOwn(BUG_RULES, input.bug as string)) {
    return Response.json({ error: 'Unknown bug' }, { status: 400, headers });
  }

  const result = scoreReport(input as unknown as ReportInput);
  return Response.json({ ...result, passMark: PASS_MARK }, { headers });
}
