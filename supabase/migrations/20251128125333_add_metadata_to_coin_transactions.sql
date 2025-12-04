/*
  # Add metadata column to coin_transactions

  1. Changes
    - Add `metadata` jsonb column to coin_transactions table
    - Allows storing additional context for transactions (prospect_id, message_type, etc.)
  
  2. Purpose
    - Enable tracking of transaction context for AI features
    - Store arbitrary key-value data with each transaction
    - No data loss - existing transactions remain intact
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coin_transactions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE coin_transactions ADD COLUMN metadata jsonb;
  END IF;
END $$;