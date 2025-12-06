/*
  # Add Missing Foreign Key Indexes - Final Batch

  1. Performance Enhancement
    - Add indexes for the last 14 unindexed foreign keys
    
  2. Indexes Added
    - File: file_documents
    - Follow-up: follow_up_sequences
    - Training: training_video_modules
    - Twitter: twitter_insights
    - Upgrade: upgrade_prompt_views
    - User: user_activity_logs, user_library
    - Video: video_pitch_scripts
    - Viral: viral_referral_conversions, viral_share_messages, viral_video_scripts
    - Voice: voice_note_analyses
*/

-- File document indexes
CREATE INDEX IF NOT EXISTS idx_file_documents_file_id ON file_documents(file_id);
CREATE INDEX IF NOT EXISTS idx_file_documents_user_id ON file_documents(user_id);

-- Follow-up sequence indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id ON follow_up_sequences(prospect_id);

-- Training indexes
CREATE INDEX IF NOT EXISTS idx_training_video_modules_user_id ON training_video_modules(user_id);

-- Twitter indexes
CREATE INDEX IF NOT EXISTS idx_twitter_insights_user_id ON twitter_insights(user_id);

-- Upgrade indexes
CREATE INDEX IF NOT EXISTS idx_upgrade_prompt_views_user_id ON upgrade_prompt_views(user_id);

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);

-- User library indexes
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON user_library(user_id);

-- Video pitch indexes
CREATE INDEX IF NOT EXISTS idx_video_pitch_scripts_user_id ON video_pitch_scripts(user_id);

-- Viral indexes
CREATE INDEX IF NOT EXISTS idx_viral_referral_conversions_share_event_id ON viral_referral_conversions(share_event_id);
CREATE INDEX IF NOT EXISTS idx_viral_share_messages_user_id ON viral_share_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_video_scripts_user_id ON viral_video_scripts(user_id);

-- Voice note indexes
CREATE INDEX IF NOT EXISTS idx_voice_note_analyses_prospect_id ON voice_note_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_voice_note_analyses_user_id ON voice_note_analyses(user_id);
