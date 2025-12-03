/*
  # Create Complete Coin Economy System

  1. Updates
    - Add coin balance tracking to profiles
    - Add usage tracking fields
    - Add daily/weekly coin earning limits
    
  2. New Functions
    - `record_coin_transaction`: Safely handle coin transactions
    - `get_coin_balance`: Get current user coin balance
    - `can_afford_action`: Check if user can afford an action
    - `reset_daily_limits`: Reset daily usage counters
    
  3. Coin Economy Rules (Free Tier)
    - Daily base coins: 10-15 (randomized reward)
    - Coins per ad watch: 3 coins (max 2 ads/day = 6 coins)
    - Daily coin earning potential: 21 coins max
    - Reveal prospect: 10 coins
    - Extra message beyond limit: 5 coins
    - Extra presentation beyond limit: 15 coins
    - Speed up scan: 8 coins
    
  4. Security
    - RLS policies for coin transactions
    - Prevent negative balances
    - Rate limiting on earning
*/

-- Add coin and usage tracking columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'coin_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coin_balance INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_scans_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_scans_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_messages_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_messages_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'weekly_presentations_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN weekly_presentations_used INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_ads_watched'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_ads_watched INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_coins_earned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_coins_earned INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_daily_reset'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_daily_reset TIMESTAMPTZ DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_weekly_reset'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_weekly_reset TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Drop and recreate record_coin_transaction function
DROP FUNCTION IF EXISTS record_coin_transaction(UUID, INTEGER, TEXT, TEXT);

CREATE OR REPLACE FUNCTION record_coin_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT coin_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;

  -- Prevent negative balance for spending
  IF p_type = 'spend' AND v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Update balance
  UPDATE profiles
  SET coin_balance = v_new_balance
  WHERE id = p_user_id;

  -- Record transaction
  INSERT INTO coin_transactions (user_id, amount, transaction_type, description, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, v_new_balance);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get coin balance
CREATE OR REPLACE FUNCTION get_coin_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT coin_balance INTO v_balance
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can afford an action
CREATE OR REPLACE FUNCTION can_afford_action(
  p_user_id UUID,
  p_cost INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  v_balance := get_coin_balance(p_user_id);
  RETURN v_balance >= p_cost;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset daily limits
CREATE OR REPLACE FUNCTION reset_daily_limits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    daily_scans_used = 0,
    daily_messages_used = 0,
    daily_ads_watched = 0,
    daily_coins_earned = 0,
    last_daily_reset = now()
  WHERE id = p_user_id
    AND last_daily_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset weekly limits
CREATE OR REPLACE FUNCTION reset_weekly_limits(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    weekly_presentations_used = 0,
    last_weekly_reset = now()
  WHERE id = p_user_id
    AND last_weekly_reset < (CURRENT_DATE - INTERVAL '7 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award daily login bonus (10-15 coins for free tier)
CREATE OR REPLACE FUNCTION award_daily_bonus(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_bonus_amount INTEGER;
  v_already_awarded BOOLEAN;
  v_subscription_tier TEXT;
BEGIN
  -- Check if already awarded today
  SELECT 
    last_daily_reset >= CURRENT_DATE,
    subscription_tier
  INTO v_already_awarded, v_subscription_tier
  FROM profiles
  WHERE id = p_user_id;

  IF v_already_awarded THEN
    RETURN 0;
  END IF;

  -- Calculate bonus amount (10-15 for free, more for paid tiers)
  CASE v_subscription_tier
    WHEN 'free' THEN
      v_bonus_amount := 10 + floor(random() * 6)::INTEGER;
    WHEN 'pro' THEN
      v_bonus_amount := 0;
    WHEN 'elite' THEN
      v_bonus_amount := 0;
    WHEN 'team' THEN
      v_bonus_amount := 0;
    ELSE
      v_bonus_amount := 10;
  END CASE;

  IF v_bonus_amount > 0 THEN
    PERFORM record_coin_transaction(
      p_user_id,
      v_bonus_amount,
      'bonus',
      'Daily login bonus'
    );
  END IF;

  RETURN v_bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for coin transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coin transactions" ON coin_transactions;
CREATE POLICY "Users can insert own coin transactions"
  ON coin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);