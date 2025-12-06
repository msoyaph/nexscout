# DEPLOY AMBASSADOR TABLES - INSTRUCTIONS 🚀

**Date:** December 3, 2025  
**Status:** ⚠️ **TABLES NOT DEPLOYED YET**

---

## ⚠️ **THE ERROR**

```
Failed to join program: Could not find the table 'public.ambassador_profiles' in the schema cache
```

**What this means:**
- The migration files exist in your codebase ✅
- But they haven't been applied to your database yet ❌
- The `ambassador_profiles` table doesn't exist in Supabase

---

## 📋 **MIGRATION FILES READY**

These files are created and ready to deploy:

1. **`20251203190000_create_ambassador_program.sql`** (Main tables)
   - Creates `ambassador_profiles` table
   - Creates `referrals` table
   - Creates `commission_transactions` table
   - Creates `ambassador_payouts` table
   - Adds indexes, RLS policies, and helper functions

2. **`20251203195000_fix_ambassador_insert_policy.sql`** (Fix)
   - Adds missing INSERT policy
   - Allows users to create profiles

---

## 🚀 **DEPLOYMENT METHODS**

### **Method 1: Using Supabase CLI (Recommended)**

```bash
# 1. Make sure you're linked to your project
cd /Users/cliffsumalpong/Documents/NexScout
supabase link --project-ref your-project-ref

# 2. Push migrations to database
supabase db push

# 3. Verify deployment
supabase db diff
```

---

### **Method 2: Using Supabase Dashboard (Alternative)**

If CLI doesn't work, deploy via the dashboard:

**Steps:**

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Copy & Paste Migration 1**
   - Open file: `supabase/migrations/20251203190000_create_ambassador_program.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for "Success" message

4. **Copy & Paste Migration 2**
   - Open file: `supabase/migrations/20251203195000_fix_ambassador_insert_policy.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run" button
   - Wait for "Success" message

5. **Verify Tables Exist**
   - Click "Table Editor" in sidebar
   - Should see:
     - `ambassador_profiles` ✅
     - `referrals` ✅
     - `commission_transactions` ✅
     - `ambassador_payouts` ✅

---

### **Method 3: Direct SQL Execution**

If you have direct database access:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migration 1
\i supabase/migrations/20251203190000_create_ambassador_program.sql

# Run migration 2
\i supabase/migrations/20251203195000_fix_ambassador_insert_policy.sql

# Verify
\dt public.ambassador*
```

---

## ✅ **VERIFICATION CHECKLIST**

After deployment, verify everything is set up:

### **1. Check Tables Exist:**

```sql
-- Run this in SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'ambassador_profiles',
  'referrals',
  'commission_transactions',
  'ambassador_payouts'
);

-- Should return 4 rows
```

### **2. Check RLS Policies:**

```sql
-- Check policies on ambassador_profiles
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'ambassador_profiles';

-- Should show:
-- Users can view own ambassador profile (SELECT)
-- Users can create own ambassador profile (INSERT)
-- Users can update own ambassador profile (UPDATE)
-- Admins can manage all ambassador data (ALL)
```

### **3. Test INSERT:**

```sql
-- Try to insert a test profile
INSERT INTO ambassador_profiles (
  user_id,
  referral_code,
  tier,
  status
) VALUES (
  auth.uid(),
  'TEST1234',
  'referral_boss',
  'active'
);

-- Should succeed! ✅
-- Then delete the test:
DELETE FROM ambassador_profiles WHERE referral_code = 'TEST1234';
```

---

## 🎯 **AFTER DEPLOYMENT**

Once tables are deployed, test the app:

```bash
npm run dev
```

**Test Flow:**
1. Go to /wallet
2. Click "Become an Ambassador"
3. Click "Become an Ambassador Now"
4. ✅ Should work without errors!
5. ✅ Profile should be created
6. ✅ Success page should show

---

## 📊 **WHAT GETS CREATED**

### **Tables:**
- `ambassador_profiles` - User ambassador data
- `referrals` - Referral tracking
- `commission_transactions` - Earnings history
- `ambassador_payouts` - Payout requests

### **Indexes:**
- Fast lookups on user_id, referral_code, status
- Optimized queries for dashboard

### **RLS Policies:**
- Users can view/edit own data
- Admins can manage all data
- System can track referrals

### **Functions:**
- `generate_referral_code()` - Generate unique codes
- `calculate_referral_commission()` - Calculate earnings
- `track_referral_conversion()` - Award commissions
- `process_monthly_recurring_commissions()` - Monthly payouts

---

## 🚨 **TROUBLESHOOTING**

### **If `supabase db push` Fails:**

**Error: "Project not linked"**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Error: "Permission denied"**
- Make sure you're logged in: `supabase login`
- Check you have admin access to the project

**Error: "Connection failed"**
- Check internet connection
- Verify project is running in Supabase dashboard

### **If Manual SQL Fails:**

**Error: "Function already exists"**
- Add `OR REPLACE` to function definitions
- Or skip if function already exists

**Error: "Table already exists"**
- Add `IF NOT EXISTS` to CREATE TABLE
- Or skip if table already exists

**Error: "Policy already exists"**
- Drop existing policy first
- Or skip if policy already exists

---

## 📋 **DEPLOYMENT SCRIPT**

Save this as `deploy-ambassador.sh`:

```bash
#!/bin/bash

echo "🚀 Deploying Ambassador Program Tables..."

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first."
    echo "Run: brew install supabase/tap/supabase"
    exit 1
fi

# Push migrations
echo "📤 Pushing migrations..."
supabase db push

if [ $? -eq 0 ]; then
    echo "✅ Migrations applied successfully!"
    echo "🎉 Ambassador tables are now live!"
else
    echo "❌ Migration failed. Please check errors above."
    echo "💡 Try deploying manually via Supabase Dashboard."
    exit 1
fi
```

Then run:
```bash
chmod +x deploy-ambassador.sh
./deploy-ambassador.sh
```

---

## ✅ **SUMMARY**

**Current Status:**
- ❌ Tables don't exist in database
- ✅ Migration files are ready
- ⚠️ Need to deploy migrations

**Action Required:**
1. Choose deployment method (CLI or Dashboard)
2. Run migrations
3. Verify tables exist
4. Test the app

**Once deployed:**
- ✅ Ambassador program fully functional
- ✅ Users can join
- ✅ Referral tracking works
- ✅ Commission system active

---

## 🚀 **QUICK START**

**Fastest way to deploy:**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy `20251203190000_create_ambassador_program.sql`
4. Paste and Run
5. Copy `20251203195000_fix_ambassador_insert_policy.sql`
6. Paste and Run
7. Test the app!

**Done!** ✅

---

**Your tables are ready to deploy - just need to run the migrations!** 🎊




