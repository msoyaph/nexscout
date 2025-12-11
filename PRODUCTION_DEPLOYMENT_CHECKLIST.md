# Production Deployment Checklist - NexScout

## 🎯 Deployment Targets

- **GitHub:** https://github.com/msoyaph/nexscout
- **Vercel:** https://nexscout-qmxcra4ms-nexscouts-projects.vercel.app/
- **Production URL:** https://nexscout.co (or your custom domain)

---

## ✅ Pre-Deployment Checklist

### 1. Facebook Integration Setup

#### 1.1 Facebook App Dashboard
- [ ] App approved ✅ (You confirmed this)
- [ ] App ID obtained
- [ ] App Secret obtained
- [ ] App Domains configured
- [ ] Data Deletion URL configured
- [ ] OAuth Redirect URIs configured
- [ ] Messenger webhook configured and verified
- [ ] Webhook events subscribed

#### 1.2 Supabase Edge Functions
- [ ] `facebook-webhook` deployed
- [ ] `facebook-oauth-callback` deployed
- [ ] `facebook-data-deletion` deployed
- [ ] Environment variables set for all functions
- [ ] JWT verification OFF for webhook and data-deletion

#### 1.3 Frontend
- [ ] `VITE_FACEBOOK_APP_ID` set in Vercel ✅ (You confirmed this)

---

### 2. Environment Variables (Vercel)

**Required Variables:**
- [x] `VITE_FACEBOOK_APP_ID` ✅ (Done)
- [ ] `VITE_SUPABASE_URL` - Verify it's set
- [ ] `VITE_SUPABASE_ANON_KEY` - Verify it's set
- [ ] `VITE_APP_URL` - Should be `https://nexscout.co` (or your domain)

**Check in Vercel:**
1. Go to: https://vercel.com/dashboard
2. Select project: `nexscout` (or your project name)
3. **Settings** → **Environment Variables**
4. Verify all variables are set

---

### 3. Code Status

#### 3.1 Git Status
- [ ] All changes committed
- [ ] No uncommitted changes (or intentional)
- [ ] Latest code pushed to GitHub

#### 3.2 Edge Functions
- [ ] All functions deployed to Supabase
- [ ] Functions tested locally (if possible)

#### 3.3 Database Migrations
- [ ] `data_deletion_requests` table created ✅
- [ ] All migrations applied to production Supabase

---

### 4. Supabase Production Configuration

#### 4.1 Database
- [ ] Production Supabase project created
- [ ] All migrations run on production
- [ ] RLS policies verified
- [ ] Test data cleaned (if any)

#### 4.2 Edge Functions
- [ ] All functions deployed to production Supabase
- [ ] Environment variables (secrets) set in production
- [ ] JWT verification configured correctly

#### 4.3 Authentication
- [ ] Site URL set to production domain
- [ ] Redirect URLs configured
- [ ] CORS configured

---

### 5. Vercel Configuration

#### 5.1 Build Settings
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Node version: 18+ (or latest)

#### 5.2 Domain
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active
- [ ] DNS records configured

#### 5.3 Environment Variables
- [ ] All `VITE_*` variables set
- [ ] Production values (not development)
- [ ] All environments (Production, Preview, Development)

---

## 🚀 Deployment Steps

### Step 1: Verify Local Changes

```bash
cd /Users/cliffsumalpong/Desktop/nexscout

# Check git status
git status

# See what files changed
git diff --name-only

# If ready, commit and push
git add .
git commit -m "Add Facebook integration and prepare for production"
git push origin main
```

---

### Step 2: Deploy Edge Functions to Supabase

```bash
# Deploy all Facebook-related functions
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion
```

**Verify deployment:**
- Go to Supabase Dashboard → Edge Functions
- Check all 3 functions show as "Active" or "Deployed"

---

### Step 3: Configure Supabase Production

#### 3.1 Set Environment Variables (Secrets)

**For each function, add secrets:**

**`facebook-webhook`:**
- `FACEBOOK_APP_SECRET`
- `FACEBOOK_VERIFY_TOKEN` = `nexscout_fb_verify_token_2024`

**`facebook-oauth-callback`:**
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `APP_URL` = `https://nexscout.co`

**`facebook-data-deletion`:**
- `FACEBOOK_APP_SECRET`
- `APP_URL` = `https://nexscout.co`

#### 3.2 Turn OFF JWT Verification

**For:**
- `facebook-webhook`
- `facebook-data-deletion`

**In Supabase Dashboard:**
- Edge Functions → [function-name] → Settings
- Turn OFF "Verify JWT with legacy secret"

---

### Step 4: Configure Facebook App Dashboard

**Go to:** [Facebook App Dashboard](https://developers.facebook.com/apps/)

#### 4.1 Basic Settings

**Settings → Basic:**
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

#### 4.2 Messenger Settings

**Messenger → Settings → Webhooks:**
- **Callback URL:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-webhook
  ```
- **Verify Token:** `nexscout_fb_verify_token_2024`
- **Verify and Save**
- **Subscribe to Events:**
  - `messages`
  - `messaging_postbacks`
  - `messaging_optins`
  - `messaging_deliveries`
  - `messaging_reads`

---

### Step 5: Verify Vercel Environment Variables

**In Vercel Dashboard:**

1. **Go to:** https://vercel.com/dashboard
2. **Select:** Your `nexscout` project
3. **Settings** → **Environment Variables**

**Verify these are set:**
- [x] `VITE_FACEBOOK_APP_ID` ✅
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_APP_URL` (should be `https://nexscout.co`)

**If missing, add them now!**

---

### Step 6: Deploy to Vercel

**Option A: Automatic (via Git push)**
```bash
git push origin main
```
- Vercel will auto-deploy if connected to GitHub

**Option B: Manual Deploy**
1. Go to Vercel Dashboard
2. **Deployments** tab
3. Click **"Redeploy"** on latest deployment
4. Or trigger new deployment

---

### Step 7: Post-Deployment Verification

#### 7.1 Test Frontend
- [ ] Visit: https://nexscout.co (or your Vercel URL)
- [ ] App loads without errors
- [ ] Login works
- [ ] No console errors (F12 → Console)

#### 7.2 Test Facebook Integration
- [ ] Go to `/integrations/facebook` or Settings → Facebook
- [ ] Click "Connect Facebook Page"
- [ ] OAuth flow works
- [ ] Redirects back successfully
- [ ] Shows connected pages

#### 7.3 Test Webhook
- [ ] Send test message to Facebook Page
- [ ] Check Supabase logs for webhook activity
- [ ] AI responds to message

#### 7.4 Test Data Deletion
- [ ] Visit data deletion URL directly (should return JSON)
- [ ] Test in Facebook (remove app → send request)

---

## 🔍 Pre-Deployment Verification

### Check These Files Exist

```bash
# Edge Functions
supabase/functions/facebook-webhook/index.ts
supabase/functions/facebook-oauth-callback/index.ts
supabase/functions/facebook-data-deletion/index.ts

# Database Migration
supabase/migrations/20251211140710_create_data_deletion_requests_table.sql

# Frontend Pages
src/pages/integrations/FacebookIntegrationPage.tsx
src/pages/DataDeletionStatusPage.tsx
src/services/chatbot/facebookMessengerIntegration.ts
```

---

## ⚠️ Critical Checks Before Deploying

### 1. Environment Variables
- [ ] All `VITE_*` variables set in Vercel
- [ ] All Supabase secrets set
- [ ] Production URLs (not localhost)

### 2. Database
- [ ] Production Supabase project is correct
- [ ] All migrations applied
- [ ] No test data in production

### 3. Facebook Configuration
- [ ] App approved ✅
- [ ] All URLs configured in Facebook Dashboard
- [ ] Webhook verified

### 4. Code
- [ ] No hardcoded localhost URLs
- [ ] No test/debug code
- [ ] All functions deployed

---

## 🚨 Rollback Plan

**If something goes wrong:**

1. **Revert Vercel deployment:**
   - Go to Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Disable Facebook integration:**
   - Turn OFF in Facebook App Dashboard
   - Or disable in Supabase Edge Functions

3. **Check logs:**
   - Vercel → Deployments → [deployment] → Logs
   - Supabase → Edge Functions → Logs

---

## 📋 Final Checklist Before Deploy

- [ ] All environment variables set
- [ ] All Edge Functions deployed
- [ ] Facebook App Dashboard configured
- [ ] Supabase secrets configured
- [ ] JWT verification settings correct
- [ ] Code committed and pushed
- [ ] Tested locally (if possible)
- [ ] Ready to deploy!

---

## 🎯 Quick Deploy Command

**Once everything is configured:**

```bash
# 1. Commit and push code
git add .
git commit -m "Production: Facebook integration complete"
git push origin main

# 2. Deploy Edge Functions (if not already)
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion

# 3. Vercel will auto-deploy from GitHub push
# Or manually trigger in Vercel Dashboard
```

---

## ✅ Post-Deployment

After deployment:

1. **Test the live site**
2. **Test Facebook integration**
3. **Monitor logs** for errors
4. **Check Vercel deployment status**
5. **Verify all features work**

---

**Ready to deploy? Start with Step 1!** 🚀
