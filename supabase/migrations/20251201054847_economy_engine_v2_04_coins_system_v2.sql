/*
  # Economy Engine 2.0 - Coins System v2

  1. New Tables
    - `coin_transactions` - Complete coin transaction history

  2. Changes
    - Tracks earn/spend events
    - Multiple trigger types: scan, message, pitch_deck, revival, reward, referral, pack_purchase
    - Stores balance_after for audit trail
    - JSONB metadata for flexibility

  3. Security
    - Indexed on user_id for performance
*/

DROP TABLE IF EXISTS coin_transactions CASCADE;

CREATE TABLE coin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    trigger TEXT NOT NULL,
    coins INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX coin_transactions_user_id_idx ON coin_transactions(user_id);
