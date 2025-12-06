# How to Deploy Facebook Data Deletion Edge Function

## ✅ Step 1: File Already Created

The file has been created at:
```
supabase/functions/facebook-data-deletion/index.ts
```

---

## 🚀 Step 2: Deploy the Function

You have **two options** to deploy:

---

### Option A: Deploy via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click **"Edge Functions"** in the left sidebar
   - Or go to: https://supabase.com/dashboard/project/_/functions

3. **Create New Function**
   - Click **"Create a new function"** or **"New Function"** button
   - Name it: `facebook-data-deletion`
   - Click **"Create function"**

4. **Copy the Code**
   - Open `supabase/functions/facebook-data-deletion/index.ts` in your editor
   - Copy **ALL** the code
   - Paste it into the Supabase function editor

5. **Deploy**
   - Click **"Deploy"** button
   - Wait for deployment to complete (usually 10-30 seconds)

6. **Set Environment Variables (Secrets)**
   - After deployment, go to **Settings** tab
   - Scroll to **"Secrets"** section
   - Click **"Add secret"**
   - Add these secrets:
     - **Name:** `FACEBOOK_APP_SECRET`
     - **Value:** Your Facebook App Secret (from Facebook App Dashboard)
     - Click **"Save"**
   - Add another secret:
     - **Name:** `VITE_APP_URL` or `APP_URL`
     - **Value:** `https://nexscout.co`
     - Click **"Save"**

7. **Get Your Function URL**
   - After deployment, you'll see the function URL
   - It will look like: `https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion`
   - **Copy this URL** - you'll need it for Facebook App Dashboard

---

### Option B: Deploy via Supabase CLI (Advanced)

1. **Install Supabase CLI** (if not installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```
   - This will open your browser to authenticate

3. **Link Your Project**
   ```bash
   supabase link --project-ref wuuwdlamgnhcagrxuskv
   ```
   - Replace `wuuwdlamgnhcagrxuskv` with your actual Supabase project reference
   - You can find this in Supabase Dashboard → Settings → API → Project URL

4. **Deploy the Function**
   ```bash
   supabase functions deploy facebook-data-deletion
   ```

5. **Set Secrets via CLI**
   ```bash
   # Set Facebook App Secret
   supabase secrets set FACEBOOK_APP_SECRET=your_facebook_app_secret_here

   # Set App URL
   supabase secrets set VITE_APP_URL=https://nexscout.co
   ```

   Or set them in Dashboard → Edge Functions → facebook-data-deletion → Settings → Secrets

---

## 🔍 How to Find Your Supabase Project Reference

1. Go to Supabase Dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Look at **Project URL**: `https://wuuwdlamgnhcagrxuskv.supabase.co`
5. The project reference is: `wuuwdlamgnhcagrxuskv` (the part before `.supabase.co`)

---

## 🔑 How to Find Your Facebook App Secret

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Scroll down to **"App Secret"**
5. Click **"Show"** and enter your password
6. Copy the App Secret

---

## ✅ Verify Deployment

After deploying, test the function:

1. **Check Function Status**
   - In Supabase Dashboard → Edge Functions
   - You should see `facebook-data-deletion` with status "Active"

2. **Test the Function** (Optional)
   ```bash
   curl -X POST https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "signed_request=test"
   ```
   - Should return an error (expected - we're just testing if it's accessible)

3. **Check Logs**
   - In Supabase Dashboard → Edge Functions → `facebook-data-deletion` → Logs
   - You should see deployment logs

---

## 📋 Next Steps After Deployment

1. ✅ **Copy Your Function URL**
   - Format: `https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion`

2. ✅ **Configure Facebook App Dashboard**
   - Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
   - Settings → Basic → Data Deletion Request URL
   - Paste your function URL
   - Save

3. ✅ **Test with Real Request**
   - Remove your app from Facebook Settings
   - Click "Send Request"
   - Check Supabase logs to see the request

---

## 🆘 Troubleshooting

### "Function not found"
- Make sure you deployed the function
- Check the function name is exactly: `facebook-data-deletion`

### "Missing environment variables"
- Go to Edge Functions → Settings → Secrets
- Make sure `FACEBOOK_APP_SECRET` and `VITE_APP_URL` are set

### "Invalid signature" errors
- Verify `FACEBOOK_APP_SECRET` matches your Facebook App Secret exactly
- Check for extra spaces or characters

### Can't find Supabase CLI
- Install it: `npm install -g supabase`
- Or use the Dashboard method instead (easier)

---

## 📝 Quick Reference

**Function Location:**
```
supabase/functions/facebook-data-deletion/index.ts
```

**Function URL Format:**
```
https://[your-project-ref].supabase.co/functions/v1/facebook-data-deletion
```

**Required Secrets:**
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `VITE_APP_URL` or `APP_URL` - `https://nexscout.co`

---

**Status:** ✅ File created and ready to deploy!

Choose **Option A (Dashboard)** for easiest deployment, or **Option B (CLI)** if you prefer command line.

