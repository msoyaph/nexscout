# How to Find Your Data Deletion URL in Supabase

## 🔍 Where to Find the URL

### Option 1: Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions:**
   - In the left sidebar, click **"Edge Functions"**
   - Find **"facebook-data-deletion"** in the list
   - Click on it

3. **View Function URL:**
   - The function URL is displayed at the top of the function page
   - Format: `https://[your-project-ref].supabase.co/functions/v1/facebook-data-deletion`
   - **Copy this URL** - this is your Data Deletion Instructions URL

---

### Option 2: Get Project Reference from Settings

1. **Go to Project Settings:**
   - In Supabase Dashboard → Click **"Settings"** (gear icon)
   - Click **"General"** or **"API"**

2. **Find Project Reference:**
   - Look for **"Reference ID"** or **"Project URL"**
   - It looks like: `wuuwdlamgnhcagrxuskv` (your unique project ID)

3. **Build the URL:**
   ```
   https://[your-project-ref].supabase.co/functions/v1/facebook-data-deletion
   ```
   
   Example:
   ```
   https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion
   ```

---

### Option 3: From Environment Variables

If you have access to your project's environment:

1. **Check `.env` file** (if local):
   ```env
   SUPABASE_URL=https://wuuwdlamgnhcagrxuskv.supabase.co
   ```

2. **Extract project reference:**
   - From `SUPABASE_URL`, extract the part before `.supabase.co`
   - That's your project reference

3. **Build the URL:**
   ```
   [SUPABASE_URL]/functions/v1/facebook-data-deletion
   ```

---

## 📋 Step-by-Step: Finding in Dashboard

### Step 1: Access Edge Functions
```
Supabase Dashboard → Your Project → Edge Functions (left sidebar)
```

### Step 2: Find the Function
```
Look for: facebook-data-deletion
Click on it
```

### Step 3: Copy the URL
```
At the top of the function page, you'll see:
"Function URL: https://[project-ref].supabase.co/functions/v1/facebook-data-deletion"
```

---

## 🔗 What the URL Looks Like

**Format:**
```
https://[PROJECT_REFERENCE].supabase.co/functions/v1/facebook-data-deletion
```

**Example:**
```
https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion
```

---

## ✅ Where to Use This URL

### Facebook App Dashboard

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. **Settings** → **Basic**
4. Scroll to **"Data Deletion Request URL"**
5. Paste the URL you copied from Supabase
6. Click **"Save Changes"**

---

## 🧪 Test the URL

You can test if the URL is working:

1. **Open the URL in browser:**
   ```
   https://[your-project-ref].supabase.co/functions/v1/facebook-data-deletion
   ```

2. **Expected Response:**
   - If it's working, you might see an error about missing parameters (this is normal - it expects a POST request from Facebook)
   - If you see a 404, the function might not be deployed

3. **Check Function Status:**
   - In Supabase Dashboard → Edge Functions → `facebook-data-deletion`
   - Make sure it shows **"Active"** or **"Deployed"**

---

## 🆘 Troubleshooting

### Can't Find the Function?

**Check if it's deployed:**
```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions list
```

**If not listed, deploy it:**
```bash
supabase functions deploy facebook-data-deletion
```

### URL Returns 404?

1. **Verify function is deployed:**
   - Go to Edge Functions in Supabase Dashboard
   - Check if `facebook-data-deletion` exists

2. **Check function name:**
   - Make sure it's exactly: `facebook-data-deletion`
   - No typos, no spaces

3. **Verify project reference:**
   - Double-check your project reference in the URL
   - It should match your Supabase project

---

## 📸 Visual Guide

**In Supabase Dashboard:**

```
┌─────────────────────────────────────┐
│  Supabase Dashboard                 │
├─────────────────────────────────────┤
│  [Settings] [Edge Functions] ← Click │
│                                     │
│  Edge Functions                     │
│  ┌───────────────────────────────┐ │
│  │ facebook-data-deletion        │ │ ← Click this
│  │ Status: Active                │ │
│  └───────────────────────────────┘ │
│                                     │
│  Function URL:                     │
│  https://[ref].supabase.co/...     │ ← Copy this
└─────────────────────────────────────┘
```

---

## ✅ Quick Checklist

- [ ] Opened Supabase Dashboard
- [ ] Navigated to Edge Functions
- [ ] Found `facebook-data-deletion` function
- [ ] Copied the Function URL
- [ ] Pasted it in Facebook App Dashboard → Settings → Basic → Data Deletion Request URL
- [ ] Saved changes in Facebook

---

**Your URL Format:**
```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/facebook-data-deletion
```

Replace `[YOUR_PROJECT_REF]` with your actual Supabase project reference!
