/*
  # Add Last 3 Foreign Key Indexes

  1. Performance Enhancement
    - Add the final 3 unindexed foreign keys
    
  2. Indexes Added
    - file_documents.file_id
    - file_documents.user_id
    - follow_up_sequences.prospect_id
*/

-- File document indexes
CREATE INDEX IF NOT EXISTS idx_file_documents_file_id_v2 ON file_documents(file_id);
CREATE INDEX IF NOT EXISTS idx_file_documents_user_id_v2 ON file_documents(user_id);

-- Follow-up sequence prospect index
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_prospect_id_v2 ON follow_up_sequences(prospect_id);
