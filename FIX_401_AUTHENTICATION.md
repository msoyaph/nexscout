# Fix: 401 Authentication Error for Facebook Data Deletion URL

## 🔍 The Problem

Facebook's validation sends a GET request **without any authentication headers**, but Supabase Edge Functions require authentication by default, causing a 401 error.

---

## ✅ Solution: Use Supabase Edge Functions Runtime

The function is using the old `serve` from Deno std library. We need to use Supabase's Edge Functions runtime which handles authentication differently.

### Update the Function

**Change from:**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
```

**To:**
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
```

**And change:**
```typescript
serve(async (req) => {
```

**To:**
```typescript
Deno.serve(async (req) => {
```

---

## 🔧 Quick Fix

The function needs to be updated to use Supabase's Edge Functions runtime. However, **Supabase Edge Functions still require authentication by default**.

### Option 1: Configure in Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/dohrkewdanppkqulvhhz/functions
   - Click on `facebook-data-deletion`

2. **Check for "Public Access" or "Require Authentication" setting:**
   - Some Supabase projects allow configuring public access
   - Enable public access for GET requests

### Option 2: Use Anon Key (Not Ideal for Facebook)

Facebook won't send the anon key, so this won't work for validation. But you can test locally:

```bash
# Get anon key from: Supabase Dashboard → Settings → API
curl -X GET "https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/facebook-data-deletion" \
  -H "apikey: YOUR_ANON_KEY"
```

### Option 3: Create a Public Proxy Endpoint

Since Facebook needs a truly public endpoint, you might need to:

1. **Create a simple public endpoint** (Vercel, Netlify, etc.)
2. **That endpoint forwards to Supabase function** with auth
3. **Use the proxy URL in Facebook**

---

## 🎯 Immediate Action

**The function code is correct** - it handles GET requests properly. The issue is **Supabase's infrastructure requiring authentication**.

**Check Supabase Dashboard** for public access settings. If not available, you may need to:
- Contact Supabase support about making this endpoint public
- Or use a proxy endpoint solution

---

## 📋 Status

✅ Function code: Correct  
✅ GET handler: Implemented  
✅ Function deployed: Yes  
❌ Public access: Not configured (Supabase infrastructure)

**The function is ready - it just needs to be configured for public access in Supabase Dashboard!**
