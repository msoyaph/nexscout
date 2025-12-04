/*
  # Remove Unused Indexes - Batch 1
  
  1. Index Cleanup
    - Remove indexes with zero scans (never used)
    - Focuses on large vector indexes and search indexes
  
  2. Indexes Removed
    - Vector embedding indexes (1608 kB each)
    - JSONB indexes on chatbot_settings
    - Array indexes on training data
    - Search indexes
  
  3. Performance Impact
    - Reduces storage usage
    - Improves write performance
    - Can be recreated if needed
*/

-- Large vector indexes (1608 kB each)
DROP INDEX IF EXISTS idx_embed_vector;
DROP INDEX IF EXISTS idx_file_intel_chunks_embedding;
DROP INDEX IF EXISTS idx_context_embedding;
DROP INDEX IF EXISTS idx_kg_v2_embedding;

-- JSONB and Array indexes
DROP INDEX IF EXISTS idx_chatbot_settings_integrations;
DROP INDEX IF EXISTS idx_public_chatbot_training_tags;
DROP INDEX IF EXISTS idx_kg_v2_layers;

-- Search and tag indexes
DROP INDEX IF EXISTS idx_admin_companies_search;
DROP INDEX IF EXISTS idx_admin_companies_tags;
DROP INDEX IF EXISTS idx_admin_products_search;
DROP INDEX IF EXISTS idx_public_chatbot_training_category;
