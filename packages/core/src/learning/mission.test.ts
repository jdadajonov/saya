import {
  buildMission,
  calculateStars,
  calculateComboBonus,
  calculateMissionXp,
  MISSION_SIZE,
  SPEED_BONUS_THRESHOLD_MS,
} from './mission';
import { DEFAULT_REWARD_CONFIG } from '../config/rewards';
import type { MissionCard } from './mission';

function makeCard(skillCode: string, mastery: number, daysOverdue = 1): MissionCard {
  const dueAt = new Date(Date.now() - daysOverdue * 86_400_000);
  return {
    skillCode,
    exerciseTypeId: 'test',
    difficulty: 1,
    state: { mastery, stability: 1, dueAt },
  };
}

function makeFutureCard(skillCode: string, mastery: number): MissionCard {
  return {
    skillCode,
    exerciseTypeId: 'test',
    difficulty: 2,
    state: { mastery, stability: 1, dueAt: new Date(Date.now() + 86_400_000) },
  };
}

describe('buildMission', () => {
  it('returns at most MISSION_SIZE cards', () => {
    const cards = Array.from({ length: 20 }, (_, i) => makeCard(`s${i}`, i * 0.05));
    const plan = buildMission(cards);
    expect(plan.cards.length).toBeLessThanOrEqual(MISSION_SIZE);
  });

  it('prioritises low-mastery due cards', () => {
    const cards = [
      makeCard('high', 0.9),
      makeCard('low', 0.1),
      makeCard('mid', 0.5),
    ];
    const plan = buildMission(cards);
    expect(plan.cards[0]!.skillCode).toBe('low');
  });

  it('pads with not-due cards when fewer than MISSION_SIZE are due', () => {
    const dueCards = Array.from({ length: 5 }, (_, i) => makeCard(`due${i}`, 0.1));
    const futureCards = Array.from({ length: 10 }, (_, i) => makeFutureCard(`future${i}`, 0.5));
    const plan = buildMission([...dueCards, ...futureCards]);
    expect(plan.cards.length).toBe(MISSION_SIZE);
  });

  it('returns fewer than MISSION_SIZE when not enough cards at all', () => {
    const cards = [makeCard('a', 0.1), makeCard('b', 0.2)];
    const plan = buildMission(cards);
    expect(plan.cards.length).toBe(2);
  });

  it('calculates positive estimatedXp', () => {
    const cards = Array.from({ length: MISSION_SIZE }, (_, i) => makeCard(`s${i}`, 0.1));
    const plan = buildMission(cards);
    expect(plan.estimatedXp).toBeGreaterThan(0);
  });
});

describe('calculateStars', () => {
  it('returns 3 for ≥ 90% accuracy', () => {
    expect(calculateStars(0.9)).toBe(3);
    expect(calculateStars(1.0)).toBe(3);
  });
  it('returns 2 for 70–89%', () => {
    expect(calculateStars(0.7)).toBe(2);
    expect(calculateStars(0.89)).toBe(2);
  });
  it('returns 1 for below 70%', () => {
    expect(calculateStars(0)).toBe(1);
    expect(calculateStars(0.5)).toBe(1);
  });
});

describe('calculateComboBonus', () => {
  it('returns 1 for streak < 3', () => {
    expect(calculateComboBonus(0)).toBe(1);
    expect(calculateComboBonus(2)).toBe(1);
  });
  it('returns streak3Multiplier for streak 3–4', () => {
    expect(calculateComboBonus(3)).toBe(DEFAULT_REWARD_CONFIG.combo.streak3Multiplier);
    expect(calculateComboBonus(4)).toBe(DEFAULT_REWARD_CONFIG.combo.streak3Multiplier);
  });
  it('returns streak5Multiplier for streak ≥ 5', () => {
    expect(calculateComboBonus(5)).toBe(DEFAULT_REWARD_CONFIG.combo.streak5Multiplier);
    expect(calculateComboBonus(10)).toBe(DEFAULT_REWARD_CONFIG.combo.streak5Multiplier);
  });
});

describe('calculateMissionXp', () => {
  const fast = SPEED_BONUS_THRESHOLD_MS - 500;
  const slow = SPEED_BONUS_THRESHOLD_MS + 1000;

  it('gives base xp + missionCompleted for all correct', () => {
    const attempts = Array.from({ length: 10 }, () => ({
      correct: true, difficulty: 1, responseMs: slow,
    }));
    const result = calculateMissionXp(attempts);
    // 10 × 1 XP (difficulty 1, no combo) + 10 mission bonus = 20 base
    // but combo kicks in after 3: attempts 3-4 get ×2, 5-9 get ×3
    expect(result.xpEarned).toBeGreaterThan(DEFAULT_REWARD_CONFIG.xp.missionCompleted);
    expect(result.stars).toBe(3);
  });

  it('applies speed bonus for fast answers', () => {
    const slow_result = calculateMissionXp([
      { correct: true, difficulty: 1, responseMs: slow },
    ]);
    const fast_result = calculateMissionXp([
      { correct: true, difficulty: 1, responseMs: fast },
    ]);
    expect(fast_result.xpEarned).toBeGreaterThan(slow_result.xpEarned);
    expect(fast_result.speedBonusCount).toBe(1);
  });

  it('tracks comboMax correctly', () => {
    const attempts = [
      { correct: true, difficulty: 1, responseMs: slow },
      { correct: true, difficulty: 1, responseMs: slow },
      { correct: true, difficulty: 1, responseMs: slow },
      { correct: false, difficulty: 1, responseMs: slow },
      { correct: true, difficulty: 1, responseMs: slow },
      { correct: true, difficulty: 1, responseMs: slow },
    ];
    const result = calculateMissionXp(attempts);
    expect(result.comboMax).toBe(3);
  });

  it('applies selfCorrectedBonus', () => {
    const base = calculateMissionXp([{ correct: true, difficulty: 1, responseMs: slow }]);
    const corrected = calculateMissionXp([
      { correct: true, difficulty: 1, responseMs: slow, selfCorrected: true },
    ]);
    expect(corrected.xpEarned).toBeGreaterThan(base.xpEarned);
    expect(corrected.selfCorrectedCount).toBe(1);
  });

  it('returns 1 star when mostly wrong', () => {
    const attempts = Array.from({ length: 10 }, (_, i) => ({
      correct: i < 3, difficulty: 1, responseMs: slow,
    }));
    expect(calculateMissionXp(attempts).stars).toBe(1);
  });

  it('handles empty attempts', () => {
    const result = calculateMissionXp([]);
    expect(result.xpEarned).toBe(DEFAULT_REWARD_CONFIG.xp.missionCompleted);
    expect(result.stars).toBe(1);
  });
});
