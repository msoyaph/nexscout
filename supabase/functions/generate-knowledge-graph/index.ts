import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GraphRequest {
  owner_type: 'system' | 'enterprise' | 'team';
  owner_id?: string;
  regenerate?: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { owner_type, owner_id, regenerate = false } = await req.json() as GraphRequest;

    if (!regenerate) {
      const { data: existingGraph } = await supabase
        .from('knowledge_graph_snapshots')
        .select('*')
        .eq('owner_type', owner_type)
        .eq('owner_id', owner_id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingGraph) {
        return new Response(
          JSON.stringify({ 
            success: true,
            graph: existingGraph,
            cached: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    let companyQuery = supabase
      .from('admin_companies')
      .select('*')
      .eq('owner_type', owner_type);

    if (owner_id) {
      companyQuery = companyQuery.eq('owner_id', owner_id);
    } else {
      companyQuery = companyQuery.is('owner_id', null);
    }

    const { data: company } = await companyQuery.maybeSingle();

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'No company data found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let productsQuery = supabase
      .from('admin_products')
      .select('*')
      .eq('owner_type', owner_type);

    if (owner_id) {
      productsQuery = productsQuery.eq('owner_id', owner_id);
    } else {
      productsQuery = productsQuery.is('owner_id', null);
    }

    const { data: products = [] } = await productsQuery;

    let servicesQuery = supabase
      .from('admin_services')
      .select('*')
      .eq('owner_type', owner_type);

    if (owner_id) {
      servicesQuery = servicesQuery.eq('owner_id', owner_id);
    } else {
      servicesQuery = servicesQuery.is('owner_id', null);
    }

    const { data: services = [] } = await servicesQuery;

    const productIds = products.map((p: any) => p.id);
    let variants = [];

    if (productIds.length > 0) {
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productIds);
      
      variants = variantsData || [];
    }

    const nodes: any[] = [];
    const edges: any[] = [];

    const companyNode = {
      id: company.id,
      type: 'company',
      label: company.company_name || company.name,
      properties: company
    };
    nodes.push(companyNode);

    for (const product of products) {
      const productNode = {
        id: product.id,
        type: 'product',
        label: product.name,
        properties: product
      };
      nodes.push(productNode);
      edges.push({ type: 'belongs_to', source: product.id, target: company.id });

      const productVariants = variants.filter((v: any) => v.product_id === product.id);
      for (const variant of productVariants) {
        const variantNode = {
          id: variant.id,
          type: 'variant',
          label: variant.variant_name,
          properties: variant
        };
        nodes.push(variantNode);
        edges.push({ type: 'variant_of', source: variant.id, target: product.id });
      }
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    const { data: savedGraph, error: saveError } = await supabase
      .from('knowledge_graph_snapshots')
      .insert({
        owner_type,
        owner_id,
        version: 1,
        graph_data: { nodes, edges },
        node_count: nodes.length,
        edge_count: edges.length,
        metadata: {
          entity_types: ['company', 'product', 'variant', 'service'],
          generated_at: new Date().toISOString()
        },
        created_by: user?.id
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ 
        success: true,
        graph: savedGraph,
        cached: false,
        stats: {
          nodes: nodes.length,
          edges: edges.length,
          products: products.length,
          services: services.length,
          variants: variants.length
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating knowledge graph:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});