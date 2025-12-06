-- ⚡ FIX INFINITE RECURSION + CREATE SUPERADMIN

-- STEP 1: Fix admin_users infinite recursion
-- The problem: RLS policies on admin_users check admin_users (circular!)

-- Drop all policies on admin_users
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view their own record" ON admin_users;

-- Create simple, non-recursive policies
CREATE POLICY "Anyone can read admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage admin_users"
  ON admin_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- STEP 2: Create SuperAdmin account for geoffmax22@gmail.com

-- First, check if user exists
DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'geoffmax22@gmail.com';
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found. Please sign up first with this email, then run this script again.', v_email;
  END IF;

  RAISE NOTICE 'Found user: % (ID: %)', v_email, v_user_id;

  -- Create or update admin_users record
  INSERT INTO admin_users (
    user_id,
    is_super_admin,
    is_admin
  ) VALUES (
    v_user_id,
    true,  -- SuperAdmin!
    true   -- Also admin
  )
  ON CONFLICT (user_id) DO UPDATE
  SET is_super_admin = true,
      is_admin = true;

  RAISE NOTICE '✅ SuperAdmin account created for %!', v_email;
  RAISE NOTICE 'You now have full access to Data Feeder, Power Mode, and all admin features!';

END $$;

-- STEP 3: Verify
SELECT 
  au.user_id,
  u.email,
  au.is_super_admin,
  au.is_admin,
  au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE u.email = 'geoffmax22@gmail.com';

