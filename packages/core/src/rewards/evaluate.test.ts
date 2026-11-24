import { evaluate } from './evaluate';
import { DEFAULT_REWARD_CONFIG } from '../config/rewards';
import type { DomainEvent } from '../events/types';
import type { LedgerHistory } from './evaluate';

const history: LedgerHistory = { coinsTodayFromStudy: 0 };

function makeEvent(type: DomainEvent['type'], payload: Record<string, unknown> = {}): DomainEvent {
  return { type, childId: 'c1', familyId: 'f1', occurredAt: '2024-01-01T00:00:00Z', payload };
}

describe('evaluate — MissionCompleted', () => {
  it('gives xp and coins when below daily cap', () => {
    const entries = evaluate(makeEvent('MissionCompleted'), history);
    expect(entries).toHaveLength(2);
    const xp = entries.find((e) => e.currency === 'xp');
    const coins = entries.find((e) => e.currency === 'coins');
    expect(xp?.amount).toBe(DEFAULT_REWARD_CONFIG.xp.missionCompleted);
    expect(coins?.amount).toBe(DEFAULT_REWARD_CONFIG.coins.missionCompleted);
  });

  it('caps coins at dailyCoinCap', () => {
    const cappedHistory: LedgerHistory = {
      coinsTodayFromStudy: DEFAULT_REWARD_CONFIG.coins.dailyCoinCap - 1,
    };
    const entries = evaluate(makeEvent('MissionCompleted'), cappedHistory);
    const coins = entries.find((e) => e.currency === 'coins');
    expect(coins?.amount).toBe(1);
  });

  it('omits coins entry when cap already reached', () => {
    const fullHistory: LedgerHistory = {
      coinsTodayFromStudy: DEFAULT_REWARD_CONFIG.coins.dailyCoinCap,
    };
    const entries = evaluate(makeEvent('MissionCompleted'), fullHistory);
    expect(entries.every((e) => e.currency !== 'coins')).toBe(true);
  });

  it('sets correct reason and sourceEventId', () => {
    const entries = evaluate(makeEvent('MissionCompleted'), history);
    entries.forEach((e) => {
      expect(e.reason).toBe('mission_completed');
      expect(e.sourceEventId).toContain('MissionCompleted');
    });
  });
});

describe('evaluate — SessionConfirmed', () => {
  it('gives only xp', () => {
    const entries = evaluate(makeEvent('SessionConfirmed'), history);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.currency).toBe('xp');
    expect(entries[0]!.amount).toBe(DEFAULT_REWARD_CONFIG.xp.sessionConfirmed);
    expect(entries[0]!.reason).toBe('session_confirmed');
  });
});

describe('evaluate — MilestoneAchieved', () => {
  it('gives xp and coins', () => {
    const entries = evaluate(makeEvent('MilestoneAchieved'), history);
    expect(entries).toHaveLength(2);
    const xp = entries.find((e) => e.currency === 'xp');
    const coins = entries.find((e) => e.currency === 'coins');
    expect(xp?.amount).toBe(DEFAULT_REWARD_CONFIG.xp.milestoneAchieved);
    expect(coins?.amount).toBe(DEFAULT_REWARD_CONFIG.coins.milestoneAchieved);
  });

  it('sets milestone_achieved reason', () => {
    const entries = evaluate(makeEvent('MilestoneAchieved'), history);
    entries.forEach((e) => expect(e.reason).toBe('milestone_achieved'));
  });
});

describe('evaluate — WeekStreakAchieved', () => {
  it('gives only coins', () => {
    const entries = evaluate(makeEvent('WeekStreakAchieved'), history);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.currency).toBe('coins');
    expect(entries[0]!.amount).toBe(DEFAULT_REWARD_CONFIG.coins.weekStreak);
    expect(entries[0]!.reason).toBe('week_streak');
  });
});

describe('evaluate — ParentSurpriseGranted', () => {
  it('passes through currency, amount, and reason from payload', () => {
    const event = makeEvent('ParentSurpriseGranted', {
      currency: 'coins',
      amount: 5,
      reason: 'birthday',
    });
    const entries = evaluate(event, history);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.currency).toBe('coins');
    expect(entries[0]!.amount).toBe(5);
    expect(entries[0]!.reason).toBe('surprise:birthday');
  });
});

describe('evaluate — unknown event type', () => {
  it('returns empty array for unknown events', () => {
    const event = makeEvent('GoalCompleted');
    const entries = evaluate(event, history);
    expect(entries).toHaveLength(0);
  });
});

describe('evaluate — custom config', () => {
  it('uses provided config values', () => {
    const customConfig = {
      ...DEFAULT_REWARD_CONFIG,
      xp: { ...DEFAULT_REWARD_CONFIG.xp, missionCompleted: 99 },
    };
    const entries = evaluate(makeEvent('MissionCompleted'), history, customConfig);
    const xp = entries.find((e) => e.currency === 'xp');
    expect(xp?.amount).toBe(99);
  });
});
