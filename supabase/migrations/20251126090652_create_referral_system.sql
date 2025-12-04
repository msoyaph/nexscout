/*
  # Create Referral System

  1. New Tables
    - `referrals`
      - `id` (uuid, primary key)
      - `referrer_user_id` (uuid, references auth.users)
      - `referrer_code` (text, unique)
      - `referred_user_id` (uuid, references auth.users, nullable)
      - `referred_email` (text)
      - `status` (text: pending, completed, rewarded)
      - `signup_completed_at` (timestamptz)
      - `subscription_upgraded_at` (timestamptz)
      - `signup_reward_given` (boolean, default false)
      - `upgrade_reward_given` (boolean, default false)
      - `created_at` (timestamptz)

    - `referral_codes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `code` (text, unique)
      - `total_signups` (integer, default 0)
      - `total_upgrades` (integer, default 0)
      - `total_coins_earned` (integer, default 0)
      - `total_pesos_earned` (numeric, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their referrals
    
  3. Functions
    - Auto-generate unique referral code for new users
    - Track referral rewards
*/

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code text UNIQUE NOT NULL,
  total_signups integer DEFAULT 0,
  total_upgrades integer DEFAULT 0,
  total_coins_earned integer DEFAULT 0,
  total_pesos_earned numeric(10, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referrer_code text NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  signup_completed_at timestamptz,
  subscription_upgraded_at timestamptz,
  signup_reward_given boolean DEFAULT false,
  upgrade_reward_given boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code"
  ON referral_codes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own referral stats"
  ON referral_codes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they made"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_user_id);

CREATE POLICY "Users can view referrals where they are referred"
  ON referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);

CREATE POLICY "System can insert referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to create referral code for new users
CREATE OR REPLACE FUNCTION create_user_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO referral_codes (user_id, code)
  VALUES (NEW.id, generate_referral_code())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create referral code
DROP TRIGGER IF EXISTS on_user_created_referral_code ON auth.users;
CREATE TRIGGER on_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_referral_code();

-- Function to process referral signup reward
CREATE OR REPLACE FUNCTION process_referral_signup(
  p_referrer_code text,
  p_referred_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referral_id uuid;
BEGIN
  SELECT user_id INTO v_referrer_user_id
  FROM referral_codes
  WHERE code = p_referrer_code;
  
  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;
  
  INSERT INTO referrals (
    referrer_user_id,
    referrer_code,
    referred_user_id,
    status,
    signup_completed_at
  )
  VALUES (
    v_referrer_user_id,
    p_referrer_code,
    p_referred_user_id,
    'completed',
    now()
  )
  RETURNING id INTO v_referral_id;
  
  UPDATE referral_codes
  SET total_signups = total_signups + 1
  WHERE user_id = v_referrer_user_id;
  
  INSERT INTO coin_transactions (
    user_id,
    amount,
    type,
    description
  )
  VALUES (
    v_referrer_user_id,
    100,
    'earn',
    'Referral bonus: Friend signed up'
  );
  
  UPDATE users_profile
  SET coin_balance = coin_balance + 100
  WHERE id = v_referrer_user_id;
  
  UPDATE referral_codes
  SET total_coins_earned = total_coins_earned + 100
  WHERE user_id = v_referrer_user_id;
  
  UPDATE referrals
  SET signup_reward_given = true
  WHERE id = v_referral_id;
END;
$$;

-- Function to process referral upgrade reward
CREATE OR REPLACE FUNCTION process_referral_upgrade(
  p_referred_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_user_id uuid;
  v_referral_id uuid;
BEGIN
  SELECT referrer_user_id, id
  INTO v_referrer_user_id, v_referral_id
  FROM referrals
  WHERE referred_user_id = p_referred_user_id
    AND upgrade_reward_given = false
  LIMIT 1;
  
  IF v_referrer_user_id IS NULL THEN
    RETURN;
  END IF;
  
  UPDATE referrals
  SET 
    subscription_upgraded_at = now(),
    upgrade_reward_given = true
  WHERE id = v_referral_id;
  
  UPDATE referral_codes
  SET 
    total_upgrades = total_upgrades + 1,
    total_pesos_earned = total_pesos_earned + 50
  WHERE user_id = v_referrer_user_id;
END;
$$;