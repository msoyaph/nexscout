/*
  # Add Missing Foreign Key Indexes - Batch 14

  1. Performance Enhancement
    - Add indexes for unindexed foreign keys in scan session and scanning systems
    
  2. Indexes Added
    - Scan sessions: scan_session_files, scan_session_prospects, scan_session_social_data
    - Scan smartness: scan_smartness_events
    - Scan taglish: scan_taglish_analysis
    - Scanning: scanning_sessions
    - Scheduled: scheduled_meetings
    - Scraper: scraper_logs
    - Sequence: sequence_step_logs
*/

-- Scan session indexes
CREATE INDEX IF NOT EXISTS idx_scan_session_files_session_id ON scan_session_files(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_session_prospects_session_id ON scan_session_prospects(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_session_social_data_session_id ON scan_session_social_data(session_id);

-- Scan smartness indexes
CREATE INDEX IF NOT EXISTS idx_scan_smartness_events_user_id ON scan_smartness_events(user_id);

-- Scan taglish indexes
CREATE INDEX IF NOT EXISTS idx_scan_taglish_analysis_scan_id ON scan_taglish_analysis(scan_id);

-- Scanning indexes
CREATE INDEX IF NOT EXISTS idx_scanning_sessions_user_id ON scanning_sessions(user_id);

-- Scheduled meeting indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_meetings_user_id ON scheduled_meetings(user_id);

-- Scraper indexes
CREATE INDEX IF NOT EXISTS idx_scraper_logs_user_id ON scraper_logs(user_id);

-- Sequence indexes
CREATE INDEX IF NOT EXISTS idx_sequence_step_logs_sequence_id ON sequence_step_logs(sequence_id);
CREATE INDEX IF NOT EXISTS idx_sequence_step_logs_user_id ON sequence_step_logs(user_id);
