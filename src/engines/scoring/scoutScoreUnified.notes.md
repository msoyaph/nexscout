# ScoutScore Engine Consolidation - Discovery Notes

## Date: December 2, 2025
## Auditor: System Architect

---

## 📋 DISCOVERED SCOUTSCORE ENGINES

### 1. **scoutScoreV5.ts** - LATEST VERSION
- **Location:** `src/services/scoutScoreV5.ts`
- **Status:** Latest version, likely most sophisticated
- **Expected Features:** Most comprehensive scoring algorithm
- **Action:** Needs detailed analysis

### 2. **scoutScoreV5.ts** (Duplicate location)
- **Location:** `src/services/intelligence/scoutScoreV5.ts`
- **Status:** DUPLICATE file in different directory
- **Action:** Investigate which is canonical

### 3. **scoutScoreV4.ts**
- **Location:** `src/services/intelligence/scoutScoreV4.ts`
- **Status:** Previous version
- **Action:** Document differences from V5

### 4. **scoutScoringV4.ts**
- **Location:** `src/services/scoutScoringV4.ts`
- **Status:** Different naming convention - investigate
- **Action:** Determine if this is same as scoutScoreV4

### 5. **scoutScoringV3.ts**
- **Location:** `src/services/scoutScoringV3.ts`
- **Status:** Older version
- **Action:** Document evolution

### 6. **scoutScoringV2.ts**
- **Location:** `src/services/scoutScoringV2.ts`
- **Status:** Even older version
- **Action:** Determine if still in use

### 7. **scoutScoreEngine.ts**
- **Location:** `src/services/scanner/scoutScoreEngine.ts`
- **Status:** Scanner-specific scoring logic
- **Action:** Determine if specialized or duplicate

### 8. **scoutScoreMath.ts**
- **Location:** `src/services/scoutScoreMath.ts`
- **Status:** Shared math utilities
- **Action:** Keep as utility library

---

## 🔍 ANALYSIS PLAN

### Step 1: Read and Compare Files
Need to analyze:
1. Input/output interfaces
2. Scoring algorithms
3. Weight profiles
4. Bucketing logic (cold/warm/hot/vip)
5. Call sites and usage

### Step 2: Identify Versions
- Determine which is newest/canonical
- Identify unique features per version
- Map evolution timeline

### Step 3: Create Weight Profiles
Each version likely has different weights for:
- Engagement signals
- Profile data
- Behavioral indicators
- Social graph position
- Response patterns

### Step 4: Design Unified Architecture
```typescript
export type ScoutScoreMode =
  | 'default'           // Latest V5 logic
  | 'mlmProspect'       // Network marketing focus
  | 'insuranceLead'     // Insurance sales focus
  | 'customerLTV'       // Lifetime value focus
  | 'coldLead'          // Cold outreach focus
  | 'legacyV1'          // Original algorithm
  | 'legacyV2'          // V2 algorithm
  | 'legacyV3'          // V3 algorithm
  | 'legacyV4'          // V4 algorithm
  | 'legacyV5';         // V5 algorithm (for compatibility)

export interface ProspectSignals {
  // Engagement metrics
  messagesSent?: number;
  repliesReceived?: number;
  daysSinceLastContact?: number;
  responseRate?: number;

  // Profile data
  incomeBracket?: string;
  location?: string;
  ageRange?: string;
  profession?: string;

  // Behavioral signals
  clickedLinks?: number;
  openedEmails?: number;
  joinedWebinar?: boolean;
  purchasedBefore?: boolean;

  // Social graph
  mutualConnections?: number;
  networkPosition?: string;

  // Meta
  tags?: string[];
  custom?: Record<string, unknown>;
}

export interface ScoutScoreOutput {
  score: number;              // 0-100
  bucket: 'cold' | 'warm' | 'hot' | 'vip';
  confidence: number;         // 0-1
  breakdown: Record<string, number>;
  factors: {
    positive: string[];
    negative: string[];
  };
  versionApplied: ScoutScoreMode;
  debugInfo?: Record<string, unknown>;
}
```

---

## 📊 CONSOLIDATION GOALS

### Must Preserve
1. V5 scoring logic (most advanced)
2. All weight profiles from V1-V5
3. Bucket mapping (cold/warm/hot/vip)
4. Performance (scoring must be fast)

### Must Improve
1. Single source of truth
2. Configurable behavior
3. Easy A/B testing of algorithms
4. Clear documentation of weights

### Nice to Have
1. ML model integration
2. Real-time recalibration
3. Industry-specific profiles
4. Custom weight overrides

---

## 🚨 RISKS

### Critical
- Breaking existing scoring will affect:
  - Prospect prioritization
  - Pipeline automation
  - AI message targeting
  - Analytics dashboards

### High
- Different versions may be tuned for different markets
- Filipino vs US vs other markets
- MLM vs insurance vs real estate

### Medium
- Performance impact if unified engine is slower
- Testing coverage gaps

---

## ✅ NEXT STEPS

1. ✅ Create discovery document
2. ✅ Read all 8 ScoutScore files
3. ✅ Map differences and evolution
4. ✅ Create weight profiles for each version
5. ✅ Build unified scoring engine
6. ⏳ Create adapter wrappers
7. ⏳ Test scoring accuracy
8. ⏳ Migrate call sites
9. ⏳ Deprecate old versions

---

## 📦 IMPLEMENTATION COMPLETE: scoutScoreUnified.ts

**Location:** `/src/engines/scoring/scoutScoreUnified.ts`

**Status:** ✅ FULLY IMPLEMENTED

### Architecture Overview

**6 Scoring Modes:**
1. `v1_simple` - Basic keyword matching (pain points + opportunity signals)
2. `v2_mlm` - MLM-focused 7-feature vector (engagement, business interest, pain, life events, etc.)
3. `v3_social` - Adds social graph trust and relationship scoring
4. `v4_behavioral` - Full behavioral timeline analysis with momentum trends
5. `v5_intelligence` - Advanced multi-engine intelligence with opportunity prediction
6. `unified` - **RECOMMENDED** - Combines all engines with intelligent boosting

### Key Features

**Unified Interface:**
```typescript
interface ScoutScoreInput {
  prospectId: string;
  userId: string;
  textContent?: string;
  browserCaptureData?: any;
  socialGraphData?: any;
  historicalData?: any;
  prospectData?: { ... };
  config?: ScoutScoreConfig;
}

interface ScoutScoreOutput {
  success: boolean;
  score: number;
  rating: 'hot' | 'warm' | 'cold';
  confidence: number;
  breakdown?: { ... };
  explanation?: string[];
  insights?: string[];
  recommendations?: { ... };
  timeline?: { ... };
  socialGraph?: { ... };
  opportunityPrediction?: { ... };
  conversionPatterns?: { ... };
}
```

**Configuration System:**
```typescript
{
  mode: 'unified',  // Choose scoring algorithm
  industry?: Industry,
  language: 'auto',
  includeBreakdown: true,
  includeInsights: true,
  includeRecommendations: true,
  includeTimeline: false,
  includeSocialGraph: false,
  includeOpportunityPrediction: false,
  includeConversionPatterns: false,
  horizonDays: 7,
  weights?: { ... }
}
```

### Unified Mode Intelligence

Combines V4 base score with intelligent boosting from:
- **Behavioral Momentum**: +10 points for warming_up trends
- **Social Influence**: +15 points for high influencers
- **Opportunity Prediction**: +10 points for high conversion probability
- **Pattern Matching**: +8 points for proven conversion patterns

Max score: 100 (clamped)

### Legacy Compatibility

All legacy algorithms preserved:
- V1 → Simple keyword matching
- V2 → MLM feature vector (7 features)
- V3 → Social graph integration (8 dimensions)
- V4 → Behavioral timeline (8 dimensions)
- V5 → Full intelligence suite (5 data sources)

### Performance

- Async/await pattern
- Parallel data fetching
- Processing time tracking
- Batch calculation support
- Top prospects ranking

### Next: Adapter Wrappers

Create thin wrappers for backward compatibility:
```typescript
// scoutScoreV2Adapter.ts
export const calculateScoutScore = (prospectId, userId) =>
  scoutScoreUnified.calculateScoutScore({
    prospectId,
    userId,
    config: { mode: 'v2_mlm' }
  });
```

---

## 📝 NOTES

- `scoutScoreMath.ts` should remain as utility library
- Scanner-specific scoring may have different requirements
- Need to verify if V5 is truly latest or if there are newer versions
