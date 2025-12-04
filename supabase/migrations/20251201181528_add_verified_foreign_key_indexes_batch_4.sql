/*
  # Add Verified Foreign Key Indexes - Batch 4

  1. Purpose
    - Continue adding indexes to foreign key columns
    - Focus on remaining company and conversation tables

  2. Security Impact
    - Ensures efficient queries across all tables
    - Prevents performance bottlenecks
*/

-- Company personas and playbooks
CREATE INDEX IF NOT EXISTS idx_company_personas_company_id 
  ON company_personas(company_id);

CREATE INDEX IF NOT EXISTS idx_company_playbooks_company_id 
  ON company_playbooks(company_id);

CREATE INDEX IF NOT EXISTS idx_company_profiles_admin_company_id 
  ON company_profiles(admin_company_id);

CREATE INDEX IF NOT EXISTS idx_company_style_overrides_company_id 
  ON company_style_overrides(company_id);

-- Contact behavior
CREATE INDEX IF NOT EXISTS idx_contact_behavior_timeline_contact_id 
  ON contact_behavior_timeline(contact_id);

-- Conversation analyses
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_prospect_id 
  ON conversation_analyses(prospect_id);

CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_id 
  ON conversation_analyses(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_analytics_prospect_id 
  ON conversation_analytics(prospect_id);

-- Conversation intelligence
CREATE INDEX IF NOT EXISTS idx_conversation_intelligence_events_prospect_id 
  ON conversation_intelligence_events(prospect_id);

CREATE INDEX IF NOT EXISTS idx_conversation_intelligence_events_conversation_id 
  ON conversation_intelligence_events(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversion_path_predictions_prospect_id 
  ON conversion_path_predictions(prospect_id);

CREATE INDEX IF NOT EXISTS idx_crawler_logs_intelligence_id 
  ON crawler_logs(intelligence_id);

-- Daily plans
CREATE INDEX IF NOT EXISTS idx_daily_action_plans_user_id 
  ON daily_action_plans(user_id);

CREATE INDEX IF NOT EXISTS idx_daily_productivity_plans_user_id 
  ON daily_productivity_plans(user_id);

-- Data ingestion
CREATE INDEX IF NOT EXISTS idx_data_ingestion_queue_source_id 
  ON data_ingestion_queue(source_id);

CREATE INDEX IF NOT EXISTS idx_data_source_stats_source_id 
  ON data_source_stats(source_id);

-- Deal timeline
CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_prospect_id 
  ON deal_timeline_forecasts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_user_id 
  ON deal_timeline_forecasts(user_id);

-- Deep scan
CREATE INDEX IF NOT EXISTS idx_deep_scan_events_user_id 
  ON deep_scan_events(user_id);

CREATE INDEX IF NOT EXISTS idx_deep_scan_events_session_id 
  ON deep_scan_events(session_id);

CREATE INDEX IF NOT EXISTS idx_deep_scan_results_user_id 
  ON deep_scan_results(user_id);

CREATE INDEX IF NOT EXISTS idx_deep_scan_results_session_id 
  ON deep_scan_results(session_id);

CREATE INDEX IF NOT EXISTS idx_deep_scan_sessions_user_id 
  ON deep_scan_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_deep_scan_state_machine_prospect_entity_id 
  ON deep_scan_state_machine(prospect_entity_id);

-- Downline members
CREATE INDEX IF NOT EXISTS idx_downline_members_leader_user_id 
  ON downline_members(leader_user_id);

CREATE INDEX IF NOT EXISTS idx_downline_members_member_user_id 
  ON downline_members(member_user_id);

-- Elite coaching
CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_prospect_id 
  ON elite_coaching_sessions(prospect_id);

CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_user_id 
  ON elite_coaching_sessions(user_id);

-- Emotion enhanced messages
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_user_id 
  ON emotion_enhanced_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_prospect_id 
  ON emotion_enhanced_messages(prospect_id);

-- Emotional state
CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_prospect_id 
  ON emotional_state_analyses(prospect_id);

CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_user_id 
  ON emotional_state_analyses(user_id);

-- Enterprise
CREATE INDEX IF NOT EXISTS idx_enterprise_analytics_org_id 
  ON enterprise_analytics(org_id);

CREATE INDEX IF NOT EXISTS idx_enterprise_members_org_id 
  ON enterprise_members(org_id);

-- Experiments
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment_id 
  ON experiment_assignments(experiment_id);

CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant_id 
  ON experiment_assignments(variant_id);

CREATE INDEX IF NOT EXISTS idx_experiment_results_variant_id 
  ON experiment_results(variant_id);

CREATE INDEX IF NOT EXISTS idx_experiment_results_experiment_id 
  ON experiment_results(experiment_id);

CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id 
  ON experiment_variants(experiment_id);

-- Extracted entities
CREATE INDEX IF NOT EXISTS idx_extracted_entities_batch_id 
  ON extracted_entities(batch_id);
