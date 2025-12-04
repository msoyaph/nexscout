/*
  # Add Missing Foreign Key Indexes - Batch 7

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in file and follow-up systems
    
  2. Indexes Added
    - File intelligence: file_documents, file_extracted_entities, file_intelligence_extracted_entities
    - File scanning: file_scan_queue
    - Financial: financial_profiles
    - Follow-up: follow_up_reminders, follow_up_sequences
    - Generated content: generated_messages, generated_scripts
*/

-- File document indexes
CREATE INDEX IF NOT EXISTS idx_file_documents_file_id ON file_documents(file_id);
CREATE INDEX IF NOT EXISTS idx_file_documents_user_id ON file_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_file_extracted_entities_page_id ON file_extracted_entities(page_id);
CREATE INDEX IF NOT EXISTS idx_file_intelligence_extracted_entities_page_id ON file_intelligence_extracted_entities(page_id);

-- File scanning indexes
CREATE INDEX IF NOT EXISTS idx_file_scan_queue_scan_batch_id ON file_scan_queue(scan_batch_id);

-- Financial indexes
CREATE INDEX IF NOT EXISTS idx_financial_profiles_prospect_id ON financial_profiles(prospect_id);
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id ON financial_profiles(user_id);

-- Follow-up indexes
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_notification_id ON follow_up_reminders(notification_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_prospect_id ON follow_up_reminders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_sequence_id ON follow_up_reminders(sequence_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_user_id ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id ON follow_up_sequences(prospect_id);

-- Generated content indexes
CREATE INDEX IF NOT EXISTS idx_generated_messages_prospect_id ON generated_messages(prospect_id);
CREATE INDEX IF NOT EXISTS idx_generated_messages_user_id ON generated_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_prospect_id ON generated_scripts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_generated_scripts_user_id ON generated_scripts(user_id);
