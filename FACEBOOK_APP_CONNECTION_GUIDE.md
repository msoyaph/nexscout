# Facebook App Connection Guide - Complete Setup

## ✅ Prerequisites Completed

1. ✅ Database migration for `data_deletion_requests` table
2. ✅ Data deletion callback edge function deployed
3. ✅ Facebook integration UI pages exist
4. ✅ Facebook Messenger integration service code exists

---

## 🚀 Step-by-Step Facebook App Connection

### Step 1: Create Facebook App (if not done)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Fill in:
   - **App Name**: NexScout (or your app name)
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one
5. Click **"Create App"**

---

### Step 2: Add Messenger Product

1. In your Facebook App Dashboard, go to **"Add Products"**
2. Find **"Messenger"** and click **"Set Up"**
3. This enables Messenger API for your app

---

### Step 3: Configure App Settings

#### 3.1 Basic Settings

1. Go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret** (click "Show" to reveal secret)
3. Add **App Domains**:
   - Your domain (e.g., `nexscout.co`)
   - Your Supabase project domain (e.g., `wuuwdlamgnhcagrxuskv.supabase.co`)
4. Add **Privacy Policy URL**: `https://nexscout.co/privacy` (or your privacy policy)
5. Add **Terms of Service URL**: `https://nexscout.co/terms` (or your terms)

#### 3.2 Data Deletion Request URL

1. In **Settings** → **Basic**, scroll to **"Data Deletion Request URL"**
2. Enter:
   ```
   https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion
   ```
   *(Replace `wuuwdlamgnhcagrxuskv` with your Supabase project reference)*
3. Click **"Save Changes"**

---

### Step 4: Configure Messenger Settings

1. Go to **Messenger** → **Settings**
2. Under **"Webhooks"**, click **"Add Callback URL"**
3. Enter:
   ```
   https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-webhook
   ```
   *(Replace with your Supabase project reference)*
4. **Verify Token**: Enter `nexscout_fb_verify_token_2024` (or any secure token)
5. Click **"Verify and Save"**

#### 4.1 Subscribe to Webhook Events

After webhook is verified, subscribe to these events:
- ✅ **messages** - Incoming messages
- ✅ **messaging_postbacks** - Button clicks, quick replies
- ✅ **messaging_optins** - User opt-ins
- ✅ **messaging_deliveries** - Message delivery status
- ✅ **messaging_reads** - Message read receipts

---

### Step 5: Create Facebook Webhook Edge Function

**Create:** `supabase/functions/facebook-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { FacebookMessengerIntegration } from '../../src/services/chatbot/facebookMessengerIntegration.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Webhook verification (GET request)
    if (req.method === 'GET') {
      const verifyToken = Deno.env.get('FACEBOOK_VERIFY_TOKEN') || 'nexscout_fb_verify_token_2024';
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified');
        return new Response(challenge, { status: 200 });
      } else {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Handle webhook events (POST request)
    if (req.method === 'POST') {
      const body = await req.json();
      const signature = req.headers.get('x-hub-signature-256');

      // Verify signature
      const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
      if (appSecret && signature) {
        const isValid = FacebookMessengerIntegration.verifyWebhookSignature(
          signature,
          JSON.stringify(body),
          appSecret
        );
        if (!isValid) {
          return new Response('Invalid signature', { status: 403 });
        }
      }

      // Process webhook
      if (body.object === 'page') {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        for (const entry of body.entry) {
          const pageId = entry.id;
          
          // Find user by page ID
          const { data: connection } = await supabase
            .from('facebook_page_connections')
            .select('user_id, chatbot_settings')
            .eq('page_id', pageId)
            .eq('is_active', true)
            .maybeSingle();

          if (connection) {
            // Get chatbot settings
            const { data: settings } = await supabase
              .from('chatbot_settings')
              .select('*')
              .eq('user_id', connection.user_id)
              .single();

            if (settings) {
              const integration = new FacebookMessengerIntegration(
                connection.user_id,
                settings
              );
              await integration.processWebhook(body);
            }
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      return new Response('Event not handled', { status: 200 });
    }

    return new Response('Method not allowed', { status: 405 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

**Deploy the webhook function:**
```bash
supabase functions deploy facebook-webhook
```

---

### Step 6: Create Facebook OAuth Callback Handler

**Create:** `supabase/functions/facebook-oauth-callback/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
    const redirectUri = `${Deno.env.get('APP_URL')}/integrations/facebook/callback`;

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
      throw new Error(tokenData.error.message);
    }

    const userAccessToken = tokenData.access_token;

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.error) {
      throw new Error(pagesData.error.message);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Save page connections
    for (const page of pagesData.data || []) {
      // Get page access token
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

    return Response.redirect(`${Deno.env.get('APP_URL')}/integrations/facebook?success=true`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return Response.redirect(
      `${Deno.env.get('APP_URL')}/integrations/facebook?error=${encodeURIComponent(error.message)}`
    );
  }
});
```

**Deploy the callback function:**
```bash
supabase functions deploy facebook-oauth-callback
```

---

### Step 7: Configure Environment Variables

**In Supabase Dashboard → Edge Functions → Settings → Secrets:**

Add these secrets for **all Facebook-related functions**:

1. **`FACEBOOK_APP_ID`** - Your Facebook App ID
2. **`FACEBOOK_APP_SECRET`** - Your Facebook App Secret
3. **`FACEBOOK_VERIFY_TOKEN`** - Your webhook verify token (e.g., `nexscout_fb_verify_token_2024`)
4. **`APP_URL`** - Your app URL (e.g., `https://nexscout.co`)

**For each function:**
- `facebook-webhook` needs: `FACEBOOK_APP_SECRET`, `FACEBOOK_VERIFY_TOKEN`
- `facebook-oauth-callback` needs: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `APP_URL`
- `facebook-data-deletion` needs: `FACEBOOK_APP_SECRET`, `APP_URL`

---

### Step 8: Update Frontend Environment Variables

**In your `.env` file (or Vite environment):**

```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

**Update callback URLs in code:**

The frontend code already has:
- `FacebookIntegrationPage.tsx` - Uses `/integrations/facebook/callback`
- `SettingsPage.tsx` - Uses `/api/facebook/callback`

**Update these to use the edge function:**
```typescript
const redirectUri = `${window.location.origin}/integrations/facebook/callback`;
// Should redirect to: https://your-project.supabase.co/functions/v1/facebook-oauth-callback
```

---

### Step 9: Update Frontend OAuth Flow

**Update `FacebookIntegrationPage.tsx`:**

Change the OAuth URL to point to your edge function:

```typescript
const startFacebookOAuth = () => {
  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
  // Use edge function for callback
  const redirectUri = `https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-oauth-callback`;
  
  const scope = 'pages_messaging,pages_manage_metadata,pages_read_engagement,pages_show_list';
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${user?.id}`;
  
  window.location.href = authUrl;
};
```

---

### Step 10: Test the Connection

1. **Test OAuth Flow:**
   - Go to `/integrations/facebook` (or Settings → Facebook)
   - Click "Connect Facebook Page"
   - Authorize the app
   - Should redirect back and show connected pages

2. **Test Webhook:**
   - Send a test message to your Facebook Page
   - Check Supabase Edge Function logs
   - Verify message is processed and AI responds

3. **Test Data Deletion:**
   - Remove app from Facebook Settings
   - Click "Send Request"
   - Check deletion status at `/data-deletion-status?code=...`

---

## 📋 Checklist

- [ ] Facebook App created
- [ ] Messenger product added
- [ ] App ID and Secret obtained
- [ ] Data Deletion URL configured in Facebook
- [ ] Webhook URL configured in Facebook
- [ ] Webhook events subscribed
- [ ] `facebook-webhook` edge function deployed
- [ ] `facebook-oauth-callback` edge function deployed
- [ ] `facebook-data-deletion` edge function deployed
- [ ] Environment variables configured
- [ ] Frontend OAuth flow updated
- [ ] Test OAuth connection
- [ ] Test webhook with real message
- [ ] Test data deletion callback

---

## 🔗 Important URLs

**Your Supabase Project:**
- Replace `wuuwdlamgnhcagrxuskv` with your actual project reference

**Webhook URL:**
```
https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-webhook
```

**OAuth Callback URL:**
```
https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-oauth-callback
```

**Data Deletion URL:**
```
https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion
```

---

## 🆘 Troubleshooting

### Webhook Verification Fails
- Check `FACEBOOK_VERIFY_TOKEN` matches in both Facebook and edge function
- Ensure webhook URL is accessible (not localhost)

### OAuth Redirect Error
- Verify redirect URI matches exactly in Facebook App settings
- Check `APP_URL` environment variable is correct
- Ensure `state` parameter (user_id) is passed

### Messages Not Received
- Verify webhook events are subscribed
- Check edge function logs in Supabase Dashboard
- Ensure page access token is valid
- Verify `facebook_page_connections` table has active connections

---

## ✅ Next Steps After Connection

1. Configure AI system instructions for Facebook responses
2. Test auto-reply functionality
3. Monitor message analytics
4. Set up lead capture automation
5. Configure pipeline automation for Facebook leads

---

**Need Help?** Check the Supabase Edge Function logs and Facebook App Dashboard webhook logs for detailed error messages.

