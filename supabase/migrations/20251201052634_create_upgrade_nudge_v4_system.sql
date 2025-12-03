/*
  # Upgrade Nudge System v4.0 - Behavioral Fingerprints & Dynamic Pricing
  
  1. Tables
    - upgrade_behavior_fingerprints: Track user behavior patterns
    - upgrade_offer_events: Track dynamic offers shown
    - dynamic_pricing_rules: Configurable pricing rules
    - surge_events: Track activity surges
    - roi_predictions: Predicted earnings from upgrades
    
  2. Functions
    - detect_surge_event: Detect activity spikes
    - calculate_dynamic_price: Calculate personalized pricing
    - predict_upgrade_roi: Estimate revenue potential
    - get_behavioral_fingerprint: Get user behavior profile
    
  3. Security
    - RLS enabled on all tables
    - Users can see only their own data
*/

-- Behavioral Fingerprints Table
CREATE TABLE IF NOT EXISTS upgrade_behavior_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  metric_value jsonb DEFAULT '{}'::jsonb,
  pattern_type text,
  confidence_score decimal(3,2),
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Upgrade Offer Events Table
CREATE TABLE IF NOT EXISTS upgrade_offer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_variant text NOT NULL,
  emotion_state text,
  roi_estimate numeric DEFAULT 0,
  behavior_pattern text,
  discount_amount int DEFAULT 0,
  final_price int NOT NULL,
  original_price int NOT NULL,
  surge_triggered boolean DEFAULT false,
  peak_window boolean DEFAULT false,
  shown_at timestamptz DEFAULT now(),
  clicked boolean DEFAULT false,
  clicked_at timestamptz,
  upgraded boolean DEFAULT false,
  upgraded_at timestamptz,
  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Dynamic Pricing Rules Table
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL UNIQUE,
  description text,
  condition jsonb NOT NULL,
  discount_percentage int DEFAULT 0,
  discount_amount int DEFAULT 0,
  max_discount int DEFAULT 500,
  active boolean DEFAULT true,
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Surge Events Table
CREATE TABLE IF NOT EXISTS surge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  surge_type text NOT NULL,
  metric_value numeric NOT NULL,
  threshold numeric NOT NULL,
  detected_at timestamptz DEFAULT now(),
  nudge_shown boolean DEFAULT false,
  converted boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- ROI Predictions Table
CREATE TABLE IF NOT EXISTS roi_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_from text NOT NULL,
  upgrade_to text NOT NULL,
  predicted_monthly_revenue numeric DEFAULT 0,
  predicted_leads_increase int DEFAULT 0,
  predicted_time_saved_hours decimal(5,2) DEFAULT 0,
  confidence_score decimal(3,2),
  calculation_basis jsonb,
  calculated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behavior_fingerprints_user ON upgrade_behavior_fingerprints(user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_fingerprints_metric ON upgrade_behavior_fingerprints(metric_key);
CREATE INDEX IF NOT EXISTS idx_offer_events_user ON upgrade_offer_events(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_events_emotion ON upgrade_offer_events(emotion_state);
CREATE INDEX IF NOT EXISTS idx_surge_events_user ON surge_events(user_id);
CREATE INDEX IF NOT EXISTS idx_surge_events_type ON surge_events(surge_type);
CREATE INDEX IF NOT EXISTS idx_roi_predictions_user ON roi_predictions(user_id);

-- Enable RLS
ALTER TABLE upgrade_behavior_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_offer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE surge_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users view own fingerprints"
  ON upgrade_behavior_fingerprints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own fingerprints"
  ON upgrade_behavior_fingerprints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own offer events"
  ON upgrade_offer_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own offer events"
  ON upgrade_offer_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own offer events"
  ON upgrade_offer_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view pricing rules"
  ON dynamic_pricing_rules FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Users view own surge events"
  ON surge_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own surge events"
  ON surge_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own ROI predictions"
  ON roi_predictions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function: Detect Surge Event
CREATE OR REPLACE FUNCTION detect_surge_event(
  p_user_id uuid,
  p_surge_type text,
  p_metric_value numeric,
  p_threshold numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_surge_id uuid;
  v_recent_surge timestamptz;
BEGIN
  -- Check if surge already detected recently (within 1 hour)
  SELECT MAX(detected_at) INTO v_recent_surge
  FROM surge_events
  WHERE user_id = p_user_id
    AND surge_type = p_surge_type
    AND detected_at > (now() - INTERVAL '1 hour');

  -- Only create if no recent surge of same type
  IF v_recent_surge IS NULL AND p_metric_value >= p_threshold THEN
    INSERT INTO surge_events (
      user_id,
      surge_type,
      metric_value,
      threshold,
      metadata
    )
    VALUES (
      p_user_id,
      p_surge_type,
      p_metric_value,
      p_threshold,
      jsonb_build_object('detected_value', p_metric_value, 'threshold', p_threshold)
    )
    RETURNING id INTO v_surge_id;

    RETURN v_surge_id;
  END IF;

  RETURN NULL;
END;
$$;

-- Function: Calculate Dynamic Price
CREATE OR REPLACE FUNCTION calculate_dynamic_price(
  p_user_id uuid,
  p_base_price int,
  p_tier text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount int := 0;
  v_rule record;
  v_user_data jsonb;
BEGIN
  -- Get user behavior data (simplified)
  v_user_data := jsonb_build_object(
    'has_surge', EXISTS(SELECT 1 FROM surge_events WHERE user_id = p_user_id AND detected_at > now() - INTERVAL '2 hours'),
    'high_usage', EXISTS(SELECT 1 FROM upgrade_behavior_fingerprints WHERE user_id = p_user_id AND metric_key = 'high_activity')
  );

  -- Find applicable pricing rules (highest priority first)
  FOR v_rule IN 
    SELECT * FROM dynamic_pricing_rules
    WHERE active = true
    ORDER BY priority DESC
    LIMIT 1
  LOOP
    -- Apply discount (simplified - in production would evaluate jsonb conditions)
    IF v_user_data->>'has_surge' = 'true' THEN
      v_discount := LEAST(v_rule.max_discount, v_rule.discount_amount);
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'original_price', p_base_price,
    'discount', v_discount,
    'final_price', p_base_price - v_discount,
    'discount_reason', CASE WHEN v_discount > 0 THEN 'surge_activity' ELSE NULL END
  );
END;
$$;

-- Function: Predict Upgrade ROI
CREATE OR REPLACE FUNCTION predict_upgrade_roi(
  p_user_id uuid,
  p_from_tier text,
  p_to_tier text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_revenue numeric := 0;
  v_predicted_revenue numeric := 0;
  v_multiplier numeric := 3.0; -- Default 3x multiplier
BEGIN
  -- Get current performance metrics (simplified)
  -- In production, would analyze actual user data
  
  -- Calculate predictions based on tier
  IF p_to_tier = 'PRO' THEN
    v_predicted_revenue := v_current_revenue * v_multiplier;
  ELSIF p_to_tier = 'TEAM' THEN
    v_predicted_revenue := v_current_revenue * 5.0;
  END IF;

  -- Store prediction
  INSERT INTO roi_predictions (
    user_id,
    upgrade_from,
    upgrade_to,
    predicted_monthly_revenue,
    predicted_leads_increase,
    confidence_score,
    calculation_basis
  )
  VALUES (
    p_user_id,
    p_from_tier,
    p_to_tier,
    v_predicted_revenue,
    CASE WHEN p_to_tier = 'PRO' THEN 50 ELSE 200 END,
    0.75,
    jsonb_build_object('method', 'tier_multiplier', 'multiplier', v_multiplier)
  );

  RETURN jsonb_build_object(
    'predicted_monthly_revenue', v_predicted_revenue,
    'predicted_leads_increase', CASE WHEN p_to_tier = 'PRO' THEN 50 ELSE 200 END,
    'confidence', 0.75
  );
END;
$$;

-- Insert default pricing rules
INSERT INTO dynamic_pricing_rules (rule_name, description, condition, discount_amount, max_discount, priority)
VALUES
  ('surge_activity_discount', 'Discount during surge activity', '{"surge": true}'::jsonb, 200, 200, 10),
  ('high_engagement_discount', 'Discount for highly engaged users', '{"engagement": "high"}'::jsonb, 150, 150, 5),
  ('first_time_discount', 'First upgrade discount', '{"first_upgrade": true}'::jsonb, 100, 100, 3)
ON CONFLICT (rule_name) DO NOTHING;