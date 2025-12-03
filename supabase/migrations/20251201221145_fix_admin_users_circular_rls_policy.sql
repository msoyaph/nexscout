/*
  # Fix Admin Users Circular RLS Policy

  1. Problem
    - The admin_users table has a circular RLS policy
    - Policy checks if user exists in admin_users by querying admin_users
    - This creates infinite recursion when inserting/updating data

  2. Solution
    - Remove the circular policy
    - Create a security definer function to check admin status
    - Use the function in RLS policies to avoid recursion

  3. Security
    - Only allow authenticated users
    - Check admin status via function (no recursion)
    - Maintain proper access control
*/

-- Drop the problematic circular policy
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Create a security definer function to check if user is admin
-- This function can safely query admin_users without triggering RLS
CREATE OR REPLACE FUNCTION is_admin_user(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use provided user_id or current user
  v_user_id := COALESCE(check_user_id, auth.uid());
  
  -- Check if user exists in admin_users table
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = v_user_id
  );
END;
$$;

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin_user(check_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use provided user_id or current user
  v_user_id := COALESCE(check_user_id, auth.uid());
  
  -- Check if user is super admin
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE user_id = v_user_id
    AND is_super_admin = true
  );
END;
$$;

-- Now create proper RLS policies using the functions
CREATE POLICY "Admins can read admin users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Super admins can insert admin users"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin_user());

CREATE POLICY "Super admins can update admin users"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (is_super_admin_user())
  WITH CHECK (is_super_admin_user());

CREATE POLICY "Super admins can delete admin users"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (is_super_admin_user());

-- Fix company_knowledge_posts RLS policies to use the helper function
DROP POLICY IF EXISTS "Admins can manage knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can view knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can create knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can update knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can delete knowledge posts" ON company_knowledge_posts;

-- Create proper policies for company_knowledge_posts
CREATE POLICY "Admins can view all knowledge posts"
  ON company_knowledge_posts
  FOR SELECT
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can create knowledge posts"
  ON company_knowledge_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update knowledge posts"
  ON company_knowledge_posts
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete knowledge posts"
  ON company_knowledge_posts
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Comments
COMMENT ON FUNCTION is_admin_user IS 'Check if user is an admin without causing RLS recursion';
COMMENT ON FUNCTION is_super_admin_user IS 'Check if user is a super admin without causing RLS recursion';
