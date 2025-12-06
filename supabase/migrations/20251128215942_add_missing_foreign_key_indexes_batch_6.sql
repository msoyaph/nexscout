/*
  # Add Missing Foreign Key Indexes - Batch 6

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in deal, diagnostic, and emotion systems
    
  2. Indexes Added
    - Deal: deal_timeline_forecasts
    - Diagnostic: diagnostic_logs
    - Downline: downline_members
    - Elite coaching: elite_coaching_sessions
    - Emotion: emotion_enhanced_messages, emotional_state_analyses
    - Enterprise: enterprise_organizations
    - Experiment: experiment_assignments, experiment_variants
*/

-- Deal timeline indexes
CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_prospect_id ON deal_timeline_forecasts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_user_id ON deal_timeline_forecasts(user_id);

-- Diagnostic indexes
CREATE INDEX IF NOT EXISTS idx_diagnostic_logs_user_id ON diagnostic_logs(user_id);

-- Downline indexes
CREATE INDEX IF NOT EXISTS idx_downline_members_leader_user_id ON downline_members(leader_user_id);
CREATE INDEX IF NOT EXISTS idx_downline_members_member_user_id ON downline_members(member_user_id);

-- Elite coaching indexes
CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_prospect_id ON elite_coaching_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_user_id ON elite_coaching_sessions(user_id);

-- Emotion system indexes
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_prospect_id ON emotion_enhanced_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_user_id ON emotion_enhanced_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_prospect_id ON emotional_state_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_user_id ON emotional_state_analyses(user_id);

-- Enterprise indexes
CREATE INDEX IF NOT EXISTS idx_enterprise_organizations_admin_user_id ON enterprise_organizations(admin_user_id);

-- Experiment indexes
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant_id ON experiment_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id ON experiment_variants(experiment_id);
