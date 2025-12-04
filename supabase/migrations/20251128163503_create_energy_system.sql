/*
  # NexScout Energy Engine v1.0
  
  1. Purpose
    - Control AI usage costs and protect profitability
    - Drive monetization through energy economy
    - Improve user experience with game-like rewards
    - Tier-based energy allocation
  
  2. New Tables
    - user_energy: Track daily energy availability per user
    - energy_transactions: Record all energy gains and usage
    - energy_costs: Configurable costs per AI feature
    - energy_purchases: Track energy purchases with coins
  
  3. Features
    - Daily energy regeneration
    - Tier-based energy caps (Free: 5, Pro: 25, Elite: 99, Team: 150, Enterprise: unlimited)
    - Energy consumption tracking per AI action
    - Purchase energy with coins
    - Mission rewards integration
*/

-- User Energy Table
CREATE TABLE IF NOT EXISTS user_energy (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_energy integer NOT NULL DEFAULT 0,
  max_energy integer NOT NULL DEFAULT 5,
  last_reset timestamptz DEFAULT now(),
  tier text NOT NULL DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Energy Transactions Table
CREATE TABLE IF NOT EXISTS energy_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  energy_change integer NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT event_type_check CHECK (
    event_type IN (
      'regeneration',
      'purchase',
      'action_cost',
      'mission_reward',
      'refill',
      'admin_adjust'
    )
  )
);

-- Energy Costs Table
CREATE TABLE IF NOT EXISTS energy_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text UNIQUE NOT NULL,
  energy_cost integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Energy Purchases Table
CREATE TABLE IF NOT EXISTS energy_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  coins_spent integer NOT NULL,
  energy_granted integer NOT NULL,
  source text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT source_check CHECK (source IN ('coins', 'ads', 'premium_bonus'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_energy_user_id ON user_energy(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_user_id ON energy_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_transactions_created_at ON energy_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_energy_purchases_user_id ON energy_purchases(user_id);

-- Enable RLS
ALTER TABLE user_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_energy
CREATE POLICY "Users can view own energy"
  ON user_energy FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own energy"
  ON user_energy FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for energy_transactions
CREATE POLICY "Users can view own transactions"
  ON energy_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON energy_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for energy_costs
CREATE POLICY "Anyone can view energy costs"
  ON energy_costs FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for energy_purchases
CREATE POLICY "Users can view own purchases"
  ON energy_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON energy_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Seed energy costs
INSERT INTO energy_costs (feature, energy_cost, description) VALUES
  ('ai_message', 1, 'AI-generated high-conversion message'),
  ('ai_objection', 1, 'AI objection handler'),
  ('ai_sequence', 3, 'AI follow-up sequence generation'),
  ('ai_pitchdeck', 5, 'AI pitch deck generator'),
  ('ai_deepscan', 3, 'AI deep prospect scan'),
  ('ai_prospect_analysis', 2, 'AI prospect scoring and analysis'),
  ('ai_team_coaching', 3, 'AI team coaching plan'),
  ('ai_emotional_response', 1, 'AI emotional persuasion layer')
ON CONFLICT (feature) DO NOTHING;

-- Function to create default energy for new users
CREATE OR REPLACE FUNCTION create_user_energy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_energy (user_id, current_energy, max_energy, tier)
  VALUES (NEW.id, 5, 5, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create energy on user creation
DROP TRIGGER IF EXISTS on_user_created_energy ON auth.users;
CREATE TRIGGER on_user_created_energy
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_energy();

-- Function to regenerate daily energy
CREATE OR REPLACE FUNCTION regenerate_daily_energy()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  hours_since_reset numeric;
BEGIN
  FOR user_record IN 
    SELECT user_id, current_energy, max_energy, last_reset, tier
    FROM user_energy
  LOOP
    hours_since_reset := EXTRACT(EPOCH FROM (now() - user_record.last_reset)) / 3600;
    
    -- Reset if more than 24 hours
    IF hours_since_reset >= 24 THEN
      UPDATE user_energy
      SET 
        current_energy = max_energy,
        last_reset = now(),
        updated_at = now()
      WHERE user_id = user_record.user_id;
      
      -- Log regeneration
      INSERT INTO energy_transactions (user_id, event_type, energy_change, reason)
      VALUES (
        user_record.user_id,
        'regeneration',
        user_record.max_energy - user_record.current_energy,
        'Daily energy regeneration'
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
