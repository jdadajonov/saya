import type { CardState } from './srs';
import type { RewardConfig } from '../config/rewards';
import { DEFAULT_REWARD_CONFIG } from '../config/rewards';

export const MISSION_SIZE = 10;
export const SPEED_BONUS_THRESHOLD_MS = 3000;

export interface MissionCard {
  skillCode: string;
  exerciseTypeId: string;
  difficulty: number;
  state: CardState;
  payload?: Record<string, unknown>;
}

export interface MissionPlan {
  cards: MissionCard[];
  estimatedXp: number;
}

export interface MissionResult {
  totalQuestions: number;
  correctCount: number;
  comboMax: number;
  speedBonusCount: number;
  selfCorrectedCount: number;
  xpEarned: number;
  coinsEarned: number;
  stars: 1 | 2 | 3;
}

export function buildMission(
  available: MissionCard[],
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): MissionPlan {
  const now = new Date();
  const due = available
    .filter((c) => c.state.dueAt <= now)
    .sort((a, b) => a.state.mastery - b.state.mastery)
    .slice(0, MISSION_SIZE);

  // If fewer than MISSION_SIZE due, pad with lowest-mastery not-yet-due cards
  if (due.length < MISSION_SIZE) {
    const notDue = available
      .filter((c) => c.state.dueAt > now)
      .sort((a, b) => a.state.mastery - b.state.mastery);
    const needed = MISSION_SIZE - due.length;
    due.push(...notDue.slice(0, needed));
  }

  const estimatedXp = due.reduce((sum, c) => {
    const base = config.xp.perExerciseByDifficulty[c.difficulty] ?? 1;
    return sum + base;
  }, 0) + config.xp.missionCompleted;

  return { cards: due, estimatedXp };
}

export function calculateStars(accuracy: number): 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

export function calculateComboBonus(streak: number, config: RewardConfig = DEFAULT_REWARD_CONFIG): number {
  if (streak >= 5) return config.combo.streak5Multiplier;
  if (streak >= 3) return config.combo.streak3Multiplier;
  return 1;
}

export function calculateMissionXp(
  attempts: Array<{ correct: boolean; difficulty: number; responseMs: number; selfCorrected?: boolean }>,
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): MissionResult {
  let xpEarned = 0;
  let comboStreak = 0;
  let comboMax = 0;
  let speedBonusCount = 0;
  let selfCorrectedCount = 0;
  let correctCount = 0;

  for (const attempt of attempts) {
    if (!attempt.correct) {
      comboStreak = 0;
      continue;
    }

    correctCount++;
    comboStreak++;
    if (comboStreak > comboMax) comboMax = comboStreak;

    const baseXp = config.xp.perExerciseByDifficulty[attempt.difficulty] ?? 1;
    const multiplier = calculateComboBonus(comboStreak, config);
    let xp = baseXp * multiplier;

    if (attempt.responseMs < SPEED_BONUS_THRESHOLD_MS) {
      xp += config.xp.speedBonus;
      speedBonusCount++;
    }

    if (attempt.selfCorrected) {
      xp += config.xp.selfCorrectedBonus;
      selfCorrectedCount++;
    }

    xpEarned += xp;
  }

  xpEarned += config.xp.missionCompleted;

  const accuracy = attempts.length > 0 ? correctCount / attempts.length : 0;

  return {
    totalQuestions: attempts.length,
    correctCount,
    comboMax,
    speedBonusCount,
    selfCorrectedCount,
    xpEarned: Math.round(xpEarned),
    coinsEarned: config.coins.missionCompleted,
    stars: calculateStars(accuracy),
  };
}
