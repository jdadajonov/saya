import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';
import { levelFromXp, xpProgressInLevel, computeTotalsFromLedger } from '@saya/core';
import type { ChildBalance, StreakInfo, CatalogReward, Redemption, RedemptionStatus } from '@saya/core';

interface LedgerEntryRow {
  entry_type: 'xp' | 'coins';
  amount: number;
}

export function useBalanceQuery(childId: string | null) {
  return useQuery({
    queryKey: ['balance', childId],
    enabled: !!childId,
    queryFn: async (): Promise<ChildBalance> => {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('entry_type, amount')
        .eq('child_id', childId!);

      if (error) throw error;

      const entries = (data ?? []).map((row: LedgerEntryRow) => ({
        currency: row.entry_type,
        amount: row.amount,
      }));

      const { totalXp, totalCoins } = computeTotalsFromLedger(entries);
      const level = levelFromXp(totalXp);
      const progress = xpProgressInLevel(totalXp);

      return {
        xp: totalXp,
        coins: totalCoins,
        level,
        xpToNextLevel: progress.needed - progress.current,
        xpProgress: progress.percent,
      };
    },
  });
}

export function useStreakQuery(childId: string | null) {
  return useQuery({
    queryKey: ['streak', childId],
    enabled: !!childId,
    queryFn: async (): Promise<StreakInfo> => {
      const today = new Date();
      const weekStart = getWeekStart(today);

      const { data: activityDays, error: adError } = await supabase
        .from('activity_days')
        .select('date, has_learning, has_activity')
        .eq('child_id', childId!)
        .gte('date', weekStart)
        .lte('date', formatDate(today));

      if (adError) throw adError;

      const daysThisWeek = (activityDays ?? []).filter(
        (d: { has_learning: boolean; has_activity: boolean }) =>
          d.has_learning || d.has_activity
      ).length;

      const { data: bonusData } = await supabase
        .from('streak_bonuses')
        .select('id')
        .eq('child_id', childId!)
        .eq('week_start', weekStart)
        .single();

      const sortedDays = [...(activityDays ?? [])]
        .filter((d: { has_learning: boolean; has_activity: boolean }) =>
          d.has_learning || d.has_activity
        )
        .sort((a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date));

      let currentStreak = 0;
      const checkDate = new Date(today);

      for (const day of sortedDays) {
        const dayDate = formatDate(checkDate);
        if ((day as { date: string }).date === dayDate) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        currentStreak,
        daysThisWeek,
        requiredDays: 4,
        bonusEarned: !!bonusData,
      };
    },
  });
}

export function useRewardCatalogQuery(familyId: string | null) {
  return useQuery({
    queryKey: ['rewards', 'catalog', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('family_id', familyId!)
        .eq('active', true)
        .order('cost_coins', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row): CatalogReward => ({
        id: row.id,
        familyId: row.family_id,
        title: row.title,
        description: row.description ?? '',
        costCoins: row.cost_coins,
        imageKey: row.image_key ?? undefined,
        isActive: row.active ?? row.is_active ?? true,
      }));
    },
  });
}

export function useCreateReward() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      familyId: string;
      title: string;
      description?: string;
      costCoins: number;
      imageKey?: string;
    }) => {
      const { error } = await supabase
        .from('rewards')
        .insert({
          family_id: input.familyId,
          title: input.title,
          cost_coins: input.costCoins,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['rewards', 'catalog', variables.familyId] });
    },
  });
}

export function useUpdateReward() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      rewardId: string;
      title?: string;
      costCoins?: number;
      isActive?: boolean;
    }) => {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.title !== undefined) updates.title = input.title;
      if (input.costCoins !== undefined) updates.cost_coins = input.costCoins;
      if (input.isActive !== undefined) updates.active = input.isActive;

      const { error } = await supabase
        .from('rewards')
        .update(updates)
        .eq('id', input.rewardId);

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rewards', 'catalog'] });
    },
  });
}

export function useDeleteReward() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase.from('rewards').delete().eq('id', rewardId);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rewards', 'catalog'] });
    },
  });
}

export function useRedemptionsQuery(childId: string | null, status?: RedemptionStatus) {
  return useQuery({
    queryKey: ['redemptions', childId, status],
    enabled: !!childId,
    queryFn: async () => {
      let query = supabase
        .from('redemptions')
        .select('*, rewards(*)')
        .eq('child_id', childId!)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row): Redemption => {
        const rewards = Array.isArray(row.rewards) ? row.rewards[0] : row.rewards;
        return {
          id: row.id,
          childId: row.child_id,
          rewardId: row.reward_id,
          reward: rewards ? {
            id: rewards.id,
            familyId: rewards.family_id,
            title: rewards.title,
            description: rewards.description ?? '',
            costCoins: rewards.cost_coins,
            imageKey: rewards.image_key ?? undefined,
            isActive: rewards.active ?? rewards.is_active ?? true,
          } : undefined,
          status: row.status,
          requestedAt: new Date(row.created_at),
          resolvedAt: row.updated_at ? new Date(row.updated_at) : undefined,
          resolvedBy: undefined,
        };
      });
    },
  });
}

export function usePendingRedemptionsForFamily(familyId: string | null) {
  return useQuery({
    queryKey: ['redemptions', 'pending', familyId],
    enabled: !!familyId,
    queryFn: async () => {
      const { data: children } = await supabase
        .from('children')
        .select('id, display_name')
        .eq('family_id', familyId!);

      if (!children?.length) return [];

      const childIds = children.map((c: { id: string }) => c.id);

      const { data, error } = await supabase
        .from('redemptions')
        .select('*, rewards(*)')
        .in('child_id', childIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const childMap = new Map(children.map((c: { id: string; display_name: string }) => [c.id, c.display_name]));

      return (data ?? []).map((row) => {
        const rewards = Array.isArray(row.rewards) ? row.rewards[0] : row.rewards;
        return {
          id: row.id,
          childId: row.child_id,
          childName: childMap.get(row.child_id) ?? '',
          rewardId: row.reward_id,
          reward: rewards ? {
            id: rewards.id,
            familyId: rewards.family_id,
            title: rewards.title,
            description: rewards.description ?? '',
            costCoins: rewards.cost_coins,
            imageKey: rewards.image_key ?? undefined,
            isActive: rewards.active ?? rewards.is_active ?? true,
          } : undefined,
          status: row.status as RedemptionStatus,
          requestedAt: new Date(row.created_at),
        };
      });
    },
  });
}

export function useRequestRedemption() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ childId, rewardId }: { childId: string; rewardId: string }) => {
      const { data, error } = await supabase
        .from('redemptions')
        .insert({ child_id: childId, reward_id: rewardId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['redemptions', variables.childId] });
    },
  });
}

export function useApproveRedemption() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      redemptionId,
      approve,
    }: {
      redemptionId: string;
      approve: boolean;
    }) => {
      const status = approve ? 'approved' : 'declined';

      const { error } = await supabase
        .from('redemptions')
        .update({ status })
        .eq('id', redemptionId);

      if (error) throw error;

      if (approve) {
        const { data: redemption } = await supabase
          .from('redemptions')
          .select('child_id, rewards(cost_coins)')
          .eq('id', redemptionId)
          .single();

        if (redemption) {
          const rewards = redemption.rewards as { cost_coins: number } | { cost_coins: number }[] | null;
          const cost = Array.isArray(rewards) ? rewards[0]?.cost_coins ?? 0 : rewards?.cost_coins ?? 0;
          await supabase.from('ledger_entries').insert({
            child_id: redemption.child_id,
            entry_type: 'coins',
            amount: -cost,
            reason: 'redemption',
            source_event_id: `redemption:${redemptionId}`,
          });
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['redemptions'] });
      void qc.invalidateQueries({ queryKey: ['balance'] });
    },
  });
}

export function useGrantSurprise() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      childId,
      rewardId,
    }: {
      childId: string;
      rewardId: string;
    }) => {
      const { error } = await supabase
        .from('redemptions')
        .insert({
          child_id: childId,
          reward_id: rewardId,
          status: 'approved',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['redemptions'] });
      void qc.invalidateQueries({ queryKey: ['surprises'] });
    },
  });
}

export function useMarkRedemptionUsed() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (redemptionId: string) => {
      const { error } = await supabase
        .from('redemptions')
        .update({ status: 'used' })
        .eq('id', redemptionId);

      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['redemptions'] });
      void qc.invalidateQueries({ queryKey: ['surprises'] });
    },
  });
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return formatDate(d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
