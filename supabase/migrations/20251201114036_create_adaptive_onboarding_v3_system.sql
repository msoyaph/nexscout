/*
  # Adaptive Onboarding v3.0 - Personalized AI-Driven Onboarding

  1. New Tables
    - `onboarding_personalization` - Tracks persona and chosen variant per user
    - `onboarding_events` - Event log for all onboarding actions
    - `onboarding_journey_state` - Current state of user's onboarding journey
    - `onboarding_variant_stats` - A/B test performance metrics

  2. Features
    - Persona detection (MLM leader, insurance agent, etc.)
    - Multi-variant onboarding paths
    - Event-driven progression
    - Real-time adaptation based on behavior
    - A/B test tracking and optimization

  3. Security
    - Full RLS on all tables
    - User-scoped access
    - Admin analytics access
*/

-- Onboarding Personalization Table
CREATE TABLE IF NOT EXISTS onboarding_personalization (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  persona text NOT NULL,
  chosen_variant text NOT NULL,
  confidence_score float DEFAULT 0.8,
  override_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_personalization ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_personalization_persona ON onboarding_personalization(persona);
CREATE INDEX IF NOT EXISTS idx_onboarding_personalization_variant ON onboarding_personalization(chosen_variant);

CREATE POLICY "Users can view own personalization"
  ON onboarding_personalization FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personalization"
  ON onboarding_personalization FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personalization"
  ON onboarding_personalization FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Onboarding Events Table
CREATE TABLE IF NOT EXISTS onboarding_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  session_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_created ON onboarding_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_session ON onboarding_events(session_id);

CREATE POLICY "Users can view own events"
  ON onboarding_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON onboarding_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Onboarding Journey State Table
CREATE TABLE IF NOT EXISTS onboarding_journey_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_steps text[] DEFAULT '{}',
  current_step text,
  last_event text,
  step_order jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE onboarding_journey_state ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_journey_state_current_step ON onboarding_journey_state(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_journey_state_updated ON onboarding_journey_state(last_updated DESC);

CREATE POLICY "Users can view own journey state"
  ON onboarding_journey_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey state"
  ON onboarding_journey_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey state"
  ON onboarding_journey_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Onboarding Variant Stats Table
CREATE TABLE IF NOT EXISTS onboarding_variant_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona text NOT NULL,
  variant text NOT NULL,
  users_assigned integer DEFAULT 0,
  users_activated integer DEFAULT 0,
  users_churned integer DEFAULT 0,
  avg_ttv_seconds integer DEFAULT 0,
  avg_time_to_first_aha integer DEFAULT 0,
  retention_7d float DEFAULT 0,
  retention_30d float DEFAULT 0,
  activation_rate float DEFAULT 0,
  last_calculated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(persona, variant)
);

ALTER TABLE onboarding_variant_stats ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_onboarding_variant_stats_persona ON onboarding_variant_stats(persona);
CREATE INDEX IF NOT EXISTS idx_onboarding_variant_stats_variant ON onboarding_variant_stats(variant);
CREATE INDEX IF NOT EXISTS idx_onboarding_variant_stats_activation ON onboarding_variant_stats(activation_rate DESC);

CREATE POLICY "Admins can view variant stats"
  ON onboarding_variant_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage variant stats"
  ON onboarding_variant_stats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Function to update journey state
CREATE OR REPLACE FUNCTION update_onboarding_journey_state()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journey_state_timestamp
  BEFORE UPDATE ON onboarding_journey_state
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_journey_state();

-- Function to update personalization timestamp
CREATE OR REPLACE FUNCTION update_onboarding_personalization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personalization_timestamp
  BEFORE UPDATE ON onboarding_personalization
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_personalization_timestamp();

-- Seed initial variant stats for common persona/variant combinations
INSERT INTO onboarding_variant_stats (persona, variant, users_assigned, users_activated, activation_rate)
VALUES
  ('mlm_newbie', 'fast_track_90s', 0, 0, 0),
  ('mlm_newbie', 'guided_step_by_step', 0, 0, 0),
  ('mlm_newbie', 'chatbot_first', 0, 0, 0),
  ('mlm_leader', 'fast_track_90s', 0, 0, 0),
  ('mlm_leader', 'pipeline_first', 0, 0, 0),
  ('insurance_agent', 'fast_track_90s', 0, 0, 0),
  ('insurance_agent', 'guided_step_by_step', 0, 0, 0),
  ('real_estate_agent', 'fast_track_90s', 0, 0, 0),
  ('real_estate_agent', 'chatbot_first', 0, 0, 0),
  ('online_seller', 'fast_track_90s', 0, 0, 0),
  ('online_seller', 'scanner_first', 0, 0, 0),
  ('service_provider', 'guided_step_by_step', 0, 0, 0),
  ('power_user_unknown', 'fast_track_90s', 0, 0, 0)
ON CONFLICT (persona, variant) DO NOTHING;