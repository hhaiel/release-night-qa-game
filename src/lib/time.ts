/** The story starts at 23:47. One real second is one second of game time. */
const START_SECONDS = 23 * 3600 + 47 * 60;
export const SECONDS_UNTIL_RELEASE = 13 * 60;

export function gameClock(elapsedMs: number): string {
  const total = (START_SECONDS + Math.floor(elapsedMs / 1000)) % 86400;
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
