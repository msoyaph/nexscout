# Facebook Data Deletion URL - Complete Deployment Guide

## ✅ Implementation Status

The Facebook Data Deletion Request Callback system is **fully implemented** and ready for deployment.

---

## 📋 What This Does

Facebook requires all apps that handle user data to provide a **Data Deletion Instructions URL**. When users remove your app from Facebook and request data deletion, Facebook sends a POST request to this URL.

**Your URL will be:**
```
https://your-project-ref.supabase.co/functions/v1/facebook-data-deletion
```

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

**Option A: Supabase Dashboard**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the contents of:
   ```
   supabase/migrations/20250110000000_create_data_deletion_requests_table.sql
   ```
5. Click **Run**

**Option B: Supabase CLI**
```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase db push
```

**Verify Migration:**
```sql
-- Check if table exists
SELECT * FROM data_deletion_requests LIMIT 1;
```

---

### Step 2: Deploy Edge Function

**Option A: Supabase Dashboard**
1. Go to **Edge Functions** → **Create Function**
2. Function Name: `facebook-data-deletion`
3. Copy code from: `supabase/functions/facebook-data-deletion/index.ts`
4. Paste into the function editor
5. Click **Deploy**

**Option B: Supabase CLI**
```bash
cd /Users/cliffsumalpong/Desktop/nexscout

# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy facebook-data-deletion
```

**Verify Deployment:**
- Go to Edge Functions → `facebook-data-deletion`
- Check that it shows "Active" status
- Test URL: `https://your-project-ref.supabase.co/functions/v1/facebook-data-deletion`

---

### Step 3: Configure Environment Variables

**In Supabase Dashboard → Edge Functions → `facebook-data-deletion` → Settings → Secrets:**

Add these secrets:

1. **`FACEBOOK_APP_SECRET`**
   - Get from: [Facebook App Dashboard](https://developers.facebook.com/apps/) → Your App → Settings → Basic
   - Copy the **App Secret** value
   - Paste into Supabase secrets

2. **`APP_URL`** (or `VITE_APP_URL`)
   - Your production app URL
   - Example: `https://nexscout.co` or `https://app.nexscout.co`
   - This is used to generate the status page URL

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available - no need to add them.

---

### Step 4: Configure Facebook App Dashboard

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Scroll down to **"Data Deletion Request URL"**
5. Enter your callback URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/facebook-data-deletion
   ```
   *(Replace `your-project-ref` with your actual Supabase project reference)*

6. Click **Save Changes**

**How to Find Your Project Reference:**
- Go to Supabase Dashboard → Settings → API
- Look at your **Project URL**: `https://abc123xyz.supabase.co`
- Your project reference is: `abc123xyz`

---

## 🧪 Testing

### Test 1: Verify Edge Function is Deployed

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/facebook-data-deletion \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "signed_request=test"
```

**Expected Response:** Should return an error about missing/invalid signed_request (this is normal - means the function is working).

### Test 2: Test Status Page

Visit in browser:
```
https://nexscout.co/data-deletion-status?code=test123
```

**Expected:** Should show "Not Found" status (normal for test code).

### Test 3: Full Flow Test

1. Connect Facebook to your app (if not already)
2. Go to Facebook Settings → Apps and Websites
3. Find your app → Remove
4. Click "Send Request" when prompted
5. Check Supabase Edge Function logs for the request
6. Verify response includes `url` and `confirmation_code`
7. Visit the status URL to see deletion status

---

## 📊 How It Works

### Flow Diagram

```
User removes app from Facebook
    ↓
Facebook sends POST to your callback URL
    ↓
Edge Function receives signed_request
    ↓
Verifies signature with FACEBOOK_APP_SECRET
    ↓
Extracts Facebook user ID
    ↓
Finds user in database
    ↓
Generates confirmation code
    ↓
Starts async data deletion
    ↓
Returns JSON with status URL and confirmation code
    ↓
User visits status URL to check progress
```

### Response Format

Facebook expects this JSON response:
```json
{
  "url": "https://nexscout.co/data-deletion-status?code=abc123xyz",
  "confirmation_code": "abc123xyz"
}
```

### What Gets Deleted

When a user requests deletion:

1. ✅ **`facebook_page_connections`** - Sets `is_active = false`
2. ✅ **`social_identities`** - Sets `is_active = false` for Facebook provider
3. ✅ **`chatbot_settings.integrations.facebook`** - Disables Facebook integration
4. ✅ **`profiles.metadata`** - Removes `facebook_user_id`, `facebook_access_token`, `facebook_page_id`
5. ✅ **`data_deletion_requests`** - Records the deletion request with status tracking

**Note:** User account is NOT deleted - only Facebook-related data is removed.

---

## 🔒 Security Features

- ✅ **Signature Verification** - Uses HMAC-SHA256 to verify Facebook's signed requests
- ✅ **Request Expiration** - Checks if request has expired
- ✅ **RLS Policies** - Users can only view their own deletion requests
- ✅ **Service Role Key** - Only used in Edge Function (never exposed to client)
- ✅ **HTTPS Only** - All requests must use HTTPS
- ✅ **Error Handling** - Graceful error handling without exposing sensitive data

---

## 📝 Status Page

Users can check their deletion status at:
```
https://nexscout.co/data-deletion-status?code=<confirmation_code>
```

**Status Values:**
- `pending` - Request received, waiting to process
- `processing` - Currently deleting data
- `completed` - Data deletion finished successfully
- `failed` - Error occurred during deletion

---

## 🆘 Troubleshooting

### Function Not Receiving Requests

**Check:**
- ✅ URL in Facebook Dashboard matches exactly (no trailing slash)
- ✅ Function is deployed and shows "Active"
- ✅ Check Supabase Edge Function logs for errors
- ✅ Verify CORS headers are correct

### Invalid Signature Error

**Check:**
- ✅ `FACEBOOK_APP_SECRET` matches your Facebook App Secret exactly
- ✅ No extra spaces or characters in the secret
- ✅ Secret hasn't been regenerated in Facebook Dashboard

### User Not Found

**This is normal if:**
- User never connected Facebook to your app
- User's Facebook connection was already removed
- Function still returns valid response (required by Facebook)

### Database Errors

**Check:**
- ✅ Migration has been run successfully
- ✅ `data_deletion_requests` table exists
- ✅ RLS policies are correctly set up
- ✅ Service role key has proper permissions

---

## ✅ Verification Checklist

Before submitting to Facebook for review:

- [ ] Database migration has been run
- [ ] Edge function is deployed and active
- [ ] Environment variables are set (`FACEBOOK_APP_SECRET`, `APP_URL`)
- [ ] URL is configured in Facebook App Dashboard
- [ ] Status page is accessible at `/data-deletion-status`
- [ ] Test deletion request works end-to-end
- [ ] Logs show successful processing
- [ ] Response format matches Facebook's requirements

---

## 📚 References

- [Facebook Data Deletion Callback Documentation](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)
- [Meta Platform Terms](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)

---

## 🎯 Next Steps

1. ✅ Deploy database migration
2. ✅ Deploy Edge Function
3. ✅ Set environment variables
4. ✅ Configure Facebook App Dashboard
5. ✅ Test the full flow
6. ✅ Update Privacy Policy to mention data deletion process
7. ✅ Submit app for Facebook review (if needed)

---

**Status:** ✅ Ready for Deployment

**Last Updated:** January 2025

