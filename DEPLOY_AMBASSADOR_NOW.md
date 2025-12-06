# DEPLOY AMBASSADOR TABLES - STEP BY STEP 🚀

**Date:** December 3, 2025  
**Error Fixed:** ✅ Table creation order fixed (ambassador_payouts before commission_transactions)

---

## ⚠️ **THE ERROR**

```
Could not find the table 'public.ambassador_profiles' in the schema cache
```

**Cause:** Migration hasn't been run yet + had a forward reference bug

**Fix Applied:** 
- ✅ Fixed table creation order (ambassador_payouts now created BEFORE commission_transactions)
- ✅ Added IF NOT EXISTS to all indexes
- ✅ Migration is now safe to run

---

## 🚀 **DEPLOY NOW - SUPABASE DASHBOARD METHOD**

### **Step 1: Open Supabase Dashboard**
1. Go to: **https://supabase.com/dashboard**
2. Login with your account
3. Click on your **NexScout project**

---

### **Step 2: Open SQL Editor**
1. In left sidebar, click **"SQL Editor"**
2. Click **"New query"** button (top right)
3. You'll see a blank SQL editor

---

### **Step 3: Copy Migration File**

**Option A: From your editor (currently open)**
- You have the file open: `20251203190000_create_ambassador_program.sql`
- Select ALL (Cmd+A)
- Copy (Cmd+C)

**Option B: From filesystem**
- Open: `/Users/cliffsumalpong/Documents/NexScout/supabase/migrations/20251203190000_create_ambassador_program.sql`
- Copy entire contents (610 lines)

---

### **Step 4: Paste and Run**
1. **Paste** into Supabase SQL Editor
2. **Click "Run"** button (bottom right)
3. Wait for result...
4. **Expected:** ✅ "Success. No rows returned" (green banner)

**If you see error:** 
- Read the error message
- Check line number
- Let me know the exact error

---

### **Step 5: Run Migration 2 (INSERT Policy)**

1. Click **"New query"** again
2. Copy this entire file:

```sql
-- =====================================================
-- FIX: Add INSERT policy for ambassador_profiles
-- =====================================================

-- Add INSERT policy for ambassador_profiles
CREATE POLICY "Users can create own ambassador profile"
  ON ambassador_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for referrals
CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- Add INSERT policy for commission_transactions
CREATE POLICY "System can create commission transactions"
  ON commission_transactions FOR INSERT
  WITH CHECK (true);
```

3. **Paste** into SQL Editor
4. **Click "Run"**
5. **Expected:** ✅ "Success. No rows returned"

---

### **Step 6: Verify Tables Exist**

1. In left sidebar, click **"Table Editor"**
2. Scroll down to find these tables:
   - ✅ `ambassador_profiles`
   - ✅ `ambassador_payouts`
   - ✅ `commission_transactions`
   - ✅ `referrals`

3. Click on `ambassador_profiles`
4. You should see columns:
   - id, user_id, tier, referral_code, status, etc.

**If you see all 4 tables:** ✅ Success!

---

### **Step 7: Test the App**

```bash
# Restart your dev server
npm run dev
```

**Test Flow:**
1. Go to: `http://localhost:5173/wallet`
2. Click **"Become an Ambassador"** or **"Start as Referral Boss"**
3. Click **"Become an Ambassador Now"**
4. ✅ **Should work!** No more errors
5. ✅ Success page should show
6. ✅ Dashboard loads with your referral link

---

## 🔧 **WHAT WAS FIXED IN MIGRATION**

### **Bug Found:**

**Problem:** Forward reference error
```sql
-- Line 94: commission_transactions created
CREATE TABLE commission_transactions (
  ...
  payout_id UUID REFERENCES ambassador_payouts(id)  -- ❌ Doesn't exist yet!
  ...
);

-- Line 121: ambassador_payouts created
CREATE TABLE ambassador_payouts (  -- ❌ Created AFTER being referenced!
  ...
);
```

**Result:** Migration would fail because `ambassador_payouts` doesn't exist when `commission_transactions` tries to reference it.

---

### **Fix Applied:**

**Solution:** Reordered table creation

```sql
-- Line 93: ambassador_payouts created FIRST
CREATE TABLE ambassador_payouts (
  ...
);

-- Line 125: commission_transactions created AFTER
CREATE TABLE commission_transactions (
  ...
  payout_id UUID REFERENCES ambassador_payouts(id)  -- ✅ Now exists!
  ...
);
```

**Also added:** `IF NOT EXISTS` to all indexes (safety)

---

## 📊 **VERIFICATION QUERIES**

After deployment, run these in SQL Editor to verify:

### **1. Check All Tables Exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%ambassador%'
ORDER BY table_name;

-- Expected:
-- ambassador_payouts
-- ambassador_profiles
-- commission_transactions
-- referrals
```

### **2. Check RLS Policies:**
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('ambassador_profiles', 'referrals', 'commission_transactions', 'ambassador_payouts')
ORDER BY tablename, cmd;

-- Should show multiple policies per table
```

### **3. Check Indexes:**
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename LIKE '%ambassador%'
ORDER BY tablename;

-- Should show ~15 indexes
```

---

## 🎯 **TROUBLESHOOTING**

### **Error: "relation already exists"**
**Solution:** Table partially created. Drop and recreate:
```sql
DROP TABLE IF EXISTS commission_transactions CASCADE;
DROP TABLE IF EXISTS ambassador_payouts CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS ambassador_profiles CASCADE;

-- Then run the migration again
```

### **Error: "permission denied"**
**Solution:** Make sure you're using the service role key or have proper permissions in the dashboard.

### **Error: "function does not exist"**
**Solution:** The migration includes function creation - make sure the entire file runs.

---

## ✅ **COMPLETE DEPLOYMENT CHECKLIST**

- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy migration file 1 (create_ambassador_program.sql)
- [ ] Paste and run
- [ ] Verify success (green banner)
- [ ] Copy migration file 2 (fix_ambassador_insert_policy.sql)
- [ ] Paste and run
- [ ] Verify success
- [ ] Check Table Editor for 4 new tables
- [ ] Test app - join ambassador program
- [ ] Verify no errors
- [ ] See success page
- [ ] View dashboard

---

## 🎉 **AFTER SUCCESSFUL DEPLOYMENT**

You'll have:
- ✅ 4 new database tables
- ✅ 15+ indexes for performance
- ✅ RLS policies for security
- ✅ Helper functions for commissions
- ✅ Automated commission calculations
- ✅ Working Ambassador program
- ✅ Functional "Become an Ambassador" button

**The entire Ambassador Program will be live!** 👑

---

## 📝 **QUICK SUMMARY**

**Problem:** Table doesn't exist + forward reference bug  
**Fix:** Reordered tables + added IF NOT EXISTS  
**Deploy:** Copy/paste SQL in Supabase Dashboard  
**Time:** ~5 minutes  
**Result:** Working Ambassador Program  

**Ready to deploy!** 🚀




