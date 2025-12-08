# Facebook Data Deletion Callback - Quick Setup Guide

## ✅ Implementation Complete

I've implemented the complete Facebook Data Deletion Request Callback system for your NexScout app.

---

## 📁 Files Created

### 1. Supabase Edge Function
**File:** `supabase/functions/facebook-data-deletion/index.ts`
- Handles Facebook's POST requests
- Parses and verifies signed requests
- Deletes Facebook-related user data
- Returns status URL and confirmation code

### 2. Database Migration
**File:** `supabase/migrations/create_data_deletion_requests_table.sql`
- Creates `data_deletion_requests` table
- Tracks all deletion requests
- Stores confirmation codes and status

### 3. Status Page
**File:** `src/pages/DataDeletionStatusPage.tsx`
- Public route: `/data-deletion-status?code=<confirmation_code>`
- Shows deletion request status
- User-friendly interface

### 4. App Routing
**Updated:** `src/App.tsx`
- Added route for `/data-deletion-status`

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

**Option A: Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/create_data_deletion_requests_table.sql`
3. Run the SQL

**Option B: Supabase CLI**
```bash
supabase db push
```

### Step 2: Deploy Edge Function

**Using Supabase CLI:**
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy facebook-data-deletion
```

**Or using Supabase Dashboard:**
1. Go to Edge Functions → Create Function
2. Name: `facebook-data-deletion`
3. Copy code from `supabase/functions/facebook-data-deletion/index.ts`
4. Deploy

### Step 3: Configure Environment Variables

In Supabase Dashboard → Edge Functions → `facebook-data-deletion` → Settings → Secrets:

Add these secrets:
- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `VITE_APP_URL` or `APP_URL` - Your app URL (e.g., `https://nexscout.co`)

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available.

### Step 4: Configure Facebook App Dashboard

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Scroll to **Data Deletion Request URL**
5. Enter:
   ```
   https://your-project.supabase.co/functions/v1/facebook-data-deletion
   ```
   Replace `your-project` with your Supabase project reference (e.g., `wuuwdlamgnhcagrxuskv`)
6. Click **Save Changes**

---

## 🔍 How to Find Your Supabase Project Reference

1. Go to Supabase Dashboard
2. Click on your project
3. Go to Settings → API
4. Look at your **Project URL**: `https://wuuwdlamgnhcagrxuskv.supabase.co`
5. The project reference is: `wuuwdlamgnhcagrxuskv`

---

## 📋 Complete Callback URL Format

Your callback URL should be:
```
https://wuuwdlamgnhcagrxuskv.supabase.co/functions/v1/facebook-data-deletion
```

---

## ✅ Testing

### Test the Status Page
Visit: `https://nexscout.co/data-deletion-status?code=test123`

### Test the Callback (After Deployment)
1. Remove your app from Facebook Settings
2. Click "Send Request"
3. Check Supabase logs for the request
4. Verify response includes status URL and confirmation code

---

## 📊 What Gets Deleted

When a user requests deletion, the system:
- ✅ Deactivates `facebook_page_connections` (sets `is_active = false`)
- ✅ Deactivates `social_identities` for Facebook (sets `is_active = false`)
- ✅ Removes Facebook data from `profiles.metadata`
- ✅ Records deletion request in `data_deletion_requests` table

---

## 🔒 Security

- ✅ Signature verification (HMAC-SHA256)
- ✅ Request expiration checking
- ✅ RLS policies on deletion requests table
- ✅ HTTPS only
- ✅ Service role key used only in Edge Function

---

## 📝 Next Steps

1. ✅ Deploy database migration
2. ✅ Deploy Edge Function
3. ✅ Set environment variables
4. ✅ Configure Facebook App Dashboard
5. ✅ Test with real deletion request
6. ✅ Update Privacy Policy to mention data deletion

---

## 🆘 Troubleshooting

### Function Not Receiving Requests
- Check URL in Facebook Dashboard matches exactly
- Verify function is deployed
- Check Supabase function logs

### Invalid Signature
- Verify `FACEBOOK_APP_SECRET` is correct
- Check it matches your Facebook App Secret exactly

### User Not Found
- This is normal if user never connected Facebook
- Function still returns valid response

---

**Status:** ✅ Ready for Deployment

**Reference:** [Facebook Data Deletion Callback Documentation](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)




