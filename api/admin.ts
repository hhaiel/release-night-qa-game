import { readCookie } from './_lib/cookies.js';

/**
 * GET /api/admin  (Room 4: Storage Closet)
 *
 * DELIBERATELY BROKEN. Don't fix it: finding this is the puzzle.
 * Decides who's an admin by reading the sr_role cookie, which the player can change in DevTools.
 * A real check would look up the signed-in user's role on the server.
 *
 * The override code is readable here in the public repo. That's accepted, like Room 3.
 * The door still checks a hash of it on the server (api/_lib/answers.ts).
 */
export async function GET(request: Request): Promise<Response> {
  const role = readCookie(request, 'sr_role') ?? 'user';
  const headers = { 'cache-control': 'no-store' };

  if (role !== 'admin') {
    return Response.json({ error: 'Forbidden', message: 'Admins only.', role }, { status: 403, headers });
  }

  return Response.json(
    {
      release: { version: '2.3.0', scheduledFor: '00:00', status: 'scheduled' },
      pipeline: [
        { stage: 'build', status: 'passed' },
        { stage: 'tests', status: 'passed' },
        { stage: 'deploy', status: 'waiting' },
      ],
      overrideCode: 'OVR-88-KILO',
    },
    { headers },
  );
}
