/*
  # Remove Unused Indexes - Batch 2
  
  1. Index Cleanup
    - Remove unused indexes on company and user tables
  
  2. Indexes Removed
    - Company crawl event indexes
    - Company style rules indexes
    - User energy pattern indexes
    - Company embeddings indexes
  
  3. Performance Impact
    - Reduces index maintenance overhead
*/

-- Company crawl indexes
DROP INDEX IF EXISTS idx_company_crawl_events_user_id;
DROP INDEX IF EXISTS idx_company_crawl_history_user_id;

-- Company AI style indexes
DROP INDEX IF EXISTS idx_company_ai_style_rules_company_id;
DROP INDEX IF EXISTS idx_company_ai_style_rules_user_id;

-- User energy indexes
DROP INDEX IF EXISTS idx_user_energy_patterns_user;

-- Company embeddings indexes
DROP INDEX IF EXISTS idx_company_embeddings_source;
DROP INDEX IF EXISTS idx_company_embeddings_asset_id;
DROP INDEX IF EXISTS idx_company_embeddings_company_id;

-- Company multi-site indexes
DROP INDEX IF EXISTS idx_company_multi_site_data_user_id;
DROP INDEX IF EXISTS idx_company_multi_site_data_company_platform;
