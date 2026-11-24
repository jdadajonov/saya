import { xpForLevel, levelFromXp, xpProgressInLevel, computeBalance, computeTotalsFromLedger } from './levels';
import { DEFAULT_REWARD_CONFIG } from '../config/rewards';

describe('xpForLevel', () => {
  it('returns 0 for level 1', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('returns 0 for level 0 or negative', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-1)).toBe(0);
  });

  it('returns positive XP for level 2+', () => {
    expect(xpForLevel(2)).toBeGreaterThan(0);
    expect(xpForLevel(3)).toBeGreaterThan(xpForLevel(2));
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
  });

  it('increases monotonically', () => {
    for (let i = 2; i <= 20; i++) {
      expect(xpForLevel(i)).toBeGreaterThan(xpForLevel(i - 1));
    }
  });

  it('uses config values', () => {
    const customConfig = {
      ...DEFAULT_REWARD_CONFIG,
      xpLevels: { base: 50, exponent: 2 },
    };
    expect(xpForLevel(3, customConfig)).toBe(Math.floor(50 * Math.pow(2, 2)));
  });
});

describe('levelFromXp', () => {
  it('returns level 1 for 0 XP', () => {
    expect(levelFromXp(0)).toBe(1);
  });

  it('returns level 1 for negative XP', () => {
    expect(levelFromXp(-100)).toBe(1);
  });

  it('returns level 1 for XP below level 2 threshold', () => {
    const level2Xp = xpForLevel(2);
    expect(levelFromXp(level2Xp - 1)).toBe(1);
  });

  it('returns level 2 at exactly level 2 XP', () => {
    const level2Xp = xpForLevel(2);
    expect(levelFromXp(level2Xp)).toBe(2);
  });

  it('returns correct level for high XP', () => {
    const level10Xp = xpForLevel(10);
    expect(levelFromXp(level10Xp)).toBe(10);
    expect(levelFromXp(level10Xp + 1)).toBe(10);
  });

  it('never decreases as XP increases', () => {
    let prevLevel = 1;
    for (let xp = 0; xp <= 10000; xp += 100) {
      const level = levelFromXp(xp);
      expect(level).toBeGreaterThanOrEqual(prevLevel);
      prevLevel = level;
    }
  });
});

describe('xpProgressInLevel', () => {
  it('returns 0 current and correct needed for 0 XP', () => {
    const progress = xpProgressInLevel(0);
    expect(progress.current).toBe(0);
    expect(progress.needed).toBe(xpForLevel(2));
    expect(progress.percent).toBe(0);
  });

  it('returns correct progress mid-level', () => {
    const level2Xp = xpForLevel(2);
    const level3Xp = xpForLevel(3);
    const midXp = level2Xp + Math.floor((level3Xp - level2Xp) / 2);

    const progress = xpProgressInLevel(midXp);
    expect(progress.current).toBe(midXp - level2Xp);
    expect(progress.needed).toBe(level3Xp - level2Xp);
    const expectedPercent = Math.floor((progress.current / progress.needed) * 100);
    expect(progress.percent).toBe(expectedPercent);
  });

  it('returns 0% at level boundary', () => {
    const level5Xp = xpForLevel(5);
    const progress = xpProgressInLevel(level5Xp);
    expect(progress.current).toBe(0);
    expect(progress.percent).toBe(0);
  });
});

describe('computeBalance', () => {
  it('computes correct balance from totals', () => {
    const level3Xp = xpForLevel(3);
    const balance = computeBalance(level3Xp + 50, 100);

    expect(balance.xp).toBe(level3Xp + 50);
    expect(balance.coins).toBe(100);
    expect(balance.level).toBe(3);
    expect(balance.xpProgress).toBeGreaterThan(0);
  });

  it('handles zero values', () => {
    const balance = computeBalance(0, 0);
    expect(balance.level).toBe(1);
    expect(balance.xp).toBe(0);
    expect(balance.coins).toBe(0);
  });
});

describe('computeTotalsFromLedger', () => {
  it('sums XP and coins separately', () => {
    const entries = [
      { currency: 'xp' as const, amount: 10 },
      { currency: 'coins' as const, amount: 5 },
      { currency: 'xp' as const, amount: 20 },
      { currency: 'coins' as const, amount: 3 },
    ];

    const totals = computeTotalsFromLedger(entries);
    expect(totals.totalXp).toBe(30);
    expect(totals.totalCoins).toBe(8);
  });

  it('returns zeros for empty ledger', () => {
    const totals = computeTotalsFromLedger([]);
    expect(totals.totalXp).toBe(0);
    expect(totals.totalCoins).toBe(0);
  });

  it('handles only XP entries', () => {
    const entries = [
      { currency: 'xp' as const, amount: 100 },
      { currency: 'xp' as const, amount: 50 },
    ];

    const totals = computeTotalsFromLedger(entries);
    expect(totals.totalXp).toBe(150);
    expect(totals.totalCoins).toBe(0);
  });
});
