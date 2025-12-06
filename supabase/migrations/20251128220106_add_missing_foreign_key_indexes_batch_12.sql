/*
  # Add Missing Foreign Key Indexes - Batch 12

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in prospect systems
    
  2. Indexes Added
    - Prospect behavior: prospect_behavior_summary
    - Prospect channel: prospect_channel_connections
    - Prospect memory: prospect_memory_cache
    - Prospect platform: prospect_platform_sources
    - Prospect profiles: prospect_profiles
    - Prospect purchase: prospect_purchase_paths
    - Prospect qualification: prospect_qualification_profiles, prospect_qualifications
    - Prospect sentiment: prospect_sentiment_history
*/

-- Prospect behavior indexes
CREATE INDEX IF NOT EXISTS idx_prospect_behavior_summary_user_id ON prospect_behavior_summary(user_id);

-- Prospect channel indexes
CREATE INDEX IF NOT EXISTS idx_prospect_channel_connections_user_id ON prospect_channel_connections(user_id);

-- Prospect memory indexes
CREATE INDEX IF NOT EXISTS idx_prospect_memory_cache_user_id ON prospect_memory_cache(user_id);

-- Prospect platform indexes
CREATE INDEX IF NOT EXISTS idx_prospect_platform_sources_user_id ON prospect_platform_sources(user_id);

-- Prospect profile indexes
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_user_id ON prospect_profiles(user_id);

-- Prospect purchase indexes
CREATE INDEX IF NOT EXISTS idx_prospect_purchase_paths_user_id ON prospect_purchase_paths(user_id);

-- Prospect qualification indexes
CREATE INDEX IF NOT EXISTS idx_prospect_qualification_profiles_session_id ON prospect_qualification_profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_prospect_qualification_profiles_user_id ON prospect_qualification_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_qualifications_prospect_id ON prospect_qualifications(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_qualifications_user_id ON prospect_qualifications(user_id);

-- Prospect sentiment indexes
CREATE INDEX IF NOT EXISTS idx_prospect_sentiment_history_conversation_id ON prospect_sentiment_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_prospect_sentiment_history_user_id ON prospect_sentiment_history(user_id);
