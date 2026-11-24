import { computeStreak, shouldGrantStreakBonus, countActiveDays, getWeekStartDate } from './streak';
import type { ActivityDay } from './types';

function makeDay(date: string, hasLearning = false, hasActivity = false): ActivityDay {
  return { date, hasLearning, hasActivity };
}

describe('countActiveDays', () => {
  it('returns 0 for empty array', () => {
    expect(countActiveDays([])).toBe(0);
  });

  it('counts days with learning', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', false, false),
    ];
    expect(countActiveDays(days)).toBe(2);
  });

  it('counts days with activity', () => {
    const days = [
      makeDay('2024-01-01', false, true),
      makeDay('2024-01-02', false, true),
    ];
    expect(countActiveDays(days)).toBe(2);
  });

  it('counts days with either learning or activity', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', false, true),
      makeDay('2024-01-03', true, true),
      makeDay('2024-01-04', false, false),
    ];
    expect(countActiveDays(days)).toBe(3);
  });
});

describe('getWeekStartDate', () => {
  it('returns Monday for a Wednesday', () => {
    expect(getWeekStartDate('2024-01-03')).toBe('2024-01-01');
  });

  it('returns same day for a Monday', () => {
    expect(getWeekStartDate('2024-01-01')).toBe('2024-01-01');
  });

  it('returns previous Monday for a Sunday', () => {
    expect(getWeekStartDate('2024-01-07')).toBe('2024-01-01');
  });

  it('handles week crossing month boundary', () => {
    expect(getWeekStartDate('2024-02-01')).toBe('2024-01-29');
  });
});

describe('computeStreak', () => {
  it('returns 0 for no activity days', () => {
    const result = computeStreak([], '2024-01-05');
    expect(result.currentStreak).toBe(0);
    expect(result.daysThisWeek).toBe(0);
    expect(result.bonusEarned).toBe(false);
  });

  it('counts days this week correctly', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', true, false),
    ];
    const result = computeStreak(days, '2024-01-03');
    expect(result.daysThisWeek).toBe(3);
  });

  it('ignores days from previous weeks', () => {
    const days = [
      makeDay('2023-12-25', true, false),
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
    ];
    const result = computeStreak(days, '2024-01-03');
    expect(result.daysThisWeek).toBe(2);
  });

  it('sets bonusEarned true when 4+ days this week', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', true, false),
      makeDay('2024-01-04', true, false),
    ];
    const result = computeStreak(days, '2024-01-04');
    expect(result.daysThisWeek).toBe(4);
    expect(result.bonusEarned).toBe(true);
  });

  it('sets bonusEarned false when less than 4 days', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', true, false),
    ];
    const result = computeStreak(days, '2024-01-03');
    expect(result.daysThisWeek).toBe(3);
    expect(result.bonusEarned).toBe(false);
  });

  it('computes consecutive streak correctly', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', true, false),
    ];
    const result = computeStreak(days, '2024-01-03');
    expect(result.currentStreak).toBe(3);
  });

  it('breaks streak on gap', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-03', true, false),
    ];
    const result = computeStreak(days, '2024-01-03');
    expect(result.currentStreak).toBe(1);
  });

  it('streak is 0 if today has no activity', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
    ];
    const result = computeStreak(days, '2024-01-03');
    expect(result.currentStreak).toBe(0);
  });

  it('uses custom config for required days', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
    ];
    const customConfig = {
      xp: { perExerciseByDifficulty: {}, selfCorrectedBonus: 0, missionCompleted: 0, sessionConfirmed: 0, milestoneAchieved: 0, speedBonus: 0 },
      combo: { streak3Multiplier: 0, streak5Multiplier: 0 },
      coins: { missionCompleted: 0, milestoneAchieved: 0, weekStreak: 0, dailyCoinCap: 0 },
      streak: { requiredDaysPerWeek: 2 },
      xpLevels: { base: 100, exponent: 1.4 },
    };
    const result = computeStreak(days, '2024-01-02', customConfig);
    expect(result.bonusEarned).toBe(true);
    expect(result.requiredDays).toBe(2);
  });
});

describe('shouldGrantStreakBonus', () => {
  it('returns true when 4+ days and not already granted', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', true, false),
      makeDay('2024-01-04', true, false),
    ];
    expect(shouldGrantStreakBonus(days, '2024-01-04', false)).toBe(true);
  });

  it('returns false when already granted this week', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
      makeDay('2024-01-03', true, false),
      makeDay('2024-01-04', true, false),
    ];
    expect(shouldGrantStreakBonus(days, '2024-01-04', true)).toBe(false);
  });

  it('returns false when less than 4 days', () => {
    const days = [
      makeDay('2024-01-01', true, false),
      makeDay('2024-01-02', true, false),
    ];
    expect(shouldGrantStreakBonus(days, '2024-01-02', false)).toBe(false);
  });
});
