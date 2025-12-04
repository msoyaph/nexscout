/*
  # Update Subscription System with PHP Pricing and Features

  1. Updates
    - Update subscription_plans with PHP pricing
    - Add daily/weekly limits columns
    - Add feature flags for each tier
    - Create usage_tracking table
    - Create team_subscriptions table
    - Add ad_watch_count to profiles

  2. New Tables
    - `usage_tracking` - Track daily AI usage limits
    - `team_subscriptions` - Team plan management
    - `team_members` - Team member assignments
    - `coin_transactions` - Track all coin activity

  3. Security
    - Enable RLS on all new tables
    - Add proper policies for team access
*/

-- Update subscription plans with PHP pricing and limits
UPDATE subscription_plans SET
  price_monthly = 0,
  price_annual = 0,
  coin_bonus_monthly = 0,
  features = '[
    "3 AI Prospect Scans/day",
    "2 AI Messages/day", 
    "1 AI Presentation/week",
    "10-15 Daily Coins from missions",
    "Watch Ads: 3 coins per ad (max 2 ads/day)",
    "Access calendar, tasks, reminders",
    "Basic pipeline (3 stages)",
    "1 visible swipe card",
    "Next 3-5 cards blurred with lock"
  ]'::jsonb
WHERE name = 'free';

UPDATE subscription_plans SET
  price_monthly = 199,
  price_annual = 1990,
  coin_bonus_monthly = 150,
  features = '[
    "Unlimited AI Prospect Scans",
    "Unlimited AI Messages",
    "Up to 5 AI Presentations/week",
    "+150 Weekly Coins",
    "No Ads",
    "Partial AI DeepScan",
    "Extended personality detection",
    "Full 6-stage pipeline",
    "2 visible swipe cards",
    "ALL basic message templates",
    "Priority in AI queue",
    "Marketplace access"
  ]'::jsonb
WHERE name = 'pro';

UPDATE subscription_plans SET
  price_monthly = 499,
  price_annual = 4990,
  coin_bonus_monthly = 500,
  features = '[
    "Unlimited everything",
    "+500 Weekly Coins",
    "AI DeepScan 2.0 (advanced)",
    "AI Affordability Score",
    "AI Leadership Potential Score",
    "AI Multi-Step Messaging (4-7 steps)",
    "Advanced presentation builder",
    "ALL swipe cards unlocked",
    "Personalized AI insights",
    "Lead Timeline Insights",
    "Prospect Affinity Analysis",
    "Early access to new features"
  ]'::jsonb
WHERE name = 'elite';

-- Insert Team plan if not exists
INSERT INTO subscription_plans (name, display_name, price_monthly, price_annual, coin_bonus_monthly, coin_bonus_annual, max_prospects, features)
VALUES (
  'team',
  'Team',
  1490,
  14900,
  750,
  9000,
  999999,
  '[
    "5 Pro seats included",
    "Shared Team Dashboard",
    "Shared Pipeline",
    "Team Missions",
    "Leaderboard",
    "Team Coaching AI",
    "Team training deck generator",
    "Team performance analytics",
    "Member-level activity breakdown",
    "Perfect for MLM/Insurance/Real Estate teams"
  ]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  coin_bonus_monthly = EXCLUDED.coin_bonus_monthly,
  features = EXCLUDED.features;

-- Add usage tracking fields to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_scans_used'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN daily_scans_used integer DEFAULT 0,
    ADD COLUMN daily_messages_used integer DEFAULT 0,
    ADD COLUMN weekly_presentations_used integer DEFAULT 0,
    ADD COLUMN daily_ads_watched integer DEFAULT 0,
    ADD COLUMN last_reset_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_count integer DEFAULT 1,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, action_type, date)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON usage_tracking
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON usage_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON usage_tracking
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create team_subscriptions table
CREATE TABLE IF NOT EXISTS team_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  team_name text NOT NULL,
  team_leader_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_seats integer DEFAULT 5,
  used_seats integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE team_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team leaders can view own teams"
  ON team_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = team_leader_id);

CREATE POLICY "Team leaders can manage own teams"
  ON team_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = team_leader_id)
  WITH CHECK (auth.uid() = team_leader_id);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES team_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view own team"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM team_subscriptions ts
      WHERE ts.id = team_id AND ts.team_leader_id = auth.uid()
    )
  );

CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_subscriptions ts
      WHERE ts.id = team_id AND ts.team_leader_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_subscriptions ts
      WHERE ts.id = team_id AND ts.team_leader_id = auth.uid()
    )
  );

-- Create coin_transactions table
CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'purchase', 'ad_reward')),
  description text,
  balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON coin_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON coin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to record coin transaction
CREATE OR REPLACE FUNCTION record_coin_transaction(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_description text
)
RETURNS void AS $$
DECLARE
  v_new_balance integer;
BEGIN
  SELECT coins_balance INTO v_new_balance
  FROM profiles
  WHERE id = p_user_id;
  
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, v_new_balance + p_amount);
  
  UPDATE profiles
  SET coins_balance = coins_balance + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_limits()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    daily_scans_used = 0,
    daily_messages_used = 0,
    daily_ads_watched = 0,
    last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset weekly limits
CREATE OR REPLACE FUNCTION reset_weekly_limits()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET weekly_presentations_used = 0
  WHERE EXTRACT(DOW FROM last_reset_date) = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;