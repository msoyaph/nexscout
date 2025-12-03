/*
  # Add Missing Foreign Key Indexes - Batch 2

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in admin, AI, and analytics systems
    
  2. Indexes Added
    - Admin system: admin_users, agent_skill_gaps
    - AI systems: ai_drafted_messages, ai_mentor_sessions, ai_usage_logs
    - Analytics: experiment assignments, funnel steps, page views, sessions
*/

-- Admin system indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_skill_gaps_user_id ON agent_skill_gaps(user_id);

-- AI systems indexes
CREATE INDEX IF NOT EXISTS idx_ai_drafted_messages_user_id ON ai_drafted_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_prospect_id ON ai_mentor_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id ON ai_mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_experiment_assignments_variant_id ON analytics_experiment_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_experiments_created_by ON analytics_experiments(created_by);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_funnel_id ON analytics_funnel_steps(funnel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_funnel_steps_user_id ON analytics_funnel_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_acknowledged_by ON analytics_insights(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_analytics_page_views_user_id ON analytics_page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_insight_id ON analytics_recommendations(insight_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_journey_user_id ON analytics_user_journey(user_id);
