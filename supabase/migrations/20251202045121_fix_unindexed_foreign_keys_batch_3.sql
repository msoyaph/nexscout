/*
  # Fix Unindexed Foreign Keys - Batch 3

  1. Performance Optimization
    - Add indexes for foreign key columns to improve query performance
    - Covers 20 additional AI-related tables
    
  2. Tables and Columns Affected
    - ai_drafted_messages: prospect_id, session_id, user_id
    - ai_follow_up_sequences: prospect_id, user_id
    - ai_generated_messages: prospect_id, user_id
    - ai_generated_tasks: task_id, user_id
    - ai_learning_profiles: prospect_id, user_id
    - ai_mentor_sessions: prospect_id, user_id
    - ai_message_sequences: group_id, prospect_id, user_id
    - ai_messages_library: prospect_id, user_id
    - ai_model_usage: user_id
    - ai_pain_point_analysis: prospect_id, user_id
    - ai_persona_modes: user_id
    - ai_personality_profiles: prospect_id, user_id
    - ai_pipeline_actions: job_id, prospect_id
    - ai_pipeline_jobs: prospect_id, user_id
    - ai_pipeline_recommendations: prospect_id, user_id
    - ai_pipeline_settings: user_id
    - ai_prospect_qualifications: prospect_id, user_id
    - ai_prospects: prospect_id, session_id, user_id
    - ai_scripts_user_defined: user_id
    - ai_smartness: user_id
    
  3. Security
    - All indexes created with IF NOT EXISTS to prevent errors
    - Improves JOIN performance and foreign key constraint checking
*/

-- ai_drafted_messages
CREATE INDEX IF NOT EXISTS idx_ai_drafted_messages_prospect_id ON ai_drafted_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_drafted_messages_session_id ON ai_drafted_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_drafted_messages_user_id ON ai_drafted_messages(user_id);

-- ai_follow_up_sequences
CREATE INDEX IF NOT EXISTS idx_ai_follow_up_sequences_prospect_id ON ai_follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_follow_up_sequences_user_id ON ai_follow_up_sequences(user_id);

-- ai_generated_messages
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_prospect_id ON ai_generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_messages_user_id ON ai_generated_messages(user_id);

-- ai_generated_tasks
CREATE INDEX IF NOT EXISTS idx_ai_generated_tasks_task_id ON ai_generated_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_tasks_user_id ON ai_generated_tasks(user_id);

-- ai_learning_profiles
CREATE INDEX IF NOT EXISTS idx_ai_learning_profiles_prospect_id ON ai_learning_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_profiles_user_id ON ai_learning_profiles(user_id);

-- ai_mentor_sessions
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_prospect_id ON ai_mentor_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id ON ai_mentor_sessions(user_id);

-- ai_message_sequences
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_group_id ON ai_message_sequences(group_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_prospect_id ON ai_message_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_sequences_user_id ON ai_message_sequences(user_id);

-- ai_messages_library
CREATE INDEX IF NOT EXISTS idx_ai_messages_library_prospect_id ON ai_messages_library(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_library_user_id ON ai_messages_library(user_id);

-- ai_model_usage
CREATE INDEX IF NOT EXISTS idx_ai_model_usage_user_id ON ai_model_usage(user_id);

-- ai_pain_point_analysis
CREATE INDEX IF NOT EXISTS idx_ai_pain_point_analysis_prospect_id ON ai_pain_point_analysis(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_pain_point_analysis_user_id ON ai_pain_point_analysis(user_id);

-- ai_persona_modes
CREATE INDEX IF NOT EXISTS idx_ai_persona_modes_user_id ON ai_persona_modes(user_id);

-- ai_personality_profiles
CREATE INDEX IF NOT EXISTS idx_ai_personality_profiles_prospect_id ON ai_personality_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_personality_profiles_user_id ON ai_personality_profiles(user_id);

-- ai_pipeline_actions
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_actions_job_id ON ai_pipeline_actions(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_actions_prospect_id ON ai_pipeline_actions(prospect_id);

-- ai_pipeline_jobs
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_prospect_id ON ai_pipeline_jobs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_jobs_user_id ON ai_pipeline_jobs(user_id);

-- ai_pipeline_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_recommendations_prospect_id ON ai_pipeline_recommendations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_recommendations_user_id ON ai_pipeline_recommendations(user_id);

-- ai_pipeline_settings
CREATE INDEX IF NOT EXISTS idx_ai_pipeline_settings_user_id ON ai_pipeline_settings(user_id);

-- ai_prospect_qualifications
CREATE INDEX IF NOT EXISTS idx_ai_prospect_qualifications_prospect_id ON ai_prospect_qualifications(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_prospect_qualifications_user_id ON ai_prospect_qualifications(user_id);

-- ai_prospects
CREATE INDEX IF NOT EXISTS idx_ai_prospects_prospect_id ON ai_prospects(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_prospects_session_id ON ai_prospects(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_prospects_user_id ON ai_prospects(user_id);

-- ai_scripts_user_defined
CREATE INDEX IF NOT EXISTS idx_ai_scripts_user_defined_user_id ON ai_scripts_user_defined(user_id);

-- ai_smartness
CREATE INDEX IF NOT EXISTS idx_ai_smartness_user_id ON ai_smartness(user_id);