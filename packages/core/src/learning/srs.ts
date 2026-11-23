export interface CardState {
  mastery: number;
  stability: number;
  dueAt: Date;
}

export interface AttemptResult {
  correct: boolean;
  responseMs: number;
  hintsUsed: number;
}

const TARGET_ACCURACY = 0.78;
const SLOW_THRESHOLD_MS = 8000;

export function updateCard(state: CardState, result: AttemptResult): CardState {
  const { correct, responseMs, hintsUsed } = result;
  const isWeak = !correct || hintsUsed > 0 || responseMs > SLOW_THRESHOLD_MS;

  const delta = isWeak ? -0.08 : 0.06;
  const newMastery = Math.max(0, Math.min(1, state.mastery + delta));

  const stabilityMultiplier = correct ? 1.8 : 0.5;
  const newStability = Math.max(1, state.stability * stabilityMultiplier);

  const intervalDays = newMastery >= 0.9 ? newStability : Math.max(1, newStability * 0.5);
  const dueAt = new Date(Date.now() + intervalDays * 86_400_000);

  return { mastery: newMastery, stability: newStability, dueAt };
}

export function selectNextExercises(
  cards: Array<{ skillCode: string; state: CardState }>,
  limit: number,
  now = new Date(),
): Array<{ skillCode: string; state: CardState }> {
  const due = cards.filter((c) => c.state.dueAt <= now);
  const byMastery = due.sort((a, b) => a.state.mastery - b.state.mastery);
  return byMastery.slice(0, limit);
}

export function isSessionAccuracyOnTarget(
  recentAttempts: Array<{ correct: boolean }>,
): boolean {
  if (recentAttempts.length < 5) return true;
  const accuracy = recentAttempts.filter((a) => a.correct).length / recentAttempts.length;
  return accuracy >= TARGET_ACCURACY - 0.05 && accuracy <= TARGET_ACCURACY + 0.07;
}
