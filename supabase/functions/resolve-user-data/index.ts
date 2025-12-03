import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PRIORITY_SCORES = {
  user: 300,
  team: 200,
  enterprise: 100,
  system: 50
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    const { data: teamMembership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .maybeSingle();

    const teamId = teamMembership?.team_id;

    const [userCompany, teamCompany, systemCompany] = await Promise.all([
      supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(),
      
      teamId ? supabase
        .from('admin_companies')
        .select('*')
        .eq('owner_type', 'team')
        .eq('owner_id', teamId)
        .maybeSingle() : Promise.resolve({ data: null }),
      
      supabase
        .from('admin_companies')
        .select('*')
        .eq('owner_type', 'system')
        .is('owner_id', null)
        .limit(1)
        .maybeSingle()
    ]);

    const [userProducts, teamProducts, systemProducts] = await Promise.all([
      supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'system')
        .eq('owner_id', userId),
      
      teamId ? supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'team')
        .eq('owner_id', teamId) : Promise.resolve({ data: [] }),
      
      supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', 'system')
        .is('owner_id', null)
    ]);

    let selectedCompany = null;
    let companySource = 'none';
    let companyPriority = 0;

    if (userCompany.data) {
      selectedCompany = userCompany.data;
      companySource = 'user';
      companyPriority = PRIORITY_SCORES.user;
    } else if (teamCompany.data) {
      selectedCompany = teamCompany.data;
      companySource = 'team';
      companyPriority = PRIORITY_SCORES.team;
    } else if (systemCompany.data) {
      selectedCompany = systemCompany.data;
      companySource = 'system';
      companyPriority = PRIORITY_SCORES.system;
    }

    let selectedProducts = [];
    let productsSource = 'none';
    let productsPriority = 0;

    if (userProducts.data && userProducts.data.length > 0) {
      selectedProducts = userProducts.data;
      productsSource = 'user';
      productsPriority = PRIORITY_SCORES.user;
    } else if (teamProducts.data && teamProducts.data.length > 0) {
      selectedProducts = teamProducts.data;
      productsSource = 'team';
      productsPriority = PRIORITY_SCORES.team;
    } else if (systemProducts.data && systemProducts.data.length > 0) {
      selectedProducts = systemProducts.data;
      productsSource = 'system';
      productsPriority = PRIORITY_SCORES.system;
    }

    const productIds = selectedProducts.map((p: any) => p.id);
    let variants = [];

    if (productIds.length > 0) {
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);
      
      variants = variantsData || [];
    }

    return new Response(
      JSON.stringify({
        company: selectedCompany,
        products: selectedProducts,
        variants,
        metadata: {
          sources: {
            company: companySource,
            products: productsSource
          },
          priorities: {
            company: companyPriority,
            products: productsPriority
          },
          cache_status: (selectedCompany && selectedProducts.length > 0) ? 'hit' : 
                       (selectedCompany || selectedProducts.length > 0) ? 'partial' : 'miss'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resolving user data:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});