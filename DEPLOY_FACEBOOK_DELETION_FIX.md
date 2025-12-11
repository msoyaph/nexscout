# Fix: Deploy Updated Facebook Data Deletion Function

## ✅ What Was Fixed

The function now handles **GET requests** for Facebook's URL validation. Previously it only accepted POST requests, which caused Facebook to reject the URL.

---

## 🚀 Deploy the Updated Function

### Step 1: Deploy Using Supabase CLI

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions deploy facebook-data-deletion
```

### Step 2: Verify Deployment

After deployment, test the URL:

```bash
curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion"
```

**Expected response:**
```json
{
  "message": "Facebook Data Deletion Callback endpoint is active",
  "status": "ok"
}
```

**If you still get 401:** Wait 1-2 minutes for deployment to propagate, then try again.

---

## ✅ Step 3: Try Again in Facebook

1. Go to **Facebook App Dashboard** → **Settings** → **Basic**
2. Scroll to **"Data Deletion Request URL"**
3. Enter:
   ```
   https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
   ```
4. Click **"Save Changes"**

**It should now accept the URL!** ✅

---

## 🔍 What Changed

**Before:**
- Function only accepted POST requests
- GET requests returned 405 (Method Not Allowed)
- Facebook couldn't validate the URL

**After:**
- Function accepts GET requests (for validation)
- Returns 200 OK with a success message
- Facebook can now validate the URL

---

## 🧪 Test After Deployment

**Test 1: GET Request (Facebook Validation)**
```bash
curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion"
```

**Expected:** `{"message":"Facebook Data Deletion Callback endpoint is active","status":"ok"}`

**Test 2: POST Request (Actual Deletion)**
```bash
curl -X POST "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion" \
  -F "signed_request=test"
```

**Expected:** Error about missing/invalid signed_request (this is normal - needs real Facebook data)

---

## 📋 Quick Checklist

- [ ] Function code updated locally
- [ ] Function deployed: `supabase functions deploy facebook-data-deletion`
- [ ] GET request returns 200 OK
- [ ] URL accepted in Facebook App Dashboard
- [ ] Saved successfully in Facebook

---

## 🆘 If Still Not Working

1. **Check deployment status:**
   ```bash
   supabase functions list
   ```
   Should show `facebook-data-deletion` as deployed

2. **Check function logs:**
   - Supabase Dashboard → Edge Functions → facebook-data-deletion → Logs
   - Look for any errors

3. **Verify function code:**
   - Make sure the GET handler is in the function
   - Check lines 232-242 in the function file

4. **Wait a few minutes:**
   - Sometimes it takes 1-2 minutes for changes to propagate

---

**After deployment, the URL should be accepted by Facebook!** 🎉
