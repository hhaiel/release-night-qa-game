import { checkAnswer, isKnownRoom } from './_lib/answers.js';

/**
 * POST /api/check
 * Body:  { "room": "login-lobby", "answer": "..." }
 * 200:   { "correct": true | false }   a wrong answer is a normal result, not an error
 * 400:   { "error": "..." }            the request itself is malformed
 * 404:   { "error": "Unknown room" }
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body must be valid JSON' }, { status: 400 });
  }

  const { room, answer } = (body ?? {}) as { room?: unknown; answer?: unknown };
  if (typeof room !== 'string' || typeof answer !== 'string') {
    return Response.json({ error: '"room" and "answer" must both be strings' }, { status: 400 });
  }
  if (answer.length > 200) {
    return Response.json({ error: '"answer" is too long (max 200 characters)' }, { status: 400 });
  }
  if (!isKnownRoom(room)) {
    return Response.json({ error: 'Unknown room' }, { status: 404 });
  }

  return Response.json({ correct: checkAnswer(room, answer) }, { headers: { 'cache-control': 'no-store' } });
}
