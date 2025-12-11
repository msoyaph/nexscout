/**
 * Facebook Data Deletion Request Callback - Edge Function
 * 
 * Copy this file to: supabase/functions/facebook-data-deletion/index.ts
 * 
 * This Edge Function handles Facebook's data deletion requests as required by
 * Meta's Platform Terms. When a user removes the app and requests data deletion,
 * Facebook sends a POST request with a signed_request containing the user's app-scoped ID.
 * 
 * Reference: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignedRequestData {
  algorithm: string;
  expires: number;
  issued_at: number;
  user_id: string;
}

/**
 * Base64 URL decode (Facebook uses URL-safe base64)
 */
function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  try {
    return atob(base64);
  } catch (error) {
    console.error('[Facebook Data Deletion] Base64 decode error:', error);
    throw error;
  }
}

/**
 * HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const bytes = new Uint8Array(signature);
  return Array.from(bytes).map(b => String.fromCharCode(b)).join('');
}

/**
 * Parse Facebook's signed request
 */
async function parseSignedRequest(signedRequest: string, appSecret: string): Promise<SignedRequestData | null> {
  try {
    const parts = signedRequest.split('.');
    if (parts.length !== 2) {
      console.error('[Facebook Data Deletion] Invalid signed request format');
      return null;
    }

    const [encodedSig, payload] = parts;
    const sig = base64UrlDecode(encodedSig);
    const data = JSON.parse(base64UrlDecode(payload));

    // Verify the signature
    const expectedSig = await hmacSha256(payload, appSecret);
    
    if (sig !== expectedSig) {
      console.error('[Facebook Data Deletion] Invalid signature');
      return null;
    }

    // Check expiration
    if (data.expires && data.expires < Math.floor(Date.now() / 1000)) {
      console.error('[Facebook Data Deletion] Request expired');
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Facebook Data Deletion] Error parsing signed request:', error);
    return null;
  }
}

/**
 * Generate confirmation code
 */
function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Find user by Facebook app-scoped user ID
 */
async function findUserByFacebookId(
  supabase: any,
  facebookUserId: string
): Promise<string | null> {
  try {
    // Search in facebook_page_connections
    const { data: connection } = await supabase
      .from('facebook_page_connections')
      .select('user_id')
      .or(`facebook_user_id.eq.${facebookUserId},page_id.eq.${facebookUserId}`)
      .eq('is_active', true)
      .maybeSingle();

    if (connection?.user_id) {
      return connection.user_id;
    }

    // Search in social_identities (if exists)
    const { data: identity } = await supabase
      .from('social_identities')
      .select('user_id')
      .eq('provider', 'facebook')
      .eq('provider_user_id', facebookUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (identity?.user_id) {
      return identity.user_id;
    }

    return null;
  } catch (error) {
    console.error('[Facebook Data Deletion] Error finding user:', error);
    return null;
  }
}

/**
 * Delete Facebook-related user data
 */
async function deleteUserData(
  supabase: any,
  userId: string,
  confirmationCode: string
): Promise<void> {
  try {
    // Record deletion request
    await supabase
      .from('data_deletion_requests')
      .insert({
        user_id: userId,
        provider: 'facebook',
        confirmation_code: confirmationCode,
        status: 'processing',
        requested_at: new Date().toISOString(),
      });

    // Deactivate Facebook connections
    await supabase
      .from('facebook_page_connections')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Deactivate social identities
    await supabase
      .from('social_identities')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('provider', 'facebook');

    // Remove Facebook data from profiles metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.metadata) {
      const updatedMetadata = { ...profile.metadata };
      delete updatedMetadata.facebook_user_id;
      delete updatedMetadata.facebook_access_token;
      delete updatedMetadata.facebook_page_id;

      await supabase
        .from('profiles')
        .update({ metadata: updatedMetadata })
        .eq('id', userId);
    }

    // Update status to completed
    await supabase
      .from('data_deletion_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('confirmation_code', confirmationCode);

    console.log(`[Facebook Data Deletion] Successfully deleted data for user: ${userId}`);
  } catch (error) {
    console.error('[Facebook Data Deletion] Error deleting user data:', error);
    
    await supabase
      .from('data_deletion_requests')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      })
      .eq('confirmation_code', confirmationCode);
    
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests (Facebook validation)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        message: 'Facebook Data Deletion Callback endpoint is active',
        status: 'ok'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
  // Handle GET requests (Facebook validation)
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        message: 'Facebook Data Deletion Callback endpoint is active',
        status: 'ok'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get signed_request from form data
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return new Response(
        JSON.stringify({ error: 'Missing signed_request' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Facebook App Secret
    const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET');
    if (!facebookAppSecret) {
      console.error('[Facebook Data Deletion] FACEBOOK_APP_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse signed request
    const requestData = await parseSignedRequest(signedRequest, facebookAppSecret);
    
    if (!requestData || !requestData.user_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid signed request' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const facebookUserId = requestData.user_id;
    console.log(`[Facebook Data Deletion] Received deletion request for Facebook user: ${facebookUserId}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate confirmation code and status URL
    const confirmationCode = generateConfirmationCode();
    const appUrl = Deno.env.get('VITE_APP_URL') || Deno.env.get('APP_URL') || 'https://nexscout.co';
    const statusUrl = `${appUrl}/data-deletion-status?code=${confirmationCode}`;

    // Find user by Facebook ID
    const userId = await findUserByFacebookId(supabase, facebookUserId);

    if (!userId) {
      // User not found - still return valid response
      console.log(`[Facebook Data Deletion] User not found for Facebook ID: ${facebookUserId}`);
      return new Response(
        JSON.stringify({
          url: statusUrl,
          confirmation_code: confirmationCode,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete user data (async)
    deleteUserData(supabase, userId, confirmationCode).catch(error => {
      console.error('[Facebook Data Deletion] Error in async deletion:', error);
    });

    // Return response immediately
    return new Response(
      JSON.stringify({
        url: statusUrl,
        confirmation_code: confirmationCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[Facebook Data Deletion] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

