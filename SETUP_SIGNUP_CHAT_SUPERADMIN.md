# Setup Signup Page Chat - SuperAdmin Configuration

## 🔴 Issue

The signup page chat is not working because it cannot find the SuperAdmin user ID. The error shows:
```
[SignupChat] SuperAdmin not found: null
```

## ✅ Solution

You need to create a `chatbot_link` entry for the SuperAdmin user with `chatbot_id = 'signup-page-chat'`.

## 🚀 Quick Fix (SQL)

Run this in Supabase SQL Editor:

```sql
-- Step 1: Get SuperAdmin user ID
DO $$
DECLARE
  superadmin_user_id uuid;
BEGIN
  -- Get SuperAdmin user ID by email
  SELECT id INTO superadmin_user_id
  FROM profiles
  WHERE email = 'geoffmax22@gmail.com'
  LIMIT 1;

  IF superadmin_user_id IS NULL THEN
    RAISE EXCEPTION 'SuperAdmin user not found. Please check email: geoffmax22@gmail.com';
  END IF;

  -- Create or update chatbot_link for signup page chat
  INSERT INTO chatbot_links (
    user_id,
    chatbot_id,
    is_active,
    created_at
  )
  VALUES (
    superadmin_user_id,
    'signup-page-chat',
    true,
    now()
  )
  ON CONFLICT (chatbot_id)
  DO UPDATE SET
    user_id = superadmin_user_id,
    is_active = true,
    last_used_at = now();

  RAISE NOTICE '✅ Chatbot link created for SuperAdmin: %', superadmin_user_id;
END $$;
```

## ✅ Verify

After running the SQL, verify it worked:

```sql
-- Check the chatbot_link was created
SELECT 
  cl.user_id,
  cl.chatbot_id,
  cl.is_active,
  p.email
FROM chatbot_links cl
JOIN profiles p ON p.id = cl.user_id
WHERE cl.chatbot_id = 'signup-page-chat';
```

You should see:
- `user_id`: SuperAdmin's UUID
- `chatbot_id`: 'signup-page-chat'
- `is_active`: true
- `email`: 'geoffmax22@gmail.com'

## 🧪 Test

1. Open the signup page
2. Click the chat button
3. Check browser console - should see: `[SignupChat] ✅ Found SuperAdmin via RPC: [user-id]`
4. Try sending a message - should work!

## 🔄 Alternative: Use Existing Chatbot ID

If SuperAdmin already has a chatbot_id, you can use that instead:

```sql
-- Find SuperAdmin's existing chatbot_id
SELECT 
  cl.chatbot_id,
  cl.custom_slug,
  p.email
FROM chatbot_links cl
JOIN profiles p ON p.id = cl.user_id
WHERE p.email = 'geoffmax22@gmail.com'
AND cl.is_active = true;
```

Then update the code to use that chatbot_id instead of 'signup-page-chat'.

---

**Status:** Ready to fix - just run the SQL above!




