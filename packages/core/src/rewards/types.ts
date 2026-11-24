export type Currency = 'xp' | 'coins';

export interface LedgerEntry {
  currency: Currency;
  amount: number;
  reason: string;
  sourceEventId: string;
}

export interface LedgerHistory {
  coinsTodayFromStudy: number;
}

export interface ChildBalance {
  xp: number;
  coins: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number;
}

export interface ActivityDay {
  date: string;
  hasLearning: boolean;
  hasActivity: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  daysThisWeek: number;
  requiredDays: number;
  bonusEarned: boolean;
}

export interface CatalogReward {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  costCoins: number;
  imageKey?: string;
  isActive: boolean;
}

export type RedemptionStatus = 'pending' | 'approved' | 'declined';

export interface Redemption {
  id: string;
  childId: string;
  rewardId: string;
  reward?: CatalogReward;
  status: RedemptionStatus;
  requestedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export const DEFAULT_CATALOG_TEMPLATES: Omit<CatalogReward, 'id' | 'familyId'>[] = [
  {
    title: 'rewards.templates.extraScreenTime',
    description: 'rewards.templates.extraScreenTimeDesc',
    costCoins: 20,
    isActive: true,
  },
  {
    title: 'rewards.templates.chooseDinner',
    description: 'rewards.templates.chooseDinnerDesc',
    costCoins: 30,
    isActive: true,
  },
  {
    title: 'rewards.templates.movieNight',
    description: 'rewards.templates.movieNightDesc',
    costCoins: 50,
    isActive: true,
  },
  {
    title: 'rewards.templates.smallToy',
    description: 'rewards.templates.smallToyDesc',
    costCoins: 100,
    isActive: true,
  },
  {
    title: 'rewards.templates.specialOuting',
    description: 'rewards.templates.specialOutingDesc',
    costCoins: 200,
    isActive: true,
  },
];
