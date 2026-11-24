import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';
import type { GoalDomain, GoalStatus, ProposedBy, MilestoneTemplate } from '@saya/core';

export interface GoalRow {
  id: string;
  child_id: string;
  domain: GoalDomain;
  title: string;
  status: GoalStatus;
  proposed_by: ProposedBy;
  approved_by: string | null;
  skill_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneRow {
  id: string;
  goal_id: string;
  title: string;
  position: number;
  achieved_at: string | null;
  skill_code: string | null;
  mastery_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface GoalWithMilestones extends GoalRow {
  milestones: MilestoneRow[];
}

export function useGoalsQuery(childId: string | null) {
  return useQuery({
    queryKey: ['goals', childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, milestones(*)')
        .eq('child_id', childId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GoalWithMilestones[];
    },
  });
}

export function useGoalDetailQuery(goalId: string | null) {
  return useQuery({
    queryKey: ['goals', 'detail', goalId],
    enabled: !!goalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, milestones(*)')
        .eq('id', goalId!)
        .single();
      if (error) throw error;
      return data as GoalWithMilestones;
    },
  });
}

export function usePendingProposalsQuery(childId: string | null) {
  return useQuery({
    queryKey: ['goals', childId, 'pending'],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*, milestones(*)')
        .eq('child_id', childId!)
        .eq('status', 'draft')
        .eq('proposed_by', 'child')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as GoalWithMilestones[];
    },
  });
}

export interface CreateGoalInput {
  childId: string;
  domain: GoalDomain;
  title: string;
  proposedBy: ProposedBy;
  skillCode?: string;
  milestones: MilestoneTemplate[];
}

export function useCreateGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const status = input.proposedBy === 'child' ? 'draft' : 'active';

      const { data: goal, error: goalErr } = await supabase
        .from('goals')
        .insert({
          child_id: input.childId,
          domain: input.domain,
          title: input.title,
          status,
          proposed_by: input.proposedBy,
          skill_code: input.skillCode ?? null,
        })
        .select()
        .single();

      if (goalErr) throw goalErr;

      const milestoneRows = input.milestones.map((m, i) => ({
        goal_id: (goal as GoalRow).id,
        title: m.title,
        position: i,
        skill_code: m.skillCode ?? null,
        mastery_threshold: m.masteryThreshold ?? 0.8,
      }));

      if (milestoneRows.length > 0) {
        const { error: msErr } = await supabase.from('milestones').insert(milestoneRows);
        if (msErr) throw msErr;
      }

      return goal as GoalRow;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['goals', data.child_id] });
    },
  });
}

export function useApproveGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, approve }: { goalId: string; approve: boolean }) => {
      const status = approve ? 'active' : 'cancelled';
      const { error } = await supabase
        .from('goals')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useConfirmMilestone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: string }) => {
      const { error } = await supabase
        .from('milestones')
        .update({ achieved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', milestoneId);
      if (error) throw error;

      // Check if all milestones for this goal are now completed
      const { data: milestone } = await supabase
        .from('milestones')
        .select('goal_id')
        .eq('id', milestoneId)
        .single();

      if (milestone?.goal_id) {
        const { data: allMilestones } = await supabase
          .from('milestones')
          .select('id, achieved_at')
          .eq('goal_id', milestone.goal_id);

        const allCompleted = allMilestones?.every((m) => m.achieved_at !== null);

        if (allCompleted) {
          await supabase
            .from('goals')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', milestone.goal_id);
        }
      }
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', goalId);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export interface EvidenceRow {
  id: string;
  milestone_id: string | null;
  session_id: string | null;
  kind: 'confirm' | 'photo' | 'note';
  confirmed_by: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function usePendingEvidenceQuery(milestoneIds: string[]) {
  return useQuery({
    queryKey: ['evidence', 'pending', milestoneIds],
    enabled: milestoneIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evidence')
        .select('*')
        .in('milestone_id', milestoneIds)
        .eq('kind', 'confirm')
        .is('confirmed_by', null);
      if (error) throw error;
      return (data ?? []) as EvidenceRow[];
    },
  });
}

export interface PendingVerificationWithDetails {
  evidence: EvidenceRow;
  milestone: MilestoneRow;
  goal: GoalRow;
}

export function usePendingVerificationsForChild(childId: string | null) {
  return useQuery({
    queryKey: ['evidence', 'pending', 'child', childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evidence')
        .select(`
          *,
          milestones!inner (
            *,
            goals!inner (*)
          )
        `)
        .eq('kind', 'confirm')
        .is('confirmed_by', null)
        .eq('milestones.goals.child_id', childId!);

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        evidence: {
          id: row.id,
          milestone_id: row.milestone_id,
          session_id: row.session_id,
          kind: row.kind,
          confirmed_by: row.confirmed_by,
          payload: row.payload,
          created_at: row.created_at,
          updated_at: row.updated_at,
        } as EvidenceRow,
        milestone: row.milestones as MilestoneRow,
        goal: row.milestones.goals as GoalRow,
      })) as PendingVerificationWithDetails[];
    },
  });
}

export function useRequestMilestoneVerification() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId }: { milestoneId: string }) => {
      const { data: existing } = await supabase
        .from('evidence')
        .select('id')
        .eq('milestone_id', milestoneId)
        .eq('kind', 'confirm')
        .is('confirmed_by', null)
        .maybeSingle();

      if (existing) {
        return existing;
      }

      const { data, error } = await supabase
        .from('evidence')
        .insert({
          milestone_id: milestoneId,
          kind: 'confirm',
          payload: { requested_at: new Date().toISOString() },
        })
        .select()
        .single();
      if (error) throw error;
      return data as EvidenceRow;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['evidence'] });
      void qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useApproveEvidence() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ evidenceId, milestoneId, userId }: { evidenceId: string; milestoneId: string; userId: string }) => {
      const { error: evidenceErr } = await supabase
        .from('evidence')
        .update({ confirmed_by: userId, updated_at: new Date().toISOString() })
        .eq('id', evidenceId);
      if (evidenceErr) throw evidenceErr;

      const { error: milestoneErr } = await supabase
        .from('milestones')
        .update({ achieved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', milestoneId);
      if (milestoneErr) throw milestoneErr;

      // Check if all milestones for this goal are now completed
      const { data: milestone } = await supabase
        .from('milestones')
        .select('goal_id')
        .eq('id', milestoneId)
        .single();

      if (milestone?.goal_id) {
        const { data: allMilestones } = await supabase
          .from('milestones')
          .select('id, achieved_at')
          .eq('goal_id', milestone.goal_id);

        const allCompleted = allMilestones?.every((m) => m.achieved_at !== null);

        if (allCompleted) {
          await supabase
            .from('goals')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', milestone.goal_id);
        }
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['evidence'] });
      void qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useSkillMasteryMap(childId: string | null) {
  return useQuery({
    queryKey: ['skill_states', childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_states')
        .select('skill_id, mastery, skills(code)')
        .eq('child_id', childId!);
      if (error) throw error;

      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const skills = row.skills as { code: string } | { code: string }[] | null;
        const skillCode = Array.isArray(skills) ? skills[0]?.code : skills?.code;
        if (skillCode) {
          map[skillCode] = row.mastery;
        }
      }
      return map;
    },
  });
}
