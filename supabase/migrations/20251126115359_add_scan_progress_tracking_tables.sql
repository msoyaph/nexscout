/*
  # Add Scan Progress Tracking Tables

  ## Overview
  Add real-time progress tracking and detailed results storage for scans

  ## New Tables
  
  ### 1. `scan_progress`
  Real-time progress updates for active scans
  - `id` (uuid, primary key)
  - `scan_id` (uuid, foreign key to scans.id)
  - `step` (text) - current processing step
  - `percent` (integer) - 0-100 progress
  - `message` (text) - status message
  - `updated_at` (timestamptz)

  ### 2. `scan_extracted_data`
  Stores extracted OCR and parsed data
  - `id` (uuid, primary key)
  - `scan_id` (uuid, foreign key to scans.id)
  - `raw_text` (text) - extracted text
  - `detected_names` (text[]) - array of names
  - `detected_keywords` (jsonb) - keywords and categories
  - `ocr_metadata` (jsonb) - OCR processing info
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own scan data
*/

-- Create scan_progress table for real-time updates
CREATE TABLE IF NOT EXISTS scan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  step text NOT NULL,
  percent integer DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  message text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create scan_extracted_data table
CREATE TABLE IF NOT EXISTS scan_extracted_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  source_index integer DEFAULT 0,
  raw_text text,
  detected_names text[] DEFAULT ARRAY[]::text[],
  detected_keywords jsonb DEFAULT '{}',
  ocr_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scan_progress_scan_id ON scan_progress(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_progress_updated_at ON scan_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_extracted_data_scan_id ON scan_extracted_data(scan_id);

-- Enable RLS
ALTER TABLE scan_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_extracted_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scan_progress
CREATE POLICY "Users can view own scan progress"
  ON scan_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own scan progress"
  ON scan_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own scan progress"
  ON scan_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_progress.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- RLS Policies for scan_extracted_data
CREATE POLICY "Users can view own scan extracted data"
  ON scan_extracted_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_extracted_data.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own scan extracted data"
  ON scan_extracted_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_extracted_data.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- Function to update progress timestamp
CREATE OR REPLACE FUNCTION update_scan_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_scan_progress_timestamp_trigger ON scan_progress;
CREATE TRIGGER update_scan_progress_timestamp_trigger
  BEFORE UPDATE ON scan_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_progress_timestamp();
