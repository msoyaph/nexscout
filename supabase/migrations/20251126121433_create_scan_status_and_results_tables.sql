/*
  # Create Scan Status and Results Tables

  ## Changes
  Creates simple tables for real-time scan progress tracking and results storage.

  ## Tables
  - scan_status: Tracks real-time progress of scans
    - scan_id: References the scan being processed
    - step: Current processing step name
    - percent: Progress percentage (0-100)
    - message: User-friendly progress message
    - updated_at: Timestamp of last update

  - scan_results: Stores final scan results
    - id: Primary key
    - scan_id: References the completed scan
    - prospects: JSON array of detected prospects
    - created_at: Timestamp of result creation

  ## Security
  - RLS enabled on both tables
  - Users can only access their own scan data
*/

-- ============================================================================
-- scan_status table
-- ============================================================================
CREATE TABLE IF NOT EXISTS scan_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL,
  step text NOT NULL,
  percent integer NOT NULL DEFAULT 0,
  message text,
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key to scans table
ALTER TABLE scan_status
  ADD CONSTRAINT fk_scan_status_scan_id 
  FOREIGN KEY (scan_id) 
  REFERENCES scans(id) 
  ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scan_status_scan_id ON scan_status(scan_id);

-- Enable RLS
ALTER TABLE scan_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scan status"
  ON scan_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_status.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can insert scan status"
  ON scan_status FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_status.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can update scan status"
  ON scan_status FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_status.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_status.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- scan_results table
-- ============================================================================
CREATE TABLE IF NOT EXISTS scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL UNIQUE,
  prospects jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key to scans table
ALTER TABLE scan_results
  ADD CONSTRAINT fk_scan_results_scan_id 
  FOREIGN KEY (scan_id) 
  REFERENCES scans(id) 
  ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);

-- Enable RLS
ALTER TABLE scan_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own scan results"
  ON scan_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can insert scan results"
  ON scan_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "System can update scan results"
  ON scan_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_results.scan_id
      AND scans.user_id = (SELECT auth.uid())
    )
  );