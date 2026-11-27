import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';
import { useAuthStore } from '../stores/auth-store';
import type { Child, Family } from '../stores/auth-store';

export function useFamilyQuery() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['family', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Family | null> => {
      const { data, error } = await supabase
        .from('members')
        .select('families(id, name, locale, timezone)')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      const fam = (data as { families: Family | null } | null)?.families ?? null;
      return fam;
    },
  });
}

export function useChildrenQuery(familyId: string | null) {
  return useQuery({
    queryKey: ['children', familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<Child[]> => {
      const { data, error } = await supabase
        .from('children')
        .select('id, family_id, display_name, birth_year, age_band, avatar_key, avatar_url, gender')
        .eq('family_id', familyId!)
        .order('created_at');
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id as string,
        familyId: row.family_id as string,
        displayName: row.display_name as string,
        birthYear: row.birth_year as number,
        ageBand: row.age_band as Child['ageBand'],
        avatarKey: row.avatar_key as string,
        avatarUrl: row.avatar_url as string | undefined,
        gender: row.gender as Child['gender'],
      }));
    },
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  const setFamily = useAuthStore((s) => s.setFamily);

  return useMutation({
    mutationFn: async (params: { name: string; locale: string }) => {
      const { data: familyId, error } = await supabase.rpc('create_family_with_owner', {
        p_name: params.name,
        p_locale: params.locale,
      });
      if (error) throw error;

      const { data: family, error: fetchError } = await supabase
        .from('families')
        .select()
        .eq('id', familyId)
        .single();
      if (fetchError) throw fetchError;

      return family as Family;
    },
    onSuccess: (family) => {
      setFamily(family);
      void queryClient.invalidateQueries({ queryKey: ['family'] });
    },
  });
}

export function useAddChild() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      displayName: string;
      birthYear: number;
      ageBand: Child['ageBand'];
      avatarKey?: string;
    }) => {
      const currentFamilyId = useAuthStore.getState().family?.id;
      if (!currentFamilyId) {
        throw new Error('No family selected');
      }
      const { data: childId, error } = await supabase.rpc('add_child_to_family', {
        p_family_id: currentFamilyId,
        p_display_name: params.displayName,
        p_birth_year: params.birthYear,
        p_age_band: params.ageBand,
        p_avatar_key: params.avatarKey ?? 'avatar_1',
      });
      if (error) throw error;

      const { data: child, error: fetchError } = await supabase
        .from('children')
        .select()
        .eq('id', childId)
        .single();
      if (fetchError) throw fetchError;

      return {
        id: child.id,
        familyId: child.family_id,
        displayName: child.display_name,
        birthYear: child.birth_year,
        ageBand: child.age_band,
        avatarKey: child.avatar_key,
      } as Child;
    },
    onSuccess: (child) => {
      void queryClient.invalidateQueries({ queryKey: ['children', child.familyId] });
    },
  });
}

export function useUpdateChild() {
  const queryClient = useQueryClient();
  const setChildren = useAuthStore((s) => s.setChildren);
  const children = useAuthStore((s) => s.children);

  return useMutation({
    mutationFn: async (params: {
      childId: string;
      displayName?: string;
      birthYear?: number;
      ageBand?: Child['ageBand'];
      avatarKey?: string;
      avatarUrl?: string;
      gender?: Child['gender'];
    }) => {
      const updates: Record<string, unknown> = {};
      if (params.displayName !== undefined) updates.display_name = params.displayName;
      if (params.birthYear !== undefined) updates.birth_year = params.birthYear;
      if (params.ageBand !== undefined) updates.age_band = params.ageBand;
      if (params.avatarKey !== undefined) updates.avatar_key = params.avatarKey;
      if (params.avatarUrl !== undefined) updates.avatar_url = params.avatarUrl;
      if (params.gender !== undefined) updates.gender = params.gender;

      const { error } = await supabase
        .from('children')
        .update(updates)
        .eq('id', params.childId);

      if (error) throw error;

      const { data: child, error: fetchError } = await supabase
        .from('children')
        .select()
        .eq('id', params.childId)
        .single();
      if (fetchError) throw fetchError;

      return {
        id: child.id,
        familyId: child.family_id,
        displayName: child.display_name,
        birthYear: child.birth_year,
        ageBand: child.age_band,
        avatarKey: child.avatar_key,
        avatarUrl: child.avatar_url,
        gender: child.gender,
      } as Child;
    },
    onSuccess: (updatedChild) => {
      const newChildren = children.map((c) =>
        c.id === updatedChild.id ? updatedChild : c
      );
      setChildren(newChildren);
      void queryClient.invalidateQueries({ queryKey: ['children', updatedChild.familyId] });
    },
  });
}

export function useDeleteFamily() {
  const signOut = useAuthStore((s) => s.signOut);
  const familyId = useAuthStore((s) => s.family?.id);

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${process.env['EXPO_PUBLIC_SUPABASE_URL']}/functions/v1/delete-family`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ familyId }),
        },
      );
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'delete-family failed');
      }
    },
    onSuccess: () => void signOut(),
  });
}
