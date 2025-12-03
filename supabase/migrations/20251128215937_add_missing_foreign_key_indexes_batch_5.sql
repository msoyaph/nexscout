/*
  # Add Missing Foreign Key Indexes - Batch 5

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in conversation, coaching, and closing systems
    
  2. Indexes Added
    - Closing: closing_stage_progressions
    - Coaching: coaching_sessions, coaching_feedback
    - Conversation: conversation_analyses, conversation_analytics, conversation_intelligence_events
    - Conversion: conversion_path_predictions
    - Crawler: crawler_logs
    - CSV: csv_validation_logs
*/

-- Closing system indexes
CREATE INDEX IF NOT EXISTS idx_closing_stage_progressions_user_id ON closing_stage_progressions(user_id);

-- Coaching system indexes
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_downline_member_id ON coaching_sessions(downline_member_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_leader_user_id ON coaching_sessions(leader_user_id);

-- Contact behavior indexes
CREATE INDEX IF NOT EXISTS idx_contact_behavior_timeline_user_id ON contact_behavior_timeline(user_id);

-- Conversation system indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_prospect_id ON conversation_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_id ON conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_prospect_id ON conversation_analytics(prospect_id);
CREATE INDEX IF NOT EXISTS idx_conversation_intelligence_events_conversation_id ON conversation_intelligence_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_intelligence_events_user_id ON conversation_intelligence_events(user_id);

-- Conversion system indexes
CREATE INDEX IF NOT EXISTS idx_conversion_path_predictions_user_id ON conversion_path_predictions(user_id);

-- Crawler indexes
CREATE INDEX IF NOT EXISTS idx_crawler_logs_intelligence_id ON crawler_logs(intelligence_id);

-- CSV validation indexes
CREATE INDEX IF NOT EXISTS idx_csv_validation_logs_user_id ON csv_validation_logs(user_id);
