/*
  # Scan Optimization Toolkit v1.0 - Performance Tracking Tables

  1. New Tables
    - `scan_benchmarks`
      - Tracks end-to-end scan performance metrics
      - Records timing for parse, extract, score, and DB write stages
      - Calculates averages (ms/prospect, prospects/second)

    - `llm_load_tests`
      - Tracks LLM extraction and scoring load test results
      - Records batch performance, API call durations, error rates
      - Supports extraction-only, scoring-only, and full pipeline modes

    - `csv_validation_logs`
      - Tracks CSV validation attempts
      - Records validation issues and cleaned CSV availability
      - Helps identify common CSV formatting problems

  2. Security
    - Enable RLS on all tables
    - Admin-only access for viewing and inserting benchmarks
    - User-level access for CSV validation logs
    - Aggregate metrics only (no PII)

  3. Performance
    - Add indexes on created_at for time-based queries
    - Add indexes on source_type and mode for filtering
*/

-- Scan Benchmarks Table
CREATE TABLE IF NOT EXISTS scan_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('paste_text', 'csv_upload', 'screenshot_upload')),
  total_prospects integer NOT NULL CHECK (total_prospects >= 0),
  parse_ms integer CHECK (parse_ms >= 0),
  extract_ms integer CHECK (extract_ms >= 0),
  score_ms integer CHECK (score_ms >= 0),
  db_write_ms integer CHECK (db_write_ms >= 0),
  total_ms integer NOT NULL CHECK (total_ms >= 0),
  ms_per_prospect numeric CHECK (ms_per_prospect >= 0),
  prospects_per_second numeric CHECK (prospects_per_second >= 0),
  simulate_only boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- LLM Load Tests Table
CREATE TABLE IF NOT EXISTS llm_load_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('extraction', 'scoring', 'full')),
  batches integer NOT NULL CHECK (batches > 0),
  batch_size integer NOT NULL CHECK (batch_size > 0),
  parallel_batches integer NOT NULL CHECK (parallel_batches > 0),
  total_calls integer NOT NULL CHECK (total_calls >= 0),
  total_ms integer NOT NULL CHECK (total_ms >= 0),
  avg_ms_per_call numeric CHECK (avg_ms_per_call >= 0),
  max_ms_per_call integer CHECK (max_ms_per_call >= 0),
  min_ms_per_call integer CHECK (min_ms_per_call >= 0),
  errors integer DEFAULT 0 CHECK (errors >= 0),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- CSV Validation Logs Table
CREATE TABLE IF NOT EXISTS csv_validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  total_rows integer NOT NULL CHECK (total_rows >= 0),
  valid_rows integer NOT NULL CHECK (valid_rows >= 0),
  issue_count integer DEFAULT 0 CHECK (issue_count >= 0),
  issues jsonb DEFAULT '[]'::jsonb,
  had_cleaned_version boolean DEFAULT false,
  file_size_kb integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scan_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_load_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_validation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scan_benchmarks
CREATE POLICY "Admins can view all scan benchmarks"
  ON scan_benchmarks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert scan benchmarks"
  ON scan_benchmarks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for llm_load_tests
CREATE POLICY "Admins can view all LLM load tests"
  ON llm_load_tests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert LLM load tests"
  ON llm_load_tests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for csv_validation_logs
CREATE POLICY "Users can view own CSV validation logs"
  ON csv_validation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CSV validation logs"
  ON csv_validation_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_benchmarks_created_at ON scan_benchmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_benchmarks_source_type ON scan_benchmarks(source_type);
CREATE INDEX IF NOT EXISTS idx_scan_benchmarks_user_id ON scan_benchmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_llm_load_tests_created_at ON llm_load_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_load_tests_mode ON llm_load_tests(mode);
CREATE INDEX IF NOT EXISTS idx_llm_load_tests_user_id ON llm_load_tests(user_id);

CREATE INDEX IF NOT EXISTS idx_csv_validation_logs_created_at ON csv_validation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_csv_validation_logs_user_id ON csv_validation_logs(user_id);
