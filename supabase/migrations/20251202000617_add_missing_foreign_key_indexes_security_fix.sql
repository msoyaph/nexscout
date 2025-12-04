/*
  # Add Missing Foreign Key Indexes - Security and Performance Fix

  Critical performance and security fix for foreign key columns.

  ## Tables Updated
  - nudge_conversions: Add index on nudge_test_id
  - onboarding_reminder_jobs_v2: Add index on message_id
  - onboarding_sessions: Add index on admin_company_id
  - pitch_decks: Add index on prospect_id
  - pricing_history: Add index on changed_by
  - prospect_merge_log: Add index on master_prospect_id
  - prospects_v10: Add index on source_id
  - scan_pass_results: Add index on pipeline_state_id
  - scan_queue: Add index on prospect_source_id
  - sife_outcomes: Add index on experiment_id
  - sife_recommendations: Add index on step_id
  - sife_weak_points: Add index on step_id
  - subscription_retention_offers: Add index on user_id
  - user_lifecycle_progress: Add index on last_milestone_id
  - user_offerings_v2: Add indexes on admin_offering_id, user_company_id
  - user_persona_profiles: Add index on secondary_persona_code
  - user_product_variants_v2: Add index on admin_variant_id
  - user_products_v2: Add index on user_company_id
  - user_services_v2: Add indexes on admin_service_id, user_company_id
  - user_subscriptions: Add index on plan_id

  ## Security
  These indexes are critical for RLS policy performance and query optimization.
  Without these indexes, RLS policies that filter by foreign keys will perform table scans.
*/

-- nudge_conversions
CREATE INDEX IF NOT EXISTS idx_nudge_conversions_nudge_test_id 
  ON public.nudge_conversions(nudge_test_id);

-- onboarding_reminder_jobs_v2
CREATE INDEX IF NOT EXISTS idx_onboarding_reminder_jobs_v2_message_id 
  ON public.onboarding_reminder_jobs_v2(message_id);

-- onboarding_sessions
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_admin_company_id 
  ON public.onboarding_sessions(admin_company_id);

-- pitch_decks
CREATE INDEX IF NOT EXISTS idx_pitch_decks_prospect_id 
  ON public.pitch_decks(prospect_id);

-- pricing_history
CREATE INDEX IF NOT EXISTS idx_pricing_history_changed_by 
  ON public.pricing_history(changed_by);

-- prospect_merge_log
CREATE INDEX IF NOT EXISTS idx_prospect_merge_log_master_prospect_id 
  ON public.prospect_merge_log(master_prospect_id);

-- prospects_v10
CREATE INDEX IF NOT EXISTS idx_prospects_v10_source_id 
  ON public.prospects_v10(source_id);

-- scan_pass_results
CREATE INDEX IF NOT EXISTS idx_scan_pass_results_pipeline_state_id 
  ON public.scan_pass_results(pipeline_state_id);

-- scan_queue
CREATE INDEX IF NOT EXISTS idx_scan_queue_prospect_source_id 
  ON public.scan_queue(prospect_source_id);

-- sife_outcomes
CREATE INDEX IF NOT EXISTS idx_sife_outcomes_experiment_id 
  ON public.sife_outcomes(experiment_id);

-- sife_recommendations
CREATE INDEX IF NOT EXISTS idx_sife_recommendations_step_id 
  ON public.sife_recommendations(step_id);

-- sife_weak_points
CREATE INDEX IF NOT EXISTS idx_sife_weak_points_step_id 
  ON public.sife_weak_points(step_id);

-- subscription_retention_offers
CREATE INDEX IF NOT EXISTS idx_subscription_retention_offers_user_id 
  ON public.subscription_retention_offers(user_id);

-- user_lifecycle_progress
CREATE INDEX IF NOT EXISTS idx_user_lifecycle_progress_last_milestone_id 
  ON public.user_lifecycle_progress(last_milestone_id);

-- user_offerings_v2
CREATE INDEX IF NOT EXISTS idx_user_offerings_v2_admin_offering_id 
  ON public.user_offerings_v2(admin_offering_id);
CREATE INDEX IF NOT EXISTS idx_user_offerings_v2_user_company_id 
  ON public.user_offerings_v2(user_company_id);

-- user_persona_profiles
CREATE INDEX IF NOT EXISTS idx_user_persona_profiles_secondary_persona_code 
  ON public.user_persona_profiles(secondary_persona_code);

-- user_product_variants_v2
CREATE INDEX IF NOT EXISTS idx_user_product_variants_v2_admin_variant_id 
  ON public.user_product_variants_v2(admin_variant_id);

-- user_products_v2
CREATE INDEX IF NOT EXISTS idx_user_products_v2_user_company_id 
  ON public.user_products_v2(user_company_id);

-- user_services_v2
CREATE INDEX IF NOT EXISTS idx_user_services_v2_admin_service_id 
  ON public.user_services_v2(admin_service_id);
CREATE INDEX IF NOT EXISTS idx_user_services_v2_user_company_id 
  ON public.user_services_v2(user_company_id);

-- user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id 
  ON public.user_subscriptions(plan_id);