/*
  # Cleanup Duplicate Slug Triggers

  1. Problem
    - Two duplicate triggers for slug generation on company_knowledge_posts
    - Two similar functions doing the same thing
    
  2. Solution
    - Keep the better function (generate_knowledge_post_slug)
    - Remove duplicate trigger and function
    
  3. Security
    - No security impact
    - Maintains functionality
*/

-- Drop the duplicate trigger
DROP TRIGGER IF EXISTS generate_post_slug_trigger ON company_knowledge_posts;

-- Drop the duplicate function
DROP FUNCTION IF EXISTS generate_post_slug();

-- Ensure the correct trigger exists
DROP TRIGGER IF EXISTS ensure_knowledge_post_slug ON company_knowledge_posts;
CREATE TRIGGER ensure_knowledge_post_slug
  BEFORE INSERT OR UPDATE ON company_knowledge_posts
  FOR EACH ROW
  EXECUTE FUNCTION generate_knowledge_post_slug();

COMMENT ON TRIGGER ensure_knowledge_post_slug ON company_knowledge_posts IS 'Auto-generates slug from title/company_name before insert or update';