# ScoutScore v2.0 - ML-Tuned Lead Scoring Engine

## Overview

ScoutScore v2.0 is an intelligent, self-learning lead scoring system that combines rule-based features with machine learning-style reinforcement learning to prioritize prospects for MLM, Insurance, and Direct Selling professionals in the Philippines.

## Key Improvements Over v1.0

### v1.0 (Static)
- Fixed weight formula
- No personalization
- No learning from outcomes
- Limited explainability

### v2.0 (Dynamic ML-Style)
- **Personalized weight vectors** per user
- **Reinforcement learning** from wins/losses
- **7-dimension feature extraction**
- **Explainable AI** with reason tags
- **Confidence scoring**
- **Audit trail** for all changes
- **Philippine market optimization**

## Architecture

### 1. Feature Vector System

Each prospect is scored across **7 key dimensions**:

```typescript
{
  engagement_score: 0-100,           // Activity level & recency
  business_interest_score: 0-100,    // Business/entrepreneurial signals
  pain_point_score: 0-100,           // Financial stress indicators
  life_event_score: 0-100,           // Life changes (baby, job, etc.)
  responsiveness_score: 0-100,       // Likelihood to reply
  leadership_score: 0-100,           // Team-building potential
  relationship_score: 0-100          // Existing connection strength
}
```

### 2. Weighted Scoring Algorithm

**Formula:**
```
ScoutScore = Σ (feature_value × weight_value)
```

**Default Weights** (optimized for Philippine MLM market):
```json
{
  "engagement_score": 0.18,
  "business_interest_score": 0.20,
  "pain_point_score": 0.20,
  "life_event_score": 0.15,
  "responsiveness_score": 0.15,
  "leadership_score": 0.12,
  "relationship_score": 0.10
}
```

Weights sum to 1.0 and adjust over time based on user outcomes.

### 3. Bucket Classification

- **HOT** (≥80): Immediate outreach priority
- **WARM** (50-79): Strong potential, follow up soon
- **COLD** (<50): Low priority, nurture over time

### 4. Reinforcement Learning

#### Positive Outcomes (Boost Weights)
- **Won** deal: +5% to contributing features
- **Positive reply**: +2% to contributing features
- **Pipeline advance**: +2% to contributing features

#### Negative Outcomes (Reduce Weights)
- **Lost** deal: -3% from contributing features
- **No response**: -1% from contributing features
- **Ignored 14+ days**: -2% from contributing features

After each adjustment, weights are **re-normalized** to sum to 1.0.

### 5. Philippine Market Optimization

#### Filipino Keywords Recognized
```typescript
business: ['negosyo', 'business', 'sideline', 'extra income', 'kita', 'tubo']
finance: ['pera', 'money', 'income', 'sahod', 'salary', 'ipon', 'utang']
career: ['trabaho', 'work', 'job', 'career', 'promotion']
family: ['pamilya', 'family', 'anak', 'asawa', 'kabuhayan']
freedom: ['freedom', 'kalayaan', 'time', 'oras', 'flexible']
```

#### High-Value Pain Points
- Financial stress (`financial_stress`, `utang`, `debt`)
- Income concerns (`sahod`, `income`, `money`)
- Job dissatisfaction (`trabaho`, `job_dissatisfaction`)
- Time freedom goals (`time`, `flexible`, `pahinga`)

## Database Schema

### Core Tables

#### `user_scoring_profiles`
Stores personalized weight vectors that learn over time.

```sql
user_id uuid PRIMARY KEY
weights jsonb                    -- Personalized weight vector
total_scored integer            -- Total prospects scored
total_wins integer              -- Successful conversions
total_losses integer            -- Lost opportunities
win_rate numeric                -- Success percentage
model_version text              -- Currently 'v2.0'
```

#### `prospect_feature_vectors`
Computed ML features for each prospect.

```sql
prospect_id uuid
user_id uuid
engagement_score numeric (0-100)
business_interest_score numeric (0-100)
pain_point_score numeric (0-100)
life_event_score numeric (0-100)
responsiveness_score numeric (0-100)
leadership_score numeric (0-100)
relationship_score numeric (0-100)
features jsonb                  -- Full breakdown
confidence numeric (0-1)        -- Data quality score
```

#### `scoring_history`
Audit trail of all score changes.

```sql
prospect_id uuid
user_id uuid
old_score numeric
new_score numeric
score_delta numeric
action_trigger text             -- What caused recalc
weight_vector_used jsonb
feature_vector_used jsonb
```

### Enhanced Fields in `prospect_scores`
```sql
feature_vector jsonb            -- Snapshot of features used
weight_vector jsonb             -- Weights applied
confidence numeric              -- Scoring confidence
model_version text              -- 'v2.0'
top_features jsonb              -- Top 3 contributors
recalc_count integer           -- How many times recalculated
last_recalc_reason text        -- Why it was recalculated
```

## API Usage

### Edge Function: `scoutscore-v2`

#### 1. Recalculate Single Prospect

```typescript
POST /functions/v1/scoutscore-v2/recalculate
Authorization: Bearer <user_token>

{
  "prospectId": "uuid-here"
}

Response:
{
  "success": true,
  "result": {
    "score": 87,
    "bucket": "hot",
    "tags": ["Strong business interest", "Recent life event"],
    "features": {...}
  }
}
```

#### 2. Bulk Recalculate (up to 100)

```typescript
POST /functions/v1/scoutscore-v2/recalculate
Authorization: Bearer <user_token>

{
  "bulkRecalculate": true
}

Response:
{
  "success": true,
  "results": [...],
  "count": 45
}
```

#### 3. Record Outcome (Trigger Learning)

```typescript
POST /functions/v1/scoutscore-v2/outcome
Authorization: Bearer <user_token>

{
  "prospectId": "uuid-here",
  "outcome": "won" | "lost" | "positive_reply" | "no_response"
}

Response:
{
  "success": true,
  "message": "Weights adjusted and score recalculated"
}
```

### TypeScript Client Service

```typescript
import { scoutScoringV2 } from '@/services';

// Calculate score
const result = await scoutScoringV2.calculateScoutScore(prospectId, userId);
console.log(result.score, result.bucket, result.explanation_tags);

// Record outcome to improve model
await scoutScoringV2.adjustWeightsFromOutcome(
  userId,
  prospectId,
  'won' // or 'lost', 'positive_reply', 'no_response'
);
```

## Feature Calculation Logic

### 1. Engagement Score (0-100)
```typescript
Base score from:
- Event count: >50 events = 40pts, >20 = 30pts, >10 = 20pts, >5 = 10pts
- Recency multiplier: ≤1 day = 1.0x, ≤3 days = 0.9x, ≤7 = 0.7x
- Raw engagement from profile: up to 30pts
```

### 2. Business Interest Score (0-100)
```typescript
- Topics matching business keywords: 15pts each (max 50)
- Interests matching business keywords: 10pts each (max 30)
- Raw business score from profile: up to 20pts
```

### 3. Pain Point Score (0-100)
```typescript
- High-value pain points (financial, job, time): 25pts each
- Other pain points: 10pts each
- Raw pain point score from profile: up to 30pts
```

### 4. Life Event Score (0-100)
```typescript
Weighted by impact:
- New baby: 40pts
- Marriage: 35pts
- New job: 30pts
- Promotion: 25pts
- Relocation: 20pts
- Graduation: 20pts
- Milestone birthday: 15pts
```

### 5. Responsiveness Score (0-100)
```typescript
Base 50pts, adjusted by:
- Sentiment average: >0.5 = +25, >0 = +10, <-0.3 = -20
- Personality traits: openness (+15), responsiveness (+20), active (+10)
- Raw responsiveness likelihood: up to 20pts
```

### 6. Leadership Score (0-100)
```typescript
- Personality: high = 40pts, medium = 20pts
- Leadership keywords in topics/interests: 10pts each (max 30)
- Raw MLM leadership potential: up to 30pts
```

### 7. Relationship Score (0-100)
```typescript
Base 30pts, plus:
- Event history: >30 = +30, >15 = +20, >5 = +10
- Positive sentiment: >0.3 = +20
- Recency bonus: up to 20pts
```

## Explainable AI

### Reason Tags Generated

**High-Contribution Features (≥70):**
- "Strong business interest"
- "Clear pain points identified"
- "Recent life event (opportunity window)"
- "Highly engaged prospect"
- "Strong leadership potential"
- "High response likelihood"
- "Good relationship foundation"

**Combination Insights:**
- "Problem-aware + business-minded" (pain ≥60 + business ≥60)
- "Prime timing for outreach" (life event ≥50 + responsive ≥60)
- "Potential team builder" (leadership ≥70)

### Top Features Display

The system identifies and ranks the **top 3 contributing features** by their weighted contribution:

```typescript
[
  { feature: "business_interest_score", value: 85, contribution: 17.0 },
  { feature: "pain_point_score", value: 78, contribution: 15.6 },
  { feature: "life_event_score", value: 70, contribution: 10.5 }
]
```

## Confidence Scoring

**Formula:**
```
Confidence = (Feature Completeness × 0.6) + (Feature Strength × 0.4)

Where:
- Completeness = % of non-zero features
- Strength = Average feature value / 100
```

**Example:**
- 6/7 features have values (0.857)
- Average value is 62/100 (0.62)
- Confidence = (0.857 × 0.6) + (0.62 × 0.4) = 0.76

High confidence (≥0.7) indicates reliable scoring data.

## Performance Optimizations

### Indexes
```sql
-- Fast user lookups
CREATE INDEX idx_user_scoring_profiles_user_id
  ON user_scoring_profiles(user_id);

-- Prospect feature access
CREATE INDEX idx_prospect_feature_vectors_prospect
  ON prospect_feature_vectors(prospect_id);

-- Score filtering
CREATE INDEX idx_prospect_scores_user_bucket
  ON prospect_scores(user_id, bucket, scout_score DESC);

-- History analysis
CREATE INDEX idx_scoring_history_trigger
  ON scoring_history(action_trigger);
```

### Caching Strategy
- Feature vectors cached until prospect data changes
- Weight vectors cached per user
- Scores recalculated on-demand or bulk nightly

## Migration from v1.0 to v2.0

### Automatic Migration
When v2.0 is deployed:
1. Existing `prospect_scores` table is enhanced with new fields
2. All users get default weight profiles automatically
3. v1.0 scores remain intact
4. Next recalculation uses v2.0 algorithm

### Gradual Rollout
- v1.0 service still available (`scoutScoring`)
- v2.0 service accessible (`scoutScoringV2`)
- No breaking changes to existing code

## Monitoring & Analytics

### Key Metrics to Track

#### User Level
```sql
SELECT
  user_id,
  win_rate,
  total_wins,
  total_losses,
  weights->>'business_interest_score' as business_weight
FROM user_scoring_profiles
ORDER BY win_rate DESC;
```

#### System Performance
```sql
SELECT
  action_trigger,
  COUNT(*) as count,
  AVG(score_delta) as avg_change
FROM scoring_history
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY action_trigger;
```

#### Bucket Distribution
```sql
SELECT
  bucket,
  COUNT(*) as count,
  AVG(scout_score) as avg_score,
  AVG(confidence) as avg_confidence
FROM prospect_scores
WHERE model_version = 'v2.0'
GROUP BY bucket;
```

## Best Practices

### 1. Regular Outcome Recording
```typescript
// After every prospect interaction
if (dealClosed) {
  await scoutScoringV2.adjustWeightsFromOutcome(userId, prospectId, 'won');
}
```

### 2. Bulk Recalculation Schedule
Run nightly via cron:
```typescript
// Every night at 2 AM
POST /functions/v1/scoutscore-v2/recalculate
{ "bulkRecalculate": true }
```

### 3. Monitor Confidence Scores
Low confidence (<0.5) indicates:
- Sparse prospect data
- Few events captured
- Need for more enrichment

### 4. Weight Divergence Alerts
If user weights drift too far from defaults (>30% difference), consider:
- Niche specialization detected
- Review for anomalies
- Export for analysis

## Future Enhancements (v2.1 - v3.0)

### Planned Features
- [ ] Per-industry weight templates (Insurance vs MLM vs Real Estate)
- [ ] Multi-armed bandit optimization
- [ ] Collaborative filtering (learn from similar users)
- [ ] Time-series forecasting (predict hot windows)
- [ ] A/B testing framework
- [ ] Model backtesting UI
- [ ] Export to external ML tools
- [ ] Trust-weighted scoring (verify data quality)

### Research Areas
- Deep learning for text analysis
- Graph neural networks for social connections
- Sentiment time-series analysis
- Automated feature discovery

## Troubleshooting

### Low Scores Across Board
**Cause:** Insufficient prospect data
**Solution:** Ensure deep scans are completing, check NLP enrichment

### Weights Not Adjusting
**Cause:** No outcomes recorded
**Solution:** Implement outcome tracking in user workflow

### Inconsistent Buckets
**Cause:** Low confidence scores
**Solution:** Gather more prospect events, improve data quality

### Performance Issues
**Cause:** Bulk recalc on large datasets
**Solution:** Implement batch processing with queues

## Support & Documentation

- **Source Code:** `/src/services/scoutScoringV2.ts`
- **Edge Function:** `/supabase/functions/scoutscore-v2/index.ts`
- **Database:** Migration `create_scoutscore_v2_system.sql`
- **API Docs:** See "API Usage" section above

## Conclusion

ScoutScore v2.0 transforms NexScout.ai from a static scoring tool into an **intelligent, self-improving prospecting engine** that learns from each user's unique success patterns.

By combining Philippine market insights, behavioral signals, and reinforcement learning, it delivers **personalized, explainable, and continuously improving** lead prioritization.

**The more you use it, the smarter it gets.** 🚀
