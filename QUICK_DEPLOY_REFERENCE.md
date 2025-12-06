# NEXSCOUT - QUICK DEPLOY REFERENCE
**One-Page Deployment Guide**  
**Keep This Handy!** 📌

---

## 🚀 **DEPLOY IN 3 STEPS**

### Step 1: Deploy Migrations
```bash
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push
```

### Step 2: Restart Dev Server
```bash
npm run dev
```

### Step 3: Verify
- Visit `/pitch-deck` → Click settings → Should work ✅
- Visit `/chat/tu5828` → Should load chat ✅
- Check badges → Should say "Pro" not "Elite" ✅

**Done!** 🎉

---

## 📋 **WHAT GETS DEPLOYED**

| Migration | What It Does | Impact |
|-----------|--------------|--------|
| `20251203120000` | Creates AI usage logs | Track AI costs |
| `20251203130000` | Removes Elite tier | Simplifies pricing |
| `20251203150000` | Creates AI instructions | WordPress-style editor |
| `20251203160000` | Creates storage buckets | Upload images/files |
| `20251203170000` | Fixes prospect_scores | No more errors |
| `20251203180000` | Initializes chatbot links | Public chats work |

**Plus:** 1 migration directly edited (prospect_scores fix)

---

## ✅ **QUICK VERIFICATION**

### Test 1: AI Pitch Deck
```
/pitch-deck → Click ⚙️ → Type text → Save → ✅
```

### Test 2: Public Chatbot
```
/chat/tu5828 → Loads → Send message → ✅
```

### Test 3: DeepScan
```
Prospect → AI DeepScan Analysis → Loads → ✅
```

### Test 4: Database
```sql
SELECT subscription_tier, COUNT(*) 
FROM profiles 
GROUP BY subscription_tier;

-- Expected: No 'elite' tier
```

---

## 🐛 **IF SOMETHING BREAKS**

### Error: "relation does not exist"
```bash
# Check which migrations applied
supabase db remote commit

# If needed, reset local DB (LOCAL ONLY!)
supabase db reset
```

### Error: "Chat not found"
```sql
-- Check if chatbot links exist
SELECT * FROM chatbot_links LIMIT 5;

-- If empty, run migration again
supabase db push --force
```

### Error: Blank page
```bash
# Check console for errors
# Usually means migration not applied
supabase db push
npm run dev
```

---

## 📊 **WHAT CHANGED**

### Database:
- ✅ 6 new tables/buckets
- ✅ Elite tier → Pro (all users)
- ✅ Chatbot links auto-created

### Frontend:
- ✅ 40+ files updated
- ✅ Elite references removed
- ✅ AI Settings modals added

### Features:
- ✅ WordPress-style AI editor
- ✅ Public chatbots work
- ✅ AI cost tracking
- ✅ DeepScan fixed

---

## 🎯 **SUCCESS CHECKLIST**

After `supabase db push`:
- [ ] 7 migrations applied
- [ ] No errors in output
- [ ] "Chatbot links created: X" message

After `npm run dev`:
- [ ] App loads without errors
- [ ] Can access AI Pitch Deck
- [ ] Can open settings modal
- [ ] No Elite tier visible

---

## 📚 **FULL DOCUMENTATION**

Need more details? Check these files:

| File | Purpose |
|------|---------|
| `MASTER_DEPLOYMENT_GUIDE.md` | Complete deployment guide |
| `SESSION_COMPLETE_SUMMARY.md` | Everything accomplished |
| `ELITE_TIER_REMOVAL_COMPLETE.md` | Elite tier changes |
| `CHATBOT_LINK_FIX_COMPLETE.md` | Chatbot link fix |
| `UNIFIED_AI_SYSTEM_INSTRUCTIONS_COMPLETE.md` | AI instructions |
| `AI_ORCHESTRATOR_GUIDE.md` | AIOrchestrator usage |

---

## 🆘 **EMERGENCY CONTACTS**

### Supabase Dashboard:
```
https://app.supabase.com/project/YOUR_PROJECT
```

### Check Logs:
```bash
supabase functions logs
```

### Rollback (CAUTION!):
```bash
# Only if absolutely necessary
supabase db remote commit
# Note the last working migration
supabase db reset --version YYYYMMDD_HHMMSS
```

---

## 🎉 **QUICK WINS**

### What Users Will Notice:
- ✅ More features in Pro (from Elite)
- ✅ Can customize AI per feature
- ✅ Public chatbot links work
- ✅ Better UI/UX

### What Admins Will Notice:
- ✅ Simpler pricing (4 tiers)
- ✅ AI cost tracking
- ✅ No more "Chat not found" support tickets
- ✅ Better insights

### What Developers Will Notice:
- ✅ Cleaner codebase
- ✅ Centralized AI calls
- ✅ Better architecture
- ✅ Comprehensive docs

---

## ⏱️ **DEPLOYMENT TIME**

| Task | Time |
|------|------|
| `supabase db push` | 2-3 min |
| `npm run dev` | 30 sec |
| Verification | 2 min |
| **TOTAL** | **~5 min** |

---

## 🎯 **ONE COMMAND DEPLOY**

```bash
cd /Users/cliffsumalpong/Documents/NexScout && \
supabase db push && \
echo "✅ Migrations deployed!" && \
npm run dev
```

**Copy-paste and go!** 🚀

---

## 📌 **PIN THIS**

Keep this reference handy for:
- Quick deployments
- Troubleshooting
- Verification
- Emergency rollbacks

**Bookmark:** `/QUICK_DEPLOY_REFERENCE.md`

---

**All systems ready. Deploy when ready!** ✅




