/*
  # Add Admin Debug Helper Functions

  1. Purpose
    - Help users debug admin access issues
    - Provide clear feedback on admin status
    - Make it easy to verify setup
    
  2. Functions
    - debug_admin_access: Shows detailed admin status
    - verify_can_save_post: Tests if user can save a post
    
  3. Security
    - Read-only debug functions
    - Safe for all authenticated users to call
*/

-- Debug function to show admin status in detail
CREATE OR REPLACE FUNCTION debug_admin_access()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  is_in_admin_users boolean;
  is_super_admin boolean;
  admin_count integer;
  result json;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Not authenticated',
      'message', 'You must be logged in to check admin status'
    );
  END IF;

  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;

  -- Check if in admin_users
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = current_user_id
  ) INTO is_in_admin_users;

  -- Check if super admin
  SELECT COALESCE(au.is_super_admin, false)
  INTO is_super_admin
  FROM admin_users au
  WHERE au.user_id = current_user_id;

  -- Count total admins
  SELECT COUNT(*) INTO admin_count FROM admin_users;

  RETURN json_build_object(
    'success', true,
    'user_id', current_user_id,
    'email', user_email,
    'is_admin', is_in_admin_users,
    'is_super_admin', COALESCE(is_super_admin, false),
    'total_admins', admin_count,
    'can_access_data_feeder', is_in_admin_users,
    'message', CASE 
      WHEN is_in_admin_users THEN 'You have admin access ✓'
      ELSE 'You need admin access. Click "Make Me Admin" button.'
    END
  );
END;
$$;

-- Function to test if user can save a post
CREATE OR REPLACE FUNCTION verify_can_save_post()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_in_admin_users boolean;
  test_passed boolean;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'can_save', false,
      'error', 'Not authenticated'
    );
  END IF;

  -- Check if in admin_users
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = current_user_id
  ) INTO is_in_admin_users;

  -- Test if RLS policy would pass
  test_passed := EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = current_user_id
  );

  RETURN json_build_object(
    'can_save', test_passed,
    'is_admin', is_in_admin_users,
    'user_id', current_user_id,
    'message', CASE 
      WHEN test_passed THEN 'You can save posts ✓'
      ELSE 'Admin access required. Click "Make Me Admin" button first.'
    END
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION debug_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION verify_can_save_post() TO authenticated;

-- Add comments
COMMENT ON FUNCTION debug_admin_access IS 'Debug helper: Shows detailed admin status for current user';
COMMENT ON FUNCTION verify_can_save_post IS 'Debug helper: Tests if current user can save knowledge posts';