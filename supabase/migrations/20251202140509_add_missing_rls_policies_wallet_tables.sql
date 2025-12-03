/*
  # Add Missing RLS Policies - Wallet Tables

  1. Security Fix
    - Add RLS policies to wallet-related tables
    - Ensure users can only access their own financial data
    
  2. Tables Affected
    - user_profiles (wallet fields)
    - coin_transactions
    - pending_coin_transactions
    - energy_transactions
    
  3. Security
    - Restrictive policies
    - Users access only their own data
*/

-- Ensure coin_transactions has proper policies
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert own coin transactions" ON coin_transactions;

CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "System can insert coin transactions"
  ON coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- pending_coin_transactions policies
DROP POLICY IF EXISTS "Users can view own pending transactions" ON pending_coin_transactions;

CREATE POLICY "Users can view own pending transactions"
  ON pending_coin_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "System can insert pending transactions"
  ON pending_coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "System can update pending transactions"
  ON pending_coin_transactions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- energy_transactions policies
DROP POLICY IF EXISTS "Users can view own energy txns" ON energy_transactions;

CREATE POLICY "Users can view own energy txns"
  ON energy_transactions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "System can insert energy txns"
  ON energy_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);