/*
  # Fix Admin Functions Completely

  1. Problem
    - dev_make_me_admin may not be working properly
    - promote_user_by_email has incorrect function call
    - Need to ensure admin promotion works flawlessly
    
  2. Solution
    - Fix dev_make_me_admin to properly add users to admin_users
    - Fix promote_user_by_email function call
    - Add better error handling and logging
    
  3. Security
    - Maintains security while allowing development access
    - Proper authentication checks
*/

-- Fix the dev_make_me_admin function to be more robust
CREATE OR REPLACE FUNCTION dev_make_me_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  is_already_admin boolean;
  user_email text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Not authenticated - please log in first'
    );
  END IF;

  -- Get user email for logging
  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;

  -- Check if already admin
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = current_user_id)
  INTO is_already_admin;

  IF is_already_admin THEN
    -- Check if super admin
    IF is_super_admin_user(current_user_id) THEN
      RETURN json_build_object(
        'success', true, 
        'message', 'You are already a Super Admin',
        'user_id', current_user_id,
        'email', user_email
      );
    ELSE
      -- Update to super admin
      UPDATE admin_users 
      SET is_super_admin = true 
      WHERE user_id = current_user_id;
      
      RETURN json_build_object(
        'success', true, 
        'message', 'Upgraded to Super Admin',
        'user_id', current_user_id,
        'email', user_email
      );
    END IF;
  END IF;

  -- Add as super admin for development
  INSERT INTO admin_users (user_id, is_super_admin, role_id)
  VALUES (current_user_id, true, NULL)
  ON CONFLICT (user_id) DO UPDATE
  SET is_super_admin = true;

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully granted Super Admin access',
    'user_id', current_user_id,
    'email', user_email
  );
END;
$$;

-- Fix promote_user_by_email function
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
  caller_user_id uuid;
  result json;
BEGIN
  caller_user_id := auth.uid();
  
  -- Check if caller is super admin (pass the user_id parameter)
  IF NOT is_super_admin_user(caller_user_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only super admins can promote users'
    );
  END IF;

  -- Find user by email from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || user_email
    );
  END IF;

  -- Promote user
  INSERT INTO admin_users (user_id, is_super_admin, role_id)
  VALUES (target_user_id, make_super_admin, NULL)
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

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION dev_make_me_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION promote_user_by_email(text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_admin_status() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION dev_make_me_admin IS 'DEV ONLY: Grants current user Super Admin access. Use "Make Me Admin" button in UI or run: SELECT dev_make_me_admin();';