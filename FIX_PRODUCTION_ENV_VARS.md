# 🔧 Fix: Missing Supabase Environment Variables in Production

Your website at https://nexscout.co/ is showing a white screen because the Supabase environment variables are not set in your production deployment.

---

## 🎯 Quick Fix

### **Step 1: Identify Your Hosting Platform**

Check where you deployed:
- **Vercel:** Go to https://vercel.com/dashboard
- **Netlify:** Go to https://app.netlify.com
- **Cloudflare Pages:** Go to https://dash.cloudflare.com

---

## ✅ Solution: Add Environment Variables

### **If Using Vercel:**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your `nexscout` project
   - Click on it

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Click **Environment Variables** in the left sidebar

3. **Add Environment Variables:**
   Click **Add New** and add these one by one:

   **Variable 1:**
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://your-project-id.supabase.co` (your actual Supabase URL)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   **Variable 2:**
   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `your-anon-key-here` (your actual Supabase anon key)
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

   **Variable 3 (Optional):**
   - **Key:** `VITE_APP_URL`
   - **Value:** `https://nexscout.co`
   - **Environment:** Production
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic redeploy

---

### **If Using Netlify:**

1. **Go to Netlify Dashboard:**
   - Visit: https://app.netlify.com
   - Find your site
   - Click on it

2. **Navigate to Site Settings:**
   - Click **Site settings**
   - Click **Environment variables** in the left sidebar

3. **Add Environment Variables:**
   Click **Add a variable** and add:

   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://your-project-id.supabase.co`
   - Click **Save**

   - **Key:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `your-anon-key-here`
   - Click **Save**

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Trigger deploy** → **Deploy site**

---

### **If Using Cloudflare Pages:**

1. **Go to Cloudflare Dashboard:**
   - Visit: https://dash.cloudflare.com
   - Go to **Workers & Pages**
   - Click your project

2. **Navigate to Settings:**
   - Click **Settings** tab
   - Scroll to **Environment variables**

3. **Add Environment Variables:**
   - Click **Add variable**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Retry deployment** on the latest deployment

---

## 🔍 Where to Find Your Supabase Credentials

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Get Your Credentials:**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** under Project Settings
   - You'll see:
     - **Project URL** → This is your `VITE_SUPABASE_URL`
     - **anon/public key** → This is your `VITE_SUPABASE_ANON_KEY`

3. **Copy and paste** these into your hosting platform's environment variables.

---

## ⚠️ Important Notes

- **Never commit** `.env` files to GitHub
- **Always use** environment variables in your hosting platform
- **Redeploy** after adding environment variables (they're only loaded during build)
- **Use production Supabase project** (not development) for production deployment

---

## ✅ Verify It's Fixed

After redeploying:

1. Wait 1-2 minutes for deployment to complete
2. Visit: https://nexscout.co/
3. The white screen should be gone
4. Check browser console (F12) - no more "Missing Supabase environment variables" error

---

## 🆘 Still Not Working?

1. **Check deployment logs:**
   - In Vercel/Netlify dashboard, check the latest deployment logs
   - Look for any build errors

2. **Verify environment variables:**
   - Make sure variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - No extra spaces or typos
   - Values are correct (copy-paste from Supabase)

3. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

4. **Check Supabase CORS:**
   - In Supabase Dashboard → Settings → API
   - Add `https://nexscout.co` to allowed origins

---

## 📋 Quick Checklist

- [ ] Environment variables added in hosting platform
- [ ] Variables set for Production environment
- [ ] Redeployed after adding variables
- [ ] Verified Supabase credentials are correct
- [ ] Checked deployment logs for errors
- [ ] Tested website after redeploy

---

**After completing these steps, your website should work!** 🚀

