# 🚀 Final Deployment Checklist - Ready to Deploy!

## ✅ Current Status

- ✅ **Build succeeds** - `npm run build` works
- ✅ **GitHub connected** - https://github.com/msoyaph/nexscout
- ✅ **Vercel connected** - https://nexscout-qmxcra4ms-nexscouts-projects.vercel.app/
- ✅ **Facebook App approved**
- ✅ **VITE_FACEBOOK_APP_ID** set in Vercel
- ✅ **Edge Functions created** (webhook, oauth-callback, data-deletion)

---

## ⚠️ Before Deploying - Complete These

### 1. Verify Vercel Environment Variables

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Check these exist:**
- [x] `VITE_FACEBOOK_APP_ID` ✅ (You confirmed)
- [ ] `VITE_SUPABASE_URL` - **VERIFY THIS IS SET**
- [ ] `VITE_SUPABASE_ANON_KEY` - **VERIFY THIS IS SET**
- [ ] `VITE_APP_URL` - Should be `https://nexscout.co`

**If missing, add them now!**

---

### 2. Deploy Edge Functions to Supabase

```bash
cd /Users/cliffsumalpong/Desktop/nexscout

# Deploy all Facebook functions
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion
```

**Verify in Supabase Dashboard:**
- Edge Functions → All 3 functions show as "Active"

---

### 3. Configure Supabase Secrets

**Go to:** Supabase Dashboard → Edge Functions → Settings → Secrets

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

---

### 4. Turn OFF JWT Verification

**In Supabase Dashboard → Edge Functions:**

- [ ] `facebook-webhook` - Turn OFF "Verify JWT with legacy secret"
- [ ] `facebook-data-deletion` - Turn OFF "Verify JWT with legacy secret"

---

### 5. Configure Facebook App Dashboard

**Go to:** [Facebook App Dashboard](https://developers.facebook.com/apps/)

#### 5.1 Basic Settings

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

#### 5.2 Messenger Webhook

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

## 🚀 Deploy Now!

### Step 1: Commit and Push Code

```bash
cd /Users/cliffsumalpong/Desktop/nexscout

# Check what will be committed
git status

# Add all changes
git add .

# Commit
git commit -m "Production: Facebook integration, data deletion callback, and latest updates"

# Push to GitHub (triggers Vercel auto-deploy)
git push origin main
```

**Vercel will automatically deploy after push!**

---

### Step 2: Monitor Deployment

1. **Go to:** https://vercel.com/dashboard
2. **Deployments** tab
3. **Watch latest deployment:**
   - Should show "Building..."
   - Then "Ready" ✅
   - Check for any errors

---

### Step 3: Verify Deployment

**After deployment completes:**

1. **Visit:** https://nexscout-qmxcra4ms-nexscouts-projects.vercel.app/
2. **Check:**
   - [ ] App loads
   - [ ] No white screen
   - [ ] Login works
   - [ ] No console errors (F12)

---

## 📋 Complete Checklist Summary

### Code ✅
- [x] Build succeeds
- [ ] Code committed
- [ ] Code pushed to GitHub

### Vercel ⚠️
- [x] `VITE_FACEBOOK_APP_ID` set ✅
- [ ] `VITE_SUPABASE_URL` verified
- [ ] `VITE_SUPABASE_ANON_KEY` verified
- [ ] `VITE_APP_URL` verified

### Supabase ⚠️
- [ ] Edge Functions deployed
- [ ] Secrets configured
- [ ] JWT verification OFF

### Facebook ⚠️
- [x] App approved ✅
- [ ] App Dashboard configured
- [ ] Webhook verified

---

## 🎯 Quick Deploy (Once Checklist Complete)

```bash
# 1. Deploy Edge Functions
supabase functions deploy facebook-webhook
supabase functions deploy facebook-oauth-callback
supabase functions deploy facebook-data-deletion

# 2. Commit and push (triggers Vercel)
git add .
git commit -m "Production: Facebook integration complete"
git push origin main
```

**That's it! Vercel will auto-deploy.** 🚀

---

## 🆘 If Deployment Fails

1. **Check Vercel logs:**
   - Deployments → [deployment] → Logs
   - Look for error messages

2. **Common issues:**
   - Missing environment variables → Add them
   - Build errors → Fix code
   - TypeScript errors → Fix types

3. **Redeploy:**
   - Fix issues
   - Push again
   - Or manually redeploy in Vercel

---

## ✅ Post-Deployment

**After successful deployment:**

1. **Test the live site**
2. **Test Facebook integration**
3. **Monitor for errors**
4. **Check Supabase logs**

**You're ready to deploy! Complete the checklist above, then push to GitHub.** 🎉
