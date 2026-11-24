import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface LinkChildDeviceRequest {
  childId: string;
  deviceToken: string;
}

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

    // Verify calling parent
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

    const { childId, deviceToken } = await req.json() as LinkChildDeviceRequest;
    if (!childId || !deviceToken) {
      return new Response(JSON.stringify({ error: 'childId and deviceToken required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is parent of this child's family
    const { data: child, error: childError } = await userClient
      .from('children')
      .select('id, family_id, display_name')
      .eq('id', childId)
      .single();

    if (childError || !child) {
      return new Response(JSON.stringify({ error: 'Child not found or access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create a Supabase auth user for the child device (anonymous-style, email = device identifier)
    const childEmail = `child+${childId}@device.saya.internal`;
    const { data: childUser, error: createError } = await admin.auth.admin.createUser({
      email: childEmail,
      email_confirm: true,
      app_metadata: {
        role: 'child',
        child_id: childId,
        family_id: child.family_id,
      },
      user_metadata: {
        display_name: child.display_name,
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hash the device token for storage
    const tokenHash = await hashToken(deviceToken);

    // Record the device link (bypasses RLS via service role)
    const { error: deviceError } = await admin.from('child_devices').insert({
      child_id: childId,
      device_token_hash: tokenHash,
      linked_by: user.id,
    });

    if (deviceError) {
      // Clean up the created user if device insert fails
      await admin.auth.admin.deleteUser(childUser.user.id);
      throw deviceError;
    }

    // Generate a sign-in link the device can exchange for a session
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: childEmail,
    });

    if (linkError) {
      throw linkError;
    }

    return new Response(
      JSON.stringify({
        childUserId: childUser.user.id,
        actionLink: linkData.properties?.action_link,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
