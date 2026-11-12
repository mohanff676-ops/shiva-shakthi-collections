// ============================================================================
// SHIVA SHAKTHI COLLECTIONS — SUPABASE EDGE FUNCTION: DELETE USER
// Secure server-side user deletion enforcing public.is_admin() authentication.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase environment variables.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify caller authentication via JWT Bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client authenticated as the caller
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or expired session.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify caller has admin privileges using database function public.is_admin()
    const { data: isAdmin, error: adminCheckError } = await callerClient.rpc('is_admin', {
      lookup_user_id: caller.id,
    });

    if (adminCheckError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access Denied: Administrator privileges are required to delete accounts.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse and validate target user ID
    const body = await req.json();
    const targetUserId = body.target_user_id;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid target_user_id in request body.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Safety Guard 1: Prevent self-deletion
    if (caller.id === targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Security Violation: Administrators cannot delete their own account.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Admin client with service_role key for backend operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Safety Guard 2: Prevent deleting the last administrator
    const { data: adminRoles, error: adminRolesError } = await adminClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRolesError && adminRoles) {
      const distinctAdmins = new Set(adminRoles.map((r: any) => r.user_id));
      const isTargetAdmin = distinctAdmins.has(targetUserId);

      if (isTargetAdmin && distinctAdmins.size <= 1) {
        return new Response(
          JSON.stringify({ error: 'Security Violation: Cannot delete the last active administrator in the system.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Check and preserve customer orders:
    // Update orders to set user_id = null so invoices and records are preserved
    const { error: ordersPreserveError } = await adminClient
      .from('orders')
      .update({ user_id: null })
      .eq('user_id', targetUserId);

    if (ordersPreserveError) {
      console.warn('[delete-user] Order preservation note:', ordersPreserveError.message);
    }

    // 7. Clean up associated public tables
    await adminClient.from('user_roles').delete().eq('user_id', targetUserId);
    await adminClient.from('user_bans').delete().eq('user_id', targetUserId);
    await adminClient.from('profiles').delete().eq('id', targetUserId);

    // 8. Permanently delete user account from Supabase Auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetUserId);

    if (deleteAuthError) {
      return new Response(
        JSON.stringify({ error: `Supabase Auth deletion failed: ${deleteAuthError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User account permanently deleted from Supabase Auth. Historical customer orders preserved.',
        deleted_user_id: targetUserId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'An unexpected error occurred during user deletion.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
