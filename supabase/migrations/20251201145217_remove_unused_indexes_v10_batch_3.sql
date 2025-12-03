/*
  # Remove Unused Indexes - Batch 3
  
  1. Index Cleanup
    - Remove unused indexes on chatbot and pricing tables
  
  2. Indexes Removed
    - Chatbot message indexes
    - Surge pricing indexes
    - AI cluster indexes
    - User pricing profile indexes
  
  3. Performance Impact
    - Reduces write overhead
*/

-- Chatbot indexes
DROP INDEX IF EXISTS idx_chatbot_messages_created;
DROP INDEX IF EXISTS idx_chatbot_messages_conversation;
DROP INDEX IF EXISTS idx_chatbot_conversations_user;
DROP INDEX IF EXISTS idx_chatbot_training_category;

-- Surge pricing indexes
DROP INDEX IF EXISTS idx_surge_windows_active;
DROP INDEX IF EXISTS idx_surge_windows_time;

-- AI cluster indexes
DROP INDEX IF EXISTS idx_cluster_status_provider;
DROP INDEX IF EXISTS idx_cluster_status_updated;

-- User pricing indexes
DROP INDEX IF EXISTS idx_pricing_profile_tier;
DROP INDEX IF EXISTS idx_pricing_profile_user;

-- User efficiency indexes
DROP INDEX IF EXISTS idx_efficiency_profiles_user;
