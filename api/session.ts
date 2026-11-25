import { readCookie } from './_lib/cookies.js';

/**
 * GET /api/session  (Room 4: Storage Closet)
 *
 * Gives the player a "session" by setting the cookie sr_role=user.
 *
 * DELIBERATELY BROKEN. Don't fix it: finding this is the puzzle.
 * The role is stored in a plain cookie the browser can edit: not HttpOnly, not signed,
 * and not tied to any server-side session. api/admin.ts then trusts it.
 *
 * If the cookie is already there, it's left alone, so a reload doesn't undo the player's edit.
 */
export async function GET(request: Request): Promise<Response> {
  const existing = readCookie(request, 'sr_role');
  const headers = new Headers({ 'cache-control': 'no-store' });
  if (!existing) {
    headers.append('set-cookie', 'sr_role=user; Path=/; SameSite=Lax; Max-Age=86400');
  }
  return Response.json({ user: 'jamie.r', role: existing ?? 'user' }, { headers });
}
