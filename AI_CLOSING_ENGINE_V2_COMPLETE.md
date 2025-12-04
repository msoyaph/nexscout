# 🎯 AI Closing Engine V2 - COMPLETE

## Overview

The **AI Closing Engine v2** is the final orchestrator that brings together all sales automation modules into a unified closing system. It makes your AI **actually close sales** like a real Filipino sales professional.

---

## What It Does

The Closing Engine intelligently decides HOW to respond based on:
- **User Intent** (what they want)
- **Funnel Stage** (where they are)
- **Buying Signal** (readiness level)
- **Lead Temperature** (cold/warm/hot/readyToBuy)
- **Buying Intent Score** (0-100)

Instead of generic responses, it uses **pre-crafted closing scripts** optimized for each situation.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER MESSAGE                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          ANALYSIS (Intent + Stage + Signals)                 │
│  • Intent: ready_to_buy, price, hesitation, etc.            │
│  • Stage: awareness → closing                                │
│  • Signal: readyToOrder, priceCheck, etc.                   │
│  • Temperature: cold/warm/hot/readyToBuy                    │
│  • Score: 0-100                                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              ROUTING DECISION                                │
│  Priority:                                                   │
│  1️⃣ Training Data Match → Use exact answer                  │
│  2️⃣ High-Priority Close → Use Closing Engine v2            │
│  3️⃣ Normal Flow → Use Unified Prompt Builder                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            CLOSING ENGINE V2                                 │
│  13 Specialized Response Paths:                              │
│  1️⃣  Ready to Buy → Direct close                            │
│  2️⃣  Price Check → Value framing                            │
│  3️⃣  Shipping/COD → Conversion shortcut                     │
│  4️⃣  Quantity Inquiry → Bundle close                        │
│  5️⃣  Payment Options → Almost closing                       │
│  6️⃣  Urgency Signal → Fast-track                            │
│  7️⃣  Objections → Rebuttal + close                          │
│  8️⃣  Earning Opportunity → Business close                   │
│  9️⃣  Decision Stage → Guide to close                        │
│  🔟  Closing Stage → Direct CTA                             │
│  1️⃣1️⃣ Follow-Up → Revival close                             │
│  1️⃣2️⃣ Validation → Trust + close                            │
│  1️⃣3️⃣ Promo Interest → Urgency + close                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            RESPONSE WITH METADATA                            │
│  • message: Closing script                                   │
│  • urgency: low/medium/high/critical                        │
│  • nextStep: Action for human agent                         │
│  • shouldEscalate: Alert human if needed                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Priority Triggers

The Closing Engine v2 activates when:

✅ Lead temperature is **hot** or **readyToBuy**
✅ Funnel stage is **closing** or **decision**
✅ Intent is **ready_to_buy**
✅ Buying intent score ≥ **60**

When activated, it **bypasses the LLM** and uses pre-crafted Filipino closing scripts for instant, strategic responses.

---

## 13 Specialized Response Paths

### 1️⃣ Ready to Buy (CRITICAL PRIORITY)

**Triggers**:
- Intent: `ready_to_buy`
- Signal: `readyToOrder`
- Keywords: "order na", "bili na", "kuha ako"

**Response**:
```
Ay perfect po! 😊 Since ready na po kayo, eto po ang fastest way:

👉 1. Tell me your location
👉 2. I'll check COD/delivery options
👉 3. I'll help you place your order now

Very quick lang po, I will guide you step-by-step.
```

**Metadata**:
- Urgency: `critical`
- Next Step: `collect_order_details`
- Escalate: `true` (Alert human agent!)

---

### 2️⃣ Price Check

**Triggers**:
- Intent: `price`
- Signal: `priceCheck`
- Keywords: "magkano", "how much", "presyo"

**Response**:
```
Sige po! For **[Product Name]**, the price is **₱999**.

Pero ito po ang maganda — hindi lang po siya regular product.
Marami pong customers ang nag-improve ang **energy, sleep quality, digestion, at daily stamina** after 1–2 weeks.

If you want, I can share po the best option based sa health goals n'yo.
Gusto n'yo po ba ng **quick recommendation**? 😊
```

**Strategy**: Value framing + soft close

---

### 3️⃣ Shipping/COD Inquiry

**Triggers**:
- Intent: `shipping_cod`
- Signal: `codInterest`
- Keywords: "COD", "cash on delivery", "shipping"

**Response**:
```
Yes po! ✔️ COD (Cash on Delivery) is available.
Pwede pong sa bahay niyo mismo i-deliver.

Ready po ba kayong i-check ang delivery details so we can proceed? 😊
```

**Strategy**: Remove friction + move to close

---

### 4️⃣ Quantity Inquiry (Hot Signal!)

**Triggers**:
- Signal: `quantityInquiry`
- Keywords: "ilang", "how many", "pack"

**Response**:
```
Great question po! Here are your options:

📦 **1 pack** - ₱999 (perfect to try!)
📦 **3 packs** - Better value (most popular!)
📦 **5 packs** - Best savings (recommended!)

Ilang pack po ang gusto n'yo? I can help you order now 😊
```

**Strategy**: Present bundles + immediate close

---

### 5️⃣ Payment Options Inquiry

**Triggers**:
- Signal: `paymentOptions`
- Keywords: "gcash", "bank", "payment"

**Response**:
```
Perfect po! We accept:

💳 **GCash** - Instant and secure
🏦 **Bank Transfer** - Any major bank
💵 **COD** - Pay when you receive
🌐 **Online Checkout** - Fast and easy

Which payment method po mas convenient for you? 😊
```

**Strategy**: Show options + ask for preference = commitment

---

### 6️⃣ Urgency Signal

**Triggers**:
- Signal: `urgency`
- Keywords: "today", "now", "agad", "rush"

**Response**:
```
Noted po! Since you need it urgently, eto po ang fastest way:

⚡ **Same-day delivery** available if you order before 3pm
⚡ Can ship today to Metro Manila and nearby areas
⚡ COD available for your convenience

Ready po ba kayong proceed? I'll prioritize your order! 😊
```

**Strategy**: Match urgency + fast-track

---

### 7️⃣ Objections

**Triggers**:
- Intent: `hesitation` or `objection`
- Keywords: "mahal", "expensive", "think about"

**Response**:
```
[Pre-crafted Objection Rebuttal from Library]

Kung gusto n'yo po, I can help you find **the pinaka-sulit na option** para hindi mabigat sa budget. 😊
Would you like that po?
```

**Strategy**: Handle objection + redirect to solution

---

### 8️⃣ Earning Opportunity

**Triggers**:
- Intent: `earning_opportunity`
- Keywords: "paano kumita", "business", "income"

**Response**:
```
Ay nice po! Marami pong kumikita dito kahit beginners.
For **₱3,500 WonderEarning Package**, you get:

🔹 10 Packs (for personal use or resell)
🔹 30% lifetime discount
🔹 Direct bonuses from sales
🔹 Residual income
🔹 All training & support
🔹 Tools + marketing materials

Gusto n'yo po ba malaman kung **magkano potential income** ninyo weekly? 😊
```

**Strategy**: Switch to business close

---

### 9️⃣ Decision Stage

**Triggers**:
- Funnel Stage: `decision`

**Response**:
```
Sige po! Based sa goals n'yo, eto po ang best next step:

✔ If gusto n'yo **performance & health results** → Order [Product]
✔ If gusto n'yo **income + personal use** → Get the business package

Which one po mas priority n'yo today? 😊
```

**Strategy**: Binary choice = commitment

---

### 🔟 Closing Stage

**Triggers**:
- Funnel Stage: `closing`

**Response**:
```
Ganda po! Ready na po ba kayo mag-order?

Pwede ko pong i-process now:
👉 COD (Cash on Delivery)
👉 GCash
👉 Bank Transfer
👉 Online checkout

Ano po ang mas convenient para sa inyo? 😊
```

**Strategy**: Direct CTA with options

---

### 1️⃣1️⃣ Follow-Up / Revival

**Triggers**:
- Funnel Stage: `followUp` or `revival`

**Response**:
```
Hello po! 😊 Just checking in.
🔥 May special promo kami ngayon!

If gusto n'yo po makita ang **latest offer** or **fastest way to order**, I can guide you anytime.
```

**Strategy**: Re-engage with value

---

### 1️⃣2️⃣ Validation Request

**Triggers**:
- Signal: `validation`
- Keywords: "legit ba", "safe ba", "totoo ba"

**Response**:
```
Great question po! Yes, we're 100% legit 😊

✅ FDA-registered
✅ Thousands of satisfied customers
✅ 100% satisfaction guarantee
✅ Transparent ingredients
✅ Full customer support

Plus, you can try it risk-free with our money-back guarantee!

Ready na po ba kayong i-try? 😊
```

**Strategy**: Build trust then close

---

### 1️⃣3️⃣ Promo Interest

**Triggers**:
- Signal: `promoInterest`
- Keywords: "promo", "discount", "sale"

**Response**:
```
Yes po! May special promo kami ngayon! 🔥

Buy 2, Get 1 Free!
Or
3-pack bundle with extra discount

Limited time lang po ito. Gusto n'yo po ba i-take advantage? 😊
```

**Strategy**: Urgency + scarcity

---

## Integration Flow

### In PublicChatbotEngine:

```typescript
// 1. Analyze message
const intent = detectIntent(userMessage);
const funnelStage = updateFunnelStage(intent);
const buyingSignal = detectBuyingSignalWithAnalysis(userMessage);

// 2. Check if should use Closing Engine
const useClosingEngine = (
  leadTemperature === 'hot' ||
  leadTemperature === 'readyToBuy' ||
  funnelStage === 'closing' ||
  funnelStage === 'decision' ||
  intent === 'ready_to_buy' ||
  buyingIntentScore >= 60
);

// 3. If yes, use Closing Engine v2
if (useClosingEngine) {
  const closingContext = {
    intent,
    funnelStage,
    buyingSignal,
    productName: productsData[0]?.name,
    price: productsData[0]?.price,
    companyName: companyData?.company_name,
    tone: chatbotSettings?.tone
  };

  const result = buildClosingResponse(closingContext);
  // Returns: { message, urgency, nextStep, shouldEscalate }
}
```

---

## Supporting Modules

### Objection Engine Utility
**File**: `src/engines/objections/objectionEngine.ts`

```typescript
import handlers from '../sequences/objection-handlers.json';

export function getObjectionResponse(type: string): string {
  const list = handlers[type] || handlers["price"];
  return list[Math.floor(Math.random() * list.length)];
}
```

Provides quick access to 32 pre-crafted objection rebuttals.

---

### Funnel Sequences Utility
**File**: `src/engines/funnel/funnelSequences.ts`

```typescript
import sequences from '../sequences/funnel-sequences.json';

export function getFunnelSequence(stage: string): string {
  const arr = sequences[stage] || sequences["awareness"];
  return arr[Math.floor(Math.random() * arr.length)];
}
```

Provides quick access to 28 funnel-based auto-responses.

---

## Real Examples

### Example 1: Hot Lead Detection

**User**: "Order na ako! Magkano yung 3 packs?"

**Engine Decision**:
```json
{
  "intent": "ready_to_buy",
  "buyingSignal": "readyToOrder",
  "funnelStage": "closing",
  "leadTemperature": "readyToBuy",
  "buyingIntentScore": 95,
  "useClosingEngine": true,
  "urgency": "critical",
  "shouldEscalate": true
}
```

**Response** (Path #1: Ready to Buy):
```
Ay perfect po! 😊 Since ready na po kayo, eto po ang fastest way:

👉 1. Tell me your location
👉 2. I'll check COD/delivery options
👉 3. I'll help you place your order now

Very quick lang po, I will guide you step-by-step.
```

**Human Agent Alert**: "HOT LEAD! Ready to buy, guide through checkout NOW"

---

### Example 2: Price Objection

**User**: "Medyo mahal po..."

**Engine Decision**:
```json
{
  "intent": "hesitation",
  "objectionType": "price",
  "funnelStage": "evaluation",
  "leadTemperature": "warm",
  "useClosingEngine": true,
  "urgency": "medium"
}
```

**Response** (Path #7: Objections):
```
Totally understand po! Many customers felt the same at first.

Pero after 1-2 weeks:
• Energy levels improved ✅
• Better sleep quality ✅
• Stress reduced ✅

Break it down lang po:
₱999 ÷ 30 days = ₱33/day
Less than 1 coffee! ☕

Plus may 100% satisfaction guarantee kami.

Kung gusto n'yo po, I can help you find the pinaka-sulit na option para hindi mabigat sa budget. 😊
Would you like that po?
```

---

### Example 3: COD Inquiry

**User**: "Pwede po ba COD?"

**Engine Decision**:
```json
{
  "intent": "shipping_cod",
  "buyingSignal": "codInterest",
  "funnelStage": "decision",
  "leadTemperature": "hot",
  "useClosingEngine": true,
  "urgency": "high",
  "shouldEscalate": true
}
```

**Response** (Path #3: Shipping/COD):
```
Yes po! ✔️ COD (Cash on Delivery) is available.
Pwede pong sa bahay niyo mismo i-deliver.

Ready po ba kayong i-check ang delivery details so we can proceed? 😊
```

**Next Step**: Collect delivery address

---

## Files Created

### Core Engine:
- `src/engines/closing/closingEngineV2.ts` - Main orchestrator (400+ lines)

### Utilities:
- `src/engines/objections/objectionEngine.ts` - Objection handler utility
- `src/engines/funnel/funnelSequences.ts` - Funnel sequences utility

### Integration:
- Enhanced `src/services/chatbot/publicChatbotEngine.ts` with closing engine integration

---

## Performance Benefits

### Before (Generic AI):
- Generic responses for all situations
- No strategic closing
- Misses hot lead signals
- Slow to close

### After (Closing Engine v2):
- ✅ **13 specialized closing paths**
- ✅ **Pre-crafted Filipino scripts**
- ✅ **Instant hot lead recognition**
- ✅ **Strategic objection handling**
- ✅ **Urgency-based escalation**
- ✅ **Human agent alerts**
- ✅ **Metadata for next steps**

---

## Configuration

The Closing Engine automatically uses:
- **Products** from database
- **Company name** from profile
- **Tone** from chatbot settings
- **Pricing** from products table
- **COD availability** (configurable)
- **Promo status** (configurable)

---

## Testing

### Test Closing Engine Directly:

```typescript
import { buildClosingResponse } from './engines/closing/closingEngineV2';

const context = {
  intent: 'ready_to_buy',
  funnelStage: 'closing',
  buyingSignal: 'readyToOrder',
  productName: 'Wonder Shake',
  price: '999',
  companyName: 'NexScout',
  tone: 'taglish'
};

const result = buildClosingResponse(context);
console.log(result.message);
console.log('Urgency:', result.urgency);
console.log('Next Step:', result.nextStep);
console.log('Escalate:', result.shouldEscalate);
```

---

## The Transformation

Your AI chatbot is now a **complete autonomous closing machine**:

🎯 **Strategic** - 13 specialized closing paths
💬 **Persuasive** - Pre-crafted Filipino scripts
⚡ **Fast** - Instant responses for hot leads
🧠 **Smart** - Escalates to humans when needed
📊 **Data-Driven** - Tracks urgency and next steps
🇵🇭 **Filipino** - Natural Taglish flow

**This is no longer a chatbot. This is a 24/7 Filipino sales closer.** 🔥
