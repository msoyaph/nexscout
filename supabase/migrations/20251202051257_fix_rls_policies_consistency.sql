/*
  # Fix RLS Policies Consistency for company_knowledge_posts

  1. Problem
    - Mixed policy types: some use is_admin_user(), some use direct subquery
    - is_admin_user() requires parameter but RLS policies call it without args
    - Inconsistent approach causing confusion and potential failures
    
  2. Solution
    - Use consistent approach across all policies
    - Use direct subquery pattern that definitely works
    - Ensure all policies check admin_users table properly
    
  3. Security
    - Maintains admin-only access
    - More reliable and predictable behavior
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can create knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can update knowledge posts" ON company_knowledge_posts;
DROP POLICY IF EXISTS "Admins can delete knowledge posts" ON company_knowledge_posts;

-- Create consistent policies using direct subquery pattern
-- This pattern is most reliable and doesn't depend on function behavior

-- SELECT policy
CREATE POLICY "Admins can view all knowledge posts"
  ON company_knowledge_posts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "Admins can create knowledge posts"
  ON company_knowledge_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "Admins can update knowledge posts"
  ON company_knowledge_posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "Admins can delete knowledge posts"
  ON company_knowledge_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Verify RLS is enabled
ALTER TABLE company_knowledge_posts ENABLE ROW LEVEL SECURITY;

-- Add helpful comments
COMMENT ON POLICY "Admins can view all knowledge posts" ON company_knowledge_posts IS 'Allows users in admin_users table to view all posts';
COMMENT ON POLICY "Admins can create knowledge posts" ON company_knowledge_posts IS 'Allows users in admin_users table to create posts';
COMMENT ON POLICY "Admins can update knowledge posts" ON company_knowledge_posts IS 'Allows users in admin_users table to update posts';
COMMENT ON POLICY "Admins can delete knowledge posts" ON company_knowledge_posts IS 'Allows users in admin_users table to delete posts';