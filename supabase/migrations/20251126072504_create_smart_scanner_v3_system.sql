/*
  # NexScout Smart Scanner v3.0 - Session-Based Scanning System

  1. New Tables
    - `scan_sessions`
      - Stores each independent scan instance
      - Tracks status, sources, and results
      - Links to user and smartness score at scan time

    - `scan_session_files`
      - Stores uploaded files per session
      - Handles OCR and extraction status

    - `scan_session_social_data`
      - Stores social media data per session
      - Supports multiple platforms

    - `scan_session_prospects`
      - Links prospects to specific scan sessions
      - Stores score snapshots and explanations

  2. Security
    - Enable RLS on all tables
    - Users can only access their own scan sessions
*/

-- Create scan_sessions table
CREATE TABLE IF NOT EXISTS scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  files_count integer DEFAULT 0,
  text_count integer DEFAULT 0,
  social_sources text[] DEFAULT ARRAY[]::text[],
  smartness_score_at_scan integer DEFAULT 0 CHECK (smartness_score_at_scan >= 0 AND smartness_score_at_scan <= 100),
  total_prospects_found integer DEFAULT 0,
  hot_count integer DEFAULT 0,
  warm_count integer DEFAULT 0,
  cold_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create scan_session_files table
CREATE TABLE IF NOT EXISTS scan_session_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scan_sessions(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('screenshot', 'csv', 'export', 'json', 'text')),
  file_name text,
  file_size bigint DEFAULT 0,
  extracted_text text,
  ocr_status text DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create scan_session_social_data table
CREATE TABLE IF NOT EXISTS scan_session_social_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scan_sessions(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'tiktok', 'twitter')),
  raw_payload jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create scan_session_prospects table
CREATE TABLE IF NOT EXISTS scan_session_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES scan_sessions(id) ON DELETE CASCADE NOT NULL,
  prospect_name text,
  prospect_email text,
  prospect_phone text,
  score_snapshot integer DEFAULT 0 CHECK (score_snapshot >= 0 AND score_snapshot <= 100),
  bucket_snapshot text CHECK (bucket_snapshot IN ('hot', 'warm', 'cold')),
  explanation_tags text[] DEFAULT ARRAY[]::text[],
  pain_points text[] DEFAULT ARRAY[]::text[],
  personality_traits text[] DEFAULT ARRAY[]::text[],
  source_platform text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_sessions_user_id ON scan_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_status ON scan_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_created_at ON scan_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_session_files_session_id ON scan_session_files(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_session_social_data_session_id ON scan_session_social_data(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_session_prospects_session_id ON scan_session_prospects(session_id);
CREATE INDEX IF NOT EXISTS idx_scan_session_prospects_bucket ON scan_session_prospects(bucket_snapshot);

-- Enable Row Level Security
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_session_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_session_social_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_session_prospects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scan_sessions
CREATE POLICY "Users can view own sessions"
  ON scan_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON scan_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON scan_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON scan_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for scan_session_files
CREATE POLICY "Users can view own session files"
  ON scan_session_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own session files"
  ON scan_session_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session files"
  ON scan_session_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session files"
  ON scan_session_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_files.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_session_social_data
CREATE POLICY "Users can view own session social data"
  ON scan_session_social_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own session social data"
  ON scan_session_social_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session social data"
  ON scan_session_social_data FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session social data"
  ON scan_session_social_data FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_social_data.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_session_prospects
CREATE POLICY "Users can view own session prospects"
  ON scan_session_prospects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own session prospects"
  ON scan_session_prospects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session prospects"
  ON scan_session_prospects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session prospects"
  ON scan_session_prospects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scan_sessions
      WHERE scan_sessions.id = scan_session_prospects.session_id
      AND scan_sessions.user_id = auth.uid()
    )
  );
