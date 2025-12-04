/*
  # Enable RLS on Economy Engine Tables - All Correct

  1. Security
    - Enable RLS on all Economy Engine v2.0 tables
    - Add restrictive policies for authenticated users
  
  2. Tables Protected
    - All 13 tables with correct column references
*/

-- Enable RLS
ALTER TABLE agent_revenue_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterprise_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasable_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- agent_revenue_reports
CREATE POLICY "Users can view own revenue reports"
  ON agent_revenue_reports FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own revenue reports"
  ON agent_revenue_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- coin_transactions
DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own coin transactions" ON coin_transactions;
CREATE POLICY "Users can insert own coin transactions"
  ON coin_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- energy_transactions
DROP POLICY IF EXISTS "Users can view own energy trans" ON energy_transactions;
CREATE POLICY "Users can view own energy trans"
  ON energy_transactions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own energy trans" ON energy_transactions;
CREATE POLICY "Users can insert own energy trans"
  ON energy_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- enterprise_members
CREATE POLICY "Users can view enterprise members if member"
  ON enterprise_members FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM enterprise_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Enterprise admins can manage members"
  ON enterprise_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprise_members em
      WHERE em.org_id = enterprise_members.org_id 
        AND em.user_id = (SELECT auth.uid())
        AND em.role IN ('owner', 'admin')
    )
  );

-- enterprise_orgs
CREATE POLICY "Users can view orgs they belong to"
  ON enterprise_orgs FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT org_id FROM enterprise_members WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Enterprise owners can update org"
  ON enterprise_orgs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enterprise_members 
      WHERE org_id = enterprise_orgs.id 
        AND user_id = (SELECT auth.uid())
        AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enterprise_members 
      WHERE org_id = enterprise_orgs.id 
        AND user_id = (SELECT auth.uid())
        AND role = 'owner'
    )
  );

-- pricing_history
CREATE POLICY "Authenticated users can view pricing history"
  ON pricing_history FOR SELECT
  TO authenticated
  USING (true);

-- purchasable_packs
CREATE POLICY "Authenticated users can view packs"
  ON purchasable_packs FOR SELECT
  TO authenticated
  USING (true);

-- referral_events
CREATE POLICY "Users can view own referral events"
  ON referral_events FOR SELECT
  TO authenticated
  USING (referrer_user_id = (SELECT auth.uid()) OR referred_user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert referral events"
  ON referral_events FOR INSERT
  TO authenticated
  WITH CHECK (referrer_user_id = (SELECT auth.uid()) OR referred_user_id = (SELECT auth.uid()));

-- subscription_plans
CREATE POLICY "Authenticated users can view plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- team_members
CREATE POLICY "Users can view team members if member"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = (SELECT auth.uid())
    ) OR owner_user_id = (SELECT auth.uid())
  );

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));

-- team_subscriptions
CREATE POLICY "Team owners can view subscription"
  ON team_subscriptions FOR SELECT
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));

CREATE POLICY "Team owners can manage subscription"
  ON team_subscriptions FOR ALL
  TO authenticated
  USING (owner_user_id = (SELECT auth.uid()));

-- upgrade_events
CREATE POLICY "Users can view own upgrade events"
  ON upgrade_events FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert upgrade events"
  ON upgrade_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own subscription"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own subscription"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
