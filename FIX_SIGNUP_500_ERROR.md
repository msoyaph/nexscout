# Fix Signup 500 Error

## 🔴 Issue

The signup page is getting a **500 Internal Server Error** when calling the `admin-signup` edge function.

**Error:** `Failed to load resource: the server responded with a status of 500 ()`

## ✅ Solution: Create or Fix the `admin-signup` Edge Function

The `admin-signup` edge function either:
1. **Doesn't exist** - needs to be created
2. **Has an error** - needs to be fixed
3. **Missing environment variables** - needs configuration

---

## Option 1: Create the Edge Function (Recommended)

### Step 1: Create the Edge Function File

Create this file in your Supabase project:

**Path:** `supabase/functions/admin-signup/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { email, password, fullName, company } = await req.json();

    // Validate input
    if (!email || !password || !fullName || !company) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: email, password, fullName, company',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase Admin Client (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);
    
    if (existingUser?.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User with this email already exists',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (skip verification)
    });

    if (authError || !authData?.user) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: authError?.message || 'Failed to create user account',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        subscription_tier: 'free',
        coin_balance: 30, // Welcome bonus
        energy_balance: 5,  // Welcome bonus
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: profileError.message || 'Failed to create user profile',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Create company intelligence entry
    const { error: companyError } = await supabaseAdmin
      .from('company_intelligence')
      .insert({
        user_id: userId,
        company_name: company,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (companyError) {
      console.error('Company intelligence creation error:', companyError);
      // Non-critical - continue even if this fails
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        message: 'User created successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Step 2: Deploy the Edge Function

**Via Supabase CLI:**
```bash
supabase functions deploy admin-signup
```

**Via Supabase Dashboard:**
1. Go to **Edge Functions** → **Create Function**
2. Name: `admin-signup`
3. Copy the code above
4. Deploy

### Step 3: Set Environment Variables

In Supabase Dashboard → Edge Functions → `admin-signup` → Settings:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (⚠️ Keep secret!)

---

## Option 2: Use Standard Supabase Auth (Alternative)

If you don't want to use an edge function, you can use standard Supabase auth:

```typescript
// In NewSignupPage.tsx, replace the admin-signup call with:
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,
      company: company,
    },
  },
});

if (authError) {
  throw new Error(authError.message);
}

// Then create profile manually via RPC or direct insert
```

**Note:** This requires RLS policies to allow profile creation, or you'll need an RPC function.

---

## Option 3: Check Existing Edge Function

If the edge function already exists, check:

1. **Supabase Dashboard** → **Edge Functions** → **admin-signup**
2. Check **Logs** for error messages
3. Verify **Environment Variables** are set
4. Check **Function Code** for syntax errors

---

## 🧪 Test After Fix

1. Open browser console (F12)
2. Try signing up
3. Check console logs for detailed error messages
4. Check Supabase Edge Function logs for server-side errors

---

## 📝 Expected Behavior

After fixing, you should see:
- ✅ `[NewSignup] Response status: 200`
- ✅ `[NewSignup] ✅ User created via admin endpoint: [uuid]`
- ✅ User is automatically signed in
- ✅ Redirects to onboarding wizard

---

**Status:** Edge function needs to be created or fixed!




