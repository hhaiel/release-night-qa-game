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

/** For door codes like "TRC-7Q4M-2B": ignore case, spaces and dashes. Hash the code with no dashes. */
function codeNormalize(raw: string): string {
  return raw.replace(/[\s-]+/g, '').toUpperCase();
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

  // Room 2: the trace ID logged to the console when Add to cart fails.
  'console-corridor': {
    normalize: codeNormalize,
    hash: '713b649901d4dd61bff8a9dc064eb8c0fdaefa86387f001741ed510e1f646508',
  },

  // Room 3: the override code leaked in the body of GET /api/orders.
  'api-vault': {
    normalize: codeNormalize,
    hash: '797a33b27c1024616d94846f9371fdb97e828a96378c1af58be66d2b45f382b2',
  },

  // Room 4: the release override code shown in the admin panel once sr_role=admin.
  'storage-closet': {
    normalize: codeNormalize,
    hash: '8f0a803bdbf43d8f3be4c833ca00e7a5ab7f1a8de1ee97b22d8e61104f693a2b',
  },

  // Room 5: the refund reference returned when checkout accepts a discount over 100%.
  'checkout-gate': {
    normalize: codeNormalize,
    hash: '75905eada3db0f691f66e8a73389adf21e60ee1c3da24014c13d888139466ee3',
  },

  // Room 6: the exit code put into the hidden aria-live region when the unnamed button is pressed.
  'dark-room': {
    normalize: codeNormalize,
    hash: 'fed73058822ff2ac632a86264b760f7a9a6a4d9755f921d0a5c7c317bd281c6d',
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
