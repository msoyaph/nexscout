/*
  # Team Billing RLS Policies
  
  Adds row-level security policies for team billing features.
*/

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Team owners view subscription" ON team_subscriptions;
DROP POLICY IF EXISTS "Team owners update subscription" ON team_subscriptions;
DROP POLICY IF EXISTS "Team owners insert subscription" ON team_subscriptions;
DROP POLICY IF EXISTS "Team owners view members" ON team_members;
DROP POLICY IF EXISTS "Members view own record" ON team_members;
DROP POLICY IF EXISTS "Team owners manage members" ON team_members;

-- Ensure RLS is enabled
ALTER TABLE team_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team Subscriptions Policies
CREATE POLICY "Team owners view subscription"
  ON team_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_user_id OR auth.uid() = team_leader_id);

CREATE POLICY "Team owners update subscription"
  ON team_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id OR auth.uid() = team_leader_id)
  WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = team_leader_id);

CREATE POLICY "Team owners insert subscription"
  ON team_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id OR auth.uid() = team_leader_id);

-- Team Members Policies
CREATE POLICY "Team owners view members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_user_id OR
    auth.uid() IN (
      SELECT team_leader_id FROM team_subscriptions WHERE id = team_id
    )
  );

CREATE POLICY "Members view own record"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Team owners manage members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    auth.uid() = owner_user_id OR
    auth.uid() IN (
      SELECT team_leader_id FROM team_subscriptions WHERE id = team_id
    )
  )
  WITH CHECK (
    auth.uid() = owner_user_id OR
    auth.uid() IN (
      SELECT team_leader_id FROM team_subscriptions WHERE id = team_id
    )
  );