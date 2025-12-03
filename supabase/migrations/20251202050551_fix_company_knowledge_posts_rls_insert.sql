/*
  # Fix Company Knowledge Posts RLS for INSERT Operations

  1. Problem
    - INSERT operations failing with RLS policy violation
    - WITH CHECK clause not properly evaluating for admin users
    - Need to ensure created_by and updated_by are automatically set
    
  2. Solution
    - Fix RLS policies to properly allow admin INSERT operations
    - Add trigger to auto-set created_by and updated_by fields
    - Ensure is_admin_user() function works correctly in WITH CHECK context
    
  3. Security
    - Maintains admin-only access
    - Auto-sets audit fields for tracking
    - No security degradation
*/

-- Drop existing INSERT policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Admins can create knowledge posts" ON company_knowledge_posts;

-- Recreate INSERT policy with explicit WITH CHECK that works
CREATE POLICY "Admins can create knowledge posts"
  ON company_knowledge_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate UPDATE policy to ensure it works properly
DROP POLICY IF EXISTS "Admins can update knowledge posts" ON company_knowledge_posts;

CREATE POLICY "Admins can update knowledge posts"
  ON company_knowledge_posts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM admin_users 
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- Create function to auto-set created_by and updated_by
CREATE OR REPLACE FUNCTION set_knowledge_post_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT, set created_by
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := (SELECT auth.uid());
    NEW.updated_by := (SELECT auth.uid());
  END IF;
  
  -- On UPDATE, set updated_by
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by := (SELECT auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-set audit fields
DROP TRIGGER IF EXISTS set_knowledge_post_audit_fields_trigger ON company_knowledge_posts;
CREATE TRIGGER set_knowledge_post_audit_fields_trigger
  BEFORE INSERT OR UPDATE ON company_knowledge_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_knowledge_post_audit_fields();

-- Add comment
COMMENT ON FUNCTION set_knowledge_post_audit_fields IS 'Automatically sets created_by and updated_by fields for knowledge posts';
COMMENT ON POLICY "Admins can create knowledge posts" ON company_knowledge_posts IS 'Allows authenticated users who are in admin_users table to insert posts';
COMMENT ON POLICY "Admins can update knowledge posts" ON company_knowledge_posts IS 'Allows authenticated users who are in admin_users table to update posts';