import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../platform/supabase';

export interface Invitation {
  id: string;
  familyId: string;
  code: string;
  email: string | null;
  role: 'parent' | 'coach';
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export function useInvitationsQuery(familyId: string | null) {
  return useQuery({
    queryKey: ['invitations', familyId],
    enabled: !!familyId,
    queryFn: async (): Promise<Invitation[]> => {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('family_id', familyId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        familyId: row.family_id,
        code: row.code,
        email: row.email,
        role: row.role,
        expiresAt: new Date(row.expires_at),
        acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
        createdAt: new Date(row.created_at),
      }));
    },
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ familyId, email }: { familyId: string; email?: string }) => {
      const { data, error } = await supabase
        .rpc('create_parent_invitation', {
          p_family_id: familyId,
          p_email: email ?? null,
        });

      if (error) throw error;
      return data[0] as { id: string; code: string; expires_at: string };
    },
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: ['invitations', variables.familyId] });
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase
        .rpc('accept_invitation', { p_code: code });

      if (error) throw error;
      return data[0] as { family_id: string; family_name: string; role: string };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['family'] });
      void qc.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

export function useCreateChildDevicePin() {
  return useMutation({
    mutationFn: async (childId: string) => {
      const { data, error } = await supabase
        .rpc('create_child_device_pin', { p_child_id: childId });

      if (error) throw error;
      return data[0] as { pin: string; expires_at: string };
    },
  });
}

export function useLinkChildDevice() {
  return useMutation({
    mutationFn: async ({ pin, deviceToken }: { pin: string; deviceToken: string }) => {
      const { data, error } = await supabase
        .rpc('link_child_device', {
          p_pin: pin,
          p_device_token: deviceToken,
        });

      if (error) throw error;
      return data[0] as { child_id: string; child_name: string; family_id: string };
    },
  });
}
