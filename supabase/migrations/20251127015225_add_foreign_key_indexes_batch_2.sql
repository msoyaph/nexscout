/*
  # Add Foreign Key Indexes - Batch 2

  1. Performance Optimization
    - Continue adding indexes for unindexed foreign keys
    - Tables: closing_scripts through financial_profiles
*/

-- closing_scripts
CREATE INDEX IF NOT EXISTS idx_closing_scripts_prospect_id_fkey ON public.closing_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_closing_scripts_user_id_fkey ON public.closing_scripts(user_id);

-- coaching_sessions
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_downline_member_id_fkey ON public.coaching_sessions(downline_member_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_leader_user_id_fkey ON public.coaching_sessions(leader_user_id);

-- coin_transactions
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id_fkey ON public.coin_transactions(user_id);

-- contact_behavior_timeline
CREATE INDEX IF NOT EXISTS idx_contact_behavior_timeline_user_id_fkey ON public.contact_behavior_timeline(user_id);

-- conversation_analyses
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_prospect_id_fkey ON public.conversation_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_id_fkey ON public.conversation_analyses(user_id);

-- csv_validation_logs
CREATE INDEX IF NOT EXISTS idx_csv_validation_logs_user_id_fkey ON public.csv_validation_logs(user_id);

-- deal_timeline_forecasts
CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_prospect_id_fkey ON public.deal_timeline_forecasts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_deal_timeline_forecasts_user_id_fkey ON public.deal_timeline_forecasts(user_id);

-- diagnostic_logs
CREATE INDEX IF NOT EXISTS idx_diagnostic_logs_user_id_fkey ON public.diagnostic_logs(user_id);

-- downline_members
CREATE INDEX IF NOT EXISTS idx_downline_members_leader_user_id_fkey ON public.downline_members(leader_user_id);
CREATE INDEX IF NOT EXISTS idx_downline_members_member_user_id_fkey ON public.downline_members(member_user_id);

-- elite_coaching_sessions
CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_prospect_id_fkey ON public.elite_coaching_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_elite_coaching_sessions_user_id_fkey ON public.elite_coaching_sessions(user_id);

-- emotion_enhanced_messages
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_prospect_id_fkey ON public.emotion_enhanced_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotion_enhanced_messages_user_id_fkey ON public.emotion_enhanced_messages(user_id);

-- emotional_state_analyses
CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_prospect_id_fkey ON public.emotional_state_analyses(prospect_id);
CREATE INDEX IF NOT EXISTS idx_emotional_state_analyses_user_id_fkey ON public.emotional_state_analyses(user_id);

-- enterprise_organizations
CREATE INDEX IF NOT EXISTS idx_enterprise_organizations_admin_user_id_fkey ON public.enterprise_organizations(admin_user_id);

-- experiment_assignments
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_variant_id_fkey ON public.experiment_assignments(variant_id);

-- experiment_results
CREATE INDEX IF NOT EXISTS idx_experiment_results_variant_id_fkey ON public.experiment_results(variant_id);

-- experiment_variants
CREATE INDEX IF NOT EXISTS idx_experiment_variants_experiment_id_fkey ON public.experiment_variants(experiment_id);

-- financial_profiles
CREATE INDEX IF NOT EXISTS idx_financial_profiles_prospect_id_fkey ON public.financial_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id_fkey ON public.financial_profiles(user_id);
