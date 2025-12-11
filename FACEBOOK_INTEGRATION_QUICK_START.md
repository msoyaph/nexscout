# Facebook Integration - Quick Start Guide

## ✅ App Approved! Here's What to Do Next

---

## 🚀 Step 1: Configure Facebook App Dashboard (5 minutes)

### 1.1 Get Your Credentials

1. **Go to:** [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. **Select your app**
3. **Settings → Basic:**
   - **App ID:** Copy this (you'll need it)
   - **App Secret:** Click "Show" → Copy (keep secure!)

### 1.2 Configure URLs

**In Settings → Basic:**

- **App Domains:**
  ```
  nexscout.co
  dohrkewdanppkqulvhhz.supabase.co
  ```

- **Data Deletion Request URL:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
  ```

- **Valid OAuth Redirect URIs:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-oauth-callback
  https://nexscout.co/integrations/facebook/callback
  https://nexscout.co/api/facebook/callback
  ```

### 1.3 Configure Messenger Webhook

**Messenger → Settings → Webhooks:**

- **Callback URL:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-webhook
  ```

- **Verify Token:** `nexscout_fb_verify_token_2024`

- **Click "Verify and Save"**

- **Subscribe to Events:**
  - ✅ `messages`
  - ✅ `messaging_postbacks`
  - ✅ `messaging_optins`
  - ✅ `messaging_deliveries`
  - ✅ `messaging_reads`

---

## 🔧 Step 2: Configure Supabase (5 minutes)

### 2.1 Set Environment Variables

**Go to:** Supabase Dashboard → Edge Functions → Settings → Secrets

**Add these secrets:**

#### For `facebook-webhook`:
```
FACEBOOK_APP_SECRET=your_app_secret_here
FACEBOOK_VERIFY_TOKEN=nexscout_fb_verify_token_2024
```

#### For `facebook-oauth-callback`:
```
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here
APP_URL=https://nexscout.co
```

#### For `facebook-data-deletion`:
```
FACEBOOK_APP_SECRET=your_app_secret_here
APP_URL=https://nexscout.co
```

### 2.2 Turn OFF JWT Verification

**For these functions:**
- `facebook-webhook`
- `facebook-data-deletion`

**In each function:**
1. Click on the function
2. Find **"Verify JWT with legacy secret"**
3. **Turn it OFF**
4. Save

---

## 📦 Step 3: Deploy OAuth Callback Function (2 minutes)

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions deploy facebook-oauth-callback
```

**The function is already created at:**
`supabase/functions/facebook-oauth-callback/index.ts`

---

## 🌐 Step 4: Set Frontend Environment Variable (2 minutes)

**In your production environment (Vercel/Netlify/etc.):**

Add:
```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

**Or in `.env` for local:**
```env
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
```

---

## ✅ Step 5: Test Everything (5 minutes)

### Test 1: Connect Facebook Page

1. Go to: `/integrations/facebook` or Settings → Facebook
2. Click **"Connect Facebook Page"**
3. Authorize in Facebook
4. Should redirect back and show connected pages ✅

### Test 2: Send Test Message

1. Send a message to your Facebook Page
2. Check Supabase logs: Edge Functions → `facebook-webhook` → Logs
3. Should see message received and AI response sent ✅

### Test 3: Data Deletion

1. Facebook Settings → Apps and Websites
2. Remove your app
3. Click "Send Request"
4. Check status at: `/data-deletion-status?code=...` ✅

---

## 📋 Complete Checklist

### Facebook App Dashboard
- [ ] App ID copied
- [ ] App Secret copied
- [ ] App domains configured
- [ ] Data Deletion URL set
- [ ] OAuth Redirect URIs configured
- [ ] Webhook URL configured
- [ ] Webhook verified (green checkmark)
- [ ] Events subscribed

### Supabase
- [ ] `FACEBOOK_APP_SECRET` set for webhook
- [ ] `FACEBOOK_VERIFY_TOKEN` set for webhook
- [ ] `FACEBOOK_APP_ID` set for oauth-callback
- [ ] `FACEBOOK_APP_SECRET` set for oauth-callback
- [ ] `APP_URL` set for oauth-callback and data-deletion
- [ ] JWT verification OFF for webhook
- [ ] JWT verification OFF for data-deletion
- [ ] `facebook-oauth-callback` function deployed

### Frontend
- [ ] `VITE_FACEBOOK_APP_ID` set in production

### Testing
- [ ] OAuth flow works (connect page)
- [ ] Webhook receives messages
- [ ] AI responds to messages
- [ ] Data deletion callback works

---

## 🎉 Once Complete

Your Facebook integration will:
- ✅ Allow users to connect Facebook Pages
- ✅ Auto-reply to Messenger messages with AI
- ✅ Create prospects from conversations
- ✅ Track buying signals
- ✅ Handle data deletion (compliance)

**Start with Step 1 - Configure Facebook App Dashboard!** 🚀
