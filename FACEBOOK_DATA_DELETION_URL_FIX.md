# Fix: "name_placeholder should represent a valid URL" Error

## 🔍 The Problem

Facebook is showing this error when you try to save the Data Deletion URL:
```
name_placeholder should represent a valid URL
```

**Your URL:**
```
https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
```

---

## ✅ Solution Steps

### Step 1: Verify the Function is Deployed

**Check in Supabase Dashboard:**

1. Go to **Supabase Dashboard** → Your Project
2. Click **Edge Functions** (left sidebar)
3. Look for **`facebook-data-deletion`**
4. Check if it shows **"Active"** or **"Deployed"**

**If it's NOT deployed:**

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions deploy facebook-data-deletion
```

---

### Step 2: Test the URL is Accessible

**Test in browser or terminal:**

```bash
curl -I https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
```

**Expected response:**
- Should return HTTP status (200, 400, or 403 - not 404)
- If you get 404, the function isn't deployed

**Or test in browser:**
- Open: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`
- Should NOT show "404 Not Found"
- May show an error about missing parameters (this is OK - means function exists)

---

### Step 3: Common Facebook Validation Issues

#### Issue 1: URL Must Be HTTPS

✅ **Correct:** `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`  
❌ **Wrong:** `http://...` (no HTTPS)

#### Issue 2: No Trailing Slash

✅ **Correct:** `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`  
❌ **Wrong:** `https://.../facebook-data-deletion/` (trailing slash)

#### Issue 3: URL Must Be Publicly Accessible

- Facebook needs to be able to reach the URL
- Make sure the function is deployed and not in development mode
- Check if there are any IP restrictions or firewall rules

#### Issue 4: Function Must Respond to GET Requests

Facebook validates the URL by sending a GET request. Make sure your function handles GET requests (even if it returns an error, it should respond).

---

### Step 4: Verify Function Code Handles GET Requests

**Check your `facebook-data-deletion` function:**

It should handle GET requests (for Facebook's validation). The function should:

1. Accept GET requests
2. Return a valid HTTP response (even if it's an error)
3. Not require authentication for the initial validation

**Example function structure:**
```typescript
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET (Facebook validation)
  if (req.method === 'GET') {
    // Facebook might send a GET to validate
    return new Response(
      JSON.stringify({ message: 'Data deletion endpoint' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Handle POST (actual deletion request)
  if (req.method === 'POST') {
    // ... deletion logic
  }
});
```

---

### Step 5: Check Supabase Function Logs

**In Supabase Dashboard:**

1. Go to **Edge Functions** → **`facebook-data-deletion`**
2. Click **Logs** tab
3. Try accessing the URL again
4. Check if there are any errors in the logs

**Common errors:**
- Function not found (404)
- CORS errors
- Authentication errors
- Function timeout

---

### Step 6: Alternative - Use Full URL with Query Parameters

Sometimes Facebook is picky. Try these variations:

**Option 1: Basic URL (recommended)**
```
https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
```

**Option 2: With trailing path (if needed)**
```
https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion/
```

**Option 3: Check if function name is correct**
- Make sure it's exactly: `facebook-data-deletion`
- No typos, no spaces, no underscores

---

### Step 7: Verify Function Deployment Status

**Using Supabase CLI:**

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions list
```

**Look for:**
```
facebook-data-deletion  [Active/Deployed]
```

**If not listed, deploy it:**
```bash
supabase functions deploy facebook-data-deletion
```

---

## 🔧 Quick Fix Checklist

- [ ] Function is deployed in Supabase
- [ ] URL is HTTPS (not HTTP)
- [ ] No trailing slash (or try with trailing slash)
- [ ] Function responds to GET requests
- [ ] Function is publicly accessible (no auth required for GET)
- [ ] No typos in the URL
- [ ] Function name matches exactly: `facebook-data-deletion`
- [ ] Test URL in browser - should not show 404

---

## 🧪 Test the URL

**Method 1: Browser**
1. Open: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`
2. Should see a response (even if it's an error about missing parameters)
3. Should NOT see "404 Not Found"

**Method 2: Terminal**
```bash
curl https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
```

**Expected:** Some JSON response or error message (not 404)

---

## 🆘 If Still Not Working

### Check 1: Function Exists
```bash
supabase functions list | grep facebook-data-deletion
```

### Check 2: Function Code
Make sure `supabase/functions/facebook-data-deletion/index.ts` exists and is correct.

### Check 3: Deploy Again
```bash
supabase functions deploy facebook-data-deletion --no-verify-jwt
```

### Check 4: Check Supabase Dashboard
- Go to Edge Functions
- Verify `facebook-data-deletion` shows as deployed
- Check the function URL matches what you're entering

---

## ✅ Once URL is Valid

After the URL is accepted by Facebook:

1. **Save the URL** in Facebook App Dashboard
2. **Test the callback:**
   - Go to Facebook Settings → Apps and Websites
   - Remove your app
   - Click "Send Request"
   - Check Supabase logs to see if request was received

---

## 📋 Your Specific URL

**Your Supabase Project:** `dohrkewdanppkqulvhhz`

**Data Deletion URL:**
```
https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
```

**Make sure:**
- ✅ Function is deployed
- ✅ URL is accessible
- ✅ Function handles GET requests
- ✅ No typos in the URL

---

## 🔍 Debug Steps

1. **Verify deployment:**
   ```bash
   supabase functions list
   ```

2. **Test URL accessibility:**
   ```bash
   curl -v https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion
   ```

3. **Check function logs:**
   - Supabase Dashboard → Edge Functions → facebook-data-deletion → Logs

4. **Verify function code:**
   - Check `supabase/functions/facebook-data-deletion/index.ts` exists
   - Make sure it handles GET requests

---

**Most Common Issue:** Function not deployed or URL not accessible. Deploy the function first, then try again in Facebook.
