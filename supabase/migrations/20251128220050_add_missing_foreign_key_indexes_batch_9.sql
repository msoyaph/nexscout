/*
  # Add Missing Foreign Key Indexes - Batch 9

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in lead, leadership, and library systems
    
  2. Indexes Added
    - Lead revival: lead_revival_messages
    - Leadership: leadership_playbooks
    - Library: library_groups
    - LinkedIn: linkedin_page_insights
    - LLM testing: llm_load_tests
    - Meeting: meeting_booking_scripts, meeting_predictions
    - Member performance: member_performance_logs
*/

-- Lead revival indexes
CREATE INDEX IF NOT EXISTS idx_lead_revival_messages_prospect_id ON lead_revival_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_lead_revival_messages_user_id ON lead_revival_messages(user_id);

-- Leadership indexes
CREATE INDEX IF NOT EXISTS idx_leadership_playbooks_user_id ON leadership_playbooks(user_id);

-- Library indexes
CREATE INDEX IF NOT EXISTS idx_library_groups_user_id ON library_groups(user_id);

-- LinkedIn indexes
CREATE INDEX IF NOT EXISTS idx_linkedin_page_insights_user_id ON linkedin_page_insights(user_id);

-- LLM testing indexes
CREATE INDEX IF NOT EXISTS idx_llm_load_tests_user_id ON llm_load_tests(user_id);

-- Meeting indexes
CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_prospect_id ON meeting_booking_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_booking_scripts_user_id ON meeting_booking_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_predictions_prospect_id ON meeting_predictions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_meeting_predictions_user_id ON meeting_predictions(user_id);

-- Member performance indexes
CREATE INDEX IF NOT EXISTS idx_member_performance_logs_downline_member_id ON member_performance_logs(downline_member_id);
