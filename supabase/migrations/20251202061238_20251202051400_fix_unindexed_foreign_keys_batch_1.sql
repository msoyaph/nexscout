/*
  # Fix Unindexed Foreign Keys - Batch 1

  1. Performance Optimization
    - Add indexes for foreign key columns to improve query performance
  
  2. Affected Tables
    - `prospect_feature_vectors` - Add index on user_id
    - `user_activation_checklist` - Add index on checklist_item_id
    - `user_aha_moments` - Add index on aha_moment_id
    - `user_badges` - Add index on badge_id
    - `user_company_links` - Add index on company_id
    - `user_sequence_assignments` - Add index on sequence_id
  
  3. Security & Performance
    - Improves join performance for foreign key relationships
    - Essential for RLS policy performance
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_prospect_feature_vectors_user_id 
  ON prospect_feature_vectors(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activation_checklist_checklist_item_id 
  ON user_activation_checklist(checklist_item_id);

CREATE INDEX IF NOT EXISTS idx_user_aha_moments_aha_moment_id 
  ON user_aha_moments(aha_moment_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id 
  ON user_badges(badge_id);

CREATE INDEX IF NOT EXISTS idx_user_company_links_company_id 
  ON user_company_links(company_id);

CREATE INDEX IF NOT EXISTS idx_user_sequence_assignments_sequence_id 
  ON user_sequence_assignments(sequence_id);
