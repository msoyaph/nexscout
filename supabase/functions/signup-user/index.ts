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

    console.log('[Signup] Creating user:', email);

    // Use service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Create auth user
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
      console.error('[Signup] Auth error:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user returned');
    }

    console.log('[Signup] ✅ Auth user created:', authData.user.id);

    const userId = authData.user.id;
    const shortId = Math.random().toString(36).substring(2, 10);

    // 2. Create all required records (with service_role = bypasses RLS)
    await Promise.all([
      // Profile
      supabase.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        company,
        onboarding_completed: false,
        onboarding_step: null,
        subscription_tier: 'free',
        coin_balance: 0,
        unique_user_id: shortId,
      }),

      // Energy
      supabase.from('user_energy').insert({
        user_id: userId,
        current_energy: 5,
        max_energy: 5,
      }),

      // Chatbot settings
      supabase.from('chatbot_settings').insert({
        user_id: userId,
        tone: 'professional',
        is_configured: false,
      }),

      // Calendar settings
      supabase.from('calendar_settings').insert({
        user_id: userId,
        timezone: 'Asia/Manila',
      }),

      // Chatbot link
      supabase.from('chatbot_links').insert({
        user_id: userId,
        chatbot_id: shortId,
        is_active: true,
      }),
    ]);

    console.log('[Signup] ✅ All records created');

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: 'Account created successfully!'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[Signup] Error:', error);
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

