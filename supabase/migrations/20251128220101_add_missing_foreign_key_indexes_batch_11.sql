/*
  # Add Missing Foreign Key Indexes - Batch 11

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in persona, personality, and pitch systems
    
  2. Indexes Added
    - Persona: persona_learning_logs
    - Personality: personality_profiles
    - Pitch: pitch_angle_recommendations
    - Platform: platform_sync_logs
    - Processing: processing_queue
    - Product: product_recommendation_history
    - Prompt: prompt_rewrite_cache
*/

-- Persona indexes
CREATE INDEX IF NOT EXISTS idx_persona_learning_logs_user_id ON persona_learning_logs(user_id);

-- Personality indexes
CREATE INDEX IF NOT EXISTS idx_personality_profiles_prospect_id ON personality_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_personality_profiles_user_id ON personality_profiles(user_id);

-- Pitch indexes
CREATE INDEX IF NOT EXISTS idx_pitch_angle_recommendations_prospect_id ON pitch_angle_recommendations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pitch_angle_recommendations_user_id ON pitch_angle_recommendations(user_id);

-- Platform indexes
CREATE INDEX IF NOT EXISTS idx_platform_sync_logs_user_id ON platform_sync_logs(user_id);

-- Processing queue indexes
CREATE INDEX IF NOT EXISTS idx_processing_queue_candidate_id ON processing_queue(candidate_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_session_id ON processing_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_user_id ON processing_queue(user_id);

-- Product recommendation indexes
CREATE INDEX IF NOT EXISTS idx_product_recommendation_history_conversation_id ON product_recommendation_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_product_recommendation_history_user_id ON product_recommendation_history(user_id);

-- Prompt cache indexes
CREATE INDEX IF NOT EXISTS idx_prompt_rewrite_cache_user_id ON prompt_rewrite_cache(user_id);
