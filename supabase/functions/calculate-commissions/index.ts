import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const { saleId } = await req.json();

    if (!saleId) {
      return new Response(
        JSON.stringify({ success: false, error: 'saleId required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify sale belongs to user
    const { data: sale, error: saleError } = await supabase
      .from('mlm_sales')
      .select('id, user_id, member_id, amount')
      .eq('id', saleId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (saleError || !sale) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sale not found or unauthorized' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate commissions using database function
    const { error: calcError } = await supabase.rpc('calculate_commissions_for_sale', {
      sale_id_param: saleId,
    });

    if (calcError) {
      console.error('Commission calculation error:', calcError);
      throw calcError;
    }

    // Get calculated commissions
    const { data: commissions, error: commError } = await supabase
      .from('mlm_commissions')
      .select(`
        *,
        earner:mlm_members!mlm_commissions_earner_id_fkey(
          id,
          full_name,
          current_rank
        )
      `)
      .eq('sale_id', saleId)
      .order('level', { ascending: true });

    if (commError) {
      throw commError;
    }

    const totalCommissions = commissions?.reduce((sum, c) => sum + (c.commission_amount || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        success: true,
        sale: {
          id: sale.id,
          amount: sale.amount,
        },
        commissions: commissions,
        summary: {
          totalCommissions,
          commissionCount: commissions?.length || 0,
          levels: commissions?.length || 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error calculating commissions:', error);
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
