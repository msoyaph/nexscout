# 🔧 Fix: Mixed Content Error (HTTP vs HTTPS)

## Problem

Your site at https://nexscout.co/ is trying to make HTTP requests to Supabase, which causes a "Mixed Content" error because:
- Your site is served over HTTPS
- But it's trying to fetch from `http://dohrkewdanppkulvhhz.supabase.co` (HTTP)
- Browsers block mixed content for security

## ✅ Solution Applied

I've updated the code to:
1. **Force HTTPS** - Automatically converts HTTP URLs to HTTPS
2. **Normalize URLs** - Removes trailing slashes to prevent double slashes
3. **Update Supabase client** - Ensures all Supabase connections use HTTPS

## 🔍 Root Cause

The `VITE_SUPABASE_URL` environment variable in your production deployment (Vercel) is likely set to:
```
http://dohrkewdanppkqulvhhz.supabase.co
```

Instead of:
```
https://dohrkewdanppkqulvhhz.supabase.co
```

## 🚀 Fix Steps

### **Step 1: Update Environment Variable in Vercel**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Click your `nexscout` project
   - Go to **Settings** → **Environment Variables**

2. **Find `VITE_SUPABASE_URL`:**
   - Check if it starts with `http://`
   - If so, update it to start with `https://`

3. **Update the value:**
   - **Old (wrong):** `http://dohrkewdanppkqulvhhz.supabase.co`
   - **New (correct):** `https://dohrkewdanppkqulvhhz.supabase.co`
   - Make sure there's **no trailing slash**

4. **Save and Redeploy:**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment → **Redeploy**

### **Step 2: Code Fix (Already Applied)**

The code now automatically:
- Converts HTTP to HTTPS
- Removes trailing slashes
- Normalizes URLs

This provides a safety net even if the environment variable is wrong.

## ✅ Verification

After redeploying:

1. **Visit:** https://nexscout.co
2. **Open browser console** (F12)
3. **Check for errors:**
   - Should NOT see "Mixed Content" errors
   - Should NOT see "Failed to fetch" errors
   - All requests should be to `https://*.supabase.co`

4. **Test signup/login:**
   - Try to sign up or log in
   - Should work without errors

## 📋 Checklist

- [ ] Updated `VITE_SUPABASE_URL` in Vercel to use `https://`
- [ ] Removed trailing slash from URL
- [ ] Redeployed after updating environment variable
- [ ] Tested signup/login functionality
- [ ] Verified no mixed content errors in console

## 🆘 Still Having Issues?

1. **Check environment variable:**
   - In Vercel, verify `VITE_SUPABASE_URL` starts with `https://`
   - No trailing slash
   - Correct project ID

2. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or use incognito/private window

3. **Check Supabase project:**
   - Verify project is active
   - Check project URL in Supabase Dashboard

---

**The code fix provides a safety net, but you should still update the environment variable in Vercel to use HTTPS!** 🚀




