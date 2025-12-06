import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, company } = await req.json();

    console.log('[AdminSignup] Creating user:', email);

    // Use service role key (full admin privileges - bypasses ALL auth checks)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create user with admin.createUser (bypasses ALL triggers and restrictions!)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        company: company
      }
    });

    if (authError) {
      console.error('[AdminSignup] Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user returned');
    }

    console.log('[AdminSignup] ✅ User created:', authData.user.id);

    // Call our SQL function to create all records (uses SECURITY DEFINER)
    const { data: result, error: functionError } = await supabase.rpc(
      'handle_new_user_signup',
      {
        p_user_id: authData.user.id,
        p_email: email,
        p_full_name: fullName,
        p_company: company
      }
    );

    if (functionError) {
      console.error('[AdminSignup] Function error:', functionError);
      throw functionError;
    }

    console.log('[AdminSignup] ✅ All records created:', result);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        email: email,
        message: 'Account created successfully!'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[AdminSignup] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Signup failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

