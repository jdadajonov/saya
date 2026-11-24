import type { DomainEvent } from '../events/types';
import { DEFAULT_REWARD_CONFIG, type RewardConfig } from '../config/rewards';
import type { Currency, LedgerEntry, LedgerHistory } from './types';

export function evaluate(
  event: DomainEvent,
  history: LedgerHistory,
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const sourcePrefix = `${event.type}:${event.occurredAt}`;

  switch (event.type) {
    case 'MissionCompleted': {
      entries.push({
        currency: 'xp',
        amount: config.xp.missionCompleted,
        reason: 'mission_completed',
        sourceEventId: `${sourcePrefix}:xp`,
      });

      const coinsEarned = Math.min(
        config.coins.missionCompleted,
        config.coins.dailyCoinCap - history.coinsTodayFromStudy,
      );
      if (coinsEarned > 0) {
        entries.push({
          currency: 'coins',
          amount: coinsEarned,
          reason: 'mission_completed',
          sourceEventId: `${sourcePrefix}:coins`,
        });
      }
      break;
    }

    case 'SessionConfirmed': {
      entries.push({
        currency: 'xp',
        amount: config.xp.sessionConfirmed,
        reason: 'session_confirmed',
        sourceEventId: `${sourcePrefix}:xp`,
      });
      break;
    }

    case 'MilestoneAchieved': {
      entries.push({
        currency: 'xp',
        amount: config.xp.milestoneAchieved,
        reason: 'milestone_achieved',
        sourceEventId: `${sourcePrefix}:xp`,
      });
      entries.push({
        currency: 'coins',
        amount: config.coins.milestoneAchieved,
        reason: 'milestone_achieved',
        sourceEventId: `${sourcePrefix}:coins`,
      });
      break;
    }

    case 'WeekStreakAchieved': {
      entries.push({
        currency: 'coins',
        amount: config.coins.weekStreak,
        reason: 'week_streak',
        sourceEventId: `${sourcePrefix}:coins`,
      });
      break;
    }

    case 'ParentSurpriseGranted': {
      const { currency, amount, reason } = event.payload as {
        currency: Currency;
        amount: number;
        reason: string;
      };
      entries.push({
        currency,
        amount,
        reason: `surprise:${reason}`,
        sourceEventId: `${sourcePrefix}:surprise`,
      });
      break;
    }

    default:
      break;
  }

  return entries;
}
