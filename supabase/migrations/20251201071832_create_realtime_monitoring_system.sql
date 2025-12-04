/*
  # Real-Time Monitoring System

  1. New Tables
    - `realtime_engine_events`
      - Real-time event broadcasting for live monitoring
    - `orchestrator_queue`
      - Job queue management
    - `engine_performance_metrics`
      - Performance tracking

  2. Security
    - Enable RLS on all tables
    - Appropriate access policies
*/

-- ============================================================================
-- REALTIME ENGINE EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS realtime_engine_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text NOT NULL,
  event_type text NOT NULL,
  job_id uuid,
  user_id uuid REFERENCES auth.users(id),
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_realtime_engine_events_created_at
  ON realtime_engine_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_engine_events_engine_id
  ON realtime_engine_events(engine_id);
CREATE INDEX IF NOT EXISTS idx_realtime_engine_events_event_type
  ON realtime_engine_events(event_type);

-- Enable realtime
ALTER TABLE realtime_engine_events REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE realtime_engine_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view realtime events"
  ON realtime_engine_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert realtime events"
  ON realtime_engine_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- ORCHESTRATOR QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orchestrator_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  job_type text NOT NULL,
  sub_type text,
  payload jsonb,
  status text DEFAULT 'QUEUED',
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_queue_status
  ON orchestrator_queue(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_queue_priority
  ON orchestrator_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_orchestrator_queue_user_id
  ON orchestrator_queue(user_id);

-- RLS
ALTER TABLE orchestrator_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue items"
  ON orchestrator_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue items"
  ON orchestrator_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update queue items"
  ON orchestrator_queue
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- ENGINE PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS engine_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_id text NOT NULL,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  total_jobs int DEFAULT 0,
  successful_jobs int DEFAULT 0,
  failed_jobs int DEFAULT 0,
  avg_duration_ms numeric,
  max_duration_ms numeric,
  min_duration_ms numeric,
  error_rate numeric,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_engine_performance_metrics_engine_id
  ON engine_performance_metrics(engine_id);
CREATE INDEX IF NOT EXISTS idx_engine_performance_metrics_window
  ON engine_performance_metrics(window_start DESC);

-- RLS
ALTER TABLE engine_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view performance metrics"
  ON engine_performance_metrics
  FOR SELECT
  TO authenticated
  USING (true);