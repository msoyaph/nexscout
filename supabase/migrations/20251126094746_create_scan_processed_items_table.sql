/*
  # Create Scan Processed Items Table

  1. New Tables
    - `scan_processed_items`
      - `id` (uuid, primary key)
      - `scan_id` (uuid, foreign key to scans)
      - `type` (text - 'text', 'post', 'friend')
      - `name` (text)
      - `content` (text)
      - `score` (numeric)
      - `source_image_id` (uuid)
      - `raw_ocr_text` (text)
      - `detected_numbers` (jsonb)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

  2. Indexes
    - Index on scan_id for fast lookup
    - Index on type for filtering
    - Index on score for sorting

  3. Security
    - Enable RLS on `scan_processed_items` table
    - Add policy for users to read their own processed items
*/

CREATE TABLE IF NOT EXISTS scan_processed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text', 'post', 'friend', 'event', 'interest')),
  name text,
  content text,
  score numeric(5, 2) DEFAULT 0,
  source_image_id uuid,
  raw_ocr_text text,
  detected_numbers jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_processed_items_scan_id ON scan_processed_items(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_processed_items_type ON scan_processed_items(type);
CREATE INDEX IF NOT EXISTS idx_scan_processed_items_score ON scan_processed_items(score DESC);

ALTER TABLE scan_processed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan processed items"
  ON scan_processed_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own scan processed items"
  ON scan_processed_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own scan processed items"
  ON scan_processed_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own scan processed items"
  ON scan_processed_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scans
      WHERE scans.id = scan_processed_items.scan_id
      AND scans.user_id = auth.uid()
    )
  );