/*
  # Create Pending Coin Transactions System

  1. New Table
    - `pending_coin_transactions`: Track pending transactions before completion
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (integer) - positive or negative
      - `transaction_type` (text) - spend, earn, bonus, etc.
      - `description` (text)
      - `status` (text) - pending, completed, failed, refunded
      - `reference_id` (text) - link to pitch_deck or sequence id
      - `failure_reason` (text)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Purpose
    - Allow creating pending transactions without immediate deduction
    - Support rollback if AI generation fails
    - Provide transaction audit trail
    - Enable refund mechanism

  3. Security
    - Enable RLS
    - Users can only view/manage their own pending transactions
*/

-- Create pending_coin_transactions table
CREATE TABLE IF NOT EXISTS pending_coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'bonus', 'purchase', 'ad_reward')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  reference_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_user_id ON pending_coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_status ON pending_coin_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_reference_id ON pending_coin_transactions(reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pending_coin_transactions_created_at ON pending_coin_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE pending_coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own pending transactions"
  ON pending_coin_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pending transactions"
  ON pending_coin_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending transactions"
  ON pending_coin_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-complete pending transaction after timeout (optional cleanup)
CREATE OR REPLACE FUNCTION cleanup_stale_pending_transactions()
RETURNS void AS $$
BEGIN
  -- Mark transactions pending for more than 1 hour as failed
  UPDATE pending_coin_transactions
  SET
    status = 'failed',
    failure_reason = 'Transaction timeout - exceeded 1 hour',
    completed_at = now()
  WHERE
    status = 'pending'
    AND created_at < (now() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add reference_id to coin_transactions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coin_transactions' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE coin_transactions ADD COLUMN reference_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_coin_transactions_reference_id ON coin_transactions(reference_id) WHERE reference_id IS NOT NULL;
  END IF;
END $$;