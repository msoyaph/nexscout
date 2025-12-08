# 🔧 Fix: "Failed to fetch" Supabase Error

The "Failed to fetch" error when logging in indicates a CORS (Cross-Origin Resource Sharing) issue or network connectivity problem with Supabase.

---

## 🎯 Quick Fixes

### **Fix 1: Configure CORS in Supabase (Most Common)**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to API Settings:**
   - Click **Settings** (gear icon) in left sidebar
   - Click **API** under Project Settings

3. **Add Allowed Origins:**
   - Scroll down to **CORS Configuration** or **Additional Allowed Origins**
   - Add these URLs:
     ```
     https://nexscout.co
     https://www.nexscout.co
     http://localhost:5173
     http://localhost:3000
     ```
   - Click **Save**

4. **Verify Site URL:**
   - In **Auth** → **URL Configuration**
   - **Site URL:** Should be `https://nexscout.co`
   - **Redirect URLs:** Add:
     ```
     https://nexscout.co/**
     https://www.nexscout.co/**
     https://nexscout.co/auth/callback
     https://nexscout.co/chat/**
     ```

---

### **Fix 2: Verify Environment Variables**

Make sure your production environment variables are correct:

1. **Check in your hosting platform:**
   - Vercel: Settings → Environment Variables
   - Netlify: Site settings → Environment variables
   - Cloudflare: Settings → Environment variables

2. **Verify:**
   - `VITE_SUPABASE_URL` = `https://your-project-id.supabase.co` (no trailing slash)
   - `VITE_SUPABASE_ANON_KEY` = Your actual anon key

3. **Redeploy** after verifying/updating

---

### **Fix 3: Update Supabase Client Configuration**

If CORS is still an issue, we may need to update the Supabase client initialization. Check if we need to add fetch options.

---

### **Fix 4: Check Supabase Project Status**

1. **Verify project is active:**
   - Go to Supabase Dashboard
   - Check if project shows as "Active"
   - Check if there are any service interruptions

2. **Test Supabase connection:**
   - In browser console on https://nexscout.co, run:
     ```javascript
     console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
     console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
     ```

---

## 🔍 Debugging Steps

### **Step 1: Check Browser Console**

Open browser console (F12) on https://nexscout.co and check:

1. **Network Tab:**
   - Look for failed requests to `*.supabase.co`
   - Check the error message
   - Check if request is being blocked (CORS error)

2. **Console Tab:**
   - Look for any error messages
   - Check if environment variables are loaded

### **Step 2: Test Supabase Connection**

In browser console, run:

```javascript
// Check if Supabase client is initialized
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Try a simple query
const { data, error } = await supabase
  .from('profiles')
  .select('count')
  .limit(0);

console.log('Connection test:', { data, error });
```

### **Step 3: Check Network Requests**

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to login
4. Look for requests to `*.supabase.co`
5. Check:
   - Status code (should be 200, not 404 or CORS error)
   - Request URL (should match your Supabase project)
   - Response headers (check for CORS headers)

---

## ✅ Common Issues & Solutions

### **Issue 1: CORS Error in Console**

**Error:** `Access to fetch at 'https://xxx.supabase.co' from origin 'https://nexscout.co' has been blocked by CORS policy`

**Solution:**
- Add `https://nexscout.co` to Supabase CORS allowed origins
- Wait a few minutes for changes to propagate
- Clear browser cache and try again

### **Issue 2: Wrong Supabase URL**

**Error:** `Failed to fetch` or `404 Not Found`

**Solution:**
- Verify `VITE_SUPABASE_URL` in production environment variables
- Make sure URL is correct (no typos, correct project ID)
- Should be: `https://xxxxx.supabase.co` (no trailing slash)

### **Issue 3: Supabase Project Paused**

**Error:** `Failed to fetch` or connection timeout

**Solution:**
- Check Supabase Dashboard
- Verify project is active (not paused)
- Check project status page

### **Issue 4: Environment Variables Not Loaded**

**Error:** `Missing Supabase environment variables`

**Solution:**
- Verify environment variables are set in hosting platform
- Make sure they're set for **Production** environment
- Redeploy after adding variables

---

## 🚀 Quick Fix Checklist

- [ ] Added `https://nexscout.co` to Supabase CORS allowed origins
- [ ] Updated Supabase Auth URL Configuration
- [ ] Verified environment variables in hosting platform
- [ ] Verified `VITE_SUPABASE_URL` is correct (no trailing slash)
- [ ] Redeployed after making changes
- [ ] Cleared browser cache
- [ ] Tested in incognito/private window

---

## 📋 Step-by-Step: Complete Fix

1. **In Supabase Dashboard:**
   - Settings → API → Add `https://nexscout.co` to CORS
   - Auth → URL Configuration → Set Site URL to `https://nexscout.co`
   - Auth → URL Configuration → Add redirect URLs

2. **In Your Hosting Platform:**
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Make sure they're correct (copy from Supabase Dashboard)

3. **Redeploy:**
   - Trigger a new deployment
   - Wait for it to complete

4. **Test:**
   - Visit https://nexscout.co
   - Try to login
   - Check browser console for errors

---

## 🆘 Still Not Working?

1. **Check Supabase Status:**
   - Visit: https://status.supabase.com
   - Check if there are any outages

2. **Verify Project:**
   - Make sure you're using the correct Supabase project
   - Check if project is in the correct region

3. **Contact Support:**
   - Supabase Support: https://supabase.com/support
   - Check Supabase Discord for help

---

**After completing these steps, the login should work!** 🚀




