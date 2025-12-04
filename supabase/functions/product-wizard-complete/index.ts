import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { productId } = await req.json();

    // Verify user owns this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found or unauthorized');
    }

    // Mark product as complete
    const { error: updateError } = await supabase
      .from('products')
      .update({
        is_complete: true,
        wizard_step: 5,
        intel_enabled: true,
      })
      .eq('id', productId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // TODO: Trigger async intelligence build via orchestrator
    // This would enqueue a job like:
    // await orchestrator.enqueueJob({
    //   jobType: 'PRODUCT_INTELLIGENCE',
    //   subType: 'BUILD_KNOWLEDGE_GRAPH',
    //   payload: { productId },
    // });

    // For now, we'll log it
    console.log(`Product ${productId} (${product.name}) completed by user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        message: 'Product wizard completed successfully!',
        productId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});