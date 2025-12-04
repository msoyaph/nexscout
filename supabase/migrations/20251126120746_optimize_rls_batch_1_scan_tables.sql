/*
  # Optimize RLS Policies - Batch 1: Scan Tables

  ## Overview  
  Fix RLS performance by wrapping auth.uid() in SELECT subqueries for scanning tables.

  ## Tables in this batch
  - scans (4 policies) - has user_id
  - scan_progress (3 policies) - uses scan_id FK
  - scan_extracted_data (2 policies) - uses scan_id FK  
  - scan_sessions (4 policies) - has user_id
  - scan_session_files (4 policies) - uses session_id FK
  - scan_session_prospects (4 policies) - uses session_id FK
  - scan_session_social_data (4 policies) - uses session_id FK
*/

-- scans table (has user_id)
DROP POLICY IF EXISTS "Users can view own scans" ON scans;
CREATE POLICY "Users can view own scans"
  ON scans FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own scans" ON scans;
CREATE POLICY "Users can create own scans"
  ON scans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own scans" ON scans;
CREATE POLICY "Users can update own scans"
  ON scans FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own scans" ON scans;
CREATE POLICY "Users can delete own scans"
  ON scans FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- scan_progress table (uses scan_id foreign key to scans)
DROP POLICY IF EXISTS "Users can view own scan progress" ON scan_progress;
CREATE POLICY "Users can view own scan progress"
  ON scan_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own scan progress" ON scan_progress;
CREATE POLICY "Users can create own scan progress"
  ON scan_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own scan progress" ON scan_progress;
CREATE POLICY "Users can update own scan progress"
  ON scan_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

-- scan_extracted_data table (uses scan_id foreign key to scans)
DROP POLICY IF EXISTS "Users can view own scan extracted data" ON scan_extracted_data;
CREATE POLICY "Users can view own scan extracted data"
  ON scan_extracted_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_extracted_data.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own scan extracted data" ON scan_extracted_data;
CREATE POLICY "Users can create own scan extracted data"
  ON scan_extracted_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_extracted_data.scan_id
      AND scans.user_id = (select auth.uid())
    )
  );

-- scan_sessions table (has user_id)
DROP POLICY IF EXISTS "Users can view own sessions" ON scan_sessions;
CREATE POLICY "Users can view own sessions"
  ON scan_sessions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own sessions" ON scan_sessions;
CREATE POLICY "Users can create own sessions"
  ON scan_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own sessions" ON scan_sessions;
CREATE POLICY "Users can update own sessions"
  ON scan_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own sessions" ON scan_sessions;
CREATE POLICY "Users can delete own sessions"
  ON scan_sessions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- scan_session_files table (uses session_id FK to scan_sessions)
DROP POLICY IF EXISTS "Users can view own session files" ON scan_session_files;
CREATE POLICY "Users can view own session files"
  ON scan_session_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own session files" ON scan_session_files;
CREATE POLICY "Users can create own session files"
  ON scan_session_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own session files" ON scan_session_files;
CREATE POLICY "Users can update own session files"
  ON scan_session_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own session files" ON scan_session_files;
CREATE POLICY "Users can delete own session files"
  ON scan_session_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

-- scan_session_prospects table (uses session_id FK to scan_sessions)
DROP POLICY IF EXISTS "Users can view own session prospects" ON scan_session_prospects;
CREATE POLICY "Users can view own session prospects"
  ON scan_session_prospects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own session prospects" ON scan_session_prospects;
CREATE POLICY "Users can create own session prospects"
  ON scan_session_prospects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own session prospects" ON scan_session_prospects;
CREATE POLICY "Users can update own session prospects"
  ON scan_session_prospects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own session prospects" ON scan_session_prospects;
CREATE POLICY "Users can delete own session prospects"
  ON scan_session_prospects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

-- scan_session_social_data table (uses session_id FK to scan_sessions)
DROP POLICY IF EXISTS "Users can view own session social data" ON scan_session_social_data;
CREATE POLICY "Users can view own session social data"
  ON scan_session_social_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own session social data" ON scan_session_social_data;
CREATE POLICY "Users can create own session social data"
  ON scan_session_social_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own session social data" ON scan_session_social_data;
CREATE POLICY "Users can update own session social data"
  ON scan_session_social_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own session social data" ON scan_session_social_data;
CREATE POLICY "Users can delete own session social data"
  ON scan_session_social_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = (select auth.uid())
    )
  );
