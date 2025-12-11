# Facebook App Approved - Next Steps Checklist

## ✅ What's Already Done

1. ✅ Database migration (`data_deletion_requests` table)
2. ✅ Data deletion callback edge function
3. ✅ Facebook integration UI pages
4. ✅ Facebook Messenger integration service
5. ✅ Facebook webhook function
6. ✅ Facebook app approved

---

## 🚀 Next Steps to Complete Integration

### Step 1: Configure Facebook App Dashboard Settings

#### 1.1 Basic Settings

1. **Go to:** [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. **Select your app**
3. **Settings → Basic:**
   - ✅ **App Domains:** Add your domains
     - `nexscout.co`
     - `dohrkewdanppkqulvhhz.supabase.co`
   - ✅ **Privacy Policy URL:** `https://nexscout.co/privacy`
   - ✅ **Terms of Service URL:** `https://nexscout.co/terms`
   - ✅ **Data Deletion Request URL:**
     ```
     https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
     ```
   - ✅ **Valid OAuth Redirect URIs:**
     ```
     https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-oauth-callback
     https://nexscout.co/integrations/facebook/callback
     https://nexscout.co/api/facebook/callback
     ```

#### 1.2 Messenger Settings

1. **Go to:** Messenger → Settings
2. **Webhooks:**
   - **Callback URL:**
     ```
     https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-webhook
     ```
   - **Verify Token:** `nexscout_fb_verify_token_2024` (or your custom token)
   - **Click "Verify and Save"**
3. **Subscribe to Events:**
   - ✅ `messages` - Incoming messages
   - ✅ `messaging_postbacks` - Button clicks
   - ✅ `messaging_optins` - User opt-ins
   - ✅ `messaging_deliveries` - Delivery status
   - ✅ `messaging_reads` - Read receipts

#### 1.3 Get App Credentials

**From Settings → Basic:**
- **App ID:** Copy this (you'll need it)
- **App Secret:** Click "Show" and copy (keep it secure!)

---

### Step 2: Configure Supabase Edge Functions

#### 2.1 Set Environment Variables (Secrets)

**Go to:** Supabase Dashboard → Edge Functions → Settings → Secrets

**For `facebook-webhook`:**
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `FACEBOOK_VERIFY_TOKEN` - `nexscout_fb_verify_token_2024` (or your token)

**For `facebook-oauth-callback` (if exists):**
- `FACEBOOK_APP_ID` - Your Facebook App ID
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `APP_URL` - `https://nexscout.co`

**For `facebook-data-deletion`:**
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `APP_URL` - `https://nexscout.co`

#### 2.2 Turn OFF JWT Verification

**For `facebook-data-deletion` function:**
1. Go to Edge Functions → `facebook-data-deletion`
2. Find **"Verify JWT with legacy secret"**
3. **Turn it OFF** (disable)
4. Save

**For `facebook-webhook` function:**
1. Go to Edge Functions → `facebook-webhook`
2. Find **"Verify JWT with legacy secret"**
3. **Turn it OFF** (disable)
4. Save

---

### Step 3: Create/Deploy OAuth Callback Function

**Check if `facebook-oauth-callback` exists:**
```bash
ls supabase/functions/facebook-oauth-callback
```

**If it doesn't exist, create it:**
- See `FACEBOOK_APP_CONNECTION_GUIDE.md` Step 6 for the code
- Or we can create it now

**Deploy:**
```bash
supabase functions deploy facebook-oauth-callback
```

---

### Step 4: Update Frontend Environment Variables

**In your production environment (Vercel/Netlify/etc.):**

Add:
```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

**Or in `.env` file (for local development):**
```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

---

### Step 5: Test the Integration

#### 5.1 Test OAuth Flow

1. **Go to your app:** `/integrations/facebook` or Settings → Facebook
2. **Click "Connect Facebook Page"**
3. **Authorize the app** in Facebook
4. **Should redirect back** and show connected pages

#### 5.2 Test Webhook

1. **Send a test message** to your Facebook Page
2. **Check Supabase logs:**
   - Edge Functions → `facebook-webhook` → Logs
3. **Verify:**
   - Message received
   - AI response generated
   - Response sent back to Facebook

#### 5.3 Test Data Deletion

1. **Go to:** Facebook Settings → Apps and Websites
2. **Remove your app**
3. **Click "Send Request"**
4. **Check status at:** `/data-deletion-status?code=...`

---

## 📋 Complete Checklist

### Facebook App Dashboard
- [ ] App domains configured
- [ ] Privacy Policy URL set
- [ ] Terms of Service URL set
- [ ] Data Deletion URL configured
- [ ] OAuth Redirect URIs configured
- [ ] Webhook URL configured and verified
- [ ] Webhook events subscribed
- [ ] App ID copied
- [ ] App Secret copied

### Supabase Configuration
- [ ] Environment variables set for `facebook-webhook`
- [ ] Environment variables set for `facebook-oauth-callback`
- [ ] Environment variables set for `facebook-data-deletion`
- [ ] JWT verification OFF for `facebook-data-deletion`
- [ ] JWT verification OFF for `facebook-webhook`
- [ ] `facebook-oauth-callback` function deployed

### Frontend Configuration
- [ ] `VITE_FACEBOOK_APP_ID` set in production
- [ ] OAuth callback URLs updated in code (if needed)

### Testing
- [ ] OAuth flow tested (connect Facebook page)
- [ ] Webhook tested (send message, receive AI response)
- [ ] Data deletion callback tested

---

## 🎯 Quick Start (Priority Order)

1. **Configure Facebook App Dashboard** (Step 1) - Most important!
2. **Set Supabase environment variables** (Step 2.1)
3. **Turn OFF JWT verification** (Step 2.2)
4. **Create/deploy OAuth callback** (Step 3)
5. **Set frontend environment variable** (Step 4)
6. **Test everything** (Step 5)

---

## 🆘 Common Issues

### OAuth Redirect Error
- **Fix:** Check OAuth Redirect URIs match exactly in Facebook App settings

### Webhook Not Receiving Messages
- **Fix:** Verify webhook is verified (green checkmark) and events are subscribed

### 401 Errors
- **Fix:** Make sure JWT verification is OFF for webhook and data deletion functions

### Messages Not Responding
- **Fix:** Check `FACEBOOK_APP_SECRET` is set correctly in Supabase secrets

---

## ✅ Once Complete

Your Facebook integration will:
- ✅ Allow users to connect Facebook Pages
- ✅ Automatically reply to Messenger messages with AI
- ✅ Create prospects from Facebook conversations
- ✅ Track buying signals and intent
- ✅ Handle data deletion requests (compliance)

**Ready to start? Begin with Step 1!** 🚀
