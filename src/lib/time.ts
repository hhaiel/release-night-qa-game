/** The story starts at 23:47 and v2.3 ships at midnight: 13 minutes of game time. */
const START_SECONDS = 23 * 3600 + 47 * 60;
export const SECONDS_UNTIL_RELEASE = 13 * 60;

/**
 * Game time runs at half speed, so the 13 game minutes to midnight take 26 real minutes.
 * Change this one number to make the game easier (lower) or harder (higher).
 */
export const GAME_SPEED = 0.5;

/** Seconds of game time that have passed after this many real milliseconds. */
export function gameSeconds(realMs: number): number {
  return Math.floor((realMs / 1000) * GAME_SPEED);
}

export function gameClock(realElapsedMs: number): string {
  const total = (START_SECONDS + gameSeconds(realElapsedMs)) % 86400;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
