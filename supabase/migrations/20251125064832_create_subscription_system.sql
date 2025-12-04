/*
  # Create Subscription System

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text) - Plan name (Starter, Professional, Enterprise)
      - `display_name` (text) - Display name (Pro, Elite, etc.)
      - `price_monthly` (numeric) - Monthly price
      - `price_annual` (numeric) - Annual price
      - `coin_bonus_monthly` (integer) - Monthly coin bonus
      - `coin_bonus_annual` (integer) - Annual coin bonus
      - `max_prospects` (integer) - Maximum prospects allowed
      - `features` (jsonb) - Plan features array
      - `created_at` (timestamptz)
      
    - `user_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `plan_id` (uuid, foreign key to subscription_plans)
      - `billing_cycle` (text) - monthly or annual
      - `status` (text) - active, cancelled, expired, trial
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `cancel_at_period_end` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Updates
    - Add subscription-related columns to `profiles` table
      - `subscription_end_date` (timestamptz)
      - `monthly_coin_bonus` (integer)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to read their own subscriptions
    - Add policies for subscription plan access
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  price_monthly numeric(10, 2) NOT NULL DEFAULT 0,
  price_annual numeric(10, 2) NOT NULL DEFAULT 0,
  coin_bonus_monthly integer NOT NULL DEFAULT 0,
  coin_bonus_annual integer NOT NULL DEFAULT 0,
  max_prospects integer NOT NULL DEFAULT 100,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')) DEFAULT 'monthly',
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')) DEFAULT 'trial',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON user_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add subscription columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_end_date'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN subscription_end_date timestamptz,
    ADD COLUMN monthly_coin_bonus integer DEFAULT 0;
  END IF;
END $$;

-- Insert default subscription plans
INSERT INTO subscription_plans (name, display_name, price_monthly, price_annual, coin_bonus_monthly, coin_bonus_annual, max_prospects, features)
VALUES
  (
    'free',
    'Free',
    0,
    0,
    50,
    0,
    50,
    '["Up to 50 prospects", "Basic AI scoring", "Email tracking", "3 email templates", "Mobile app access"]'::jsonb
  ),
  (
    'starter',
    'Starter',
    29,
    278.40,
    100,
    1200,
    100,
    '["Up to 100 prospects", "Basic AI scoring", "Email tracking", "5 email templates", "Mobile app access", "100 bonus coins/month"]'::jsonb
  ),
  (
    'pro',
    'Pro',
    79,
    758.40,
    300,
    3600,
    1000,
    '["Up to 1,000 prospects", "Advanced AI scoring & insights", "Email & call tracking", "Unlimited templates", "AI task generation", "Team collaboration (5 users)", "Priority support", "300 bonus coins/month"]'::jsonb
  ),
  (
    'elite',
    'Elite',
    199,
    1910.40,
    1000,
    12000,
    999999,
    '["Unlimited prospects", "Custom AI models", "Full platform access", "Unlimited users", "Advanced integrations", "Dedicated account manager", "24/7 premium support", "Custom SLA", "1000 bonus coins/month"]'::jsonb
  )
ON CONFLICT (name) DO NOTHING;

-- Create function to sync subscription to profile
CREATE OR REPLACE FUNCTION sync_subscription_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    subscription_tier = (SELECT name FROM subscription_plans WHERE id = NEW.plan_id),
    subscription_end_date = NEW.current_period_end,
    monthly_coin_bonus = (
      SELECT CASE 
        WHEN NEW.billing_cycle = 'monthly' THEN coin_bonus_monthly
        ELSE coin_bonus_annual / 12
      END
      FROM subscription_plans 
      WHERE id = NEW.plan_id
    )
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync subscription changes
DROP TRIGGER IF EXISTS sync_subscription_trigger ON user_subscriptions;
CREATE TRIGGER sync_subscription_trigger
  AFTER INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_to_profile();

-- Create function to award monthly coin bonus
CREATE OR REPLACE FUNCTION award_monthly_coin_bonus()
RETURNS void AS $$
BEGIN
  UPDATE profiles p
  SET coins_balance = coins_balance + COALESCE(p.monthly_coin_bonus, 0)
  FROM user_subscriptions us
  WHERE p.id = us.user_id
    AND us.status = 'active'
    AND us.current_period_start::date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;