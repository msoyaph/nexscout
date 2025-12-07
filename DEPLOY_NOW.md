# 🚀 Deploy to Production - Quick Guide

## Option 1: Run the Deployment Script

```bash
./deploy-to-production.sh
```

This script will:
1. Stage all changes
2. Commit with a descriptive message
3. Push to `origin main`
4. Trigger Vercel deployment automatically

## Option 2: Manual Deployment

### Step 1: Check Status
```bash
git status
```

### Step 2: Stage All Changes
```bash
git add .
```

### Step 3: Commit Changes
```bash
git commit -m "Fix: Public chat production readiness - HTTPS normalization, error handling, .maybeSingle() queries

- Fixed .single() to .maybeSingle() in PublicChatPage for better error handling
- Enhanced URL normalization in supabaseUrl.ts (HTTPS enforcement, double-slash removal)
- Added defensive URL validation in PublicChatPage
- Created production readiness checklist and documentation
- All fixes ensure public chatbot works correctly in production"
```

### Step 4: Push to Remote
```bash
git push origin main
```

## ⚠️ CRITICAL: Before Deployment Completes

### Verify Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Verify these are set for **Production**:
   ```
   VITE_SUPABASE_URL=https://dohrkewdanppkqulvhhz.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   VITE_APP_URL=https://nexscout.co
   ```

3. **IMPORTANT:**
   - Must be `https://` (NOT `http://`)
   - No trailing slashes
   - All variables must be set

## 📊 Monitor Deployment

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Watch for the latest deployment to complete
3. Check build logs for any errors
4. Wait for deployment to finish (usually 2-5 minutes)

## ✅ Test After Deployment

1. **Test Public Chat:**
   - Open: `https://nexscout.co/chat/[your-chatbot-id]`
   - Use **incognito/private browser** (to test without login)
   - Should load without authentication
   - Send a test message
   - Should receive AI response

2. **Check Browser Console:**
   - Press F12 → Console tab
   - Look for any errors
   - Should see: `[PublicChat] Calling edge function: https://...`

3. **Test Error Handling:**
   - Try invalid chatbot ID → Should show "Chat not found"
   - Test network failure scenarios

## 🎯 Success Indicators

✅ Deployment completes without errors
✅ Public chat loads without login
✅ Messages send successfully
✅ AI responses appear
✅ No console errors
✅ No mixed content warnings

## 🚨 If Issues Occur

1. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Logs
   - Look for build errors or runtime errors

2. **Check Environment Variables:**
   - Verify all env vars are set correctly
   - Ensure HTTPS URLs (not HTTP)
   - Ensure no trailing slashes

3. **Check Browser Console:**
   - Look for specific error messages
   - Check network tab for failed requests

4. **Verify Database:**
   - Check if RPC function exists: `get_user_from_chatbot_id`
   - Verify RLS policies allow anonymous access

---

**Ready to deploy?** Run `./deploy-to-production.sh` or follow the manual steps above!
