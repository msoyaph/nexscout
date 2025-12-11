# Vercel Environment Variables - Complete Checklist

## 🔍 Required Environment Variables for Production

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

---

## ✅ Must Have (Critical)

### 1. Supabase Configuration
- [ ] **`VITE_SUPABASE_URL`**
  - **Value:** `https://dohrkewdanppkqulvhhz.supabase.co`
  - **Environment:** All (Production, Preview, Development)
  - **Where to get:** Supabase Dashboard → Settings → API → Project URL

- [ ] **`VITE_SUPABASE_ANON_KEY`**
  - **Value:** Your Supabase anon key (long string)
  - **Environment:** All (Production, Preview, Development)
  - **Where to get:** Supabase Dashboard → Settings → API → anon/public key

### 2. Application URL
- [ ] **`VITE_APP_URL`**
  - **Value:** `https://nexscout.co` (or your production domain)
  - **Environment:** Production (or All)
  - **Purpose:** Used for OAuth redirects and API calls

### 3. Facebook Integration
- [x] **`VITE_FACEBOOK_APP_ID`** ✅ (You confirmed this is set)
  - **Value:** Your Facebook App ID (number)
  - **Environment:** All
  - **Where to get:** Facebook App Dashboard → Settings → Basic → App ID

---

## 📋 How to Verify in Vercel

1. **Go to:** https://vercel.com/dashboard
2. **Select:** Your `nexscout` project
3. **Settings** → **Environment Variables**
4. **Check each variable:**
   - Name matches exactly (case-sensitive)
   - Value is correct
   - Environment is set correctly

---

## ⚠️ Common Issues

### Variable Not Found
- **Symptom:** App shows white screen or errors
- **Fix:** Add missing variable and redeploy

### Wrong Value
- **Symptom:** Can't connect to Supabase or Facebook
- **Fix:** Update value and redeploy

### Wrong Environment
- **Symptom:** Works in preview but not production
- **Fix:** Make sure variable is set for "Production" environment

---

## 🧪 Test After Setting Variables

**After adding/updating variables:**

1. **Redeploy in Vercel:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment

2. **Test in browser:**
   - Open browser console (F12)
   - Run: `console.log(import.meta.env.VITE_SUPABASE_URL)`
   - Should show your Supabase URL (not `undefined`)

---

## ✅ Quick Verification

**In Vercel Dashboard, verify these exist:**

```
✅ VITE_FACEBOOK_APP_ID (you confirmed this)
⚠️ VITE_SUPABASE_URL (verify this)
⚠️ VITE_SUPABASE_ANON_KEY (verify this)
⚠️ VITE_APP_URL (verify this)
```

**If any are missing, add them before deploying!**
