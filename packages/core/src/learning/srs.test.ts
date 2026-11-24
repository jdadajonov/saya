import { updateCard, selectNextExercises, isSessionAccuracyOnTarget } from './srs';
import type { CardState } from './srs';

const baseCard = (): CardState => ({
  mastery: 0.5,
  stability: 2,
  dueAt: new Date(Date.now() - 1000),
});

describe('updateCard', () => {
  it('increases mastery on correct fast answer', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: true, responseMs: 1000, hintsUsed: 0 });
    expect(after.mastery).toBeCloseTo(0.56, 5);
  });

  it('decreases mastery on wrong answer', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: false, responseMs: 1000, hintsUsed: 0 });
    expect(after.mastery).toBeCloseTo(0.42, 5);
  });

  it('decreases mastery when hints used even if correct', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: true, responseMs: 1000, hintsUsed: 1 });
    expect(after.mastery).toBeCloseTo(0.42, 5);
  });

  it('decreases mastery when response is slow', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: true, responseMs: 9000, hintsUsed: 0 });
    expect(after.mastery).toBeCloseTo(0.42, 5);
  });

  it('clamps mastery to [0, 1]', () => {
    const high = { mastery: 0.98, stability: 1, dueAt: new Date() };
    const low = { mastery: 0.02, stability: 1, dueAt: new Date() };
    expect(updateCard(high, { correct: true, responseMs: 100, hintsUsed: 0 }).mastery).toBeLessThanOrEqual(1);
    expect(updateCard(low, { correct: false, responseMs: 100, hintsUsed: 0 }).mastery).toBeGreaterThanOrEqual(0);
  });

  it('increases stability on correct', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: true, responseMs: 1000, hintsUsed: 0 });
    expect(after.stability).toBeGreaterThan(before.stability);
  });

  it('decreases stability on incorrect', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: false, responseMs: 1000, hintsUsed: 0 });
    expect(after.stability).toBeLessThan(before.stability);
  });

  it('never lets stability drop below 1', () => {
    const before = { mastery: 0.5, stability: 1, dueAt: new Date() };
    const after = updateCard(before, { correct: false, responseMs: 1000, hintsUsed: 0 });
    expect(after.stability).toBeGreaterThanOrEqual(1);
  });

  it('sets dueAt in the future', () => {
    const before = baseCard();
    const after = updateCard(before, { correct: true, responseMs: 1000, hintsUsed: 0 });
    expect(after.dueAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('uses shorter interval when mastery < 0.9', () => {
    const low = { mastery: 0.5, stability: 10, dueAt: new Date() };
    const high = { mastery: 0.95, stability: 10, dueAt: new Date() };
    const afterLow = updateCard(low, { correct: true, responseMs: 100, hintsUsed: 0 });
    const afterHigh = updateCard(high, { correct: true, responseMs: 100, hintsUsed: 0 });
    expect(afterHigh.dueAt.getTime()).toBeGreaterThan(afterLow.dueAt.getTime());
  });
});

describe('selectNextExercises', () => {
  const now = new Date();
  const past = new Date(now.getTime() - 1000);
  const future = new Date(now.getTime() + 86_400_000);

  const cards = [
    { skillCode: 'a', state: { mastery: 0.9, stability: 1, dueAt: past } },
    { skillCode: 'b', state: { mastery: 0.3, stability: 1, dueAt: past } },
    { skillCode: 'c', state: { mastery: 0.5, stability: 1, dueAt: past } },
    { skillCode: 'd', state: { mastery: 0.1, stability: 1, dueAt: future } },
  ];

  it('returns only due cards', () => {
    const result = selectNextExercises(cards, 10, now);
    expect(result.every((c) => c.state.dueAt <= now)).toBe(true);
    expect(result.find((c) => c.skillCode === 'd')).toBeUndefined();
  });

  it('sorts by mastery ascending (lowest first)', () => {
    const result = selectNextExercises(cards, 10, now);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.state.mastery).toBeGreaterThanOrEqual(result[i - 1]!.state.mastery);
    }
  });

  it('respects the limit', () => {
    const result = selectNextExercises(cards, 2, now);
    expect(result.length).toBe(2);
  });

  it('returns empty array when nothing is due', () => {
    const result = selectNextExercises(
      [{ skillCode: 'x', state: { mastery: 0.5, stability: 1, dueAt: future } }],
      5,
      now,
    );
    expect(result).toHaveLength(0);
  });
});

describe('isSessionAccuracyOnTarget', () => {
  it('returns true when fewer than 5 attempts', () => {
    expect(isSessionAccuracyOnTarget([{ correct: false }, { correct: false }])).toBe(true);
  });

  it('returns true for accuracy in target band', () => {
    // 78% ± allowed band = TARGET_ACCURACY=0.78, range [0.73, 0.85]
    const attempts = Array.from({ length: 10 }, (_, i) => ({ correct: i < 8 }));
    expect(isSessionAccuracyOnTarget(attempts)).toBe(true);
  });

  it('returns false when accuracy too low', () => {
    const attempts = Array.from({ length: 10 }, () => ({ correct: false }));
    expect(isSessionAccuracyOnTarget(attempts)).toBe(false);
  });

  it('returns false when accuracy too high (all correct)', () => {
    const attempts = Array.from({ length: 10 }, () => ({ correct: true }));
    expect(isSessionAccuracyOnTarget(attempts)).toBe(false);
  });
});
