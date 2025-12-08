# Fix Public Chat HTTPS/Mixed Content Error

## 🔴 Issue

**Error:** `Mixed Content: The page at 'https://nexscout.co/chat/...' was loaded over HTTPS, but requested an insecure resource 'http://dohrkewdanppkqulvhhz.supabase.co//functions/v1/public-chatbot-chat'`

**Root Cause:**
1. `VITE_SUPABASE_URL` environment variable in production (Vercel) is set to `http://` instead of `https://`
2. URL has double slashes: `//functions/v1/...`

## ✅ Solution

### Step 1: Update Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `VITE_SUPABASE_URL`
3. **Update it to:**
   ```
   https://dohrkewdanppkqulvhhz.supabase.co
   ```
   (Make sure it's `https://` not `http://`, and no trailing slash)

### Step 2: Redeploy

After updating the environment variable:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 3: Verify

After deployment, test the public chat:
1. Open: `https://nexscout.co/chat/[your-chatbot-id]`
2. Try sending a message
3. Check browser console - should see: `[PublicChat] Calling edge function: https://...`
4. No more mixed content errors!

## 🛡️ Defensive Code Added

The code now includes defensive fixes that will:
- ✅ Automatically convert HTTP to HTTPS
- ✅ Remove double slashes from URLs
- ✅ Log warnings if URL issues are detected

**But you still need to fix the environment variable** for the best performance and to avoid console warnings.

## 📝 Quick Check

Run this in your browser console on the public chat page:
```javascript
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
```

**Should show:** `https://dohrkewdanppkqulvhhz.supabase.co`  
**Not:** `http://dohrkewdanppkqulvhhz.supabase.co` or anything with trailing slashes

---

**Status:** Code is fixed, but production environment variable needs updating!




