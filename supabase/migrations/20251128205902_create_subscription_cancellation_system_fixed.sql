/*
  # Subscription Cancellation System

  1. New Tables
    - `subscription_cancellation_reasons` - Tracks why users cancel
    - `subscription_retention_offers` - Tracks retention offer attempts
    
  2. Features
    - Cancel reason tracking
    - User feedback capture
    - Usage statistics at cancellation
    - Retention offer tracking
    - Contact-back preferences
    
  3. Security
    - RLS enabled
    - User can only see their own data
*/

-- Create cancellation reasons table
CREATE TABLE IF NOT EXISTS subscription_cancellation_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_tier text NOT NULL,
  reason_primary text NOT NULL,
  reason_secondary text,
  additional_feedback text,
  contact_back boolean DEFAULT false,
  usage_scans integer DEFAULT 0,
  usage_messages integer DEFAULT 0,
  usage_chatbot integer DEFAULT 0,
  company_name text,
  plan_remaining_days integer,
  created_at timestamptz DEFAULT now()
);

-- Create retention offers table
CREATE TABLE IF NOT EXISTS subscription_retention_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_tier text NOT NULL,
  offer_type text NOT NULL,
  offer_value text,
  offer_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_user_id ON subscription_cancellation_reasons(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_created_at ON subscription_cancellation_reasons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_tier ON subscription_cancellation_reasons(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_reason ON subscription_cancellation_reasons(reason_primary);
CREATE INDEX IF NOT EXISTS idx_retention_offers_user_id ON subscription_retention_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_retention_offers_accepted ON subscription_retention_offers(offer_accepted);

-- Enable RLS
ALTER TABLE subscription_cancellation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_retention_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cancellation_reasons
CREATE POLICY "Users can view own cancellation reasons"
  ON subscription_cancellation_reasons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cancellation reasons"
  ON subscription_cancellation_reasons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for retention_offers
CREATE POLICY "Users can view own retention offers"
  ON subscription_retention_offers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retention offers"
  ON subscription_retention_offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retention offers"
  ON subscription_retention_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
