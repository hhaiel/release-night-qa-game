import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'release-night:progress:v1';

export interface RoomProgress {
  enteredAt?: number;
  solvedAt?: number;
  hintsUsed: number;
}

export interface Progress {
  startedAt?: number;
  /** Index into ROOMS of the room the player is on. */
  currentRoom: number;
  rooms: Record<string, RoomProgress>;
}

const EMPTY: Progress = { currentRoom: 0, rooms: {} };

function load(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Progress;
    if (typeof parsed.currentRoom !== 'number' || typeof parsed.rooms !== 'object') return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

/** Game progress, saved to localStorage so a refresh doesn't lose your place. */
export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const updateRoom = useCallback((roomId: string, change: (room: RoomProgress) => RoomProgress) => {
    setProgress((p) => ({
      ...p,
      rooms: { ...p.rooms, [roomId]: change(p.rooms[roomId] ?? { hintsUsed: 0 }) },
    }));
  }, []);

  return {
    progress,
    start: useCallback(() => setProgress({ ...EMPTY, startedAt: Date.now() }), []),
    reset: useCallback(() => setProgress(EMPTY), []),
    enterRoom: useCallback(
      (roomId: string) => updateRoom(roomId, (r) => (r.enteredAt ? r : { ...r, enteredAt: Date.now() })),
      [updateRoom],
    ),
    takeHint: useCallback(
      (roomId: string) => updateRoom(roomId, (r) => ({ ...r, hintsUsed: Math.min(3, r.hintsUsed + 1) })),
      [updateRoom],
    ),
    solveRoom: useCallback(
      (roomId: string) => updateRoom(roomId, (r) => (r.solvedAt ? r : { ...r, solvedAt: Date.now() })),
      [updateRoom],
    ),
    nextRoom: useCallback(() => setProgress((p) => ({ ...p, currentRoom: p.currentRoom + 1 })), []),
  };
}
