/** Asks the server whether an answer opens a room's door. */
export async function checkAnswer(room: string, answer: string): Promise<boolean> {
  const response = await fetch('/api/check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ room, answer }),
  });
  if (!response.ok) throw new Error(`Answer check failed (HTTP ${response.status})`);
  const data = (await response.json()) as { correct?: boolean };
  return data.correct === true;
}
