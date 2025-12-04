/*
  # Economy Engine 2.0 - Energy System v3

  1. New Tables
    - `energy_transactions` - Complete energy transaction history

  2. Changes
    - Tracks regenerate/spend/bonus/pack_purchase
    - Adds energy_balance and coin_balance to profiles
    - Stores balance_after for audit trail

  3. Security
    - Indexed on user_id for performance
*/

DROP TABLE IF EXISTS energy_transactions CASCADE;

CREATE TABLE energy_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    energy INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add balance columns to profiles if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'energy_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN energy_balance INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'coin_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coin_balance INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX energy_transactions_user_idx ON energy_transactions(user_id);
