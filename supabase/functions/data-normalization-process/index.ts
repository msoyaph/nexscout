import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NormalizationRequest {
  limit?: number;
  priority_threshold?: number;
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

    const { limit = 10, priority_threshold = 0 } = 
      req.method === 'POST' ? await req.json() as NormalizationRequest : {};

    const { data: queueItems, error: fetchError } = await supabase
      .from('data_normalization_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 'max_attempts')
      .gte('priority', priority_threshold)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) throw fetchError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, errors: 0, message: 'No items to process' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let errors = 0;

    for (const item of queueItems) {
      try {
        await supabase
          .from('data_normalization_queue')
          .update({
            status: 'processing',
            processing_started_at: new Date().toISOString(),
            attempts: item.attempts + 1
          })
          .eq('id', item.id);

        const startTime = Date.now();

        await supabase
          .from('data_normalization_queue')
          .update({
            status: 'completed',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        processed++;
      } catch (err) {
        console.error(`Error processing item ${item.id}:`, err);

        await supabase
          .from('data_normalization_queue')
          .update({
            status: item.attempts + 1 >= item.max_attempts ? 'failed' : 'pending',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            processing_completed_at: new Date().toISOString()
          })
          .eq('id', item.id);

        errors++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed,
        errors,
        total_items: queueItems.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in data normalization:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});