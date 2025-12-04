/*
  # Add Verified Foreign Key Indexes - Batch 5

  1. Purpose
    - Continue adding indexes to foreign key columns
    - Focus on file intelligence and follow-up tables

  2. Security Impact
    - Ensures efficient file processing queries
    - Prevents performance bottlenecks
*/

-- File documents and entities
CREATE INDEX IF NOT EXISTS idx_file_documents_user_id 
  ON file_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_file_documents_file_id 
  ON file_documents(file_id);

CREATE INDEX IF NOT EXISTS idx_file_extracted_entities_user_id 
  ON file_extracted_entities(user_id);

CREATE INDEX IF NOT EXISTS idx_file_extracted_entities_document_id 
  ON file_extracted_entities(document_id);

CREATE INDEX IF NOT EXISTS idx_file_extracted_entities_page_id 
  ON file_extracted_entities(page_id);

-- File intelligence documents
CREATE INDEX IF NOT EXISTS idx_file_intelligence_documents_user_id 
  ON file_intelligence_documents(user_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_documents_file_id 
  ON file_intelligence_documents(file_id);

-- File intelligence extracted entities
CREATE INDEX IF NOT EXISTS idx_file_intelligence_extracted_entities_user_id 
  ON file_intelligence_extracted_entities(user_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_extracted_entities_document_id 
  ON file_intelligence_extracted_entities(document_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_extracted_entities_page_id 
  ON file_intelligence_extracted_entities(page_id);

-- File intelligence pages
CREATE INDEX IF NOT EXISTS idx_file_intelligence_pages_document_id 
  ON file_intelligence_pages(document_id);

-- File intelligence scan batches and queue
CREATE INDEX IF NOT EXISTS idx_file_intelligence_scan_batches_user_id 
  ON file_intelligence_scan_batches(user_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_scan_queue_scan_batch_id 
  ON file_intelligence_scan_queue(scan_batch_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_scan_queue_file_id 
  ON file_intelligence_scan_queue(file_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_scan_queue_user_id 
  ON file_intelligence_scan_queue(user_id);

-- File intelligence text chunks
CREATE INDEX IF NOT EXISTS idx_file_intelligence_text_chunks_document_id 
  ON file_intelligence_text_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_text_chunks_page_id 
  ON file_intelligence_text_chunks(page_id);

-- File intelligence uploaded files
CREATE INDEX IF NOT EXISTS idx_file_intelligence_uploaded_files_user_id 
  ON file_intelligence_uploaded_files(user_id);

CREATE INDEX IF NOT EXISTS idx_file_intelligence_uploaded_files_scan_batch_id 
  ON file_intelligence_uploaded_files(scan_batch_id);

-- File pages and scan queue
CREATE INDEX IF NOT EXISTS idx_file_pages_document_id 
  ON file_pages(document_id);

CREATE INDEX IF NOT EXISTS idx_file_scan_queue_scan_batch_id 
  ON file_scan_queue(scan_batch_id);

CREATE INDEX IF NOT EXISTS idx_file_scan_queue_user_id 
  ON file_scan_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_file_scan_queue_file_id 
  ON file_scan_queue(file_id);

-- File text chunks
CREATE INDEX IF NOT EXISTS idx_file_text_chunks_page_id 
  ON file_text_chunks(page_id);

CREATE INDEX IF NOT EXISTS idx_file_text_chunks_document_id 
  ON file_text_chunks(document_id);

-- Financial profiles
CREATE INDEX IF NOT EXISTS idx_financial_profiles_user_id 
  ON financial_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_financial_profiles_prospect_id 
  ON financial_profiles(prospect_id);

-- Follow-up reminders and sequences
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_notification_id 
  ON follow_up_reminders(notification_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_prospect_id 
  ON follow_up_reminders(prospect_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_sequence_id 
  ON follow_up_reminders(sequence_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id 
  ON follow_up_sequences(prospect_id);

CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_user_id 
  ON follow_up_sequences(user_id);

-- Generated messages and scripts
CREATE INDEX IF NOT EXISTS idx_generated_messages_prospect_id 
  ON generated_messages(prospect_id);

CREATE INDEX IF NOT EXISTS idx_generated_scripts_prospect_id 
  ON generated_scripts(prospect_id);

CREATE INDEX IF NOT EXISTS idx_generated_scripts_user_id 
  ON generated_scripts(user_id);

-- Government
CREATE INDEX IF NOT EXISTS idx_government_audit_findings_audit_id 
  ON government_audit_findings(audit_id);

CREATE INDEX IF NOT EXISTS idx_government_law_rules_law_id 
  ON government_law_rules(law_id);
