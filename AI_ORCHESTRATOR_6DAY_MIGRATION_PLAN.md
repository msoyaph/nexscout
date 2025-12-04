# AI ORCHESTRATOR - 6-Day Migration Plan

**Start Date:** December 3, 2025  
**End Date:** December 9, 2025  
**Status:** 🚀 Day 1 Started

---

## 📅 Timeline Overview

| Day | Focus | Hours | Status |
|-----|-------|-------|--------|
| **Day 1** | Setup & Testing | 4h | ✅ IN PROGRESS |
| **Day 2** | Messaging Engine Migration | 8h | ⏳ Pending |
| **Day 3** | Chatbot & Scanning Migration | 8h | ⏳ Pending |
| **Day 4** | Edge Functions Update | 6h | ⏳ Pending |
| **Day 5** | Testing & Verification | 6h | ⏳ Pending |
| **Day 6** | Cleanup & Documentation | 4h | ⏳ Pending |
| **Total** | | **36h** | |

---

## 📋 DAY 1: Setup & Testing (4 hours)

### Status: ✅ IN PROGRESS

### Objectives
- ✅ Create database migration
- ⏳ Deploy migration to database
- ⏳ Verify AIOrchestrator files
- ⏳ Run test suite
- ⏳ Verify energy integration

### Tasks Checklist

#### ✅ 1.1 Database Migration (30 min) - COMPLETE
- [x] Created: `20251203120000_create_ai_usage_logs_table.sql`
- [x] Includes:
  - [x] `ai_usage_logs` table
  - [x] 7 performance indexes
  - [x] RLS policies
  - [x] 3 helper functions
  - [x] 3 analytics views
- [ ] Deploy migration: `supabase migration up`

#### ⏳ 1.2 Verify AIOrchestrator Files (15 min)
- [x] `src/services/ai/types.ts` exists
- [x] `src/services/ai/ConfigService.ts` exists
- [x] `src/services/ai/AIOrchestrator.ts` exists
- [ ] Files compile without errors
- [ ] No missing imports

#### ⏳ 1.3 Run Test Suite (1 hour)
- [x] Created: `src/services/ai/__tests__/aiOrchestratorTest.ts`
- [ ] Test 1: Basic generation works
- [ ] Test 2: Config caching works
- [ ] Test 3: Energy integration works
- [ ] Test 4: Auto model selection works
- [ ] Test 5: Error handling works
- [ ] Test 6: Metrics tracking works

#### ⏳ 1.4 Test Edge Function Integration (1 hour)
- [ ] Verify `generate-ai-content` edge function exists
- [ ] Test calling from AIOrchestrator
- [ ] Verify token tracking
- [ ] Verify cost calculation

#### ⏳ 1.5 Documentation Review (30 min)
- [ ] Read `AI_ORCHESTRATOR_GUIDE.md`
- [ ] Review migration examples
- [ ] Understand ConfigService caching

#### ⏳ 1.6 Create Test User (30 min)
- [ ] Create test user with sufficient energy
- [ ] Test basic AI generation
- [ ] Verify usage logged to `ai_usage_logs`
- [ ] Check metrics dashboard

### Commands for Day 1

```bash
# 1. Deploy database migration
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push

# 2. Verify tables created
supabase db diff

# 3. Test AIOrchestrator (in console or test page)
npm run dev
# Then in browser console:
# aiOrchestratorTests.quickTest("your-user-id")
# aiOrchestratorTests.runAllTests()

# 4. Check database logs
# supabase sql
SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 10;
```

### Expected Outputs
- ✅ Database migration deployed successfully
- ✅ All 6 tests pass
- ✅ AI generations logged to database
- ✅ Metrics show accurate data

---

## 📋 DAY 2: Messaging Engine Migration (8 hours)

### Objectives
- Identify all files using old messaging engines
- Migrate messaging engine calls to AIOrchestrator
- Test messaging functionality

### Tasks Checklist

#### 2.1 Audit Messaging Engine Usage (1 hour)
- [ ] Find all imports of `messagingEngine.ts`
- [ ] Find all imports of `messagingEngineV2.ts`
- [ ] Find all imports of `messagingEngineV4.ts`
- [ ] Create migration tracking spreadsheet

**Command:**
```bash
# Find all messaging engine usages
grep -r "from.*messagingEngine" src/ --include="*.ts" --include="*.tsx"
grep -r "messagingEngine\.generate" src/ --include="*.ts" --include="*.tsx"
```

#### 2.2 Migrate Core Message Generation (2 hours)
Files likely to migrate:
- [ ] `src/pages/AIMessagesPage.tsx`
- [ ] `src/pages/MessagingHubPage.tsx`
- [ ] `src/components/GenerateMessageModal.tsx`
- [ ] `src/hooks/useProspectActions.ts`

**Migration pattern:**
```typescript
// BEFORE
import { messagingEngine } from '@/services/ai/messagingEngine';
const result = await messagingEngine.generateMessage({
  userId, prospectId, intent, tone, industry
});

// AFTER
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { configService } from '@/services/ai/ConfigService';
const config = await configService.loadConfig(userId);
const result = await aiOrchestrator.generate({
  messages: [
    { role: 'system', content: buildSystemPrompt(config) },
    { role: 'user', content: buildUserPrompt(intent) }
  ],
  config: { userId, prospectId, action: 'ai_message' }
});
```

#### 2.3 Migrate Objection Handler (2 hours)
- [ ] Find objection handler usages
- [ ] Migrate to AIOrchestrator
- [ ] Test objection responses

#### 2.4 Migrate Booking Scripts (1 hour)
- [ ] Find booking script generator usages
- [ ] Migrate to AIOrchestrator
- [ ] Test booking script generation

#### 2.5 Testing (2 hours)
- [ ] Test message generation end-to-end
- [ ] Test objection handler
- [ ] Test booking scripts
- [ ] Verify all features still work
- [ ] Check `ai_usage_logs` for proper tracking

### Day 2 Success Criteria
✅ All messaging features use AIOrchestrator  
✅ No references to old messaging engines  
✅ All messaging tests pass  
✅ Usage logged correctly  

---

## 📋 DAY 3: Chatbot & Scanning Migration (8 hours)

### Objectives
- Migrate chatbot engine to AIOrchestrator
- Migrate scanning engine to AIOrchestrator
- Test both systems

### Tasks Checklist

#### 3.1 Migrate Public Chatbot (3 hours)
- [ ] Find `chatbotEngine.ts` usages
- [ ] Migrate public chatbot responses
- [ ] Update `public-chatbot-chat` edge function
- [ ] Test chatbot conversations

Files to migrate:
- [ ] `src/pages/AIChatbotPage.tsx`
- [ ] `src/pages/PublicChatPage.tsx`
- [ ] `src/services/chatbot/publicChatbotEngine.ts`
- [ ] Edge function: `supabase/functions/public-chatbot-chat/`

#### 3.2 Migrate Internal Chatbot (1 hour)
- [ ] Migrate internal AI assistant
- [ ] Test AI responses
- [ ] Verify conversation history

#### 3.3 Migrate Scanning Engine (3 hours)
- [ ] Find `scanningEngine.ts` usages
- [ ] Migrate prospect analysis
- [ ] Update scanning pipeline
- [ ] Test deep scan feature

Files to migrate:
- [ ] `src/services/ai/scanningEngine.ts`
- [ ] `src/services/ai/deepScanEngine.ts`
- [ ] `src/pages/AIDeepScanPage.tsx`
- [ ] `src/pages/AIScanningPage.tsx`

#### 3.4 Testing (1 hour)
- [ ] Test public chatbot end-to-end
- [ ] Test prospect scanning
- [ ] Test deep scan analysis
- [ ] Verify usage tracking

### Day 3 Success Criteria
✅ Chatbot uses AIOrchestrator  
✅ Scanning uses AIOrchestrator  
✅ All conversations tracked  
✅ All scans tracked  

---

## 📋 DAY 4: Edge Functions Update (6 hours)

### Objectives
- Update all edge functions to use AIOrchestrator pattern
- Ensure consistent error handling
- Test all edge functions

### Tasks Checklist

#### 4.1 Update `generate-ai-content` Edge Function (2 hours)
- [ ] Review current implementation
- [ ] Update to support AIOrchestrator request format
- [ ] Add comprehensive error handling
- [ ] Test all generation types

File: `supabase/functions/generate-ai-content/index.ts`

#### 4.2 Update `public-chatbot-chat` Edge Function (2 hours)
- [ ] Update chatbot response generation
- [ ] Ensure proper workspace isolation
- [ ] Test with multiple workspaces

File: `supabase/functions/public-chatbot-chat/index.ts`

#### 4.3 Update `scan-processor-v2` Edge Function (1 hour)
- [ ] Update AI analysis calls
- [ ] Ensure proper energy deduction
- [ ] Test scanning pipeline

File: `supabase/functions/scan-processor-v2/index.ts`

#### 4.4 Testing All Edge Functions (1 hour)
- [ ] Test each edge function manually
- [ ] Verify error responses
- [ ] Check usage logging
- [ ] Monitor performance

### Commands for Day 4
```bash
# Deploy edge functions
supabase functions deploy generate-ai-content
supabase functions deploy public-chatbot-chat
supabase functions deploy scan-processor-v2

# Test edge functions
curl -X POST https://your-project.supabase.co/functions/v1/generate-ai-content \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"messages": [...], "config": {...}}'
```

### Day 4 Success Criteria
✅ All edge functions updated  
✅ All edge functions tested  
✅ Error handling consistent  
✅ Performance acceptable  

---

## 📋 DAY 5: Testing & Verification (6 hours)

### Objectives
- Comprehensive end-to-end testing
- Performance verification
- Cost tracking validation

### Tasks Checklist

#### 5.1 Feature Testing (3 hours)
Test each feature thoroughly:
- [ ] Message generation (all types)
- [ ] Objection handling
- [ ] Booking scripts
- [ ] Revival messages
- [ ] Referral messages
- [ ] Call scripts
- [ ] Chatbot conversations
- [ ] Prospect scanning
- [ ] Deep analysis
- [ ] Pitch deck generation
- [ ] Sequence generation

#### 5.2 Energy System Verification (1 hour)
- [ ] Test with user having sufficient energy
- [ ] Test with user having low energy
- [ ] Verify auto-downgrade to GPT-3.5
- [ ] Verify energy deduction
- [ ] Test insufficient energy error

#### 5.3 Cost Tracking Verification (1 hour)
- [ ] Run multiple AI generations
- [ ] Query `ai_usage_logs` table
- [ ] Verify token counts
- [ ] Verify cost calculations
- [ ] Check analytics views

**SQL Queries:**
```sql
-- Check recent usage
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 20;

-- Check cost accuracy
SELECT 
  action,
  model,
  AVG(cost_usd) as avg_cost,
  SUM(cost_usd) as total_cost,
  COUNT(*) as count
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY action, model;

-- Check energy correlation
SELECT 
  action,
  model,
  AVG(energy_consumed) as avg_energy,
  AVG(cost_usd) as avg_cost
FROM ai_usage_logs
GROUP BY action, model;
```

#### 5.4 Performance Testing (1 hour)
- [ ] Test response times
- [ ] Verify config caching works
- [ ] Check database query counts
- [ ] Monitor memory usage
- [ ] Test with 10+ concurrent requests

### Day 5 Success Criteria
✅ All features working  
✅ Energy system working  
✅ Cost tracking accurate  
✅ Performance acceptable  
✅ No regressions  

---

## 📋 DAY 6: Cleanup & Documentation (4 hours)

### Objectives
- Delete old engine files
- Clean up imports
- Update documentation
- Create handoff document

### Tasks Checklist

#### 6.1 Delete Old Engine Files (1 hour)
Files to delete:
- [ ] `src/services/ai/messagingEngine.OLD.ts`
- [ ] `src/services/ai/messagingEngine.ts` (if replaced)
- [ ] `src/services/ai/messagingEngineV2.ts`
- [ ] `src/services/ai/advancedMessagingEngines.ts`
- [ ] `src/engines/messaging/messagingEngineV4.ts` (if fully migrated)
- [ ] `src/services/ai/chatbotEngine.ts` (if duplicated)
- [ ] `src/services/ai/scanningEngine.ts` (if duplicated)

**Verify before deleting:**
```bash
# Check for remaining imports
grep -r "messagingEngine" src/ --include="*.ts" --include="*.tsx"
grep -r "chatbotEngine" src/ --include="*.ts" --include="*.tsx"
```

#### 6.2 Clean Up Imports (1 hour)
- [ ] Remove unused imports across codebase
- [ ] Fix any broken imports
- [ ] Update index.ts exports
- [ ] Run TypeScript compiler

```bash
# Check for TypeScript errors
npm run typecheck
```

#### 6.3 Update Documentation (1 hour)
- [ ] Update main README.md
- [ ] Document AIOrchestrator in architecture docs
- [ ] Update API documentation
- [ ] Create quick reference guide

#### 6.4 Create Handoff Document (1 hour)
- [ ] Document what was changed
- [ ] List all migrated files
- [ ] Document any gotchas
- [ ] Create monitoring guide

### Day 6 Success Criteria
✅ All old files deleted  
✅ No unused imports  
✅ Documentation updated  
✅ Clean codebase  

---

## 📊 Migration Tracking

### Files Migrated

| File | Old Engine | Status | Notes |
|------|------------|--------|-------|
| `AIMessagesPage.tsx` | messagingEngine | ⏳ Pending | |
| `MessagingHubPage.tsx` | messagingEngine | ⏳ Pending | |
| `GenerateMessageModal.tsx` | messagingEngine | ⏳ Pending | |
| `AIChatbotPage.tsx` | chatbotEngine | ⏳ Pending | |
| `PublicChatPage.tsx` | chatbotEngine | ⏳ Pending | |
| `AIDeepScanPage.tsx` | scanningEngine | ⏳ Pending | |
| `generate-ai-content` | Multiple | ⏳ Pending | Edge function |
| `public-chatbot-chat` | chatbotEngine | ⏳ Pending | Edge function |

### Metrics to Track

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines of Code | ~2,900 | ~600 | -79% |
| AI Engine Files | 6 | 1 | -83% |
| Config Loads/Request | 40+ | 1 | -97% |
| Token Tracking Coverage | ~40% | 100% | +60% |
| Energy Coverage | ~60% | 100% | +40% |

---

## 🚨 Risk Mitigation

### Potential Issues & Solutions

#### Issue 1: Energy System Conflicts
**Risk:** Energy deducted twice (old + new system)  
**Mitigation:** 
- Test with test user first
- Verify energy logs
- Rollback plan ready

#### Issue 2: Missing Config Data
**Risk:** ConfigService returns defaults, AI responses generic  
**Mitigation:**
- Test config loading first
- Verify all tables have data
- Add logging to ConfigService

#### Issue 3: Edge Function Timeout
**Risk:** AIOrchestrator takes too long, edge function times out  
**Mitigation:**
- Monitor latency metrics
- Add timeout handling
- Consider async processing for expensive operations

#### Issue 4: Cost Tracking Inaccuracy
**Risk:** Token counts or costs calculated incorrectly  
**Mitigation:**
- Verify token counts against OpenAI API
- Cross-reference with actual API bills
- Add unit tests for cost calculation

---

## 📞 Support & Resources

### Documentation
- `AI_ORCHESTRATOR_GUIDE.md` - Complete usage guide
- `AI_ORCHESTRATOR_MIGRATION_EXAMPLES.md` - Code examples
- `AI_ORCHESTRATOR_IMPLEMENTATION_SUMMARY.md` - Technical overview

### Testing
- `src/services/ai/__tests__/aiOrchestratorTest.ts` - Test suite

### Database
- `supabase/migrations/20251203120000_create_ai_usage_logs_table.sql` - Migration file

### Helpful Commands
```bash
# Check migration status
supabase migration list

# View logs
supabase logs --type database
supabase logs --type functions

# Query usage
supabase sql < query.sql

# Test locally
npm run dev
```

---

## ✅ Daily Sign-off Checklist

### End of Each Day
- [ ] All tasks for the day completed
- [ ] Tests passing
- [ ] No TypeScript errors
- [ ] Git commit with descriptive message
- [ ] Update this document with progress
- [ ] Document any issues encountered

---

## 🎯 Final Success Criteria

Migration is complete when:
- ✅ All AI calls go through AIOrchestrator
- ✅ Config loaded once per 5 minutes (cached)
- ✅ Energy automatically checked on every AI call
- ✅ 100% token & cost tracking
- ✅ Old engine files deleted
- ✅ No code duplication
- ✅ All tests passing
- ✅ Documentation updated
- ✅ Performance acceptable
- ✅ Costs trackable and accurate

---

**Status:** Day 1 in progress  
**Next Step:** Deploy database migration  
**Blockers:** None  

🚀 **Let's ship it!**


