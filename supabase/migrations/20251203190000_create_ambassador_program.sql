-- =====================================================
-- AMBASSADOR PROGRAM - TWO-TIER REFERRAL SYSTEM
-- =====================================================
-- Purpose: Enable sales agents and users to earn from referrals
-- Tiers:
--   - Ambassadors (Pro Agents): 50% first month + 15% recurring (PHP)
--   - Referral Boss (Free Users): Earn coins + energy per referral
-- =====================================================

-- Create ambassador_profiles table
CREATE TABLE IF NOT EXISTS ambassador_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Ambassador tier
  tier TEXT NOT NULL CHECK (tier IN ('referral_boss', 'ambassador')),
  -- referral_boss: Free users, earn coins/energy
  -- ambassador: Pro users, earn PHP commissions
  
  -- Referral tracking
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_earnings_php NUMERIC DEFAULT 0, -- For Ambassadors
  total_earnings_coins INTEGER DEFAULT 0, -- For Referral Boss
  total_earnings_energy INTEGER DEFAULT 0, -- For Referral Boss
  
  -- Performance stats
  conversion_rate NUMERIC DEFAULT 0,
  retention_rate NUMERIC DEFAULT 0,
  average_ltv NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'banned')),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  bio TEXT,
  profile_image_url TEXT,
  landing_page_slug TEXT UNIQUE, -- Custom landing page: /join/agent-name
  custom_message TEXT, -- Personal pitch on landing page
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_ambassador UNIQUE(user_id)
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who referred whom
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Referral context
  referral_code TEXT NOT NULL,
  landing_page_slug TEXT, -- If came via custom landing page
  
  -- Conversion tracking
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_to_pro_at TIMESTAMPTZ, -- When they upgraded to Pro
  churned_at TIMESTAMPTZ, -- When they cancelled/downgraded
  
  -- Commission tracking (for Ambassadors)
  first_month_commission_paid BOOLEAN DEFAULT FALSE,
  first_month_commission_amount NUMERIC DEFAULT 0,
  total_recurring_commission NUMERIC DEFAULT 0,
  last_commission_date TIMESTAMPTZ,
  
  -- Coin/Energy rewards (for Referral Boss)
  coins_awarded INTEGER DEFAULT 0,
  energy_awarded INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'refunded')),
  -- pending: Signed up but not Pro yet
  -- active: Pro subscriber
  -- churned: Cancelled/downgraded
  -- refunded: Subscription refunded (clawback commission)
  
  -- Timestamps
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_user_id)
);

-- Create ambassador_payouts table (MOVED BEFORE commission_transactions to avoid forward reference)
CREATE TABLE IF NOT EXISTS ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who gets paid
  ambassador_id UUID NOT NULL REFERENCES ambassador_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Payout details
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  
  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'bank_transfer', 'paymaya', 'paypal')),
  payment_details JSONB, -- GCash number, bank account, etc.
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'failed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Failure handling
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Audit
  approved_by UUID REFERENCES profiles(id), -- Admin who approved
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create commission_transactions table (MOVED AFTER ambassador_payouts)
CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who earned
  ambassador_id UUID NOT NULL REFERENCES ambassador_profiles(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('first_month', 'recurring', 'bonus', 'clawback')),
  amount_php NUMERIC NOT NULL, -- For Ambassadors
  amount_coins INTEGER DEFAULT 0, -- For Referral Boss
  amount_energy INTEGER DEFAULT 0, -- For Referral Boss
  
  -- Payment info
  period_start DATE,
  period_end DATE,
  payout_id UUID REFERENCES ambassador_payouts(id) ON DELETE SET NULL,  -- Now this table exists!
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_user ON ambassador_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_tier ON ambassador_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_code ON ambassador_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_slug ON ambassador_profiles(landing_page_slug) WHERE landing_page_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_ambassador ON ambassador_payouts(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_status ON ambassador_payouts(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_period ON ambassador_payouts(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_ambassador ON commission_transactions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_referral ON commission_transactions(referral_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_type ON commission_transactions(transaction_type);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE ambassador_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;

-- Ambassador profiles: Users can view and update their own profile
CREATE POLICY "Users can view own ambassador profile"
  ON ambassador_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ambassador profile"
  ON ambassador_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Referrals: Ambassadors can view their referrals
CREATE POLICY "Ambassadors can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Transactions: Ambassadors can view their transactions
CREATE POLICY "Ambassadors can view own transactions"
  ON commission_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ambassador_profiles
      WHERE ambassador_profiles.id = commission_transactions.ambassador_id
      AND ambassador_profiles.user_id = auth.uid()
    )
  );

-- Payouts: Ambassadors can view and request own payouts
CREATE POLICY "Ambassadors can view own payouts"
  ON ambassador_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Ambassadors can request payouts"
  ON ambassador_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies (for super admins)
CREATE POLICY "Admins can manage all ambassador data"
  ON ambassador_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all referrals"
  ON referrals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payouts"
  ON ambassador_payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (I, O, 0, 1)
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Calculate commission for referral
CREATE OR REPLACE FUNCTION calculate_referral_commission(
  p_referrer_id UUID,
  p_referred_user_id UUID,
  p_subscription_amount NUMERIC,
  p_is_first_month BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ambassador ambassador_profiles%ROWTYPE;
  v_commission NUMERIC;
  v_commission_type TEXT;
  v_result JSONB;
BEGIN
  -- Get ambassador profile
  SELECT * INTO v_ambassador
  FROM ambassador_profiles
  WHERE user_id = p_referrer_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Not an ambassador');
  END IF;
  
  -- Calculate commission based on tier
  IF v_ambassador.tier = 'ambassador' THEN
    -- Pro agents earn PHP commissions
    IF p_is_first_month THEN
      v_commission := p_subscription_amount * 0.50; -- 50% first month
      v_commission_type := 'first_month';
    ELSE
      v_commission := p_subscription_amount * 0.15; -- 15% recurring
      v_commission_type := 'recurring';
    END IF;
    
    v_result := jsonb_build_object(
      'amount_php', v_commission,
      'amount_coins', 0,
      'amount_energy', 0,
      'commission_type', v_commission_type
    );
    
  ELSIF v_ambassador.tier = 'referral_boss' THEN
    -- Free users earn coins + energy
    IF p_is_first_month THEN
      v_result := jsonb_build_object(
        'amount_php', 0,
        'amount_coins', 100, -- 100 coins per Pro conversion
        'amount_energy', 50, -- 50 energy bonus
        'commission_type', 'referral_reward'
      );
    ELSE
      -- No recurring for Referral Boss (incentivizes upgrade!)
      v_result := jsonb_build_object(
        'amount_php', 0,
        'amount_coins', 0,
        'amount_energy', 0,
        'commission_type', 'none'
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Track referral conversion
CREATE OR REPLACE FUNCTION track_referral_conversion(
  p_referred_user_id UUID,
  p_new_tier TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referral referrals%ROWTYPE;
  v_commission JSONB;
BEGIN
  -- Find referral record
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_user_id = p_referred_user_id;
  
  IF NOT FOUND THEN
    RETURN; -- Not a referred user
  END IF;
  
  -- Only process if converting to Pro
  IF p_new_tier NOT IN ('pro', 'team', 'enterprise') THEN
    RETURN;
  END IF;
  
  -- Mark as converted
  UPDATE referrals
  SET 
    converted_to_pro_at = NOW(),
    status = 'active',
    updated_at = NOW()
  WHERE id = v_referral.id;
  
  -- Calculate commission
  v_commission := calculate_referral_commission(
    v_referral.referrer_id,
    v_referral.referred_user_id,
    1299.00, -- Pro subscription price
    TRUE -- First month
  );
  
  -- Award commission
  IF (v_commission->>'amount_php')::numeric > 0 THEN
    -- Record PHP commission transaction
    INSERT INTO commission_transactions (
      ambassador_id, referral_id, transaction_type,
      amount_php, description
    )
    SELECT 
      ap.id, v_referral.id, 'first_month',
      (v_commission->>'amount_php')::numeric,
      'First month commission - Pro subscription'
    FROM ambassador_profiles ap
    WHERE ap.user_id = v_referral.referrer_id;
    
    -- Update referral record
    UPDATE referrals
    SET 
      first_month_commission_paid = TRUE,
      first_month_commission_amount = (v_commission->>'amount_php')::numeric
    WHERE id = v_referral.id;
    
  ELSIF (v_commission->>'amount_coins')::integer > 0 THEN
    -- Award coins + energy to Referral Boss
    INSERT INTO commission_transactions (
      ambassador_id, referral_id, transaction_type,
      amount_php, amount_coins, amount_energy, description
    )
    SELECT 
      ap.id, v_referral.id, 'bonus',
      0,
      (v_commission->>'amount_coins')::integer,
      (v_commission->>'amount_energy')::integer,
      'Referral reward - Pro conversion'
    FROM ambassador_profiles ap
    WHERE ap.user_id = v_referral.referrer_id;
    
    -- Award coins to user
    UPDATE profiles
    SET coin_balance = coin_balance + (v_commission->>'amount_coins')::integer
    WHERE id = v_referral.referrer_id;
    
    -- Award energy to user
    UPDATE user_energy
    SET current_energy = LEAST(current_energy + (v_commission->>'amount_energy')::integer, max_energy)
    WHERE user_id = v_referral.referrer_id;
  END IF;
  
  -- Update ambassador stats
  UPDATE ambassador_profiles
  SET 
    total_referrals = total_referrals + 1,
    active_referrals = active_referrals + 1,
    total_earnings_php = total_earnings_php + COALESCE((v_commission->>'amount_php')::numeric, 0),
    total_earnings_coins = total_earnings_coins + COALESCE((v_commission->>'amount_coins')::integer, 0),
    total_earnings_energy = total_earnings_energy + COALESCE((v_commission->>'amount_energy')::integer, 0),
    updated_at = NOW()
  WHERE user_id = v_referral.referrer_id;
END;
$$;

-- Monthly recurring commission processor
CREATE OR REPLACE FUNCTION process_monthly_recurring_commissions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
  v_referral RECORD;
  v_ambassador ambassador_profiles%ROWTYPE;
BEGIN
  -- Find all active Pro referrals that need recurring commission
  FOR v_referral IN
    SELECT r.*, p.subscription_tier
    FROM referrals r
    JOIN profiles p ON p.id = r.referred_user_id
    WHERE r.status = 'active'
      AND r.converted_to_pro_at IS NOT NULL
      AND r.first_month_commission_paid = TRUE
      AND p.subscription_tier IN ('pro', 'team', 'enterprise')
      AND (r.last_commission_date IS NULL OR r.last_commission_date < NOW() - INTERVAL '30 days')
  LOOP
    -- Get ambassador
    SELECT * INTO v_ambassador
    FROM ambassador_profiles
    WHERE user_id = v_referral.referrer_id;
    
    -- Only Ambassadors get recurring (not Referral Boss)
    IF v_ambassador.tier = 'ambassador' THEN
      -- Calculate 15% recurring commission
      INSERT INTO commission_transactions (
        ambassador_id, referral_id, transaction_type,
        amount_php, period_start, period_end, description
      )
      VALUES (
        v_ambassador.id,
        v_referral.id,
        'recurring',
        1299.00 * 0.15, -- 15% of ₱1,299 = ₱194.85
        NOW() - INTERVAL '30 days',
        NOW(),
        'Monthly recurring commission'
      );
      
      -- Update referral
      UPDATE referrals
      SET 
        total_recurring_commission = total_recurring_commission + (1299.00 * 0.15),
        last_commission_date = NOW(),
        updated_at = NOW()
      WHERE id = v_referral.id;
      
      -- Update ambassador
      UPDATE ambassador_profiles
      SET 
        total_earnings_php = total_earnings_php + (1299.00 * 0.15),
        updated_at = NOW()
      WHERE id = v_ambassador.id;
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_ambassador_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ambassador_profiles_updated_at
  BEFORE UPDATE ON ambassador_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassador_updated_at();

CREATE TRIGGER referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassador_updated_at();

CREATE TRIGGER ambassador_payouts_updated_at
  BEFORE UPDATE ON ambassador_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_ambassador_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE ambassador_profiles IS 
  'Two-tier ambassador program: Ambassadors (Pro, earn PHP) and Referral Boss (Free, earn coins/energy)';

COMMENT ON TABLE referrals IS 
  'Tracks all referrals and their conversion/commission status';

COMMENT ON TABLE commission_transactions IS 
  'All commission earnings (PHP for Ambassadors, coins/energy for Referral Boss)';

COMMENT ON TABLE ambassador_payouts IS 
  'Payout requests and processing for Ambassadors';

COMMENT ON COLUMN ambassador_profiles.tier IS 
  'ambassador: Pro users earning PHP (50% first + 15% recurring), referral_boss: Free users earning coins/energy';

COMMENT ON FUNCTION calculate_referral_commission IS 
  'Calculate commission based on ambassador tier: PHP for Ambassadors, coins/energy for Referral Boss';

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Commission rates configuration (for reference)
INSERT INTO ai_system_instructions (user_id, feature_type, content, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- System user
  'ambassador_config',
  jsonb_build_object(
    'ambassador_tier', jsonb_build_object(
      'required_tier', 'pro',
      'first_month_rate', 0.50,
      'recurring_rate', 0.15,
      'currency', 'PHP'
    ),
    'referral_boss_tier', jsonb_build_object(
      'required_tier', 'free',
      'coins_per_conversion', 100,
      'energy_per_conversion', 50,
      'recurring_rewards', false,
      'upgrade_incentive', 'Upgrade to Pro to earn PHP commissions instead!'
    )
  ),
  TRUE
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

/*
This migration creates:
✅ Two-tier ambassador program
✅ Ambassadors (Pro): 50% first + 15% recurring in PHP
✅ Referral Boss (Free): 100 coins + 50 energy per conversion
✅ Referral tracking and attribution
✅ Commission calculation and recording
✅ Payout request system
✅ Performance analytics
✅ Custom landing pages
✅ RLS security policies

Next steps:
1. Build Agent Dashboard UI
2. Build Wallet referral card
3. Implement referral link generation
4. Create QR code generator
5. Build custom landing pages
6. Implement payout processing
*/

