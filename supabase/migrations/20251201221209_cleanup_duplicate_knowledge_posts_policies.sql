/*
  # Cleanup Duplicate Knowledge Posts Policies

  1. Problem
    - Multiple overlapping RLS policies on company_knowledge_posts
    - May cause conflicts or confusion

  2. Solution
    - Keep only the admin-based policies
    - Remove old policies

  3. Security
    - Maintains admin-only access
    - No security degradation
*/

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "knowledge_posts_read_published" ON company_knowledge_posts;
DROP POLICY IF EXISTS "knowledge_posts_super_admin_all" ON company_knowledge_posts;

-- Verify RLS is enabled
ALTER TABLE company_knowledge_posts ENABLE ROW LEVEL SECURITY;

-- The admin policies from previous migration are sufficient:
-- - Admins can view all knowledge posts (SELECT)
-- - Admins can create knowledge posts (INSERT)
-- - Admins can update knowledge posts (UPDATE)
-- - Admins can delete knowledge posts (DELETE)

COMMENT ON TABLE company_knowledge_posts IS 'Knowledge posts managed by admins only. Uses is_admin_user() function to check permissions without recursion.';
