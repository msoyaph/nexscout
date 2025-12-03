/*
  # Remove Unused Indexes - Batch 4 Fixed
  
  1. Index Cleanup
    - Remove unused indexes (skip unique constraints)
  
  2. Indexes Removed
    - Library and deck indexes
    - Task and message indexes
    - Subscription and payment indexes
  
  3. Performance Impact
    - Final cleanup of truly unused indexes
*/

-- AI task and library indexes
DROP INDEX IF EXISTS idx_ai_tasks_prospect_id;
DROP INDEX IF EXISTS idx_ai_messages_library_prospect_id;
DROP INDEX IF EXISTS idx_ai_messages_library_user_id;

-- Pitch deck indexes
DROP INDEX IF EXISTS idx_pitch_decks_prospect_id;

-- Training data indexes
DROP INDEX IF EXISTS idx_public_chatbot_training_user;

-- Subscription retention indexes
DROP INDEX IF EXISTS idx_retention_offers_user_id;
DROP INDEX IF EXISTS idx_retention_offers_accepted;

-- Additional unused indexes
DROP INDEX IF EXISTS idx_user_energy_token_reset;
DROP INDEX IF EXISTS idx_energy_purchases_user_id;
DROP INDEX IF EXISTS idx_chatbot_configurations_user_id;
DROP INDEX IF EXISTS idx_ai_usage_logs_user_id;
DROP INDEX IF EXISTS idx_payment_history_subscription_id;
