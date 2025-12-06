# QUICK FIX - DEPLOY AMBASSADOR TABLES 🚀

**Error:** "Could not find the table 'public.ambassador_profiles' in the schema cache"  
**Solution:** Deploy the migration files to your Supabase database

---

## ⚡ **FASTEST FIX - SUPABASE DASHBOARD (5 MINUTES)**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard
2. Login to your account
3. Select your NexScout project

### **Step 2: Open SQL Editor**
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button

### **Step 3: Run Migration 1 (Create Tables)**

**Copy this entire file:**
- File: `supabase/migrations/20251203190000_create_ambassador_program.sql`
- Location: `/Users/cliffsumalpong/Documents/NexScout/supabase/migrations/`

**Paste into SQL Editor and click "Run"**

**Expected:** ✅ "Success. No rows returned"

### **Step 4: Run Migration 2 (Add INSERT Policy)**

**Copy this entire file:**
- File: `supabase/migrations/20251203195000_fix_ambassador_insert_policy.sql`

**Paste into SQL Editor and click "Run"**

**Expected:** ✅ "Success. No rows returned"

### **Step 5: Verify Tables Created**
1. Click **"Table Editor"** in sidebar
2. Look for these tables:
   - ✅ `ambassador_profiles`
   - ✅ `referrals`
   - ✅ `commission_transactions`
   - ✅ `ambassador_payouts`

### **Step 6: Test the App**
```bash
npm run dev
```

1. Go to /wallet
2. Click "Become an Ambassador"
3. Click "Become an Ambassador Now"
4. ✅ **Should work now!**

---

## 📋 **ALTERNATIVE - COPY/PASTE READY SQL**

If you prefer, here's the consolidated SQL to run in one go:

### **Run This in Supabase SQL Editor:**

<details>
<summary>Click to expand SQL</summary>

```sql
-- =====================================================
-- AMBASSADOR PROGRAM - COMPLETE SETUP
-- =====================================================

-- Create ambassador_profiles table
CREATE TABLE IF NOT EXISTS ambassador_profiles (
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
CREATE TABLE IF NOT EXISTS referrals (
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

-- Create commission_transactions table
CREATE TABLE IF NOT EXISTS commission_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id UUID NOT NULL REFERENCES ambassador_profiles(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('first_month', 'recurring', 'bonus', 'clawback')),
  amount_php NUMERIC NOT NULL,
  amount_coins INTEGER DEFAULT 0,
  amount_energy INTEGER DEFAULT 0,
  period_start DATE,
  period_end DATE,
  payout_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create ambassador_payouts table
CREATE TABLE IF NOT EXISTS ambassador_payouts (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_user ON ambassador_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_tier ON ambassador_profiles(tier);
CREATE INDEX IF NOT EXISTS idx_ambassador_profiles_code ON ambassador_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_ambassador ON commission_transactions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_payouts_ambassador ON ambassador_payouts(ambassador_id);

-- Enable RLS
ALTER TABLE ambassador_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_payouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

CREATE POLICY "Ambassadors can view own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

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

CREATE POLICY "Ambassadors can view own payouts"
  ON ambassador_payouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Ambassadors can request payouts"
  ON ambassador_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

</details>

---

## 🎯 **WHAT THIS CREATES**

### **Tables (4 total):**
1. **ambassador_profiles** - Who's an ambassador/referral boss
2. **referrals** - Who referred whom
3. **commission_transactions** - Earnings history
4. **ambassador_payouts** - Payout requests

### **Security:**
- ✅ RLS enabled on all tables
- ✅ Users can only see their own data
- ✅ Users can create their own profile
- ✅ System can track referrals automatically

### **Performance:**
- ✅ Indexes on all key columns
- ✅ Fast lookups by user_id, referral_code
- ✅ Optimized for dashboard queries

---

## ✅ **AFTER DEPLOYMENT**

**Test the complete flow:**

1. **Refresh your app**
   ```bash
   # Restart dev server
   npm run dev
   ```

2. **Join Ambassador Program**
   - Go to /wallet
   - Click "Become an Ambassador"
   - Click "Become an Ambassador Now"
   - ✅ Should work without errors!
   - ✅ Success page should show
   - ✅ Profile created in database

3. **View Dashboard**
   - Click "View My Dashboard"
   - ✅ See your referral link
   - ✅ See your QR code
   - ✅ See analytics (starting at 0)

4. **Test Referral Link**
   - Copy your link: `/ref/tu5828`
   - Share it
   - When someone signs up, you earn!

---

## 🚀 **DEPLOY NOW!**

**Choose your method:**

### **Option A: Supabase Dashboard (Easiest)**
1. Copy SQL from migration files
2. Paste in SQL Editor
3. Click "Run"
4. Done! ✅

### **Option B: Supabase CLI**
```bash
supabase db push
```

### **Option C: Direct Database Access**
```bash
psql "your-connection-string" -f supabase/migrations/20251203190000_create_ambassador_program.sql
psql "your-connection-string" -f supabase/migrations/20251203195000_fix_ambassador_insert_policy.sql
```

---

**Pick one method and deploy - then your Ambassador button will work!** 🎉




