import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';

export interface ChildStats {
  coins: number;
  xp: number;
  level: number;
  todayMinutes: number;
  todayMissions: number;
  activeGoals: number;
  streakDays: number;
  weeklyData: { day: string; minutes: number; missions: number }[];
}

const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function calculateLevel(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

async function fetchChildStats(childId: string): Promise<ChildStats> {
  const today = getStartOfDay(new Date());
  const weekDates = getWeekDates();
  const weekStart = getStartOfDay(weekDates[0]!);

  // Fetch ledger entries for coins and XP
  const { data: ledgerData } = await supabase
    .from('ledger_entries')
    .select('currency, amount')
    .eq('child_id', childId);

  const coins = ledgerData?.filter(e => e.currency === 'coins').reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const xp = ledgerData?.filter(e => e.currency === 'xp').reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const level = calculateLevel(xp);

  // Fetch active goals count
  const { count: activeGoals } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('status', 'active');

  // Fetch attempts for this week
  const { data: attemptsData } = await supabase
    .from('attempts')
    .select('created_at, response_ms, exercise_id')
    .eq('child_id', childId)
    .gte('created_at', weekStart.toISOString());

  // Calculate today's stats
  const todayAttempts = attemptsData?.filter(a => {
    const attemptDate = getStartOfDay(new Date(a.created_at));
    return attemptDate.getTime() === today.getTime();
  }) ?? [];

  const todayMinutes = Math.round(
    todayAttempts.reduce((sum, a) => sum + (a.response_ms ?? 30000), 0) / 60000
  );

  const todayMissions = new Set(todayAttempts.map(a => a.exercise_id)).size;

  // Calculate weekly data
  const weeklyData = weekDates.map((date, idx) => {
    const dayStart = getStartOfDay(date);
    const dayAttempts = attemptsData?.filter(a => {
      const attemptDate = getStartOfDay(new Date(a.created_at));
      return attemptDate.getTime() === dayStart.getTime();
    }) ?? [];

    const minutes = Math.round(
      dayAttempts.reduce((sum, a) => sum + (a.response_ms ?? 30000), 0) / 60000
    );
    const missions = new Set(dayAttempts.map(a => a.exercise_id)).size;

    return {
      day: DAYS_SHORT[(idx + 1) % 7]!, // Monday = index 0
      minutes,
      missions,
    };
  });

  // Calculate streak (days with activity in last 7 days)
  const streakDays = weeklyData.filter(d => d.minutes > 0).length;

  return {
    coins,
    xp,
    level,
    todayMinutes,
    todayMissions,
    activeGoals: activeGoals ?? 0,
    streakDays,
    weeklyData,
  };
}

export function useChildStats(childId: string | null) {
  return useQuery({
    queryKey: ['child-stats', childId],
    queryFn: () => fetchChildStats(childId!),
    enabled: !!childId,
    staleTime: 60_000,
  });
}

export function useChildrenStats(childIds: string[]) {
  return useQuery({
    queryKey: ['children-stats', childIds],
    queryFn: async () => {
      const results: Record<string, ChildStats> = {};
      for (const id of childIds) {
        results[id] = await fetchChildStats(id);
      }
      return results;
    },
    enabled: childIds.length > 0,
    staleTime: 60_000,
  });
}
