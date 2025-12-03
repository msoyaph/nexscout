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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { productId, name, tagline, category, description, basePrice } = await req.json();

    let finalId = productId;

    // If productId missing, create new product
    if (!productId) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name,
          short_tagline: tagline,
          main_category: category,
          short_description: description,
          base_price: basePrice,
          wizard_step: 1,
          active: true,
        })
        .select('id')
        .single();

      if (error) throw error;
      finalId = data.id;
    } else {
      // Update existing product
      const { error } = await supabase
        .from('products')
        .update({
          name,
          short_tagline: tagline,
          main_category: category,
          short_description: description,
          base_price: basePrice,
          wizard_step: 1,
        })
        .eq('id', productId)
        .eq('user_id', user.id);

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true, productId: finalId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});