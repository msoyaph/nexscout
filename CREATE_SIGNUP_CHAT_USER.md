# Create Signup Chat User Account

## 🔴 Issue

The RPC function `get_signup_chat_user_id()` is working, but the user account `meyouvideos@gmail.com` doesn't exist in the database.

**Error:** `Signup chat user not found with email: meyouvideos@gmail.com`

## ✅ Solution: Create User Account

You have two options:

### Option 1: Create Account via Signup Page (Recommended)

1. Go to the signup page
2. Sign up with email: `meyouvideos@gmail.com`
3. Complete onboarding
4. The chat will automatically work after that

### Option 2: Create Account via SQL (Quick Setup)

Run this SQL in Supabase SQL Editor to create the user account:

```sql
-- Step 1: Create auth user (if not exists)
DO $$
DECLARE
  auth_user_id uuid;
  profile_exists boolean;
BEGIN
  -- Check if auth user exists
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'meyouvideos@gmail.com'
  LIMIT 1;

  -- If auth user doesn't exist, create it
  IF auth_user_id IS NULL THEN
    -- Note: You'll need to create the auth user manually via Supabase Auth
    -- Or use the signup page to create it properly
    RAISE NOTICE 'Auth user does not exist. Please create via signup page or Supabase Auth Dashboard.';
    RETURN;
  END IF;

  -- Check if profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = auth_user_id
  ) INTO profile_exists;

  -- Create profile if it doesn't exist
  IF NOT profile_exists THEN
    INSERT INTO profiles (
      id,
      email,
      full_name,
      subscription_tier,
      coin_balance,
      energy_balance,
      onboarding_completed,
      created_at,
      updated_at
    )
    VALUES (
      auth_user_id,
      'meyouvideos@gmail.com',
      'Signup Chat Account',
      'pro',
      1000,  -- Starting coins
      100,   -- Starting energy
      true,  -- Skip onboarding
      now(),
      now()
    );
    
    RAISE NOTICE '✅ Profile created for meyouvideos@gmail.com';
  ELSE
    RAISE NOTICE 'Profile already exists for meyouvideos@gmail.com';
  END IF;
END $$;
```

**Important:** You still need to create the auth user first. The easiest way is to:
1. Use the signup page to create the account
2. Or use Supabase Auth Dashboard → Users → Add User

### Option 3: Update RPC Function to Use Existing User

If you want to use a different existing user account, update the RPC function:

```sql
CREATE OR REPLACE FUNCTION get_signup_chat_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_chat_user_id UUID;
BEGIN
  -- Change this email to an existing user's email
  SELECT id INTO signup_chat_user_id
  FROM profiles
  WHERE email = 'YOUR_EXISTING_EMAIL@gmail.com'  -- Replace with actual email
  LIMIT 1;

  IF signup_chat_user_id IS NULL THEN
    RAISE EXCEPTION 'Signup chat user not found';
  END IF;

  RETURN signup_chat_user_id;
END;
$$;
```

## 🧪 Verify

After creating the account, verify it works:

```sql
-- Check if user exists
SELECT id, email, full_name, subscription_tier
FROM profiles
WHERE email = 'meyouvideos@gmail.com';
```

You should see the user record.

## 📝 After Setup

1. Refresh the signup page
2. Open browser console (F12)
3. Click the chat button
4. You should see: `[SignupChat] ✅ Found signup chat user via RPC function: [uuid]`
5. Try sending a message - it should work!

---

**Status:** User account needs to be created first!




