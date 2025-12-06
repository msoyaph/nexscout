/*
  # Drop Unused Indexes - Batch 3

  1. Purpose
    - Continue dropping unused indexes
  
  2. Indexes Dropped
    - Follow-up, generation, lead nurture related (next 30)
*/

DROP INDEX IF EXISTS idx_follow_up_reminders_notification_id_fkey;
DROP INDEX IF EXISTS idx_follow_up_reminders_prospect_id_fkey;
DROP INDEX IF EXISTS idx_follow_up_reminders_sequence_id_fkey;
DROP INDEX IF EXISTS idx_follow_up_reminders_user_id_fkey;
DROP INDEX IF EXISTS idx_follow_up_sequences_prospect_id_fkey;
DROP INDEX IF EXISTS idx_follow_up_sequences_user_id_fkey;
DROP INDEX IF EXISTS idx_generated_messages_prospect_id_fkey;
DROP INDEX IF EXISTS idx_generated_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_generated_scripts_prospect_id_fkey;
DROP INDEX IF EXISTS idx_generated_scripts_user_id_fkey;
DROP INDEX IF EXISTS idx_hot_lead_accelerations_prospect_id_fkey;
DROP INDEX IF EXISTS idx_hot_lead_accelerations_user_id_fkey;
DROP INDEX IF EXISTS idx_insight_assistant_history_admin_user_id_fkey;
DROP INDEX IF EXISTS idx_invoices_payment_id_fkey;
DROP INDEX IF EXISTS idx_lead_nurture_pathways_prospect_id_fkey;
DROP INDEX IF EXISTS idx_lead_nurture_pathways_user_id_fkey;
DROP INDEX IF EXISTS idx_lead_revival_messages_prospect_id_fkey;
DROP INDEX IF EXISTS idx_lead_revival_messages_user_id_fkey;
DROP INDEX IF EXISTS idx_leadership_playbooks_user_id_fkey;
DROP INDEX IF EXISTS idx_library_groups_user_id_fkey;
DROP INDEX IF EXISTS idx_linkedin_page_insights_user_id_fkey;
DROP INDEX IF EXISTS idx_llm_load_tests_user_id_fkey;
DROP INDEX IF EXISTS idx_meeting_booking_scripts_prospect_id_fkey;
DROP INDEX IF EXISTS idx_meeting_booking_scripts_user_id_fkey;
DROP INDEX IF EXISTS idx_meeting_predictions_prospect_id_fkey;
DROP INDEX IF EXISTS idx_meeting_predictions_user_id_fkey;
DROP INDEX IF EXISTS idx_member_performance_logs_downline_member_id_fkey;
DROP INDEX IF EXISTS idx_message_sequences_prospect_id_fkey;
DROP INDEX IF EXISTS idx_message_sequences_user_id_fkey;
DROP INDEX IF EXISTS idx_mission_completions_user_id_fkey;
