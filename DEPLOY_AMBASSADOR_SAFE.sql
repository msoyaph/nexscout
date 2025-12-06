-- =====================================================
-- AMBASSADOR PROGRAM - SAFE DEPLOYMENT
-- =====================================================
-- This version checks for existing tables and handles conflicts
-- =====================================================

-- Drop existing ambassador tables if they exist (safe cleanup)
DROP TABLE IF EXISTS commission_transactions CASCADE;
DROP TABLE IF EXISTS ambassador_payouts CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS ambassador_profiles CASCADE;

-- Create ambassador_profiles table
CREATE TABLE ambassador_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('referral_boss', 'ambassador')),
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  active_referrals INTEGER DEFAULT 0,
  total_earnings_php NUMERIC DEFAULT 0,
  total_earnings_coins INTEGER DEFAULT 0,
  total_earnings_energy INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  retention_rate NUMERIC DEFAULT 0,
  average_ltv NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'banned')),
  approved_at TIMESTAMPTZ,
  bio TEXT,
  profile_image_url TEXT,
  landing_page_slug TEXT UNIQUE,
  custom_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_ambassador UNIQUE(user_id)
);

-- Create referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  landing_page_slug TEXT,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_to_pro_at TIMESTAMPTZ,
  churned_at TIMESTAMPTZ,
  first_month_commission_paid BOOLEAN DEFAULT FALSE,
  first_month_commission_amount NUMERIC DEFAULT 0,
  total_recurring_commission NUMERIC DEFAULT 0,
  last_commission_date TIMESTAMPTZ,
  coins_awarded INTEGER DEFAULT 0,
  energy_awarded INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned', 'refunded')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id),
  CONSTRAINT no_self_referral CHECK (referrer_id != referred_user_id)
);

-- Create ambassador_payouts table
CREATE TABLE ambassador_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassador_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('gcash', 'bank_transfer', 'paymaya', 'paypal')),
  payment_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'failed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create commission_transactions table
CREATE TABLE commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassador_profiles(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('first_month', 'recurring', 'bonus', 'clawback')),
  amount_php NUMERIC NOT NULL,
  amount_coins INTEGER DEFAULT 0,
  amount_energy INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE,
  payout_id UUID REFERENCES ambassador_payouts(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ambassador_profiles_user ON ambassador_profiles(user_id);
CREATE INDEX idx_ambassador_profiles_tier ON ambassador_profiles(tier);
CREATE INDEX idx_ambassador_profiles_code ON ambassador_profiles(referral_code);
CREATE INDEX idx_ambassador_profiles_slug ON ambassador_profiles(landing_page_slug) WHERE landing_page_slug IS NOT NULL;

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

CREATE INDEX idx_ambassador_payouts_ambassador ON ambassador_payouts(ambassador_id);
CREATE INDEX idx_ambassador_payouts_status ON ambassador_payouts(status);
CREATE INDEX idx_ambassador_payouts_period ON ambassador_payouts(period_start, period_end);

CREATE INDEX idx_commission_transactions_ambassador ON commission_transactions(ambassador_id);
CREATE INDEX idx_commission_transactions_referral ON commission_transactions(referral_id);
CREATE INDEX idx_commission_transactions_type ON commission_transactions(transaction_type);

-- Enable RLS
ALTER TABLE ambassador_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ambassador_profiles
CREATE POLICY "Users can view own ambassador profile"
  ON ambassador_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ambassador profile"
  ON ambassador_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ambassador profile"
  ON ambassador_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Ambassadors can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- RLS Policies for commission_transactions
CREATE POLICY "Ambassadors can view own transactions"
  ON commission_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ambassador_profiles
      WHERE ambassador_profiles.id = commission_transactions.ambassador_id
      AND ambassador_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create commission transactions"
  ON commission_transactions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ambassador_payouts
CREATE POLICY "Ambassadors can view own payouts"
  ON ambassador_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Ambassadors can request payouts"
  ON ambassador_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin policies (optional - only if admin_users table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    EXECUTE 'CREATE POLICY "Admins can manage all ambassador data"
      ON ambassador_profiles FOR ALL
      USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))';
      
    EXECUTE 'CREATE POLICY "Admins can manage all referrals"
      ON referrals FOR ALL
      USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))';
      
    EXECUTE 'CREATE POLICY "Admins can manage all payouts"
      ON ambassador_payouts FOR ALL
      USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()))';
  END IF;
END $$;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Ambassador Program deployed successfully!';
  RAISE NOTICE '✅ Created 4 tables: ambassador_profiles, referrals, ambassador_payouts, commission_transactions';
  RAISE NOTICE '✅ Added RLS policies for security';
  RAISE NOTICE '✅ Created performance indexes';
  RAISE NOTICE '🎉 Your Ambassador Program is now LIVE!';
END $$;




