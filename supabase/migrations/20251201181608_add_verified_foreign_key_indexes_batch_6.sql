/*
  # Add Verified Foreign Key Indexes - Batch 6 (Final)

  1. Purpose
    - Complete adding indexes to all remaining foreign key columns
    - Focus on hot leads, identity, invoices, and message sequences

  2. Security Impact
    - Completes foreign key indexing across all tables
    - Ensures maximum query performance and security
*/

-- Hot lead accelerations
CREATE INDEX IF NOT EXISTS idx_hot_lead_accelerations_user_id 
  ON hot_lead_accelerations(user_id);

CREATE INDEX IF NOT EXISTS idx_hot_lead_accelerations_prospect_id 
  ON hot_lead_accelerations(prospect_id);

-- Human takeover
CREATE INDEX IF NOT EXISTS idx_human_takeover_sessions_prospect_id 
  ON human_takeover_sessions(prospect_id);

-- Identity merge
CREATE INDEX IF NOT EXISTS idx_identity_merge_log_target_prospect_id 
  ON identity_merge_log(target_prospect_id);

-- Industry persona
CREATE INDEX IF NOT EXISTS idx_industry_persona_profiles_user_id 
  ON industry_persona_profiles(user_id);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_payment_id 
  ON invoices(payment_id);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id 
  ON invoices(user_id);

-- Law changes and votes
CREATE INDEX IF NOT EXISTS idx_law_change_log_law_id 
  ON law_change_log(law_id);

CREATE INDEX IF NOT EXISTS idx_law_votes_law_id 
  ON law_votes(law_id);

-- Lead nurture and revival
CREATE INDEX IF NOT EXISTS idx_lead_nurture_pathways_user_id 
  ON lead_nurture_pathways(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_nurture_pathways_prospect_id 
  ON lead_nurture_pathways(prospect_id);

CREATE INDEX IF NOT EXISTS idx_lead_revival_messages_user_id 
  ON lead_revival_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_lead_revival_messages_prospect_id 
  ON lead_revival_messages(prospect_id);

-- Leadership playbooks
CREATE INDEX IF NOT EXISTS idx_leadership_playbooks_user_id 
  ON leadership_playbooks(user_id);

-- Learning feedback
CREATE INDEX IF NOT EXISTS idx_learning_feedback_events_prospect_id 
  ON learning_feedback_events(prospect_id);

-- Masterclass
CREATE INDEX IF NOT EXISTS idx_masterclass_lessons_user_id 
  ON masterclass_lessons(user_id);

-- Meeting booking and predictions
CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_prospect_id 
  ON meeting_booking_scripts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_user_id 
  ON meeting_booking_scripts(user_id);

CREATE INDEX IF NOT EXISTS idx_meeting_predictions_user_id 
  ON meeting_predictions(user_id);

CREATE INDEX IF NOT EXISTS idx_meeting_predictions_prospect_id 
  ON meeting_predictions(prospect_id);

-- Member performance
CREATE INDEX IF NOT EXISTS idx_member_performance_logs_downline_member_id 
  ON member_performance_logs(downline_member_id);

-- Mentor task events
CREATE INDEX IF NOT EXISTS idx_mentor_task_events_task_id 
  ON mentor_task_events(task_id);

-- Message sequences
CREATE INDEX IF NOT EXISTS idx_message_sequences_prospect_id 
  ON message_sequences(prospect_id);
