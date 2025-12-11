# Facebook App Connection - Quick Checklist

## ✅ What's Already Done

1. ✅ **Database Migration** - `data_deletion_requests` table created
2. ✅ **Edge Functions Exist:**
   - `facebook-webhook` - Webhook handler for Messenger
   - `facebook-lead-webhook` - Webhook handler for Lead Ads
   - `facebook-data-deletion` - Data deletion callback
3. ✅ **Frontend Pages:**
   - `FacebookIntegrationPage.tsx` - UI for connecting pages
   - `SettingsPage.tsx` - Facebook toggle in settings
4. ✅ **Services:**
   - `facebookMessengerIntegration.ts` - Messenger integration logic

---

## 🔧 What You Need to Do

### Step 1: Get Facebook App Credentials

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Create or select your app
3. Go to **Settings** → **Basic**
4. Copy:
   - **App ID**
   - **App Secret** (click "Show")

---

### Step 2: Configure Facebook App Dashboard

#### 2.1 Basic Settings

1. **Settings** → **Basic**
2. Add **App Domains:**
   - Your domain: `nexscout.co` (or your domain)
   - Supabase domain: `wuuwdlamgnhcagrxuskv.supabase.co` (your project)
3. **Data Deletion Request URL:**
   ```
   https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion
   ```
   *(Replace `wuuwdlamgnhcagrxuskv` with your Supabase project reference)*

#### 2.2 Messenger Settings

1. Go to **Messenger** → **Settings**
2. **Webhooks** → **Add Callback URL:**
   ```
   https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-webhook
   ```
3. **Verify Token:** `nexscout_fb_verify_token_2024` (or your custom token)
4. Click **"Verify and Save"**
5. **Subscribe to Events:**
   - ✅ messages
   - ✅ messaging_postbacks
   - ✅ messaging_optins
   - ✅ messaging_deliveries
   - ✅ messaging_reads

#### 2.3 OAuth Settings

1. Go to **Settings** → **Basic**
2. **Valid OAuth Redirect URIs:**
   Add:
   ```
   https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-oauth-callback
   https://nexscout.co/integrations/facebook/callback
   https://nexscout.co/api/facebook/callback
   ```
   *(Add all variations your app might use)*

---

### Step 3: Deploy/Verify Edge Functions

**Check if functions are deployed:**

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions list
```

**If not deployed, deploy them:**

```bash
# Deploy webhook
supabase functions deploy facebook-webhook

# Deploy lead webhook (if needed)
supabase functions deploy facebook-lead-webhook

# Deploy data deletion (already done)
supabase functions deploy facebook-data-deletion

# Deploy OAuth callback (if it exists)
supabase functions deploy facebook-oauth-callback
```

---

### Step 4: Configure Environment Variables

**In Supabase Dashboard → Edge Functions → Settings → Secrets:**

Add these secrets for **each function**:

#### For `facebook-webhook`:
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `FACEBOOK_VERIFY_TOKEN` - Your verify token (e.g., `nexscout_fb_verify_token_2024`)

#### For `facebook-oauth-callback` (if exists):
- `FACEBOOK_APP_ID` - Your Facebook App ID
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `APP_URL` - Your app URL (e.g., `https://nexscout.co`)

#### For `facebook-data-deletion`:
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `APP_URL` - Your app URL

---

### Step 5: Update Frontend Environment

**In your `.env` file:**

```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

**Or in Vite config / environment variables:**
- Make sure `VITE_FACEBOOK_APP_ID` is set in your production environment

---

### Step 6: Test the Connection

#### 6.1 Test OAuth Flow

1. Go to your app → Settings → Facebook (or `/integrations/facebook`)
2. Click **"Connect Facebook Page"**
3. Authorize the app
4. Should redirect back and show connected pages

#### 6.2 Test Webhook

1. Send a test message to your Facebook Page
2. Check Supabase Edge Function logs:
   - Go to Supabase Dashboard → Edge Functions → `facebook-webhook` → Logs
3. Verify message is received and processed

#### 6.3 Test Data Deletion

1. Go to Facebook Settings → Apps and Websites
2. Remove your app
3. Click "Send Request"
4. Check status at: `https://nexscout.co/data-deletion-status?code=...`

---

## 🔍 Troubleshooting

### OAuth Redirect Error

**Problem:** "Redirect URI mismatch"

**Solution:**
1. Check Facebook App → Settings → Basic → Valid OAuth Redirect URIs
2. Ensure the redirect URI in your code matches exactly
3. Check `APP_URL` environment variable

### Webhook Not Receiving Messages

**Problem:** Messages sent to page but not processed

**Solution:**
1. Check webhook is verified (green checkmark in Facebook)
2. Verify events are subscribed (messages, messaging_postbacks, etc.)
3. Check edge function logs for errors
4. Verify `FACEBOOK_VERIFY_TOKEN` matches
5. Ensure page access token is valid

### "Invalid Signature" Error

**Problem:** Webhook signature verification fails

**Solution:**
1. Check `FACEBOOK_APP_SECRET` is correct in edge function secrets
2. Verify webhook URL is using HTTPS (not HTTP)
3. Check signature verification code in webhook function

---

## 📋 Quick Checklist

- [ ] Facebook App created
- [ ] App ID and Secret obtained
- [ ] Messenger product added
- [ ] Webhook URL configured in Facebook
- [ ] Webhook verified (green checkmark)
- [ ] Events subscribed (messages, postbacks, etc.)
- [ ] Data Deletion URL configured
- [ ] OAuth Redirect URIs configured
- [ ] Edge functions deployed
- [ ] Environment variables set in Supabase
- [ ] `VITE_FACEBOOK_APP_ID` set in frontend
- [ ] Test OAuth connection
- [ ] Test webhook with real message
- [ ] Test data deletion callback

---

## 🆘 Need Help?

1. **Check Supabase Logs:**
   - Dashboard → Edge Functions → [function-name] → Logs

2. **Check Facebook Webhook Logs:**
   - Facebook App → Messenger → Webhooks → View Logs

3. **Verify Environment Variables:**
   - Supabase Dashboard → Edge Functions → Settings → Secrets

4. **Test Webhook Manually:**
   - Use Facebook's webhook testing tool in App Dashboard

---

## ✅ Next Steps After Connection

1. Configure AI system instructions for Facebook responses
2. Test auto-reply with real messages
3. Set up lead capture automation
4. Configure pipeline automation for Facebook leads
5. Monitor analytics and optimize responses

---

**Your Supabase Project Reference:** `wuuwdlamgnhcagrxuskv`  
*(Replace this with your actual project reference in all URLs)*

