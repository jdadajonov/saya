import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is an authenticated parent in the family
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json() as { familyId: string };
    const { familyId } = body;
    if (!familyId) {
      return new Response(JSON.stringify({ error: 'familyId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is owner of the family
    const { data: member, error: memberError } = await userClient
      .from('members')
      .select('role')
      .eq('user_id', user.id)
      .eq('family_id', familyId)
      .single();

    if (memberError || !member || member.role !== 'owner') {
      return new Response(JSON.stringify({ error: 'Forbidden: not family owner' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for cascade delete
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Collect all auth user IDs linked to this family (members + child device users)
    const { data: members } = await admin
      .from('members')
      .select('user_id')
      .eq('family_id', familyId);

    // Delete family (cascades to all child tables via FK ON DELETE CASCADE)
    const { error: deleteError } = await admin
      .from('families')
      .delete()
      .eq('id', familyId);

    if (deleteError) {
      throw deleteError;
    }

    // Delete auth users (members + children device accounts)
    const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
    for (const uid of userIds) {
      await admin.auth.admin.deleteUser(uid);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
