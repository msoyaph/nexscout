# How to Set VITE_FACEBOOK_APP_ID Environment Variable

## 🔍 What is This?

`VITE_FACEBOOK_APP_ID` is an **environment variable** that stores your Facebook App ID. Your frontend code needs this to:
- Start the OAuth flow (connect Facebook pages)
- Redirect users to Facebook for authorization

---

## 📍 Where is It Used?

**In your code:**
- `src/pages/integrations/FacebookIntegrationPage.tsx` - Line 152
- `src/pages/SettingsPage.tsx` - Line 159
- `src/components/onboarding/OnboardingCompletionFlow.tsx` - Line 122

**Example usage:**
```typescript
const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&...`;
```

---

## 🎯 What Value to Use?

**Your Facebook App ID** from Facebook App Dashboard:
1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. **Settings → Basic**
4. Copy the **App ID** (it's a number like `123456789012345`)

---

## 🚀 How to Set It

### Option 1: Production Environment (Vercel/Netlify/etc.)

**If you're using Vercel:**

1. **Go to:** https://vercel.com/dashboard
2. **Select your project:** `nexscout` (or your project name)
3. **Settings** → **Environment Variables**
4. **Add New:**
   - **Key:** `VITE_FACEBOOK_APP_ID`
   - **Value:** `your_facebook_app_id_here` (the number from Facebook)
   - **Environment:** Select all (Production, Preview, Development)
5. **Click Save**
6. **Redeploy** your app (or push a new commit)

**If you're using Netlify:**

1. **Go to:** https://app.netlify.com
2. **Select your site**
3. **Site settings** → **Environment variables**
4. **Add a variable:**
   - **Key:** `VITE_FACEBOOK_APP_ID`
   - **Value:** `your_facebook_app_id_here`
5. **Save**
6. **Redeploy** your site

**If you're using Cloudflare Pages:**

1. **Go to:** https://dash.cloudflare.com
2. **Workers & Pages** → Your project
3. **Settings** → **Environment variables**
4. **Add variable:**
   - **Key:** `VITE_FACEBOOK_APP_ID`
   - **Value:** `your_facebook_app_id_here`
5. **Save**
6. **Redeploy**

---

### Option 2: Local Development (.env file)

**For local testing:**

1. **Create/Edit:** `.env` file in your project root
2. **Add this line:**
   ```env
   VITE_FACEBOOK_APP_ID=your_facebook_app_id_here
   ```
3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

**Example `.env` file:**
```env
VITE_SUPABASE_URL=https://dohrkewdanppkqulvhhz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_FACEBOOK_APP_ID=123456789012345
```

---

## ⚠️ Important Notes

1. **Never commit `.env` to Git:**
   - `.env` should be in `.gitignore`
   - Only commit `.env.example` (without real values)

2. **VITE_ prefix:**
   - Variables starting with `VITE_` are exposed to the browser
   - This is safe for App ID (it's public anyway)
   - Never use `VITE_` for secrets (use backend/env vars for secrets)

3. **Redeploy after adding:**
   - Environment variables are loaded at build time
   - You must redeploy for changes to take effect

---

## 🧪 How to Verify It's Set

**After setting and redeploying:**

1. **Open your app** in browser
2. **Open browser console** (F12)
3. **Run:**
   ```javascript
   console.log(import.meta.env.VITE_FACEBOOK_APP_ID);
   ```
4. **Should show:** Your Facebook App ID (not `undefined`)

**Or test the Facebook connect button:**
- Go to `/integrations/facebook`
- Click "Connect Facebook Page"
- Should redirect to Facebook (not show an error)

---

## 📋 Quick Checklist

- [ ] Got Facebook App ID from Facebook Dashboard
- [ ] Added `VITE_FACEBOOK_APP_ID` to production environment (Vercel/Netlify/etc.)
- [ ] Added `VITE_FACEBOOK_APP_ID` to `.env` for local development
- [ ] Redeployed app (if production)
- [ ] Tested - Facebook connect button works

---

## 🆘 Troubleshooting

### "VITE_FACEBOOK_APP_ID is undefined"

**Fix:**
- Make sure variable name is exactly `VITE_FACEBOOK_APP_ID` (case-sensitive)
- Make sure it starts with `VITE_`
- Redeploy after adding
- Restart dev server if local

### Facebook Connect Button Doesn't Work

**Check:**
- Is `VITE_FACEBOOK_APP_ID` set correctly?
- Is the App ID correct (from Facebook Dashboard)?
- Check browser console for errors

---

## ✅ Example

**Your Facebook App ID:** `123456789012345`

**In Vercel/Netlify:**
```
Key: VITE_FACEBOOK_APP_ID
Value: 123456789012345
```

**In .env file:**
```
VITE_FACEBOOK_APP_ID=123456789012345
```

**That's it!** Simple as that. 🎉
