# Solution: Turn OFF JWT Verification for Facebook Data Deletion

## ✅ Found the Setting!

You found the **"Verify JWT with legacy secret"** setting in Supabase Dashboard. This is exactly what we need to fix!

---

## 🎯 Action Required

### Step 1: Turn OFF JWT Verification

1. **In Supabase Dashboard:**
   - Go to: Edge Functions → `facebook-data-deletion`
   - Find: **"Verify JWT with legacy secret"** setting
   - **Turn it OFF** (disable it)

2. **Why?**
   - Facebook's validation sends GET requests **without any authentication**
   - With JWT verification ON, Supabase blocks these requests before they reach your function
   - With JWT verification OFF, requests reach your function, and you handle authorization yourself

---

## ✅ Your Function Already Has Authorization Logic

Your function code already implements proper authorization:

1. **For GET requests:** Returns a simple success message (for Facebook validation)
2. **For POST requests:** 
   - Verifies Facebook's `signed_request` using HMAC-SHA256
   - Validates the signature with `FACEBOOK_APP_SECRET`
   - Only processes valid Facebook requests

**This is more secure** than JWT verification because:
- ✅ You verify Facebook's signature directly
- ✅ You control the authorization logic
- ✅ GET requests are safe (just return status)
- ✅ POST requests require valid Facebook signed_request

---

## 🧪 Test After Turning OFF JWT Verification

**Test the URL:**
```bash
curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion"
```

**Expected Response (after turning OFF JWT):**
```json
{
  "message": "Facebook Data Deletion Callback endpoint is active",
  "status": "ok"
}
```

**Current Response (with JWT ON):**
```json
{"code":401,"message":"Missing authorization header"}
```

---

## 📋 Security Notes

**With JWT Verification OFF:**

✅ **Still Secure:**
- GET requests only return a status message (no sensitive data)
- POST requests require valid Facebook `signed_request`
- You verify Facebook's signature using `FACEBOOK_APP_SECRET`
- Invalid requests are rejected

✅ **Authorization Logic in Function:**
- Your function checks `signed_request` signature
- Only processes requests from Facebook
- Validates expiration and user ID

❌ **Not Secure:**
- Anyone can call GET endpoint (but it only returns status)
- Anyone can call POST endpoint (but invalid requests are rejected)

**This is the correct approach for Facebook callbacks!**

---

## ✅ Next Steps

1. **Turn OFF "Verify JWT with legacy secret"** in Supabase Dashboard
2. **Wait 10-30 seconds** for the change to propagate
3. **Test the URL:**
   ```bash
   curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion"
   ```
4. **Should return:** `{"message":"Facebook Data Deletion Callback endpoint is active","status":"ok"}`
5. **Try in Facebook Dashboard:**
   - Go to Settings → Basic → Data Deletion Request URL
   - Enter: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion`
   - Should now accept it! ✅

---

## 🎉 Summary

**The Setting:**
- **"Verify JWT with legacy secret"** → Turn **OFF**

**Why:**
- Facebook needs to validate the URL without authentication
- Your function handles authorization with Facebook's signed_request
- This is the recommended approach per Supabase's own recommendation

**Result:**
- GET requests work (for Facebook validation)
- POST requests are still secure (require valid Facebook signature)
- URL will be accepted by Facebook! ✅

---

**Turn it OFF and test - the URL should work!** 🚀
