// Prints the hash to paste into api/_lib/answers.ts for a room's answer.
// Usage: npm run hash-answer -- <room-id> "<normalized answer>"
// For door codes, the normalized answer is uppercase with no spaces or dashes, e.g. TRC7Q4M2B.
// Hashes (not plain answers) live in the repo so reading the source on GitHub doesn't give the answers away.
import { createHash } from 'node:crypto';

const [room, answer] = process.argv.slice(2);
if (!room || answer === undefined) {
  console.error('Usage: npm run hash-answer -- <room-id> "<normalized answer>"');
  process.exit(1);
}
console.log(createHash('sha256').update(`${room}:${answer}`).digest('hex'));
