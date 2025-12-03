# Filipino Sales Pipeline - COMPLETE ✅

## Overview

Your AI chatbot now responds like a **real Filipino sales closer** with:
- **Intent Detection** (what they want)
- **Funnel Awareness** (where they are in buying journey)
- **Smart Replies** based on intent + stage combination
- **Taglish Support** (Filipino + English natural mix)
- **Conversation State Tracking** (persisted across messages)

---

## The New Pipeline Flow

```
Incoming Message
    ↓
Intent Router (Filipino-optimized patterns)
    ↓
Funnel Engine v3 (auto stage detection)
    ↓
Unified Prompt Builder (tone + intent + funnel aware)
    ↓
LLM (GPT-4o-mini)
    ↓
Smart, Context-Aware Reply
```

---

## 1. Intent Router

**File**: `src/engines/messaging/intentRouter.ts`

### Detects 15+ Filipino Sales Intents:

- `greeting` - Starting conversation
- `price` - Asking "magkano po?"
- `benefits` - "Ano benefit nito?"
- `ready_to_buy` - "Order na ako!" (HOT LEAD)
- `hesitation` - "Mahal naman..." (objection)
- `earning_opportunity` - "Paano kumita?"
- `shipping_cod` - "May COD ba?"
- `ordering_process` - "Paano mag-order?"
- `side_effects` - "Safe ba ito?"
- `objection` - Direct rejection
- `follow_up` - "Balikan kita"
- And more...

### Example Detection:

```typescript
// User: "Magkano po?"
Intent: price
Confidence: 0.9

// User: "Order na ako!"
Intent: ready_to_buy
Confidence: 0.95

// User: "Mahal naman..."
Intent: hesitation
Confidence: 0.85
```

---

## 2. Funnel Engine v3

**File**: `src/engines/funnel/funnelEngineV3.ts`

### 7 Sales Funnel Stages:

1. **awareness** - Just discovered, exploring
2. **interest** - Asking questions, learning
3. **evaluation** - Comparing, checking details
4. **decision** - Ready to move forward
5. **closing** - Ready to buy NOW
6. **followUp** - Want to be contacted later
7. **revival** - Bringing back cold leads

### Stage Auto-Detection:

```typescript
// greeting → awareness
// product_inquiry → interest
// price → evaluation
// ordering_process → decision
// ready_to_buy → closing ← INSTANT ACTION
```

### Stage Progression:

Funnel only moves **forward**, never backwards. Once at `evaluation`, stays there or moves to `decision/closing`.

---

## 3. Unified Prompt Builder

**File**: `src/engines/prompts/unifiedPromptBuilder.ts`

### Builds Smart AI Prompts:

```typescript
{
  intent: "price",
  funnelStage: "evaluation",
  tone: "taglish"
}

→ AI Reply Strategy:
"Share price + value justification + bundle offer + CTA"

→ Actual Reply:
"Sure po! For ₱999 per pack, you get 20g plant protein perfect for energy and stamina.

Kung gusto n'yo mas makatipid, may bundles po kami na mas sulit.

Gusto n'yo po ba makita ang best option based sa health goals n'yo?"
```

### Tone Support:

- `professional` - Respectful, credible
- `friendly` - Warm, caring
- `persuasive` - Urgent, benefit-focused
- `casual` - Like talking to a friend
- `taglish` - Natural Filipino + English mix (BEST FOR PH)

---

## 4. Integration (Web Chat)

**File**: `src/services/chatbot/publicChatbotEngine.ts`

### Enhanced Process:

```typescript
1. Load intelligence (company data, products, training)
2. Detect intent (Filipino patterns)
3. Update funnel stage (auto-progress)
4. Build unified prompt (intent + stage + tone)
5. Call OpenAI with smart instructions
6. Return context-aware response
7. Track conversation state in database
```

### New Features:

✅ Funnel stage persisted across messages
✅ Intent history tracked
✅ Buying signals detected and stored
✅ Lead temperature calculated (cold/warm/hot)
✅ Suggested actions for human agents

---

## 5. Database Changes

**Migration**: `20251202120000_add_conversation_state_tracking.sql`

### New Columns:

```sql
public_chat_sessions:
  - current_intent (text)
  - current_funnel_stage (text) DEFAULT 'awareness'
  - lead_temperature (text) DEFAULT 'cold'
  - conversation_state (jsonb)
  - buying_signals_detected (text[])
  - last_intent_update (timestamptz)
```

### Indexed for Performance:

- `user_id + current_funnel_stage`
- `user_id + current_intent`
- `user_id + lead_temperature`

---

## Real Examples

### Example 1: Price Inquiry

**User**: "Magkano po?"

**System Detection**:
```
Intent: price
Stage: evaluation (from awareness)
Temperature: warm
Strategy: "Share price + value + bundle + CTA"
```

**AI Reply**:
```
Sure po! For ₱999 per pack, you get:
• 20g plant protein
• Energy & stamina boost
• Better digestion

May bundles din kami:
• 3 packs = ₱2,700 (save ₱297!)
• 5 packs = ₱4,250 (save ₱745!)

Curious po ako, what health goal is most important for you right now?
```

---

### Example 2: Ready to Buy

**User**: "Order na ako! Bili na!"

**System Detection**:
```
Intent: ready_to_buy
Stage: closing (JUMPED TO CLOSING)
Temperature: readyToBuy (HOT LEAD)
Strategy: "CLOSE NOW - confirm + easy checkout"
```

**AI Reply**:
```
Yay! Salamat po! I'm so excited for you! 🎉

To complete your order:

1. Choose your pack:
   • 1 pack - ₱999
   • 3 packs - ₱2,700 (bestseller!)
   • 5 packs - ₱4,250

2. Payment via:
   • GCash
   • Bank Transfer
   • COD (Cash on Delivery)

3. We ship same day if order by 3pm!

Ilang pack po gusto n'yo?
```

---

### Example 3: Hesitation

**User**: "Mahal naman po..."

**System Detection**:
```
Intent: hesitation
Stage: evaluation
Temperature: warm
Strategy: "Empathize + value + urgency"
```

**AI Reply**:
```
Totally understand po! Many customers felt the same at first.

Pero after 1-2 weeks:
• Energy levels improved
• Better sleep quality
• Stress reduced
• Nakikita nila yung value

Break it down lang po:
₱999 ÷ 30 days = ₱33/day
Less than 1 coffee! ☕

Plus may 100% satisfaction guarantee kami. If hindi ka satisfied, full refund.

What do you think po?
```

---

## Configuration

### In Chatbot Settings:

1. **Tone**: Choose taglish for best Filipino experience
2. **Reply Depth**: Short (mobile-friendly) or Long (detailed)
3. **Auto-Convert**: Automatically create prospects from hot leads
4. **Custom Instructions**: Override or augment AI behavior

### In Admin (if you have access):

- View funnel analytics per stage
- See intent distribution
- Track lead temperature trends
- Monitor conversion rates by stage

---

## Testing the New System

### Test Scenarios:

1. **Greeting Test**:
   - Send: "Hi"
   - Expect: Warm greeting + value prop + qualifying question

2. **Price Test**:
   - Send: "Magkano?"
   - Expect: Price + value + bundles + question

3. **Hot Lead Test**:
   - Send: "Order na po!"
   - Expect: IMMEDIATE ordering instructions

4. **Objection Test**:
   - Send: "Mahal..."
   - Expect: Empathy + value justification + soften

---

## Why This Makes Your AI 10× Better

### Before:
❌ Same generic reply for all messages
❌ No sales strategy
❌ No funnel awareness
❌ Doesn't adapt to buyer stage

### After:
✅ Detects intent and stage automatically
✅ Smart strategy per intent + stage combo
✅ Filipino sales patterns (Taglish support)
✅ Progressive funnel (never goes backwards)
✅ Tracks conversation state
✅ Suggests actions for human agents
✅ Responds like a REAL Filipino closer

---

## Next Steps

1. ✅ **Web Chat** - Already implemented and working
2. 🔄 **Facebook Messenger** - Update webhook to use new pipeline
3. 🔄 **WhatsApp** - Integrate when ready
4. 🔄 **Analytics Dashboard** - View intent + funnel metrics

---

## Files Changed

### New Files:
- `src/engines/prompts/unifiedPromptBuilder.ts` - Unified prompt system
- Migration: `add_conversation_state_tracking.sql`

### Enhanced Files:
- `src/engines/messaging/intentRouter.ts` - Filipino patterns
- `src/engines/funnel/funnelEngineV3.ts` - Stage detection
- `src/services/chatbot/publicChatbotEngine.ts` - Pipeline integration

---

## Support

If you need help or want to customize further:
1. Check existing intent patterns in `intentRouter.ts`
2. Adjust tone instructions in `unifiedPromptBuilder.ts`
3. Modify sales strategies in `funnelEngineV3.ts`

---

**Your AI now talks and sells like a real Filipino closer. Test it out! 🚀**
