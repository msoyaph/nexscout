import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-nexscout-api-key',
};

interface BrowserCapturePayload {
  captureType: string;
  platform: string;
  sourceUrl: string;
  htmlSnapshot?: string;
  textContent?: string;
  tags?: string[];
  notes?: string;
  metadata?: {
    autoCaptureType?: string;
    userAgent?: string;
    extensionVersion?: string;
    [key: string]: any;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const apiKey = req.headers.get('x-nexscout-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokenData, error: tokenError } = await supabase
      .from('browser_extension_tokens')
      .select('user_id, is_active')
      .eq('token', apiKey)
      .maybeSingle();

    if (tokenError || !tokenData || !tokenData.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or inactive API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = tokenData.user_id;

    await supabase
      .from('browser_extension_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token', apiKey);

    const payload: BrowserCapturePayload = await req.json();

    if (!payload.captureType || !payload.platform || !payload.sourceUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: captureType, platform, sourceUrl',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const normalizedPlatform = payload.platform.toLowerCase();
    const normalizedCaptureType = payload.captureType.toLowerCase().replace(/ /g, '_');

    const normalizedTags = (payload.tags || []).map((tag) =>
      tag.toLowerCase().replace(/ /g, '_')
    );

    const { data: capture, error: insertError } = await supabase
      .from('browser_captures')
      .insert({
        user_id: userId,
        capture_type: normalizedCaptureType,
        platform: normalizedPlatform,
        source_url: payload.sourceUrl,
        html_snapshot: payload.htmlSnapshot || null,
        text_content: payload.textContent || null,
        tags: normalizedTags,
        notes: payload.notes || null,
        extension_version: payload.metadata?.extensionVersion || null,
        metadata: payload.metadata || {},
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to store capture',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        captureId: capture.id,
        message: 'Browser capture stored successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});