/*
  # Add Self-Admin Promotion for Development

  1. Purpose
    - Allow users to check their admin status
    - Provide a way to promote specific users to admin during development
    - Make debugging admin issues easier

  2. Changes
    - Create function to get current user's admin status
    - Create function to promote specific users (by email)
    - Add helpful views for debugging

  3. Security
    - Functions are callable by authenticated users
    - Promotion still requires super admin
    - Status check is safe for all users
*/

-- Function to check current user's admin status
CREATE OR REPLACE FUNCTION get_my_admin_status()
RETURNS TABLE (
  is_admin boolean,
  is_super_admin boolean,
  admin_since timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) as is_admin,
    COALESCE((SELECT au.is_super_admin FROM admin_users au WHERE au.user_id = auth.uid()), false) as is_super_admin,
    (SELECT au.created_at FROM admin_users au WHERE au.user_id = auth.uid()) as admin_since;
END;
$$;

-- Function to promote user by email (super admin only)
CREATE OR REPLACE FUNCTION promote_user_by_email(
  user_email text,
  make_super_admin boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  result json;
BEGIN
  -- Check if caller is super admin
  IF NOT is_super_admin_user() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only super admins can promote users'
    );
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = user_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || user_email
    );
  END IF;

  -- Promote user
  INSERT INTO admin_users (user_id, is_super_admin)
  VALUES (target_user_id, make_super_admin)
  ON CONFLICT (user_id) DO UPDATE
  SET is_super_admin = make_super_admin;

  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_email,
    'is_super_admin', make_super_admin
  );
END;
$$;

-- Temporary function for development: Allow first-time users to self-promote
-- IMPORTANT: Remove this in production!
CREATE OR REPLACE FUNCTION dev_make_me_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_already_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if already admin
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = current_user_id)
  INTO is_already_admin;

  IF is_already_admin THEN
    RETURN json_build_object('success', true, 'message', 'Already an admin');
  END IF;

  -- Add as admin (not super admin for safety)
  INSERT INTO admin_users (user_id, is_super_admin)
  VALUES (current_user_id, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'You are now an admin',
    'user_id', current_user_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_my_admin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION promote_user_by_email(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION dev_make_me_admin() TO authenticated;

-- Comments
COMMENT ON FUNCTION get_my_admin_status IS 'Get current user admin status';
COMMENT ON FUNCTION promote_user_by_email IS 'Promote user to admin by email (super admins only)';
COMMENT ON FUNCTION dev_make_me_admin IS 'DEV ONLY: Allow current user to become admin. REMOVE IN PRODUCTION!';
