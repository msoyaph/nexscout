/*
  # Setup Initial Super Admin

  1. Problem
    - admin_users table is empty
    - No one can access admin features or publish knowledge posts
    - RLS policies require admin status but no admins exist

  2. Solution
    - Add first registered user as super admin
    - Create helper function to promote users to admin
    - Create helper function to check if any admins exist

  3. Security
    - Only super admins can promote other users
    - First user auto-promotion only happens if no admins exist
*/

-- Function to check if any admins exist
CREATE OR REPLACE FUNCTION has_any_admins()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users LIMIT 1);
$$;

-- Function to promote user to admin (only super admins can call this)
CREATE OR REPLACE FUNCTION promote_user_to_admin(
  target_user_id uuid,
  make_super_admin boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super admin (unless no admins exist yet)
  IF has_any_admins() AND NOT is_super_admin_user() THEN
    RAISE EXCEPTION 'Only super admins can promote users to admin';
  END IF;

  -- Insert or update admin status
  INSERT INTO admin_users (user_id, is_super_admin)
  VALUES (target_user_id, make_super_admin)
  ON CONFLICT (user_id) DO UPDATE
  SET is_super_admin = make_super_admin;

  RETURN true;
END;
$$;

-- Function to auto-setup first super admin (only if no admins exist)
CREATE OR REPLACE FUNCTION setup_first_super_admin()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Only run if no admins exist
  IF has_any_admins() THEN
    RAISE EXCEPTION 'Admins already exist. Use promote_user_to_admin() instead.';
  END IF;

  -- Get first registered user
  SELECT id INTO first_user_id
  FROM profiles
  ORDER BY created_at ASC
  LIMIT 1;

  IF first_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in profiles table';
  END IF;

  -- Make them super admin
  INSERT INTO admin_users (user_id, is_super_admin)
  VALUES (first_user_id, true);

  RETURN first_user_id;
END;
$$;

-- Setup first super admin if no admins exist
DO $$
DECLARE
  first_admin_id uuid;
BEGIN
  IF NOT has_any_admins() THEN
    first_admin_id := setup_first_super_admin();
    RAISE NOTICE 'Created first super admin: %', first_admin_id;
  END IF;
END;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION has_any_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin_user(uuid) TO authenticated;

-- Comments
COMMENT ON FUNCTION has_any_admins IS 'Check if any admin users exist in the system';
COMMENT ON FUNCTION promote_user_to_admin IS 'Promote a user to admin status (super admins only)';
COMMENT ON FUNCTION setup_first_super_admin IS 'Auto-setup first user as super admin (only if no admins exist)';
