# 🔧 Fix Supabase CORS - Correct Location

Supabase doesn't have a separate "CORS Configuration" section. CORS is handled through **Auth URL Configuration**.

---

## ✅ Step 1: Configure Auth URLs in Supabase

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings:**
   - Click **Authentication** in the left sidebar
   - Click **URL Configuration** (under Configuration)

3. **Configure Site URL:**
   - **Site URL:** Set to `https://nexscout.co`
   - This is the main domain Supabase will allow

4. **Add Redirect URLs:**
   - Click **Add URL** or use the text area
   - Add each URL on a new line:
     ```
     https://nexscout.co/**
     https://www.nexscout.co/**
     https://nexscout.co/auth/callback
     https://nexscout.co/chat/**
     http://localhost:5173
     http://localhost:3000
     ```
   - The `**` wildcard allows all paths under that domain

5. **Click Save**

---

## ✅ Step 2: Check API Settings

1. **Go to Settings:**
   - Click **Settings** (gear icon) in left sidebar
   - Click **API** under Project Settings

2. **Verify Project URL:**
   - Make sure the **Project URL** matches what you have in your environment variables
   - Should be: `https://your-project-id.supabase.co`

3. **Note the anon/public key:**
   - This should match your `VITE_SUPABASE_ANON_KEY` environment variable

---

## ✅ Step 3: Alternative - Update Supabase Client (If Still Not Working)

If CORS issues persist after configuring Auth URLs, we can update the Supabase client to handle CORS better. But first, try the Auth URL configuration above.

---

## 🔍 Verify Configuration

After updating Auth URLs:

1. **Wait 1-2 minutes** for changes to propagate
2. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or use incognito/private window
3. **Test login** on https://nexscout.co

---

## 📋 What Each Setting Does

- **Site URL:** The primary domain Supabase allows for authentication
- **Redirect URLs:** Allowed URLs for OAuth redirects and deep links
- The `**` wildcard means "all paths under this domain"

---

## 🆘 Still Getting CORS Errors?

If you're still seeing CORS errors after configuring Auth URLs:

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for specific CORS error messages
   - Check which URL is being blocked

2. **Verify environment variables:**
   - Make sure `VITE_SUPABASE_URL` in production matches your Supabase project URL exactly
   - No trailing slashes
   - Correct project ID

3. **Check Supabase project:**
   - Make sure project is active (not paused)
   - Check project region matches your users' location

---

## ✅ Quick Checklist

- [ ] Site URL set to `https://nexscout.co` in Auth → URL Configuration
- [ ] Redirect URLs include `https://nexscout.co/**`
- [ ] Environment variables verified in hosting platform
- [ ] Redeployed after making changes
- [ ] Cleared browser cache
- [ ] Tested in incognito window

---

**The Auth URL Configuration is the main way to fix CORS in Supabase!** 🚀

