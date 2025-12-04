/*
  # NexScout Smart Scanner v2.0 System

  1. New Tables
    - `uploaded_batches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `source_type` (text: screenshot, file, text, fb)
      - `file_count` (integer)
      - `text_length` (integer)
      - `status` (text: processing, completed, failed)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `uploaded_files`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to uploaded_batches)
      - `filename` (text)
      - `file_url` (text)
      - `file_size` (bigint)
      - `file_type` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `extracted_entities`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to uploaded_batches)
      - `raw_text` (text)
      - `entity_name` (text)
      - `entity_type` (text)
      - `confidence_score` (numeric)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `ai_smartness`
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `uploads_count` (integer)
      - `unique_sources` (integer)
      - `smartness_score` (integer: 0-100)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create uploaded_batches table
CREATE TABLE IF NOT EXISTS uploaded_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('screenshot', 'file', 'text', 'fb')),
  file_count integer DEFAULT 0,
  text_length integer DEFAULT 0,
  status text DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create uploaded_files table
CREATE TABLE IF NOT EXISTS uploaded_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES uploaded_batches(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create extracted_entities table
CREATE TABLE IF NOT EXISTS extracted_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES uploaded_batches(id) ON DELETE CASCADE NOT NULL,
  raw_text text,
  entity_name text,
  entity_type text,
  confidence_score numeric(5,2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ai_smartness table
CREATE TABLE IF NOT EXISTS ai_smartness (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  uploads_count integer DEFAULT 0,
  unique_sources integer DEFAULT 0,
  smartness_score integer DEFAULT 0 CHECK (smartness_score >= 0 AND smartness_score <= 100),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_uploaded_batches_user_id ON uploaded_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_batches_created_at ON uploaded_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_batch_id ON uploaded_files(batch_id);
CREATE INDEX IF NOT EXISTS idx_extracted_entities_batch_id ON extracted_entities(batch_id);

-- Enable Row Level Security
ALTER TABLE uploaded_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_smartness ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_batches
CREATE POLICY "Users can view own batches"
  ON uploaded_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batches"
  ON uploaded_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batches"
  ON uploaded_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own batches"
  ON uploaded_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view own files"
  ON uploaded_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own files"
  ON uploaded_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own files"
  ON uploaded_files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own files"
  ON uploaded_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = uploaded_files.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

-- RLS Policies for extracted_entities
CREATE POLICY "Users can view own entities"
  ON extracted_entities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own entities"
  ON extracted_entities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own entities"
  ON extracted_entities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own entities"
  ON extracted_entities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_batches
      WHERE uploaded_batches.id = extracted_entities.batch_id
      AND uploaded_batches.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_smartness
CREATE POLICY "Users can view own smartness"
  ON ai_smartness FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own smartness"
  ON ai_smartness FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smartness"
  ON ai_smartness FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically initialize ai_smartness for new users
CREATE OR REPLACE FUNCTION initialize_user_smartness()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO ai_smartness (user_id, uploads_count, unique_sources, smartness_score)
  VALUES (NEW.user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize smartness when first batch is created
CREATE OR REPLACE TRIGGER trigger_initialize_smartness
  AFTER INSERT ON uploaded_batches
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_smartness();

-- Function to update smartness score
CREATE OR REPLACE FUNCTION update_smartness_score()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uploads_count integer;
  v_unique_sources integer;
  v_smartness_score integer;
BEGIN
  SELECT COUNT(*), COUNT(DISTINCT source_type)
  INTO v_uploads_count, v_unique_sources
  FROM uploaded_batches
  WHERE user_id = NEW.user_id AND status = 'completed';

  v_smartness_score := LEAST(100, (v_uploads_count * 7) + (v_unique_sources * 15));

  INSERT INTO ai_smartness (user_id, uploads_count, unique_sources, smartness_score, updated_at)
  VALUES (NEW.user_id, v_uploads_count, v_unique_sources, v_smartness_score, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    uploads_count = v_uploads_count,
    unique_sources = v_unique_sources,
    smartness_score = v_smartness_score,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update smartness when batch status changes to completed
CREATE OR REPLACE TRIGGER trigger_update_smartness
  AFTER INSERT OR UPDATE OF status ON uploaded_batches
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_smartness_score();
