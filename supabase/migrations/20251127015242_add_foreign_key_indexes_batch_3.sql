/*
  # Add Foreign Key Indexes - Batch 3

  1. Performance Optimization
    - Continue adding indexes for unindexed foreign keys
    - Tables: follow_up_reminders through meeting_predictions
*/

-- follow_up_reminders
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_notification_id_fkey ON public.follow_up_reminders(notification_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_prospect_id_fkey ON public.follow_up_reminders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_sequence_id_fkey ON public.follow_up_reminders(sequence_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_id_fkey ON public.follow_up_reminders(user_id);

-- follow_up_sequences
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id_fkey ON public.follow_up_sequences(prospect_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_user_id_fkey ON public.follow_up_sequences(user_id);

-- generated_messages
CREATE INDEX IF NOT EXISTS idx_generated_messages_prospect_id_fkey ON public.generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_generated_messages_user_id_fkey ON public.generated_messages(user_id);

-- generated_scripts
CREATE INDEX IF NOT EXISTS idx_generated_scripts_prospect_id_fkey ON public.generated_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_user_id_fkey ON public.generated_scripts(user_id);

-- hot_lead_accelerations
CREATE INDEX IF NOT EXISTS idx_hot_lead_accelerations_prospect_id_fkey ON public.hot_lead_accelerations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_hot_lead_accelerations_user_id_fkey ON public.hot_lead_accelerations(user_id);

-- insight_assistant_history
CREATE INDEX IF NOT EXISTS idx_insight_assistant_history_admin_user_id_fkey ON public.insight_assistant_history(admin_user_id);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id_fkey ON public.invoices(payment_id);

-- lead_nurture_pathways
CREATE INDEX IF NOT EXISTS idx_lead_nurture_pathways_prospect_id_fkey ON public.lead_nurture_pathways(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_nurture_pathways_user_id_fkey ON public.lead_nurture_pathways(user_id);

-- lead_revival_messages
CREATE INDEX IF NOT EXISTS idx_lead_revival_messages_prospect_id_fkey ON public.lead_revival_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_revival_messages_user_id_fkey ON public.lead_revival_messages(user_id);

-- leadership_playbooks
CREATE INDEX IF NOT EXISTS idx_leadership_playbooks_user_id_fkey ON public.leadership_playbooks(user_id);

-- library_groups
CREATE INDEX IF NOT EXISTS idx_library_groups_user_id_fkey ON public.library_groups(user_id);

-- linkedin_page_insights
CREATE INDEX IF NOT EXISTS idx_linkedin_page_insights_user_id_fkey ON public.linkedin_page_insights(user_id);

-- llm_load_tests
CREATE INDEX IF NOT EXISTS idx_llm_load_tests_user_id_fkey ON public.llm_load_tests(user_id);

-- meeting_booking_scripts
CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_prospect_id_fkey ON public.meeting_booking_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_user_id_fkey ON public.meeting_booking_scripts(user_id);

-- meeting_predictions
CREATE INDEX IF NOT EXISTS idx_meeting_predictions_prospect_id_fkey ON public.meeting_predictions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_predictions_user_id_fkey ON public.meeting_predictions(user_id);
