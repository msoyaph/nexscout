import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // user_id
    const error = url.searchParams.get('error');

    if (error) {
      return Response.redirect(`${Deno.env.get('APP_URL')}/integrations/facebook?error=${error}`);
    }

    if (!code || !state) {
      return Response.redirect(`${Deno.env.get('APP_URL')}/integrations/facebook?error=missing_params`);
    }

    const appId = Deno.env.get('FACEBOOK_APP_ID');
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
    const appUrl = Deno.env.get('APP_URL') || 'https://nexscout.co';
    const redirectUri = `${appUrl}/integrations/facebook/callback`;

    if (!appId || !appSecret) {
      console.error('[Facebook OAuth] Missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
      return Response.redirect(`${appUrl}/integrations/facebook?error=server_config`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `code=${code}`
    );

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('[Facebook OAuth] Token exchange error:', tokenData.error);
      return Response.redirect(`${appUrl}/integrations/facebook?error=${encodeURIComponent(tokenData.error.message)}`);
    }

    const userAccessToken = tokenData.access_token;

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      console.error('[Facebook OAuth] Pages fetch error:', pagesData.error);
      return Response.redirect(`${appUrl}/integrations/facebook?error=${encodeURIComponent(pagesData.error.message)}`);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save page connections
    for (const page of pagesData.data || []) {
      const pageToken = page.access_token;

      // Get page info
      const pageInfoResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=name,username&access_token=${pageToken}`
      );
      const pageInfo = await pageInfoResponse.json();

      // Save to database
      await supabase.from('facebook_page_connections').upsert({
        user_id: state,
        page_id: page.id,
        page_name: pageInfo.name || page.name,
        page_username: pageInfo.username || null,
        page_access_token: pageToken,
        is_active: true,
        auto_reply_enabled: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,page_id'
      });

      // Update chatbot settings
      const { data: settings } = await supabase
        .from('chatbot_settings')
        .select('integrations')
        .eq('user_id', state)
        .maybeSingle();

      const integrations = settings?.integrations || {};
      integrations.facebook = {
        page_id: page.id,
        page_access_token: pageToken,
        enabled: true,
        connected_at: new Date().toISOString(),
      };

      await supabase
        .from('chatbot_settings')
        .update({ integrations })
        .eq('user_id', state);
    }

    return Response.redirect(`${appUrl}/integrations/facebook?success=true`);
  } catch (error: any) {
    console.error('[Facebook OAuth] Error:', error);
    const appUrl = Deno.env.get('APP_URL') || 'https://nexscout.co';
    return Response.redirect(
      `${appUrl}/integrations/facebook?error=${encodeURIComponent(error.message || 'Unknown error')}`
    );
  }
});
