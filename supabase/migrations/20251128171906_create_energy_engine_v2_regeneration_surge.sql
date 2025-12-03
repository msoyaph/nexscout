/*
  # Energy Engine v2.0 - AI Regeneration & Surge Pricing

  1. New Tables
    - `energy_regeneration_events`
      - Tracks all energy regeneration events
      - Multiple regeneration types (daily, streak, behavioral, etc.)
      - Metadata for ML analysis

    - `surge_pricing_windows`
      - Time-based pricing windows
      - Feature-specific multipliers
      - Happy hour and peak hour support

    - `user_energy_patterns`
      - ML-driven user behavior tracking
      - Predictive regeneration
      - Usage patterns analysis

  2. Schema Updates
    - Enhanced `user_energy` with regeneration tracking
    - Streak bonuses and inactivity tracking
    - Dynamic multipliers

  3. Security
    - RLS enabled on all tables
    - User-specific access controls
*/

-- Energy Regeneration Events
CREATE TABLE IF NOT EXISTS energy_regeneration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL CHECK (reason IN (
    'daily_reset',
    'inactivity_bonus',
    'streak_bonus',
    'closing_bonus',
    'low_energy_rescue',
    'behavioral_regen',
    'happy_hour',
    'surge_discount',
    'ml_recommendation',
    'mission_completion',
    'upgrade_bonus',
    'referral_bonus',
    'productivity_boost'
  )),
  energy_amount integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Surge Pricing Windows
CREATE TABLE IF NOT EXISTS surge_pricing_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  multiplier numeric NOT NULL DEFAULT 1.0,
  applies_to text[] DEFAULT ARRAY['ai_pitchdeck','ai_deepscan','ai_sequence','ai_message','ai_chatbot','ai_scanner'],
  is_active boolean DEFAULT true,
  days_of_week integer[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Energy Patterns (ML-driven)
CREATE TABLE IF NOT EXISTS user_energy_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  peak_usage_hours integer[] DEFAULT '{}',
  avg_daily_consumption integer DEFAULT 0,
  last_7_days_consumption integer DEFAULT 0,
  predicted_next_usage timestamptz,
  regen_multiplier numeric DEFAULT 1.0,
  behavior_score numeric DEFAULT 0.5,
  efficiency_score numeric DEFAULT 0.5,
  last_analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced User Energy (add columns if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'streak_days'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN streak_days integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'inactivity_days'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN inactivity_days integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'last_activity_at'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN last_activity_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'regen_multiplier'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN regen_multiplier numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'surge_multiplier'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN surge_multiplier numeric DEFAULT 1.0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'last_regen_at'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN last_regen_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'next_regen_at'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN next_regen_at timestamptz DEFAULT (now() + interval '1 hour');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_energy' AND column_name = 'regen_rate_per_hour'
  ) THEN
    ALTER TABLE user_energy ADD COLUMN regen_rate_per_hour integer DEFAULT 1;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE energy_regeneration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE surge_pricing_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_energy_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for energy_regeneration_events
CREATE POLICY "Users can view own regeneration events"
  ON energy_regeneration_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own regeneration events"
  ON energy_regeneration_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for surge_pricing_windows (read-only for users)
CREATE POLICY "Users can view active surge windows"
  ON surge_pricing_windows FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_energy_patterns
CREATE POLICY "Users can view own energy patterns"
  ON user_energy_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own energy patterns"
  ON user_energy_patterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own energy patterns"
  ON user_energy_patterns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_energy_regen_user ON energy_regeneration_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_regen_reason ON energy_regeneration_events(reason);
CREATE INDEX IF NOT EXISTS idx_surge_windows_time ON surge_pricing_windows(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_surge_windows_active ON surge_pricing_windows(is_active);
CREATE INDEX IF NOT EXISTS idx_user_energy_patterns_user ON user_energy_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_energy_last_activity ON user_energy(user_id, last_activity_at);

-- Seed default surge pricing windows
INSERT INTO surge_pricing_windows (name, start_time, end_time, multiplier, applies_to) VALUES
  ('Peak Evening', '21:00:00', '23:00:00', 1.2, ARRAY['ai_pitchdeck','ai_deepscan','ai_sequence','ai_chatbot']),
  ('Happy Hour Afternoon', '14:00:00', '16:00:00', 0.8, ARRAY['ai_pitchdeck','ai_deepscan','ai_sequence','ai_message','ai_chatbot']),
  ('Morning Advantage', '06:00:00', '10:00:00', 0.85, ARRAY['ai_pitchdeck','ai_deepscan','ai_sequence']),
  ('Late Night Premium', '23:00:00', '02:00:00', 1.3, ARRAY['ai_pitchdeck','ai_deepscan'])
ON CONFLICT DO NOTHING;

-- Function to auto-create energy pattern for new users
CREATE OR REPLACE FUNCTION create_default_energy_pattern()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_energy_patterns (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create pattern when energy is created
DROP TRIGGER IF EXISTS create_energy_pattern_on_signup ON user_energy;
CREATE TRIGGER create_energy_pattern_on_signup
  AFTER INSERT ON user_energy
  FOR EACH ROW
  EXECUTE FUNCTION create_default_energy_pattern();