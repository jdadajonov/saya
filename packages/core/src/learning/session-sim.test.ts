import { simulateSession, simulationAccuracy } from './session-sim';
import type { CardState } from './srs';

function makeCard(skillCode: string, mastery = 0.5): { skillCode: string; state: CardState } {
  return { skillCode, state: { mastery, stability: 1, dueAt: new Date() } };
}

describe('simulateSession', () => {
  const cards = [
    makeCard('math.mul.7', 0.3),
    makeCard('math.mul.8', 0.5),
    makeCard('math.mul.9', 0.7),
  ];

  it('returns exactly count attempts', () => {
    expect(simulateSession(cards, 0.8, 10)).toHaveLength(10);
  });

  it('is deterministic: same call twice gives same result', () => {
    const a = simulateSession(cards, 0.8, 10);
    const b = simulateSession(cards, 0.8, 10);
    expect(a).toEqual(b);
  });

  it('approximates targetAccuracy for large count', () => {
    const attempts = simulateSession(cards, 0.8, 100);
    const acc = simulationAccuracy(attempts);
    expect(acc).toBeCloseTo(0.8, 0);
  });

  it('produces 0% accuracy when targetAccuracy=0', () => {
    const attempts = simulateSession(cards, 0, 10);
    expect(simulationAccuracy(attempts)).toBe(0);
  });

  it('produces 100% accuracy when targetAccuracy=1', () => {
    const attempts = simulateSession(cards, 1, 10);
    expect(simulationAccuracy(attempts)).toBe(1);
  });

  it('assigns correct skillCode from card pool', () => {
    const attempts = simulateSession(cards, 0.8, 9);
    const codes = new Set(attempts.map((a) => a.skillCode));
    expect(codes.size).toBeGreaterThanOrEqual(1);
  });

  it('wrong attempts have hintsUsed > 0', () => {
    const attempts = simulateSession(cards, 0, 5);
    expect(attempts.every((a) => a.hintsUsed > 0)).toBe(true);
  });

  it('correct attempts have faster responseMs than wrong', () => {
    const attempts = simulateSession(cards, 1, 5);
    expect(attempts.every((a) => a.responseMs < 5000)).toBe(true);
  });
});

describe('simulationAccuracy', () => {
  it('returns 0 for empty array', () => {
    expect(simulationAccuracy([])).toBe(0);
  });

  it('returns 1 for all correct', () => {
    expect(simulationAccuracy([
      { skillCode: 'x', correct: true, responseMs: 1000, hintsUsed: 0 },
    ])).toBe(1);
  });
});
