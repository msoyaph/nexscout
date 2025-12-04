/*
  # Fix Function Search Path Security Issues (Correct Signatures)
  
  ## Purpose
  Set secure search_path for all database functions to prevent
  SQL injection through search_path manipulation attacks.
  
  ## Functions Updated
  All 31 functions with correct parameter signatures.
*/

-- Functions with no parameters
ALTER FUNCTION public.cleanup_expired_ai_generations() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_generate_starter_missions() SET search_path = public, pg_temp;
ALTER FUNCTION public.award_monthly_coin_bonus() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_invoice_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.initialize_user_scoring_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.sync_subscription_to_profile() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_company_profiles_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_sequences_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_support_ticket_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

-- Functions with resetdaily/weekly_limits (both versions)
ALTER FUNCTION public.reset_daily_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_daily_limits(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_weekly_limits() SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_weekly_limits(uuid) SET search_path = public, pg_temp;

-- Functions with single UUID parameter
ALTER FUNCTION public.get_latest_prospect_score(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_prospect_counts_by_bucket(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_unread_count(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_all_read(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.get_coin_balance(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.award_daily_bonus(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_daily_training_tasks(uuid) SET search_path = public, pg_temp;

-- Functions with two UUID parameters
ALTER FUNCTION public.create_sequence_reminders(uuid, uuid) SET search_path = public, pg_temp;

-- Functions with UUID and integer
ALTER FUNCTION public.can_afford_action(uuid, integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_mission_progress(uuid, integer) SET search_path = public, pg_temp;

-- Functions with UUID and date
ALTER FUNCTION public.update_user_streak(uuid, date) SET search_path = public, pg_temp;

-- Functions with UUID and text parameters
ALTER FUNCTION public.check_ai_usage_limit(uuid, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.record_coin_transaction(uuid, integer, text, text) SET search_path = public, pg_temp;

-- Complex notification function
ALTER FUNCTION public.create_notification(uuid, text, text, text, text, uuid, uuid, text, jsonb) SET search_path = public, pg_temp;

-- Complex invoice function  
ALTER FUNCTION public.create_invoice_for_payment(uuid, uuid, numeric, text, text, timestamptz, timestamptz) SET search_path = public, pg_temp;
