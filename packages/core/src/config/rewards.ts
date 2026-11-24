export interface RewardConfig {
  xp: {
    perExerciseByDifficulty: Record<number, number>;
    selfCorrectedBonus: number;
    missionCompleted: number;
    sessionConfirmed: number;
    milestoneAchieved: number;
    speedBonus: number;
  };
  combo: {
    streak3Multiplier: number;
    streak5Multiplier: number;
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
    speedBonus: 1,
  },
  combo: {
    streak3Multiplier: 2,
    streak5Multiplier: 3,
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

