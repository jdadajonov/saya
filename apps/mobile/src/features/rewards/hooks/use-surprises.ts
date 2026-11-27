import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../platform/supabase';
import type { CatalogReward } from '@saya/core';

const SEEN_KEY = 'seen_surprise_ids';

async function getSeenIds(): Promise<string[]> {
  const json = await SecureStore.getItemAsync(SEEN_KEY);
  return json ? JSON.parse(json) : [];
}

async function markAsSeen(id: string) {
  const seen = await getSeenIds();
  if (!seen.includes(id)) {
    seen.push(id);
    await SecureStore.setItemAsync(SEEN_KEY, JSON.stringify(seen));
  }
}

interface Surprise {
  id: string;
  reward: CatalogReward;
  createdAt: Date;
}

export function useUnseenSurprises(childId: string | null) {
  return useQuery({
    queryKey: ['surprises', 'unseen', childId],
    enabled: !!childId,
    queryFn: async (): Promise<Surprise[]> => {
      const { data, error } = await supabase
        .from('redemptions')
        .select('id, created_at, rewards(*)')
        .eq('child_id', childId!)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const seenIds = await getSeenIds();

      return (data ?? [])
        .filter(row => !seenIds.includes(row.id))
        .map(row => {
          const rawRewards = row.rewards;
          const rewards = Array.isArray(rawRewards) ? rawRewards[0] : rawRewards;
          return {
            id: row.id,
            reward: {
              id: rewards?.id ?? '',
              familyId: rewards?.family_id ?? '',
              title: rewards?.title ?? '',
              description: '',
              costCoins: rewards?.cost_coins ?? 0,
              isActive: true,
            },
            createdAt: new Date(row.created_at),
          };
        });
    },
    staleTime: 30_000,
  });
}

export function useMarkSurpriseSeen() {
  const qc = useQueryClient();

  return async (surpriseId: string) => {
    await markAsSeen(surpriseId);
    void qc.invalidateQueries({ queryKey: ['surprises', 'unseen'] });
  };
}
