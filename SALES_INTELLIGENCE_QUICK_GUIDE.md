# Sales Intelligence System - Quick Reference Guide

## How It Works in Real Conversations

### Example 1: Budget-Conscious Customer → Downsell

**Customer Message:**
```
"Magkano po yung WonderSoya Bundle? Medyo tight kasi budget ko ngayon."
```

**System Analysis:**
- Intent: `price` + `hesitation`
- Buying Signal: `priceCheck`
- Budget Concern: **YES** (detected "tight", "budget")
- Funnel Stage: `evaluation`
- Lead Score: 25/100
- Lead Temperature: **WARM**

**Engine Decision:**
```
DOWNSELL: WonderSoya Bundle (₱999) → Starter Pack (₱199)
```

**AI Response:**
```
Totally understand po na may budget considerations.

Kung gusto n'yo po, puwede tayo mag-start sa *Starter Pack (₱199)* muna —
para ma-try n'yo po yung benefits without malaking risk.

If nagustuhan n'yo po ang results, puwede tayo mag-upgrade later. 😊
```

**Database Saved:**
```json
{
  "lead_temperature": "warm",
  "lead_score": 25,
  "current_product_id": "starter-pack",
  "suggested_product_id": "starter-pack",
  "offer_type": "downsell"
}
```

---

### Example 2: Income Seeker → Upsell to Business

**Customer Message:**
```
"Interested po ako sa product. May earning opportunity din po ba dito?"
```

**System Analysis:**
- Intent: `earning_opportunity`
- Buying Signal: `validation`
- Wants Income: **YES**
- Funnel Stage: `interest`
- Lead Score: 55/100
- Lead Temperature: **HOT**

**Engine Decision:**
```
UPSELL: WonderSoya Pack (₱350) → WonderEarning Business Package (₱3,500)
```

**AI Response:**
```
Since interesado po kayo sa income, the **best option** is actually our
*WonderEarning Business Package*.

✔ Mas sulit kaysa sa regular pack
✔ May products na for personal use
✔ Plus may potential income pa

Gusto n'yo po ba makita kung paano puwedeng kumita from this package? 😊
```

**Database Saved:**
```json
{
  "lead_temperature": "hot",
  "lead_score": 55,
  "current_product_id": "business-package",
  "suggested_product_id": "business-package",
  "offer_type": "upsell"
}
```

**Revenue Impact:** Order value increased 10x (₱350 → ₱3,500)

---

### Example 3: Ready to Buy → Upsell to Bundle

**Customer Message:**
```
"Okay na po ako. Paano mag-order? May COD po ba?"
```

**System Analysis:**
- Intent: `ready_to_buy` + `shipping_cod`
- Buying Signal: `readyToOrder` + `codInterest`
- Funnel Stage: `closing`
- Lead Score: 85/100
- Lead Temperature: **READY**

**Engine Decision:**
```
UPSELL: Single Pack (₱350) → Health Bundle 3-Pack (₱999)
```

**AI Response:**
```
Since decided na po kayo to start, I'd recommend *Health Bundle (3 packs)*
instead of just *Single Pack*.

✔ Mas tipid per pack (₱333 each vs ₱350)
✔ Mas consistent ang results
✔ Hindi po kayo mawawalan agad ng stocks

Gusto n'yo po ba makita difference between **Single Pack (₱350)**
and **Health Bundle (₱999)**? 😊

And yes po, available po ang COD for both! 🚚
```

**Database Saved:**
```json
{
  "lead_temperature": "ready",
  "lead_score": 85,
  "current_product_id": "bundle-3pack",
  "suggested_product_id": "bundle-3pack",
  "offer_type": "upsell"
}
```

**Revenue Impact:** Order value increased 2.85x (₱350 → ₱999)

---

### Example 4: Health Buyer → Cross-Sell to Business

**Customer Message:**
```
"Interested ako sa health benefits nito for my family."
```

**System Analysis:**
- Intent: `benefits` + `product_inquiry`
- Buying Signal: `validation`
- Funnel Stage: `evaluation`
- Lead Score: 30/100
- Lead Temperature: **WARM**

**After 2-3 more messages...** (if they mention income goals)

**Engine Decision:**
```
CROSS-SELL: WonderSoya Pack → WonderEarning Business Package
```

**AI Response:**
```
Ganda po ng choice n'yo sa *WonderSoya Pack* for health. 💪

By the way, if open din po kayo to **extra income**,
we have *WonderEarning Business Package* where you still get products
+ potential earnings.

Gusto n'yo po ba ng mabilis na explanation how it works? 🙂
```

---

## Lead Temperature Scoring

### Score Calculation

| Factor | Points |
|--------|--------|
| **Funnel Stage** ||
| Awareness | +5 |
| Interest | +15 |
| Evaluation | +25 |
| Decision | +35 |
| Closing | +45 |
| **Intents** ||
| Price inquiry | +10 |
| Order process | +15 |
| Shipping/COD | +15 |
| Earning opportunity | +10 |
| Hesitation | -5 |
| **Buying Signals** ||
| Ready to order | +30 |
| COD interest | +15 |
| Delivery check | +10 |
| Price check | +8 |
| **Engagement** ||
| 3+ messages | +5 |
| 6+ messages | +10 |
| **Time Decay** ||
| 12+ hours | -10 |
| 24+ hours | -20 |

### Temperature Thresholds

- **Ready** (70-100): Close immediately
- **Hot** (45-69): Push gently
- **Warm** (20-44): Nurture
- **Cold** (0-19): Downsell or revive

---

## Upsell/Downsell Decision Tree

```
START
  │
  ├─ Wants Income? ─YES→ UPSELL to Business Package
  │
  ├─ Budget Concern? ─YES→ DOWNSELL to Starter/Cheaper
  │
  ├─ Lead = HOT/READY + Looking at Starter? ─YES→ UPSELL to Bundle
  │
  ├─ Lead = WARM + Health Product + Income Interest? ─YES→ CROSS-SELL to Business
  │
  └─ DEFAULT → STAY on current recommendation
```

---

## Analytics Queries

### View Lead Temperature Distribution
```sql
SELECT
  lead_temperature,
  COUNT(*) as count,
  ROUND(AVG(lead_score), 2) as avg_score
FROM public_chat_sessions
WHERE lead_temperature IS NOT NULL
GROUP BY lead_temperature
ORDER BY
  CASE lead_temperature
    WHEN 'ready' THEN 1
    WHEN 'hot' THEN 2
    WHEN 'warm' THEN 3
    WHEN 'cold' THEN 4
  END;
```

### Upsell Success Rate
```sql
SELECT
  offer_type,
  COUNT(*) as total_offers,
  SUM(CASE WHEN lead_temperature IN ('hot', 'ready') THEN 1 ELSE 0 END) as successful,
  ROUND(100.0 * SUM(CASE WHEN lead_temperature IN ('hot', 'ready') THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM public_chat_sessions
WHERE offer_type IS NOT NULL
GROUP BY offer_type;
```

### Product Performance
```sql
SELECT
  suggested_product_id,
  COUNT(*) as times_recommended,
  AVG(lead_score) as avg_lead_score,
  COUNT(CASE WHEN lead_temperature IN ('hot', 'ready') THEN 1 END) as hot_leads
FROM public_chat_sessions
WHERE suggested_product_id IS NOT NULL
GROUP BY suggested_product_id
ORDER BY hot_leads DESC;
```

---

## Configuration

### Product Setup Example

```typescript
const products: Product[] = [
  {
    id: "starter-pack",
    name: "Starter Pack (1 pack)",
    price: 199,
    tier: "starter"
  },
  {
    id: "wondersoya-pack",
    name: "WonderSoya Pack",
    price: 350,
    tier: "core"
  },
  {
    id: "health-bundle",
    name: "Health Bundle (3 packs)",
    price: 999,
    tier: "premium"
  },
  {
    id: "business-package",
    name: "WonderEarning Business Package",
    price: 3500,
    tier: "business"
  }
];
```

### Tuning Parameters

To adjust sensitivity:

**Make upsells more aggressive:**
```typescript
// In leadTemperatureModel.ts
if (score >= 60) return "ready";  // Lower from 70
if (score >= 35) return "hot";    // Lower from 45
```

**Make downsells less frequent:**
```typescript
// In upsellDownsellEngine.ts
if (budgetConcern && leadTemperature === "cold") {  // Only cold leads
  // downsell logic
}
```

---

## Integration Checklist

- [x] Lead temperature automatically calculated every message
- [x] Upsell/downsell suggestions generated in real-time
- [x] Suggestions naturally integrated into AI responses
- [x] All metrics saved to database for analytics
- [x] Works with both web chat and Facebook Messenger
- [x] Filipino-optimized messages and patterns
- [x] Revenue optimization without losing leads

---

## Business Metrics to Track

1. **Average Order Value (AOV)** - Should increase with upselling
2. **Conversion Rate by Temperature** - Ready > Hot > Warm > Cold
3. **Upsell Acceptance Rate** - % of hot leads who accept upsells
4. **Downsell Retention Rate** - % of cold leads who stay after downsell
5. **Time to Close by Temperature** - How long each segment takes
6. **Revenue by Offer Type** - Which strategy generates most revenue

---

## Status

**PRODUCTION READY** ✅

All features implemented and tested. The chatbot now operates as an intelligent sales optimizer with:
- Real-time lead scoring
- Automated upsell/downsell suggestions
- Revenue optimization algorithms
- Complete analytics tracking
