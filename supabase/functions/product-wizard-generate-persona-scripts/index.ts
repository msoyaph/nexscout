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

    const { productId, persona } = await req.json();

    // Fetch product data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found or unauthorized');
    }

    // Generate AI script using a simple template for now
    // TODO: Integrate with OpenAI or other AI service
    const script = {
      icebreaker: `Hi! I noticed you're a ${persona}. Kumusta?`,
      pain_trigger: `Many ${persona}s struggle with ${product.pains?.[0] || 'their goals'}. Ever feel that way?`,
      benefit_punchline: `That's exactly why ${product.name} was created! ${product.primary_promise || 'It helps solve this problem.'}`,
      objection_handler: `I know you might be thinking "${product.objections?.[0] || 'Is this right for me?'}" - and that's totally valid! Here's what makes this different...`,
      close_attempt: `So, are you ready to try ${product.name}? I can help you get started today.`,
      cta: `Click here to learn more: ${product.product_url || '#'}`,
    };

    const scriptContent = `
ICEBREAKER:
${script.icebreaker}

PAIN TRIGGER:
${script.pain_trigger}

BENEFIT PUNCHLINE:
${script.benefit_punchline}

OBJECTION HANDLER:
${script.objection_handler}

CLOSE ATTEMPT:
${script.close_attempt}

CTA:
${script.cta}
`;

    // Save script to database
    const { data: savedScript, error: saveError } = await supabase
      .from('product_scripts')
      .insert({
        product_id: productId,
        persona,
        script_type: 'full_pitch',
        script_content: scriptContent,
        icebreaker: script.icebreaker,
        pain_trigger: script.pain_trigger,
        benefit_punchline: script.benefit_punchline,
        objection_handler: script.objection_handler,
        close_attempt: script.close_attempt,
        cta: script.cta,
        ai_generated: true,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ ok: true, script: savedScript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});