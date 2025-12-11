# Fix: Facebook URL Validation - 401 Error

## 🔍 The Problem

After deploying the function, you're still getting:
```json
{"code":401,"message":"Missing authorization header"}
```

This is because **Supabase Edge Functions require authentication by default**, but Facebook's validation doesn't send authentication headers.

---

## ✅ Solution: Make GET Requests Public

We need to configure the function to allow **unauthenticated GET requests** for Facebook's validation, while still requiring authentication for POST requests (actual deletions).

### Option 1: Use Anon Key (Quick Test)

**Test if the function works with anon key:**

```bash
# Get your anon key from Supabase Dashboard → Settings → API
curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion" \
  -H "apikey: YOUR_ANON_KEY_HERE"
```

If this works, the function is correct but needs the anon key.

**However**, Facebook won't send the anon key, so we need **Option 2**.

---

### Option 2: Configure Function to Allow Public GET (Recommended)

**Update the function to handle authentication properly:**

The function should:
1. **Allow GET requests without authentication** (for Facebook validation)
2. **Require authentication for POST requests** (for actual deletions)

**The current code already handles GET requests correctly**, but Supabase's infrastructure is blocking it.

---

## 🔧 Solution: Deploy with Public Access

### Step 1: Check Function Configuration

Supabase Edge Functions can be configured to allow public access. However, the 401 error suggests the function is behind Supabase's authentication layer.

### Step 2: Use Supabase Dashboard to Configure

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dohrkewdanppkqulvhhz/functions
   - Click on `facebook-data-deletion`

2. **Check Function Settings:**
   - Look for "Authentication" or "Public Access" settings
   - Some Supabase projects allow configuring public access per function

### Step 3: Alternative - Use Anon Key in Function Logic

If we can't make it fully public, we can modify the function to accept requests with the anon key OR no authentication for GET requests.

---

## 🧪 Test After Fix

**Test 1: GET Request (Should work without auth)**
```bash
curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion"
```

**Expected:** `{"message":"Facebook Data Deletion Callback endpoint is active","status":"ok"}`

**Test 2: In Facebook Dashboard**
- Go to Settings → Basic → Data Deletion Request URL
- Enter: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`
- Should accept without error

---

## 🔍 Why This Happens

Supabase Edge Functions are **protected by default** and require:
- Either a `Bearer` token (user JWT)
- Or an `apikey` header (anon key)

Facebook's validation doesn't send either, so we get 401.

**Solution:** The function code handles GET correctly, but we need to configure Supabase to allow public GET requests for this specific function.

---

## 📋 Next Steps

1. **Check Supabase Dashboard:**
   - Go to Edge Functions → `facebook-data-deletion`
   - Look for "Public Access" or "Authentication" settings
   - Enable public access for GET requests if available

2. **If no public access option:**
   - The function might need to be called with anon key
   - Or we need to contact Supabase support about making this endpoint public

3. **Alternative:**
   - Create a separate public endpoint just for validation
   - Or use a different hosting solution for this callback

---

## 🆘 Quick Workaround

**If Facebook still rejects the URL**, you can:

1. **Use a proxy/wrapper:**
   - Create a simple public endpoint that forwards to the Supabase function
   - Use that URL in Facebook

2. **Contact Supabase Support:**
   - Ask about making Edge Functions publicly accessible
   - Or getting a public URL for this specific function

---

**The function code is correct - it's a Supabase infrastructure configuration issue.**
