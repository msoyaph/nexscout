/*
  # Fix Critical Unindexed Foreign Keys - Batch 1

  1. Performance Issues
    - Add indexes on frequently-queried foreign keys
    - Focus on high-traffic tables (AI engines, productivity, core features)
  
  2. Tables Covered
    - AI productivity system tables
    - Calendar, reminders, todos
    - User-related foreign keys
    - Prospect-related foreign keys
*/

-- AI Productivity System
CREATE INDEX IF NOT EXISTS idx_reminders_company_id ON reminders(company_id);
CREATE INDEX IF NOT EXISTS idx_todos_company_id ON todos(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_id ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_team_events_calendar_event_id ON team_events(calendar_event_id);

-- Core prospect and user relationships
CREATE INDEX IF NOT EXISTS idx_ai_alerts_prospect_id ON ai_alerts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_prospect_id ON ai_tasks(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_prospect_id ON ai_generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_user_id ON ai_generated_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_prospect_id ON ai_generations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id ON ai_generations(user_id);

-- Chatbot and conversation systems
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_prospect_id ON ai_closer_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_user_id ON ai_closer_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_prospect_id ON ai_conversation_states(prospect_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_session_id ON chatbot_visitors(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_visitors_user_id ON chatbot_visitors(user_id);

-- Message and sequence systems
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_prospect_id ON ai_message_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_library_prospect_id ON ai_messages_library(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_library_user_id ON ai_messages_library(user_id);
CREATE INDEX IF NOT EXISTS idx_message_sequences_prospect_id ON message_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_message_sequences_user_id ON message_sequences(user_id);

-- Follow-up and reminder systems
CREATE INDEX IF NOT EXISTS idx_ai_follow_up_sequences_user_id ON ai_follow_up_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_follow_up_sequences_user_id ON adaptive_follow_up_sequences(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id ON follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_user_id ON follow_up_sequences(user_id);

-- Pipeline and events
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_changes_prospect_id ON pipeline_stage_changes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage_changes_user_id ON pipeline_stage_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_events_prospect_id ON prospect_events(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_events_user_id ON prospect_events(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_prospect_id ON schedule_events(prospect_id);

-- Scoring and analytics
CREATE INDEX IF NOT EXISTS idx_prospect_scores_prospect_id ON prospect_scores(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_scores_user_id ON prospect_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_prospect_id ON scoring_history(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scoring_history_user_id ON scoring_history(user_id);
CREATE INDEX IF NOT EXISTS idx_scoutscore_calculations_prospect_id ON scoutscore_calculations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scoutscore_calculations_user_id ON scoutscore_calculations(user_id);
