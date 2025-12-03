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

    const { productId, variants } = await req.json();

    // Verify user owns this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found or unauthorized');
    }

    // Delete existing variants for this product
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    // Insert new variants
    if (variants && variants.length > 0) {
      const variantsToInsert = variants.map((v: any, index: number) => ({
        product_id: productId,
        name: v.name,
        sku: v.sku || null,
        price_override: v.price ? parseFloat(v.price) : null,
        attributes: v.attributes || {},
        status: 'active',
        sort_order: index,
      }));

      const { error: insertError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert);

      if (insertError) throw insertError;
    }

    // Update wizard step
    await supabase
      .from('products')
      .update({ wizard_step: 3 })
      .eq('id', productId)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});