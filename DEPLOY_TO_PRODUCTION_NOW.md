# 🚀 Deploy to Production - Complete Guide

## 🎯 Your Deployment Targets

- **GitHub Repo:** https://github.com/msoyaph/nexscout
- **Vercel URL:** https://nexscout-qmxcra4ms-nexscouts-projects.vercel.app/
- **Production Domain:** https://nexscout.co (or your custom domain)

---

## ✅ Pre-Deployment Status Check

### What's Ready ✅
- [x] Facebook App approved
- [x] `VITE_FACEBOOK_APP_ID` set in Vercel
- [x] Database migration (`data_deletion_requests`) completed
- [x] Edge functions created:
  - [x] `facebook-webhook`
  - [x] `facebook-oauth-callback`
  - [x] `facebook-data-deletion`

### What Needs to Be Done ⏳

#### 1. Deploy Edge Functions to Supabase
```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion
```

#### 2. Configure Supabase Secrets
**In Supabase Dashboard → Edge Functions → Settings → Secrets:**

**For `facebook-webhook`:**
- `FACEBOOK_APP_SECRET` = Your Facebook App Secret
- `FACEBOOK_VERIFY_TOKEN` = `nexscout_fb_verify_token_2024`

**For `facebook-oauth-callback`:**
- `FACEBOOK_APP_ID` = Your Facebook App ID
- `FACEBOOK_APP_SECRET` = Your Facebook App Secret
- `APP_URL` = `https://nexscout.co`

**For `facebook-data-deletion`:**
- `FACEBOOK_APP_SECRET` = Your Facebook App Secret
- `APP_URL` = `https://nexscout.co`

#### 3. Turn OFF JWT Verification
- [ ] `facebook-webhook` - Turn OFF JWT verification
- [ ] `facebook-data-deletion` - Turn OFF JWT verification

#### 4. Configure Facebook App Dashboard
- [ ] Set App Domains
- [ ] Set Data Deletion URL
- [ ] Set OAuth Redirect URIs
- [ ] Configure Messenger webhook
- [ ] Subscribe to webhook events

#### 5. Verify Vercel Environment Variables
**In Vercel Dashboard → Settings → Environment Variables:**

- [x] `VITE_FACEBOOK_APP_ID` ✅ (Done)
- [ ] `VITE_SUPABASE_URL` - Verify it's set
- [ ] `VITE_SUPABASE_ANON_KEY` - Verify it's set
- [ ] `VITE_APP_URL` - Should be `https://nexscout.co`

#### 6. Commit and Push Code
```bash
git add .
git commit -m "Production: Facebook integration complete"
git push origin main
```

---

## 🚀 Step-by-Step Deployment

### Step 1: Verify Local Build Works

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
npm run build
```

**Expected:** Build succeeds without errors
**If errors:** Fix them before deploying

---

### Step 2: Deploy Edge Functions

```bash
# Deploy all Facebook functions
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion
```

**Verify:**
- Go to Supabase Dashboard → Edge Functions
- All 3 functions show as "Active" or "Deployed"

---

### Step 3: Configure Supabase (Critical!)

#### 3.1 Set Secrets for Each Function

**Go to:** Supabase Dashboard → Edge Functions → Settings → Secrets

**Add secrets for each function** (see list above)

#### 3.2 Turn OFF JWT Verification

**For `facebook-webhook` and `facebook-data-deletion`:**
1. Click on the function
2. Find "Verify JWT with legacy secret"
3. Turn it OFF
4. Save

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

#### 4.2 Messenger Webhook

**Messenger → Settings → Webhooks:**
- **Callback URL:**
  ```
  https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-webhook
  ```
- **Verify Token:** `nexscout_fb_verify_token_2024`
- **Verify and Save**
- **Subscribe to Events:** messages, messaging_postbacks, messaging_optins, etc.

---

### Step 5: Verify Vercel Environment Variables

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Required Variables:**
- [x] `VITE_FACEBOOK_APP_ID` ✅
- [ ] `VITE_SUPABASE_URL` - Check it's set
- [ ] `VITE_SUPABASE_ANON_KEY` - Check it's set
- [ ] `VITE_APP_URL` - Should be `https://nexscout.co`

**If any are missing, add them now!**

---

### Step 6: Commit and Push to GitHub

```bash
cd /Users/cliffsumalpong/Desktop/nexscout

# Check what will be committed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Production deployment: Facebook integration, data deletion callback, and latest features"

# Push to GitHub (this will trigger Vercel auto-deploy)
git push origin main
```

**Note:** If Vercel is connected to GitHub, it will automatically deploy after push.

---

### Step 7: Monitor Deployment

**In Vercel Dashboard:**
1. Go to **Deployments** tab
2. Watch the latest deployment
3. Should show "Building..." then "Ready"
4. Check for any build errors

**If build fails:**
- Check deployment logs
- Fix errors
- Push again

---

### Step 8: Post-Deployment Verification

#### 8.1 Test Frontend
- [ ] Visit: https://nexscout-qmxcra4ms-nexscouts-projects.vercel.app/ (or your domain)
- [ ] App loads without errors
- [ ] Login works
- [ ] No console errors (F12 → Console)

#### 8.2 Test Facebook Integration
- [ ] Go to `/integrations/facebook` or Settings → Facebook
- [ ] Click "Connect Facebook Page"
- [ ] OAuth flow works
- [ ] Redirects back successfully

#### 8.3 Test Webhook
- [ ] Send test message to Facebook Page
- [ ] Check Supabase logs
- [ ] AI responds

---

## 📋 Complete Deployment Checklist

### Code & Build
- [ ] Local build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] All changes committed
- [ ] Code pushed to GitHub

### Supabase
- [ ] All Edge Functions deployed
- [ ] Environment variables (secrets) set
- [ ] JWT verification OFF for webhook and data-deletion
- [ ] Database migrations applied

### Facebook
- [ ] App Dashboard configured
- [ ] Webhook verified
- [ ] Events subscribed
- [ ] OAuth URLs configured

### Vercel
- [ ] All environment variables set
- [ ] Build settings correct
- [ ] Domain configured (if using custom domain)
- [ ] Deployment successful

### Testing
- [ ] Frontend loads
- [ ] Login works
- [ ] Facebook integration works
- [ ] Webhook receives messages

---

## 🚨 Critical: Before You Deploy

### Must Have:
1. ✅ `VITE_FACEBOOK_APP_ID` in Vercel ✅ (Done)
2. ⚠️ `VITE_SUPABASE_URL` in Vercel - **VERIFY THIS**
3. ⚠️ `VITE_SUPABASE_ANON_KEY` in Vercel - **VERIFY THIS**
4. ⚠️ All Supabase Edge Functions deployed
5. ⚠️ Supabase secrets configured
6. ⚠️ Facebook App Dashboard configured

---

## 🎯 Quick Deploy Commands

**Once everything is configured:**

```bash
# 1. Build locally to check for errors
npm run build

# 2. Deploy Edge Functions
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion

# 3. Commit and push (triggers Vercel auto-deploy)
git add .
git commit -m "Production: Facebook integration complete"
git push origin main
```

---

## 🆘 Troubleshooting

### Build Fails in Vercel
- Check deployment logs
- Verify all environment variables are set
- Check for TypeScript errors locally first

### Facebook Integration Doesn't Work
- Verify `VITE_FACEBOOK_APP_ID` is set in Vercel
- Check Facebook App Dashboard URLs are correct
- Verify webhook is verified (green checkmark)

### Supabase Errors
- Check Edge Functions are deployed
- Verify secrets are set correctly
- Check JWT verification is OFF for webhook/data-deletion

---

## ✅ Ready to Deploy?

**Before deploying, verify:**
1. ✅ `VITE_FACEBOOK_APP_ID` set in Vercel
2. ⚠️ `VITE_SUPABASE_URL` set in Vercel
3. ⚠️ `VITE_SUPABASE_ANON_KEY` set in Vercel
4. ⚠️ Edge Functions deployed
5. ⚠️ Supabase secrets configured
6. ⚠️ Facebook App Dashboard configured

**Once all checked, push to GitHub and Vercel will auto-deploy!** 🚀
