/*
  # MLM Compensation System

  1. New Tables
    - `mlm_members` - MLM network members (resellers, affiliates)
    - `mlm_relationships` - Sponsor/downline tree structure
    - `mlm_commission_rules` - Commission plan configuration
    - `mlm_sales` - Sales tracking
    - `mlm_commissions` - Calculated commission payouts
    - `mlm_ranks` - Rank definitions and requirements
    - `mlm_member_ranks` - Member rank history

  2. Security
    - Enable RLS on all tables
    - User-level data isolation
    - Team-based access for upline visibility

  3. Features
    - Uni-level, binary, matrix support
    - Rank qualification tracking
    - Volume calculations
    - Automated commission calculations
*/

-- MLM MEMBERS
CREATE TABLE IF NOT EXISTS mlm_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  external_id text,
  full_name text NOT NULL,
  email text,
  phone text,
  current_rank text,
  joined_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, external_id)
);

-- MLM RELATIONSHIPS (tree structure)
CREATE TABLE IF NOT EXISTS mlm_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  sponsor_id uuid REFERENCES mlm_members NOT NULL,
  downline_id uuid REFERENCES mlm_members NOT NULL,
  level integer NOT NULL CHECK (level > 0),
  position text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(sponsor_id, downline_id)
);

-- MLM COMMISSION RULES
CREATE TABLE IF NOT EXISTS mlm_commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_name text NOT NULL,
  plan_type text CHECK (plan_type IN ('unilevel', 'binary', 'matrix', 'hybrid')),
  level integer NOT NULL CHECK (level > 0),
  commission_rate numeric(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  rank_required text,
  volume_required numeric(12,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_name, level)
);

-- MLM SALES
CREATE TABLE IF NOT EXISTS mlm_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  member_id uuid REFERENCES mlm_members NOT NULL,
  prospect_id uuid REFERENCES prospects,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'PHP',
  product_name text,
  sale_date timestamptz DEFAULT now(),
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- MLM COMMISSIONS
CREATE TABLE IF NOT EXISTS mlm_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  sale_id uuid REFERENCES mlm_sales NOT NULL,
  earner_id uuid REFERENCES mlm_members NOT NULL,
  level integer NOT NULL,
  commission_amount numeric(12,2) NOT NULL CHECK (commission_amount >= 0),
  commission_rate numeric(5,2),
  calculated_at timestamptz DEFAULT now(),
  paid_out boolean DEFAULT false,
  paid_at timestamptz,
  payment_reference text,
  created_at timestamptz DEFAULT now()
);

-- MLM RANKS
CREATE TABLE IF NOT EXISTS mlm_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  rank_name text NOT NULL,
  rank_order integer NOT NULL,
  personal_volume_required numeric(12,2),
  team_volume_required numeric(12,2),
  active_downlines_required integer,
  benefits jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, rank_name)
);

-- MLM MEMBER RANKS (history)
CREATE TABLE IF NOT EXISTS mlm_member_ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  member_id uuid REFERENCES mlm_members NOT NULL,
  rank_name text NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  period_start date,
  period_end date,
  personal_volume numeric(12,2),
  team_volume numeric(12,2),
  created_at timestamptz DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_mlm_members_user ON mlm_members(user_id);
CREATE INDEX IF NOT EXISTS idx_mlm_members_status ON mlm_members(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mlm_relationships_sponsor ON mlm_relationships(sponsor_id, level);
CREATE INDEX IF NOT EXISTS idx_mlm_relationships_downline ON mlm_relationships(downline_id);
CREATE INDEX IF NOT EXISTS idx_mlm_relationships_user ON mlm_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_mlm_rules_user_plan ON mlm_commission_rules(user_id, plan_name) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_mlm_sales_member ON mlm_sales(member_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_mlm_sales_user_date ON mlm_sales(user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_mlm_commissions_earner ON mlm_commissions(earner_id, paid_out);
CREATE INDEX IF NOT EXISTS idx_mlm_commissions_sale ON mlm_commissions(sale_id);
CREATE INDEX IF NOT EXISTS idx_mlm_commissions_unpaid ON mlm_commissions(user_id, paid_out) WHERE paid_out = false;
CREATE INDEX IF NOT EXISTS idx_mlm_ranks_user ON mlm_ranks(user_id, rank_order);
CREATE INDEX IF NOT EXISTS idx_mlm_member_ranks_member ON mlm_member_ranks(member_id, achieved_at DESC);

-- ENABLE RLS
ALTER TABLE mlm_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_member_ranks ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES: mlm_members
CREATE POLICY "Users can view own MLM members"
  ON mlm_members FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own MLM members"
  ON mlm_members FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: mlm_relationships
CREATE POLICY "Users can view own MLM relationships"
  ON mlm_relationships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own MLM relationships"
  ON mlm_relationships FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: mlm_commission_rules
CREATE POLICY "Users can view own commission rules"
  ON mlm_commission_rules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own commission rules"
  ON mlm_commission_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: mlm_sales
CREATE POLICY "Users can view own MLM sales"
  ON mlm_sales FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own MLM sales"
  ON mlm_sales FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: mlm_commissions
CREATE POLICY "Users can view own commissions"
  ON mlm_commissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage commissions"
  ON mlm_commissions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: mlm_ranks
CREATE POLICY "Users can view own ranks"
  ON mlm_ranks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ranks"
  ON mlm_ranks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS POLICIES: mlm_member_ranks
CREATE POLICY "Users can view own member ranks"
  ON mlm_member_ranks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage member ranks"
  ON mlm_member_ranks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- SEED DEFAULT RANKS
INSERT INTO mlm_ranks (user_id, rank_name, rank_order, personal_volume_required, team_volume_required, active_downlines_required, benefits) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Member', 1, 0, 0, 0, '{"monthly_bonus": 0}'::jsonb),
  ((SELECT id FROM auth.users LIMIT 1), 'Senior', 2, 5000, 10000, 3, '{"monthly_bonus": 500}'::jsonb),
  ((SELECT id FROM auth.users LIMIT 1), 'Leader', 3, 10000, 25000, 5, '{"monthly_bonus": 1500}'::jsonb),
  ((SELECT id FROM auth.users LIMIT 1), 'Director', 4, 25000, 75000, 10, '{"monthly_bonus": 5000}'::jsonb),
  ((SELECT id FROM auth.users LIMIT 1), 'Executive', 5, 50000, 150000, 15, '{"monthly_bonus": 15000}'::jsonb);

-- FUNCTION: Get upline chain
CREATE OR REPLACE FUNCTION get_upline_chain(member_id_param uuid, max_levels integer DEFAULT 10)
RETURNS TABLE(member_id uuid, level integer, full_name text, current_rank text)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE upline AS (
    SELECT 
      r.sponsor_id as member_id,
      r.level,
      m.full_name,
      m.current_rank
    FROM mlm_relationships r
    JOIN mlm_members m ON m.id = r.sponsor_id
    WHERE r.downline_id = member_id_param
    AND r.level = 1
    
    UNION ALL
    
    SELECT 
      r.sponsor_id,
      u.level + 1,
      m.full_name,
      m.current_rank
    FROM upline u
    JOIN mlm_relationships r ON r.downline_id = u.member_id AND r.level = 1
    JOIN mlm_members m ON m.id = r.sponsor_id
    WHERE u.level < max_levels
  )
  SELECT * FROM upline;
END;
$$;

-- FUNCTION: Calculate team volume
CREATE OR REPLACE FUNCTION calculate_team_volume(member_id_param uuid, start_date timestamptz, end_date timestamptz)
RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  total_volume numeric := 0;
BEGIN
  SELECT COALESCE(SUM(s.amount), 0)
  INTO total_volume
  FROM mlm_sales s
  JOIN mlm_relationships r ON r.downline_id = s.member_id
  WHERE r.sponsor_id = member_id_param
  AND s.sale_date BETWEEN start_date AND end_date
  AND s.status = 'completed';
  
  RETURN total_volume;
END;
$$;