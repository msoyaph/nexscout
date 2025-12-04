# Messaging Engine Consolidation - Discovery Notes

## Date: December 2, 2025
## Auditor: System Architect

---

## 📋 DISCOVERED MESSAGING ENGINES

### 1. **messagingEngine.ts** (957 lines) - PRIMARY CANONICAL
- **Location:** `src/services/ai/messagingEngine.ts`
- **Status:** Claims to be consolidated canonical version
- **Input Type:** Multiple interfaces (GenerateMessageParams, ObjectionResponseParams, etc.)
- **Output Type:** Multiple interfaces (ObjectionResponse, BookingScript, etc.)
- **Primary Use Cases:**
  - General AI message generation
  - Multi-step follow-up sequences
  - Objection handling (10 types)
  - Booking scripts
  - Revival messages
  - Referral messages
  - Call scripts
  - Pitch deck delegation
- **Special Behavior:**
  - Energy system integration
  - Tier-based limits (Free: 2/day, Pro+: unlimited)
  - Delegates to Edge Function `/generate-ai-content`
  - Analytics tracking
  - Daily usage tracking
- **Dependencies:**
  - energyEngine
  - analyticsEngineV2
  - supabase
- **Called By:**
  - AIMessagesPage
  - GenerateMessageModal
  - MessagingHubPage
  - Edge functions

### 2. **messagingEngineV2.ts** (742 lines) - DUPLICATE LOGIC
- **Location:** `src/services/ai/messagingEngineV2.ts`
- **Status:** Active duplicate with similar objection handling
- **Input Type:** Different interfaces (no energy integration)
- **Output Type:** ObjectionResponse, BookingScript, CoachingSession, GeneratedMessage
- **Primary Use Cases:**
  - Objection handling (10 types) - **SAME AS V1**
  - Booking scripts - **SAME AS V1**
  - Elite coaching sessions (unique feature)
  - Message generation with alternatives
- **Special Behavior:**
  - NO energy integration
  - Tier-based daily limits
  - Direct database inserts (no Edge Function)
  - Filipino language mixing (Taglish)
  - More detailed personality insights
- **Unique Features:**
  - Elite coaching (not in V1)
  - Message alternatives (3 variants)
  - Emotional tone classification
- **Dependencies:**
  - supabase (direct queries, no edge functions)
- **Called By:**
  - Unknown - needs search

### 3. **messagingEngine.OLD.ts**
- **Location:** `src/services/ai/messagingEngine.OLD.ts`
- **Status:** Deprecated, should be removed
- **Action:** DELETE after confirming no imports

### 4. **messagingClient.ts**
- **Location:** `src/services/ai/messagingClient.ts`
- **Status:** Needs investigation - likely a wrapper/helper

### 5. **chatbotEngine.ts**
- **Location:** `src/services/ai/chatbotEngine.ts`
- **Status:** Different purpose - internal chatbot, not messaging

### 6. **chatbotPublicEngine.ts**
- **Location:** `src/services/ai/chatbotPublicEngine.ts`
- **Status:** Different purpose - public-facing chatbot

---

## 🔍 KEY DIFFERENCES BETWEEN V1 AND V2

| Feature | messagingEngine (V1) | messagingEngineV2 |
|---------|---------------------|-------------------|
| Energy Integration | ✅ Yes | ❌ No |
| Edge Function Calls | ✅ Yes (`generate-ai-content`) | ❌ No (direct DB) |
| Elite Coaching | ❌ No | ✅ Yes |
| Message Alternatives | ❌ No | ✅ Yes (3 variants) |
| Language | English | Taglish (English + Filipino) |
| Analytics | ✅ analyticsEngineV2 | ❌ No tracking |
| Daily Limits | ✅ Tracked | ✅ Tracked |
| Objection Handling | ✅ 10 types | ✅ 10 types (DUPLICATE) |
| Booking Scripts | ✅ Yes | ✅ Yes (DUPLICATE) |

---

## 🎯 CONSOLIDATION STRATEGY

### Phase 1: Create Unified Interface
```typescript
export interface MessagingEngineConfig {
  channel: 'web' | 'facebook' | 'whatsapp' | 'email' | 'internal';
  language: 'en' | 'es' | 'fil' | 'ceb' | 'auto';
  persona: 'default' | 'sales' | 'support' | 'pastor' | 'mlmLeader';
  temperature?: number;
  maxTokens?: number;
  safetyLevel?: 'strict' | 'normal';
  versionMode?: 'legacyV1' | 'legacyV2' | 'unified';
  includeAlternatives?: boolean; // From V2
  includeCoaching?: boolean; // From V2
  useEdgeFunction?: boolean; // V1 uses edge, V2 uses direct
}
```

### Phase 2: Merge Unique Features
- Keep Elite Coaching from V2
- Keep Message Alternatives from V2
- Keep Energy Integration from V1
- Keep Edge Function delegation from V1
- Keep Taglish support from V2
- Consolidate objection handling (currently duplicated)

### Phase 3: Migration Path
1. Create `messagingEngineUnified.ts`
2. Adapt V1 → calls unified with `versionMode: 'legacyV1'`
3. Adapt V2 → calls unified with `versionMode: 'legacyV2'`
4. Gradually migrate call sites
5. Remove V1 and V2 after migration complete

---

## 🚨 RISK ASSESSMENT

### High Risk
- V1 is used by Edge Functions - breaking changes will cascade
- Energy integration is critical - must preserve
- Daily limits are tied to billing - must preserve

### Medium Risk
- V2's Elite coaching might be used by premium features
- Message alternatives may be expected by UI
- Taglish language mixing is culturally important

### Low Risk
- .OLD file can be safely deleted
- Analytics tracking can be centralized

---

## 📊 USAGE ANALYSIS NEEDED

Run these searches to find all call sites:
```bash
grep -r "messagingEngine" src/ --include="*.ts" --include="*.tsx"
grep -r "messagingEngineV2" src/ --include="*.ts" --include="*.tsx"
grep -r "from.*messagingEngine" src/
```

---

## ✅ NEXT STEPS

1. ✅ Complete this discovery document
2. ⏳ Search for all call sites
3. ⏳ Create unified engine with config-based behavior
4. ⏳ Create adapter wrappers for V1 and V2
5. ⏳ Test with existing flows
6. ⏳ Migrate new features to unified
7. ⏳ Deprecate V1 and V2
8. ⏳ Remove after full migration
