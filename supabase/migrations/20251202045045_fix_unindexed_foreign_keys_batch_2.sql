/*
  # Fix Unindexed Foreign Keys - Batch 2

  1. Performance Optimization
    - Add indexes for foreign key columns to improve query performance
    - Covers 20 additional tables
    
  2. Tables and Columns Affected
    - adaptive_follow_up_sequences: prospect_id, user_id
    - adaptive_learning_weights: entity_id, owner_id
    - admin_companies: owner_id
    - admin_offerings: company_id, owner_id
    - admin_product_variants: owner_id, product_id
    - admin_services: company_id, owner_id
    - agent_profitability: user_id
    - agent_revenue_reports: user_id
    - agent_skill_gaps: user_id
    - aha_events: user_id
    - aha_moments: badge_id
    - ai_agent_settings: user_id
    - ai_alerts: prospect_id, user_id
    - ai_chat_sessions: prospect_id, user_id
    - ai_closer_sessions: prospect_id, user_id
    - ai_coach_recommendations: user_id
    - ai_conversation_states: prospect_id, session_id
    - ai_conversations: prospect_id, session_id, user_id
    - ai_cost_predictions: user_id
    - ai_cost_simulations: user_id
    
  3. Security
    - All indexes created with IF NOT EXISTS to prevent errors
    - Improves JOIN performance and foreign key constraint checking
*/

-- adaptive_follow_up_sequences
CREATE INDEX IF NOT EXISTS idx_adaptive_follow_up_sequences_prospect_id ON adaptive_follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_follow_up_sequences_user_id ON adaptive_follow_up_sequences(user_id);

-- adaptive_learning_weights
CREATE INDEX IF NOT EXISTS idx_adaptive_learning_weights_entity_id ON adaptive_learning_weights(entity_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_learning_weights_owner_id ON adaptive_learning_weights(owner_id);

-- admin_companies
CREATE INDEX IF NOT EXISTS idx_admin_companies_owner_id ON admin_companies(owner_id);

-- admin_offerings
CREATE INDEX IF NOT EXISTS idx_admin_offerings_company_id ON admin_offerings(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_offerings_owner_id ON admin_offerings(owner_id);

-- admin_product_variants
CREATE INDEX IF NOT EXISTS idx_admin_product_variants_owner_id ON admin_product_variants(owner_id);
CREATE INDEX IF NOT EXISTS idx_admin_product_variants_product_id ON admin_product_variants(product_id);

-- admin_services
CREATE INDEX IF NOT EXISTS idx_admin_services_company_id ON admin_services(company_id);
CREATE INDEX IF NOT EXISTS idx_admin_services_owner_id ON admin_services(owner_id);

-- agent_profitability
CREATE INDEX IF NOT EXISTS idx_agent_profitability_user_id ON agent_profitability(user_id);

-- agent_revenue_reports
CREATE INDEX IF NOT EXISTS idx_agent_revenue_reports_user_id ON agent_revenue_reports(user_id);

-- agent_skill_gaps
CREATE INDEX IF NOT EXISTS idx_agent_skill_gaps_user_id ON agent_skill_gaps(user_id);

-- aha_events
CREATE INDEX IF NOT EXISTS idx_aha_events_user_id ON aha_events(user_id);

-- aha_moments
CREATE INDEX IF NOT EXISTS idx_aha_moments_badge_id ON aha_moments(badge_id);

-- ai_agent_settings
CREATE INDEX IF NOT EXISTS idx_ai_agent_settings_user_id ON ai_agent_settings(user_id);

-- ai_alerts
CREATE INDEX IF NOT EXISTS idx_ai_alerts_prospect_id ON ai_alerts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user_id ON ai_alerts(user_id);

-- ai_chat_sessions
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_prospect_id ON ai_chat_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);

-- ai_closer_sessions
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_prospect_id ON ai_closer_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_closer_sessions_user_id ON ai_closer_sessions(user_id);

-- ai_coach_recommendations
CREATE INDEX IF NOT EXISTS idx_ai_coach_recommendations_user_id ON ai_coach_recommendations(user_id);

-- ai_conversation_states
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_prospect_id ON ai_conversation_states(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_states_session_id ON ai_conversation_states(session_id);

-- ai_conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_prospect_id ON ai_conversations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);

-- ai_cost_predictions
CREATE INDEX IF NOT EXISTS idx_ai_cost_predictions_user_id ON ai_cost_predictions(user_id);

-- ai_cost_simulations
CREATE INDEX IF NOT EXISTS idx_ai_cost_simulations_user_id ON ai_cost_simulations(user_id);