/*
  # Smart Scanner v3.0 System

  1. Updates to scans table
    - Add v3 specific columns for OCR, parsing, and Taglish analysis
    - Add state machine tracking
    - Add detailed processing metadata

  2. New scan_ocr_results table
    - Stores raw OCR output per image
    - Confidence scores
    - Extracted text blocks

  3. New scan_taglish_analysis table
    - Language mix analysis
    - Filipino keywords by category
    - Cultural signals
    - Communication style

  4. Indexes
    - Performance indexes for status polling
    - Indexes for filtering by state

  5. Security
    - RLS policies for all new tables
*/

-- Add v3 columns to scans table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scans' AND column_name = 'pipeline_state'
  ) THEN
    ALTER TABLE scans ADD COLUMN pipeline_state text DEFAULT 'queued';
    ALTER TABLE scans ADD COLUMN ocr_confidence numeric(5, 2);
    ALTER TABLE scans ADD COLUMN taglish_score numeric(5, 2);
    ALTER TABLE scans ADD COLUMN language_mix jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE scans ADD COLUMN processing_metadata jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE scans ADD COLUMN estimated_completion_time timestamptz;
  END IF;
END $$;

-- Create scan_ocr_results table
CREATE TABLE IF NOT EXISTS scan_ocr_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE,
  image_index integer NOT NULL,
  raw_text text,
  lines jsonb DEFAULT '[]'::jsonb,
  blocks jsonb DEFAULT '[]'::jsonb,
  confidence numeric(5, 2),
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_ocr_results_scan_id ON scan_ocr_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_ocr_results_confidence ON scan_ocr_results(confidence DESC);

-- Create scan_taglish_analysis table
CREATE TABLE IF NOT EXISTS scan_taglish_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE,
  filipino_percentage numeric(5, 2),
  english_percentage numeric(5, 2),
  taglish_score numeric(5, 2),
  communication_style text CHECK (communication_style IN ('pure_filipino', 'taglish', 'pure_english', 'mixed')),
  business_keywords jsonb DEFAULT '[]'::jsonb,
  lifestyle_keywords jsonb DEFAULT '[]'::jsonb,
  emotion_keywords jsonb DEFAULT '[]'::jsonb,
  location_keywords jsonb DEFAULT '[]'::jsonb,
  relationship_keywords jsonb DEFAULT '[]'::jsonb,
  buying_intent_phrases jsonb DEFAULT '[]'::jsonb,
  cultural_signals jsonb DEFAULT '[]'::jsonb,
  has_business_interest boolean DEFAULT false,
  business_confidence_score numeric(5, 2),
  localized_greeting text,
  localized_approach text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_taglish_analysis_scan_id ON scan_taglish_analysis(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_taglish_analysis_business ON scan_taglish_analysis(has_business_interest);
CREATE INDEX IF NOT EXISTS idx_scan_taglish_analysis_communication ON scan_taglish_analysis(communication_style);

-- RLS for scan_ocr_results
ALTER TABLE scan_ocr_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan OCR results"
  ON scan_ocr_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scan OCR results"
  ON scan_ocr_results
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_ocr_results.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- RLS for scan_taglish_analysis
ALTER TABLE scan_taglish_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan Taglish analysis"
  ON scan_taglish_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scan Taglish analysis"
  ON scan_taglish_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own scan Taglish analysis"
  ON scan_taglish_analysis
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_taglish_analysis.scan_id
      AND scans.user_id = auth.uid()
    )
  );

-- Create index on scans.pipeline_state for fast status polling
CREATE INDEX IF NOT EXISTS idx_scans_pipeline_state ON scans(pipeline_state);
CREATE INDEX IF NOT EXISTS idx_scans_user_id_status ON scans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);