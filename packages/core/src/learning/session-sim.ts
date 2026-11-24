import type { CardState } from './srs';

export interface SimulatedAttempt {
  skillCode: string;
  correct: boolean;
  responseMs: number;
  hintsUsed: number;
}

/**
 * Produces a deterministic sequence of attempts at a given accuracy.
 * Useful for seeding test fixtures without random variance.
 */
export function simulateSession(
  cards: Array<{ skillCode: string; state: CardState }>,
  targetAccuracy: number,
  count: number,
): SimulatedAttempt[] {
  const result: SimulatedAttempt[] = [];
  const pool = [...cards];

  for (let i = 0; i < count; i++) {
    const card = pool[i % pool.length]!;
    // Deterministic: correct based on position and targetAccuracy
    const correct = (i / count) < targetAccuracy;
    result.push({
      skillCode: card.skillCode,
      correct,
      responseMs: correct ? 2000 + i * 100 : 5000 + i * 100,
      hintsUsed: correct ? 0 : 1,
    });
  }

  return result;
}

export function simulationAccuracy(attempts: SimulatedAttempt[]): number {
  if (attempts.length === 0) return 0;
  return attempts.filter((a) => a.correct).length / attempts.length;
}
