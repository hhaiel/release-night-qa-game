import { createHash } from 'node:crypto';

/**
 * Answer checking lives on the server so players can't find the answers in the game's JavaScript.
 * Only SHA-256 hashes are stored here, so reading this file on GitHub doesn't spoil them either.
 * Generate a hash with: npm run hash-answer -- <room-id> "<normalized answer>"
 */
interface RoomAnswer {
  /** Turns what the player typed into one canonical form before hashing. */
  normalize: (raw: string) => string;
  hash: string;
}

const ANSWERS: Record<string, RoomAnswer> = {
  // Room 1: the player logs in with the test account a developer left in an HTML comment.
  // Answer format "username:password". Usernames ignore case and spaces; passwords are exact.
  'login-lobby': {
    normalize: (raw) => {
      const i = raw.indexOf(':');
      if (i === -1) return raw.trim();
      return `${raw.slice(0, i).trim().toLowerCase()}:${raw.slice(i + 1)}`;
    },
    hash: 'e486617c01fc0cc0a969591ff0652650550604da8dd8577d32057446892866e5',
  },
};

export function isKnownRoom(room: string): boolean {
  return Object.hasOwn(ANSWERS, room);
}

export function checkAnswer(room: string, raw: string): boolean {
  const entry = ANSWERS[room];
  if (!entry) return false;
  const hash = createHash('sha256').update(`${room}:${entry.normalize(raw)}`).digest('hex');
  return hash === entry.hash;
}
