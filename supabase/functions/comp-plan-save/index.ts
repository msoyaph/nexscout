import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CompensationPlanConfig {
  planName: string;
  planType: 'unilevel' | 'binary' | 'matrix' | 'hybrid';
  maxLevels: number;
  levels: Array<{
    level: number;
    percentage: number;
    rankRequired?: string;
  }>;
  rankRules: Array<{
    rank: string;
    minVolume: number;
  }>;
}

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

    const { planName, planType, config }: { planName: string; planType: string; config: CompensationPlanConfig } = await req.json();

    // 1. Upsert plan
    const { data: planData, error: planError } = await supabase
      .from('mlm_compensation_plans')
      .upsert(
        {
          user_id: user.id,
          plan_name: planName,
          plan_type: planType,
          config: config,
          is_active: true,
        },
        { onConflict: 'user_id,plan_name' }
      )
      .select()
      .single();

    if (planError) {
      throw planError;
    }

    // 2. Sync to commission rules
    const { error: syncError } = await supabase.rpc('sync_plan_to_commission_rules', {
      user_id_param: user.id,
      plan_name_param: planName,
      config_param: config,
    });

    if (syncError) {
      console.error('Sync error:', syncError);
      throw syncError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        plan: planData,
        message: 'Compensation plan saved and synced successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error saving plan:', error);
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
