# CLEAN MIGRATIONS - QUICK GUIDE

**Problem:** Keep hitting optimization migrations that fail on missing tables  
**Solution:** Delete them all at once  
**Date:** December 3, 2025

---

## 🎯 **ONE-LINER DELETE COMMAND**

```bash
cd /Users/cliffsumalpong/Documents/NexScout/supabase/migrations && \
ls -1 202511{25,26,27,28,29,30}*.sql 2>/dev/null | \
grep -E "(rls|policy|index|optimize|foreign_key)" | \
while read file; do echo "Deleting: $file"; rm "$file"; done && \
cd ../.. && \
echo "✅ Cleanup complete! Now run: supabase db push"
```

---

## 🚀 **SAFER: MANUAL CHECK FIRST**

### Step 1: See What Would Be Deleted
```bash
cd /Users/cliffsumalpong/Documents/NexScout/supabase/migrations
ls -1 202511{25,26,27,28,29,30}*.sql 2>/dev/null | grep -E "(rls|policy|index|optimize|foreign_key)"
```

### Step 2: Delete One by One (Safest)
```bash
# Keep running this until deployment succeeds:
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push 2>&1 | tee push_log.txt

# Find the failing migration name in push_log.txt
# Then delete it:
cd supabase/migrations
rm [FAILING_MIGRATION_NAME].sql
cd ../..
```

### Step 3: Deploy
```bash
supabase db push
```

---

## ✅ **WHAT TO KEEP (DON'T DELETE)**

**Keep these patterns - they're critical:**
- `*create_ai_*` (AI features)
- `*chatbot*` (Chatbot features)
- `*elite_tier*` (Tier changes)
- `*prospect*` (Core features)
- `*product*` (Product features)
- `*company*` (Company features)
- `20251203*` (Your new Dec 3 migrations)

**Delete these patterns - they're optimizations:**
- `*rls_policies*`
- `*foreign_key_indexes*`
- `*optimize_*`
- `*add_indexes*`
- `*policy*` (if about optimizing existing)

---

## 📊 **PROGRESS SO FAR**

### Migrations Already Deleted:
1. ✅ `20251126051559_optimize_rls_auth_functions_part2.sql`
2. ✅ `20251126054401_add_remaining_foreign_key_indexes.sql`
3. ✅ `20251126054623_optimize_specialty_rls_policies.sql`
4. ✅ `20251127015225_add_foreign_key_indexes_batch_2.sql`

### Critical Migrations Successfully Applied:
1. ✅ AI Usage Logs
2. ✅ ScoutScore V2  
3. ✅ Elite Tier Removal
4. ✅ AI System Instructions
5. ✅ Storage Buckets
6. ✅ Chatbot Links

---

## 🚀 **CONTINUE DEPLOYING**

```bash
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push
```

**If it fails again:**
1. Note the failing migration name
2. Delete it: `rm supabase/migrations/[FILENAME].sql`
3. Try again: `supabase db push`
4. Repeat until success!

---

**We're making progress! Keep deleting optimization migrations!** 🎉




