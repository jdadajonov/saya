import type { RewardConfig } from '../config/rewards';
import { DEFAULT_REWARD_CONFIG } from '../config/rewards';
import type { ChildBalance } from './types';

export function xpForLevel(level: number, config: RewardConfig = DEFAULT_REWARD_CONFIG): number {
  if (level <= 1) return 0;
  return Math.floor(config.xpLevels.base * Math.pow(level - 1, config.xpLevels.exponent));
}

export function levelFromXp(totalXp: number, config: RewardConfig = DEFAULT_REWARD_CONFIG): number {
  if (totalXp < 0) return 1;
  let level = 1;
  while (xpForLevel(level + 1, config) <= totalXp) {
    level++;
  }
  return level;
}

export function xpProgressInLevel(
  totalXp: number,
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): { current: number; needed: number; percent: number } {
  const level = levelFromXp(totalXp, config);
  const xpAtCurrentLevel = xpForLevel(level, config);
  const xpAtNextLevel = xpForLevel(level + 1, config);
  const current = totalXp - xpAtCurrentLevel;
  const needed = xpAtNextLevel - xpAtCurrentLevel;
  const percent = needed > 0 ? Math.floor((current / needed) * 100) : 100;
  return { current, needed, percent };
}

export function computeBalance(
  totalXp: number,
  totalCoins: number,
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): ChildBalance {
  const level = levelFromXp(totalXp, config);
  const progress = xpProgressInLevel(totalXp, config);

  return {
    xp: totalXp,
    coins: totalCoins,
    level,
    xpToNextLevel: progress.needed - progress.current,
    xpProgress: progress.percent,
  };
}

export function computeTotalsFromLedger(
  entries: Array<{ currency: 'xp' | 'coins'; amount: number }>,
): { totalXp: number; totalCoins: number } {
  let totalXp = 0;
  let totalCoins = 0;

  for (const entry of entries) {
    if (entry.currency === 'xp') {
      totalXp += entry.amount;
    } else {
      totalCoins += entry.amount;
    }
  }

  return { totalXp, totalCoins };
}
