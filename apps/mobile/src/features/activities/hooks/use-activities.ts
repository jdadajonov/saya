import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';
import { expandSessions } from '@saya/core';
import type { RecurrenceRule } from '@saya/core';
import { scheduleConfirmNotification } from '../../../platform/notifications';
import i18n from '@saya/i18n';

export interface ActivityRow {
  id: string;
  child_id: string;
  kind: string;
  title: string;
  place: string | null;
  color: string;
  rrule: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  id: string;
  activity_id: string;
  starts_at: string;
  ends_at: string;
  status: 'planned' | 'done' | 'missed' | 'cancelled';
  mood: string | null;
  activity?: ActivityRow;
}

export function useActivitiesQuery(childId: string | null) {
  return useQuery({
    queryKey: ['activities', childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('child_id', childId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActivityRow[];
    },
  });
}

export function useSessionsQuery(childId: string | null, from: Date, to: Date) {
  return useQuery({
    queryKey: ['sessions', childId, from.toISOString(), to.toISOString()],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_sessions')
        .select('*, activity:activities!activity_sessions_activity_id_fkey(*)')
        .gte('starts_at', from.toISOString())
        .lt('starts_at', to.toISOString())
        .order('starts_at');
      if (error) throw error;
      // Filter to this child only
      const rows = (data ?? []) as SessionRow[];
      return rows.filter((s) => (s.activity as ActivityRow | undefined)?.child_id === childId);
    },
  });
}

export function useTodaySessionsQuery(childId: string | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  return useSessionsQuery(childId, today, tomorrow);
}

export interface CreateActivityInput {
  childId: string;
  kind: string;
  title: string;
  place?: string;
  color: string;
  rule: RecurrenceRule;
}

export function useCreateActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      // 1. Insert activity
      const { data: activity, error: actErr } = await supabase
        .from('activities')
        .insert({
          child_id: input.childId,
          kind: input.kind,
          title: input.title,
          place: input.place ?? null,
          color: input.color,
          rrule: JSON.stringify(input.rule),
        })
        .select()
        .single();
      if (actErr) throw actErr;

      // 2. Expand sessions (12 weeks)
      const slots = expandSessions(input.rule, new Date(), 12);

      // 3. Batch insert sessions
      const rows = slots.map((s) => ({
        activity_id: (activity as ActivityRow).id,
        starts_at: s.startsAt.toISOString(),
        ends_at: s.endsAt.toISOString(),
        status: 'planned' as const,
      }));

      if (rows.length > 0) {
        const { error: sesErr } = await supabase.from('activity_sessions').insert(rows);
        if (sesErr) throw sesErr;
      }

      // 4. Schedule notifications for first 7 sessions (iOS limit awareness)
      const title = i18n.t('activities.confirmTitle', { title: input.title });
      const body = i18n.t('activities.confirmBody');
      await Promise.allSettled(
        slots.slice(0, 7).map((s) =>
          scheduleConfirmNotification({
            activityId: (activity as ActivityRow).id,
            title,
            body,
            fireAt: s.endsAt,
          }),
        ),
      );

      return activity as ActivityRow;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['activities', data.child_id] });
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useConfirmSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: string; status: 'done' | 'missed' }) => {
      const { error } = await supabase
        .from('activity_sessions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useRecordMood() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, mood }: { sessionId: string; mood: string }) => {
      const { error } = await supabase
        .from('activity_sessions')
        .update({ mood, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useCancelSession() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      // Actually delete the session from database
      const { error } = await supabase
        .from('activity_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ activityId, childId }: { activityId: string; childId: string }) => {
      // Delete all sessions first (cascade should handle this, but explicit is safer)
      const { error: sessionsError } = await supabase
        .from('activity_sessions')
        .delete()
        .eq('activity_id', activityId);
      if (sessionsError) throw sessionsError;

      // Delete the activity
      const { error: activityError } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);
      if (activityError) throw activityError;

      return { activityId, childId };
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['activities', data.childId] });
      void qc.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
