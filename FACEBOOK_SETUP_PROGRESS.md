# Facebook Integration Setup - Progress Tracker

## ✅ Completed Steps

- [x] Facebook App approved
- [x] `VITE_FACEBOOK_APP_ID` added to Vercel
- [x] Database migration (`data_deletion_requests` table)
- [x] Data deletion callback function deployed
- [x] OAuth callback function created
- [x] Webhook function exists

---

## 🚀 Next Steps (In Order)

### Step 1: Redeploy Vercel (If Not Auto-Deployed)

**After adding environment variable:**
- Vercel usually auto-redeploys
- If not, go to **Deployments** → Click **⋯** on latest → **Redeploy**
- Or push a new commit to trigger redeploy

**Verify it's loaded:**
- After redeploy, test in browser console:
  ```javascript
  console.log(import.meta.env.VITE_FACEBOOK_APP_ID);
  ```
- Should show your App ID (not `undefined`)

---

### Step 2: Configure Facebook App Dashboard

**Go to:** [Facebook App Dashboard](https://developers.facebook.com/apps/)

#### 2.1 Basic Settings

**Settings → Basic:**
- [ ] **App Domains:**
  ```
  nexscout.co
  dohrkewdanppkqulvhhz.supabase.co
  ```
- [ ] **Data Deletion Request URL:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
  ```
- [ ] **Valid OAuth Redirect URIs:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-oauth-callback
  https://nexscout.co/integrations/facebook/callback
  https://nexscout.co/api/facebook/callback
  ```

#### 2.2 Messenger Settings

**Messenger → Settings → Webhooks:**
- [ ] **Callback URL:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-webhook
  ```
- [ ] **Verify Token:** `nexscout_fb_verify_token_2024`
- [ ] **Click "Verify and Save"** (should show green checkmark)
- [ ] **Subscribe to Events:**
  - [ ] `messages`
  - [ ] `messaging_postbacks`
  - [ ] `messaging_optins`
  - [ ] `messaging_deliveries`
  - [ ] `messaging_reads`

---

### Step 3: Configure Supabase Edge Functions

**Go to:** Supabase Dashboard → Edge Functions → Settings → Secrets

#### 3.1 Set Environment Variables

**For `facebook-webhook`:**
- [ ] `FACEBOOK_APP_SECRET` = Your Facebook App Secret
- [ ] `FACEBOOK_VERIFY_TOKEN` = `nexscout_fb_verify_token_2024`

**For `facebook-oauth-callback`:**
- [ ] `FACEBOOK_APP_ID` = Your Facebook App ID
- [ ] `FACEBOOK_APP_SECRET` = Your Facebook App Secret
- [ ] `APP_URL` = `https://nexscout.co`

**For `facebook-data-deletion`:**
- [ ] `FACEBOOK_APP_SECRET` = Your Facebook App Secret
- [ ] `APP_URL` = `https://nexscout.co`

#### 3.2 Turn OFF JWT Verification

**For these functions:**
- [ ] `facebook-webhook` - Turn OFF "Verify JWT with legacy secret"
- [ ] `facebook-data-deletion` - Turn OFF "Verify JWT with legacy secret"

---

### Step 4: Deploy OAuth Callback Function

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions deploy facebook-oauth-callback
```

---

### Step 5: Test Everything

#### Test 1: OAuth Flow (Connect Facebook Page)
- [ ] Go to `/integrations/facebook` or Settings → Facebook
- [ ] Click "Connect Facebook Page"
- [ ] Authorize in Facebook
- [ ] Should redirect back and show connected pages ✅

#### Test 2: Webhook (Send Test Message)
- [ ] Send a message to your Facebook Page
- [ ] Check Supabase logs: Edge Functions → `facebook-webhook` → Logs
- [ ] Should see message received and AI response sent ✅

#### Test 3: Data Deletion
- [ ] Facebook Settings → Apps and Websites
- [ ] Remove your app
- [ ] Click "Send Request"
- [ ] Check status at `/data-deletion-status?code=...` ✅

---

## 📋 Quick Reference

**Your URLs:**
- Webhook: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-webhook`
- OAuth Callback: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-oauth-callback`
- Data Deletion: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`

**Your Credentials (from Facebook):**
- App ID: (you have this)
- App Secret: (get from Facebook Dashboard → Settings → Basic)

---

## 🎯 Current Status

✅ **Frontend:** Ready (VITE_FACEBOOK_APP_ID set)  
⏳ **Facebook Dashboard:** Needs configuration  
⏳ **Supabase:** Needs environment variables and JWT settings  
⏳ **OAuth Callback:** Needs deployment  
⏳ **Testing:** Pending

---

**Next:** Configure Facebook App Dashboard (Step 2) 🚀
