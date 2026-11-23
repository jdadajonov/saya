export interface RewardConfig {
  xp: {
    perExerciseByDifficulty: Record<number, number>;
    selfCorrectedBonus: number;
    missionCompleted: number;
    sessionConfirmed: number;
    milestoneAchieved: number;
  };
  coins: {
    missionCompleted: number;
    milestoneAchieved: number;
    weekStreak: number;
    dailyCoinCap: number;
  };
  streak: {
    requiredDaysPerWeek: number;
  };
  xpLevels: {
    base: number;
    exponent: number;
  };
}

export const DEFAULT_REWARD_CONFIG: RewardConfig = {
  xp: {
    perExerciseByDifficulty: { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3 },
    selfCorrectedBonus: 1,
    missionCompleted: 10,
    sessionConfirmed: 15,
    milestoneAchieved: 50,
  },
  coins: {
    missionCompleted: 2,
    milestoneAchieved: 20,
    weekStreak: 10,
    dailyCoinCap: 10,
  },
  streak: {
    requiredDaysPerWeek: 4,
  },
  xpLevels: {
    base: 100,
    exponent: 1.4,
  },
};

export function xpForLevel(level: number, config: RewardConfig): number {
  return Math.floor(config.xpLevels.base * Math.pow(level, config.xpLevels.exponent));
}

export function levelFromTotalXp(totalXp: number, config: RewardConfig): number {
  let level = 1;
  while (xpForLevel(level + 1, config) <= totalXp) level++;
  return level;
}
