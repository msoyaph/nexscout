/*
  # Complete Synergy Layer - Remaining Tables

  Creates:
  - synergy_links
  - synergy_routing_rules
  - synergy_engine_logs
  - synergy_metrics
*/

-- =====================================================
-- SYNERGY LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS synergy_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  from_type text NOT NULL,
  from_id uuid NOT NULL,

  to_type text NOT NULL,
  to_id uuid NOT NULL,

  relation text NOT NULL,
  weight numeric(5,2) DEFAULT 1.0,

  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_synergy_links_user ON synergy_links(user_id);
CREATE INDEX IF NOT EXISTS idx_synergy_links_from ON synergy_links(from_type, from_id);
CREATE INDEX IF NOT EXISTS idx_synergy_links_to ON synergy_links(to_type, to_id);
CREATE INDEX IF NOT EXISTS idx_synergy_links_relation ON synergy_links(relation);
CREATE INDEX IF NOT EXISTS idx_synergy_links_bidirectional ON synergy_links(from_type, from_id, to_type, to_id);

-- =====================================================
-- SYNERGY ROUTING RULES
-- =====================================================

CREATE TABLE IF NOT EXISTS synergy_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  event_type_pattern text NOT NULL,
  target_engines text[] NOT NULL,
  
  conditions jsonb DEFAULT '{}'::jsonb,
  
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  
  is_async boolean DEFAULT true,
  retry_on_failure boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_synergy_routing_active ON synergy_routing_rules(is_active, priority DESC);

-- =====================================================
-- SYNERGY ENGINE LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS synergy_engine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synergy_event_id uuid REFERENCES synergy_events(id) ON DELETE CASCADE NOT NULL,
  
  target_engine text NOT NULL,
  status text NOT NULL,
  
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  
  success boolean,
  error_message text,
  result_data jsonb,
  
  attempt_number integer DEFAULT 1,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_synergy_engine_logs_event ON synergy_engine_logs(synergy_event_id);
CREATE INDEX IF NOT EXISTS idx_synergy_engine_logs_status ON synergy_engine_logs(status);
CREATE INDEX IF NOT EXISTS idx_synergy_engine_logs_engine ON synergy_engine_logs(target_engine);

-- =====================================================
-- SYNERGY METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS synergy_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  period_type text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  
  chatbot_messages integer DEFAULT 0,
  prospects_scanned integer DEFAULT 0,
  deep_scans_completed integer DEFAULT 0,
  deals_closed integer DEFAULT 0,
  deals_lost integer DEFAULT 0,
  meetings_booked integer DEFAULT 0,
  products_pitched integer DEFAULT 0,
  products_purchased integer DEFAULT 0,
  
  total_revenue numeric(12,2) DEFAULT 0,
  avg_deal_size numeric(10,2) DEFAULT 0,
  
  total_energy_used integer DEFAULT 0,
  total_coins_used integer DEFAULT 0,
  
  total_events integer DEFAULT 0,
  successful_engine_calls integer DEFAULT 0,
  failed_engine_calls integer DEFAULT 0,
  avg_event_processing_time_ms integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_synergy_metrics_user_period ON synergy_metrics(user_id, period_type, period_start DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synergy_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE synergy_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synergy_engine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synergy_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own synergy links"
  ON synergy_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own synergy links"
  ON synergy_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view routing rules"
  ON synergy_routing_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view engine logs for their events"
  ON synergy_engine_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM synergy_events
      WHERE synergy_events.id = synergy_engine_logs.synergy_event_id
      AND synergy_events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own synergy metrics"
  ON synergy_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);