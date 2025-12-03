/*
  # MLM Compensation Plans Storage

  1. New Tables
    - `mlm_compensation_plans` - Stores compensation plan JSON configurations

  2. Security
    - Enable RLS
    - User-level data isolation

  3. Functions
    - Auto-update timestamp trigger
    - Sync plan to commission rules function
*/

-- MLM COMPENSATION PLANS
CREATE TABLE IF NOT EXISTS mlm_compensation_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  plan_name text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('unilevel', 'binary', 'matrix', 'forced', 'hybrid')),
  config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_name)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_comp_plans_user ON mlm_compensation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_plans_active ON mlm_compensation_plans(user_id, is_active) WHERE is_active = true;

-- ENABLE RLS
ALTER TABLE mlm_compensation_plans ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own compensation plans"
  ON mlm_compensation_plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own compensation plans"
  ON mlm_compensation_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_compensation_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_compensation_plan_updated_at
  BEFORE UPDATE ON mlm_compensation_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_compensation_plan_updated_at();

-- FUNCTION: Sync plan config to commission rules
CREATE OR REPLACE FUNCTION sync_plan_to_commission_rules(
  user_id_param uuid,
  plan_name_param text,
  config_param jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  level_item jsonb;
BEGIN
  -- Delete existing rules for this plan
  DELETE FROM mlm_commission_rules
  WHERE user_id = user_id_param
  AND plan_name = plan_name_param;

  -- Insert new rules from config
  FOR level_item IN SELECT * FROM jsonb_array_elements(config_param->'levels')
  LOOP
    INSERT INTO mlm_commission_rules (
      user_id,
      plan_name,
      plan_type,
      level,
      commission_rate,
      rank_required,
      is_active
    ) VALUES (
      user_id_param,
      plan_name_param,
      (config_param->>'planType')::text,
      (level_item->>'level')::integer,
      (level_item->>'percentage')::numeric(5,2),
      level_item->>'rankRequired',
      true
    );
  END LOOP;
END;
$$;

-- FUNCTION: Calculate commissions for a sale (full CTE)
CREATE OR REPLACE FUNCTION calculate_commissions_for_sale(sale_id_param uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  WITH sale AS (
    SELECT 
      s.id,
      s.user_id,
      s.member_id,
      s.amount,
      s.created_at
    FROM mlm_sales s
    WHERE s.id = sale_id_param
  ),
  recursive_upline AS (
    -- Level 1: direct sponsor
    SELECT
      r.sponsor_id as earner_id,
      r.downline_id,
      1::int as level,
      s.user_id,
      s.amount,
      s.id as sale_id
    FROM sale s
    JOIN mlm_relationships r ON r.downline_id = s.member_id AND r.user_id = s.user_id
    
    UNION ALL
    
    -- Next levels up
    SELECT
      r.sponsor_id as earner_id,
      r.downline_id,
      ru.level + 1 as level,
      ru.user_id,
      ru.amount,
      ru.sale_id
    FROM recursive_upline ru
    JOIN mlm_relationships r ON r.downline_id = ru.earner_id AND r.user_id = ru.user_id
    WHERE ru.level < 10  -- Safety limit
  ),
  eligible_upline AS (
    SELECT
      ru.sale_id,
      ru.earner_id,
      ru.level,
      ru.amount,
      ru.user_id,
      cr.commission_rate
    FROM recursive_upline ru
    JOIN mlm_commission_rules cr
      ON cr.user_id = ru.user_id
      AND cr.level = ru.level
      AND cr.is_active = true
  )
  INSERT INTO mlm_commissions (user_id, sale_id, earner_id, level, commission_amount, commission_rate)
  SELECT
    e.user_id,
    e.sale_id,
    e.earner_id,
    e.level,
    (e.amount * e.commission_rate / 100.0)::numeric(12,2) as commission_amount,
    e.commission_rate
  FROM eligible_upline e;
END;
$$;