import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const defaultPlan = {
  planName: 'Default Unilevel',
  planType: 'unilevel',
  maxLevels: 5,
  levels: [
    { level: 1, percentage: 10 },
    { level: 2, percentage: 5 },
    { level: 3, percentage: 3 },
    { level: 4, percentage: 2 },
    { level: 5, percentage: 1 },
  ],
  rankRules: [
    { rank: 'Starter', minVolume: 0 },
    { rank: 'Silver', minVolume: 1000 },
    { rank: 'Gold', minVolume: 5000 },
    { rank: 'Platinum', minVolume: 15000 },
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get query params
    const url = new URL(req.url);
    const planName = url.searchParams.get('planName') || 'Default Unilevel';

    // Load plan
    const { data: planData, error: planError } = await supabase
      .from('mlm_compensation_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_name', planName)
      .eq('is_active', true)
      .maybeSingle();

    if (planError) {
      throw planError;
    }

    if (!planData) {
      return new Response(
        JSON.stringify({
          success: true,
          exists: false,
          defaultPlan: defaultPlan,
          message: 'No plan found, returning default',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        exists: true,
        plan: {
          id: planData.id,
          planName: planData.plan_name,
          planType: planData.plan_type,
          ...planData.config,
          createdAt: planData.created_at,
          updatedAt: planData.updated_at,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error loading plan:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
