/*
  # Add Missing Foreign Key Indexes - Batch 8 (Final)

  1. Performance Enhancement
    - Add indexes for remaining unindexed foreign keys
    
  2. Indexes Added
    - Handoff: handoff_triggers
    - Hot leads: hot_lead_accelerations
    - Human takeover: human_takeover_sessions
    - Identity: identity_merge_log
    - Insight: insight_assistant_history
    - Invoices: invoices
    - Lead nurture: lead_nurture_pathways
*/

-- Handoff indexes
CREATE INDEX IF NOT EXISTS idx_handoff_triggers_human_user_id ON handoff_triggers(human_user_id);
CREATE INDEX IF NOT EXISTS idx_handoff_triggers_user_id ON handoff_triggers(user_id);

-- Hot lead indexes
CREATE INDEX IF NOT EXISTS idx_hot_lead_accelerations_prospect_id ON hot_lead_accelerations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_hot_lead_accelerations_user_id ON hot_lead_accelerations(user_id);

-- Human takeover indexes
CREATE INDEX IF NOT EXISTS idx_human_takeover_sessions_prospect_id ON human_takeover_sessions(prospect_id);

-- Identity merge indexes
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_reviewed_by ON identity_merge_log(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_target_prospect_id ON identity_merge_log(target_prospect_id);
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_user_id ON identity_merge_log(user_id);

-- Insight assistant indexes
CREATE INDEX IF NOT EXISTS idx_insight_assistant_history_admin_user_id ON insight_assistant_history(admin_user_id);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id ON invoices(payment_id);

-- Lead nurture indexes
CREATE INDEX IF NOT EXISTS idx_lead_nurture_pathways_prospect_id ON lead_nurture_pathways(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_nurture_pathways_user_id ON lead_nurture_pathways(user_id);
