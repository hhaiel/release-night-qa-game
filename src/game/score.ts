import type { Progress } from './progress';
import type { RoomDefinition } from './types';
import { gameSeconds, SECONDS_UNTIL_RELEASE } from '../lib/time';
import { HINT_COST } from '../components/HintPanel';

export const ROOM_POINTS = 1000;
export const MIDNIGHT_BONUS = 500;
export const FINAL_ROOM_ID = 'release-board';

export interface RoomScore {
  room: RoomDefinition;
  base: number;
  hintPenalty: number;
  points: number;
}

/** Rooms 1–6 are worth 1000 each; Room 7 is worth its report score × 10. Hints cost 100 each. */
export function scoreRoom(room: RoomDefinition, progress: Progress): RoomScore {
  const p = progress.rooms[room.id];
  const solved = Boolean(p?.solvedAt);
  const base = !solved ? 0 : room.id === FINAL_ROOM_ID ? (p?.reportScore ?? 0) * 10 : ROOM_POINTS;
  const hintPenalty = (p?.hintsUsed ?? 0) * HINT_COST;
  return { room, base, hintPenalty, points: Math.max(0, base - hintPenalty) };
}

/** True if the final room was solved before the game clock reached midnight. */
export function finishedBeforeMidnight(progress: Progress): boolean {
  const end = progress.rooms[FINAL_ROOM_ID]?.solvedAt;
  if (!end || !progress.startedAt) return false;
  return gameSeconds(end - progress.startedAt) < SECONDS_UNTIL_RELEASE;
}

export interface Rank {
  title: string;
  blurb: string;
}

export function rankFor(total: number, beforeMidnight: boolean): Rank {
  if (total >= 7000 && beforeMidnight)
    return { title: 'Release Blocker', blurb: 'Every bug found, every door opened, and the release stopped before midnight.' };
  if (total >= 6000) return { title: 'Senior QA', blurb: 'Sharp, thorough and calm under a deadline.' };
  if (total >= 4500) return { title: 'QA Engineer', blurb: 'Solid instincts. A few more reps and nothing gets past you.' };
  if (total >= 3000) return { title: 'Junior Tester', blurb: 'You found the bugs. Next time, lean on the hints a little less.' };
  return { title: 'Intern on Their First Day', blurb: 'Everyone starts somewhere. Play again and the doors open faster.' };
}

export function totalScore(rooms: RoomDefinition[], progress: Progress) {
  const perRoom = rooms.map((r) => scoreRoom(r, progress));
  const beforeMidnight = finishedBeforeMidnight(progress);
  const bonus = beforeMidnight ? MIDNIGHT_BONUS : 0;
  const total = perRoom.reduce((sum, r) => sum + r.points, 0) + bonus;
  return { perRoom, bonus, beforeMidnight, total, rank: rankFor(total, beforeMidnight) };
}
