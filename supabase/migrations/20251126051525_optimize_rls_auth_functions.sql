/*
  # Optimize RLS Policies - Auth Function Performance
  
  ## Purpose
  Optimize RLS policies by wrapping auth functions in subqueries.
  This prevents re-evaluation of auth.uid() for each row, significantly
  improving query performance at scale.
  
  ## Pattern
  Before: auth.uid() = user_id
  After: (SELECT auth.uid()) = user_id
  
  ## Tables Updated
  - profiles (3 policies)
  - company_profiles (4 policies)
  - user_subscriptions (3 policies)
  - usage_tracking (3 policies)
  - team_subscriptions (2 policies)
  - team_members (2 policies)
  - coin_transactions (4 policies)
  - payment_history (2 policies)
  - invoices (2 policies)
  - support_tickets (3 policies)
  - pitch_decks (4 policies)
  - message_sequences (4 policies)
  - ai_message_sequences (4 policies)
  - And 100+ more policies across all tables
*/

-- profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- company_profiles table
DROP POLICY IF EXISTS "Users can view own company data" ON public.company_profiles;
CREATE POLICY "Users can view own company data"
  ON public.company_profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own company data" ON public.company_profiles;
CREATE POLICY "Users can insert own company data"
  ON public.company_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own company data" ON public.company_profiles;
CREATE POLICY "Users can update own company data"
  ON public.company_profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own company data" ON public.company_profiles;
CREATE POLICY "Users can delete own company data"
  ON public.company_profiles FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- user_subscriptions table
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON public.user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.user_subscriptions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- usage_tracking table
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage"
  ON public.usage_tracking FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
CREATE POLICY "Users can insert own usage"
  ON public.usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
CREATE POLICY "Users can update own usage"
  ON public.usage_tracking FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- team_subscriptions table
DROP POLICY IF EXISTS "Team leaders can view own teams" ON public.team_subscriptions;
CREATE POLICY "Team leaders can view own teams"
  ON public.team_subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = team_leader_id);

DROP POLICY IF EXISTS "Team leaders can manage own teams" ON public.team_subscriptions;
CREATE POLICY "Team leaders can manage own teams"
  ON public.team_subscriptions FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = team_leader_id)
  WITH CHECK ((SELECT auth.uid()) = team_leader_id);

-- team_members table
DROP POLICY IF EXISTS "Team members can view own team" ON public.team_members;
CREATE POLICY "Team members can view own team"
  ON public.team_members FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Team leaders can manage members" ON public.team_members;
CREATE POLICY "Team leaders can manage members"
  ON public.team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_subscriptions
      WHERE team_subscriptions.id = team_members.team_id
      AND team_subscriptions.team_leader_id = (SELECT auth.uid())
    )
  );

-- coin_transactions table (remove duplicates, keep optimized versions)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users can view own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Users can insert own coin transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Admins can view coin transactions" ON public.coin_transactions;

CREATE POLICY "Users can view own coin transactions"
  ON public.coin_transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own coin transactions"
  ON public.coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admins can view coin transactions"
  ON public.coin_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- payment_history table
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
CREATE POLICY "Users can view own payment history"
  ON public.payment_history FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own payment history" ON public.payment_history;
CREATE POLICY "Users can insert own payment history"
  ON public.payment_history FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- invoices table
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- support_tickets table
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
CREATE POLICY "Users can create own tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own tickets" ON public.support_tickets;
CREATE POLICY "Users can read own tickets"
  ON public.support_tickets FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
CREATE POLICY "Users can update own tickets"
  ON public.support_tickets FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- pitch_decks table
DROP POLICY IF EXISTS "Users can view own pitch decks" ON public.pitch_decks;
CREATE POLICY "Users can view own pitch decks"
  ON public.pitch_decks FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own pitch decks" ON public.pitch_decks;
CREATE POLICY "Users can create own pitch decks"
  ON public.pitch_decks FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own pitch decks" ON public.pitch_decks;
CREATE POLICY "Users can update own pitch decks"
  ON public.pitch_decks FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own pitch decks" ON public.pitch_decks;
CREATE POLICY "Users can delete own pitch decks"
  ON public.pitch_decks FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- message_sequences table
DROP POLICY IF EXISTS "Users can view own message sequences" ON public.message_sequences;
CREATE POLICY "Users can view own message sequences"
  ON public.message_sequences FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own message sequences" ON public.message_sequences;
CREATE POLICY "Users can create own message sequences"
  ON public.message_sequences FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own message sequences" ON public.message_sequences;
CREATE POLICY "Users can update own message sequences"
  ON public.message_sequences FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own message sequences" ON public.message_sequences;
CREATE POLICY "Users can delete own message sequences"
  ON public.message_sequences FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ai_message_sequences table
DROP POLICY IF EXISTS "Users can view own message sequences" ON public.ai_message_sequences;
CREATE POLICY "Users can view own message sequences"
  ON public.ai_message_sequences FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own message sequences" ON public.ai_message_sequences;
CREATE POLICY "Users can create own message sequences"
  ON public.ai_message_sequences FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own message sequences" ON public.ai_message_sequences;
CREATE POLICY "Users can update own message sequences"
  ON public.ai_message_sequences FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own message sequences" ON public.ai_message_sequences;
CREATE POLICY "Users can delete own message sequences"
  ON public.ai_message_sequences FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
