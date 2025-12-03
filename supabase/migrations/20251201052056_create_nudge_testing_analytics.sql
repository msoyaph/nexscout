/*
  # Nudge A/B Testing & Analytics System
  
  1. Tables
    - nudge_tests: Track nudge variants and user interactions
    - nudge_conversions: Track successful upgrades from nudges
    - nudge_analytics_summary: Aggregated performance metrics
    
  2. Functions
    - track_nudge_shown: Record nudge display
    - track_nudge_clicked: Record nudge click
    - track_nudge_conversion: Record successful upgrade
    - get_nudge_performance: Get analytics for specific nudge
    
  3. Security
    - RLS enabled
    - Users can only see their own nudge interactions
    - Admins can see aggregated analytics
*/

-- Nudge Tests Table
CREATE TABLE IF NOT EXISTS nudge_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_key text NOT NULL,
  variant text NOT NULL,
  trigger_type text NOT NULL,
  emotional_state text,
  tier text NOT NULL,
  target_tier text NOT NULL,
  shown_at timestamptz DEFAULT now(),
  clicked boolean DEFAULT false,
  clicked_at timestamptz,
  upgraded boolean DEFAULT false,
  upgraded_at timestamptz,
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  time_on_screen_ms int,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Nudge Conversions Table
CREATE TABLE IF NOT EXISTS nudge_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_test_id uuid REFERENCES nudge_tests(id) ON DELETE SET NULL,
  from_tier text NOT NULL,
  to_tier text NOT NULL,
  trigger_type text NOT NULL,
  emotional_state text,
  revenue_amount int NOT NULL,
  time_to_conversion_seconds int,
  variant text,
  converted_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Nudge Analytics Summary (Materialized View)
CREATE TABLE IF NOT EXISTS nudge_analytics_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_key text NOT NULL,
  variant text NOT NULL,
  trigger_type text NOT NULL,
  emotional_state text,
  total_shown int DEFAULT 0,
  total_clicked int DEFAULT 0,
  total_upgraded int DEFAULT 0,
  total_dismissed int DEFAULT 0,
  ctr_percentage decimal(5,2),
  conversion_percentage decimal(5,2),
  avg_time_to_click_ms int,
  avg_time_to_conversion_seconds int,
  total_revenue int DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nudge_tests_user ON nudge_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_tests_key_variant ON nudge_tests(test_key, variant);
CREATE INDEX IF NOT EXISTS idx_nudge_tests_trigger ON nudge_tests(trigger_type);
CREATE INDEX IF NOT EXISTS idx_nudge_tests_emotional ON nudge_tests(emotional_state);
CREATE INDEX IF NOT EXISTS idx_nudge_tests_shown_at ON nudge_tests(shown_at);
CREATE INDEX IF NOT EXISTS idx_nudge_conversions_user ON nudge_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_conversions_trigger ON nudge_conversions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_nudge_analytics_key ON nudge_analytics_summary(test_key, variant);

-- Enable RLS
ALTER TABLE nudge_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudge_analytics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own nudge tests"
  ON nudge_tests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nudge tests"
  ON nudge_tests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nudge tests"
  ON nudge_tests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own conversions"
  ON nudge_conversions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversions"
  ON nudge_conversions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Analytics summary is read-only for all authenticated users
CREATE POLICY "Anyone can view analytics summary"
  ON nudge_analytics_summary FOR SELECT
  TO authenticated
  USING (true);

-- Function: Track nudge shown
CREATE OR REPLACE FUNCTION track_nudge_shown(
  p_user_id uuid,
  p_test_key text,
  p_variant text,
  p_trigger_type text,
  p_emotional_state text DEFAULT NULL,
  p_tier text DEFAULT 'FREE',
  p_target_tier text DEFAULT 'PRO',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test_id uuid;
BEGIN
  INSERT INTO nudge_tests (
    user_id,
    test_key,
    variant,
    trigger_type,
    emotional_state,
    tier,
    target_tier,
    metadata
  )
  VALUES (
    p_user_id,
    p_test_key,
    p_variant,
    p_trigger_type,
    p_emotional_state,
    p_tier,
    p_target_tier,
    p_metadata
  )
  RETURNING id INTO v_test_id;

  RETURN v_test_id;
END;
$$;

-- Function: Track nudge clicked
CREATE OR REPLACE FUNCTION track_nudge_clicked(
  p_test_id uuid,
  p_time_on_screen_ms int DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE nudge_tests
  SET 
    clicked = true,
    clicked_at = now(),
    time_on_screen_ms = p_time_on_screen_ms
  WHERE id = p_test_id;

  RETURN FOUND;
END;
$$;

-- Function: Track nudge conversion
CREATE OR REPLACE FUNCTION track_nudge_conversion(
  p_test_id uuid,
  p_from_tier text,
  p_to_tier text,
  p_revenue_amount int
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversion_id uuid;
  v_test record;
  v_time_diff int;
BEGIN
  -- Get test details
  SELECT * INTO v_test FROM nudge_tests WHERE id = p_test_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nudge test not found';
  END IF;

  -- Calculate time to conversion
  v_time_diff := EXTRACT(EPOCH FROM (now() - v_test.shown_at))::int;

  -- Update test record
  UPDATE nudge_tests
  SET 
    upgraded = true,
    upgraded_at = now()
  WHERE id = p_test_id;

  -- Insert conversion record
  INSERT INTO nudge_conversions (
    user_id,
    nudge_test_id,
    from_tier,
    to_tier,
    trigger_type,
    emotional_state,
    revenue_amount,
    time_to_conversion_seconds,
    variant
  )
  VALUES (
    v_test.user_id,
    p_test_id,
    p_from_tier,
    p_to_tier,
    v_test.trigger_type,
    v_test.emotional_state,
    p_revenue_amount,
    v_time_diff,
    v_test.variant
  )
  RETURNING id INTO v_conversion_id;

  RETURN v_conversion_id;
END;
$$;

-- Function: Get nudge performance
CREATE OR REPLACE FUNCTION get_nudge_performance(
  p_test_key text DEFAULT NULL,
  p_days_back int DEFAULT 30
)
RETURNS TABLE (
  test_key text,
  variant text,
  trigger_type text,
  shown_count bigint,
  clicked_count bigint,
  upgraded_count bigint,
  ctr decimal,
  conversion_rate decimal,
  avg_time_to_click decimal,
  revenue bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nt.test_key,
    nt.variant,
    nt.trigger_type,
    COUNT(*)::bigint as shown_count,
    COUNT(CASE WHEN nt.clicked THEN 1 END)::bigint as clicked_count,
    COUNT(CASE WHEN nt.upgraded THEN 1 END)::bigint as upgraded_count,
    ROUND((COUNT(CASE WHEN nt.clicked THEN 1 END)::decimal / NULLIF(COUNT(*)::decimal, 0)) * 100, 2) as ctr,
    ROUND((COUNT(CASE WHEN nt.upgraded THEN 1 END)::decimal / NULLIF(COUNT(*)::decimal, 0)) * 100, 2) as conversion_rate,
    ROUND(AVG(nt.time_on_screen_ms)::decimal / 1000, 2) as avg_time_to_click,
    COALESCE(SUM(nc.revenue_amount), 0)::bigint as revenue
  FROM nudge_tests nt
  LEFT JOIN nudge_conversions nc ON nc.nudge_test_id = nt.id
  WHERE 
    nt.shown_at >= (CURRENT_DATE - p_days_back)
    AND (p_test_key IS NULL OR nt.test_key = p_test_key)
  GROUP BY nt.test_key, nt.variant, nt.trigger_type
  ORDER BY shown_count DESC;
END;
$$;