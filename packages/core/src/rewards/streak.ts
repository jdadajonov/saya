import type { RewardConfig } from '../config/rewards';
import { DEFAULT_REWARD_CONFIG } from '../config/rewards';
import type { ActivityDay, StreakInfo } from './types';

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year!, month! - 1, day);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDaysInRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function countActiveDays(activityDays: ActivityDay[]): number {
  return activityDays.filter((d) => d.hasLearning || d.hasActivity).length;
}

export function computeStreak(
  activityDays: ActivityDay[],
  today: string,
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): StreakInfo {
  const todayDate = parseDate(today);
  const weekStart = getWeekStart(todayDate);
  const weekDays = getDaysInRange(weekStart, todayDate);

  const activityMap = new Map<string, ActivityDay>();
  for (const day of activityDays) {
    activityMap.set(day.date, day);
  }

  let daysThisWeek = 0;
  for (const dateStr of weekDays) {
    const day = activityMap.get(dateStr);
    if (day && (day.hasLearning || day.hasActivity)) {
      daysThisWeek++;
    }
  }

  let currentStreak = 0;
  const sortedDays = [...activityDays]
    .filter((d) => d.hasLearning || d.hasActivity)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sortedDays.length > 0) {
    const checkDate = new Date(todayDate);

    for (const day of sortedDays) {
      const dayDate = formatDate(checkDate);
      if (day.date === dayDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (day.date < dayDate) {
        break;
      }
    }
  }

  const requiredDays = config.streak.requiredDaysPerWeek;
  const bonusEarned = daysThisWeek >= requiredDays;

  return {
    currentStreak,
    daysThisWeek,
    requiredDays,
    bonusEarned,
  };
}

export function shouldGrantStreakBonus(
  activityDays: ActivityDay[],
  today: string,
  alreadyGrantedThisWeek: boolean,
  config: RewardConfig = DEFAULT_REWARD_CONFIG,
): boolean {
  if (alreadyGrantedThisWeek) return false;

  const streak = computeStreak(activityDays, today, config);
  return streak.daysThisWeek >= config.streak.requiredDaysPerWeek;
}

export function getWeekStartDate(today: string): string {
  const todayDate = parseDate(today);
  const weekStart = getWeekStart(todayDate);
  return formatDate(weekStart);
}
