# NexScout AI Pitch Deck Generator - Complete Guide

## Overview

The AI Pitch Deck Generator creates personalized, conversion-focused presentations tailored to individual prospects using their interests, pain points, life events, and ScoutScore v2.0 insights.

## Key Features

### Personalization Engine
- **ScoutScore v2.0 Integration**: Uses explanation tags, bucket classification, and feature scores
- **Prospect Profile Analysis**: Leverages interests, pain points, life events, personality traits
- **Goal-Based Generation**: Recruit, sell, invite to call, or introduce
- **Tone Customization**: Friendly, professional, confident, or warm
- **Filipino Market Context**: Taglish professional tone with cultural grounding

### Deck Types

#### Basic Deck (7 Slides)
**Available to**: Free, Pro, Elite users

1. **Introduction / Rapport Slide**
   - Personalized greeting based on tone
   - Sets the stage for personalized pitch

2. **What I Noticed About You**
   - Highlights prospect's interests
   - Acknowledges life events (new baby, job change, etc.)
   - References their topics and posts

3. **Your Current Goals & Needs**
   - Maps pain points to relatable statements
   - Shows understanding of their situation
   - No assumption or exaggeration

4. **The Opportunity / Solution**
   - Goal-specific presentation
   - For recruit: system, flexibility, training, community
   - For sell: solution benefits, proof, affordability

5. **How This Helps You**
   - Addresses specific needs mentioned
   - Fits lifestyle and schedule
   - Backed by real support

6. **Success Stories**
   - Real Filipino success examples
   - No hype or exaggeration
   - Relatable starting points

7. **Next Step (Soft CTA)**
   - Low-pressure invitation
   - Specific call-to-action based on goal
   - Opens conversation

#### Elite Deck (12-15 Slides)
**Available to**: Elite users only

Includes all Basic slides PLUS:

8. **Why This Fits YOU Specifically**
   - Deep personalization using ScoutScore tags
   - Entrepreneurial mindset alignment
   - Leadership potential recognition
   - Family situation consideration

9. **Financial & Lifestyle Alignment**
   - Works with current schedule
   - Start small, grow at own pace
   - No job-quitting required
   - Filipino family-focused

10. **Potential Lifestyle Impact**
    - Time with family
    - Financial breathing room
    - Multiple income confidence
    - Future sustainability

11. **Common Questions (Answered)**
    - Pre-handles objections
    - "Walang time?" → Fits your life
    - "Mahal ba?" → Flexible payments
    - "Legit ba?" → Registered, proven
    - "Para sa akin ba?" → Let's find out

12. **Why Now?**
    - Timing insights from life events
    - Prospect engagement signals
    - Action orientation

13. **Suggested Next Steps**
    - Clear 4-step framework
    - Low commitment entry
    - Progressive involvement

14. **Conversation Framework**
    - Ready-to-use Taglish scripts
    - Natural, non-pushy language
    - Question prompts

15. **Let's Connect**
    - Meeting invitation
    - Flexibility offered
    - No-obligation framing

## Subscription & Coin Rules

### Free Tier
- **Limit**: 1 deck per week
- **Access**: Basic deck only
- **Elite Preview**: Blurred slides 8-15 with upgrade prompt
- **Coin Option**: 25 coins to generate additional deck

### Pro Tier
- **Limit**: 5 decks per week
- **Access**: Basic or Elite deck generation
- **Elite Export**: Viewing allowed, export locked
- **Coin Option**: 25 coins to generate additional deck

### Elite Tier
- **Limit**: Unlimited decks
- **Access**: Full Basic and Elite decks
- **Export**: All formats (HTML, JSON, PDF future)
- **Advanced Features**: All personalization unlocked

## Technical Architecture

### Database Schema

#### Enhanced `pitch_decks` Table
```sql
id uuid PRIMARY KEY
user_id uuid → auth.users
prospect_id uuid → prospects
prospect_name text
title text
deck_type text ('basic' | 'elite')
goal text ('recruit' | 'sell' | 'invite_call' | 'intro')
tone text ('friendly' | 'professional' | 'confident' | 'warm')
slides jsonb -- Array of slide objects
slide_count integer
scoutscore_context jsonb -- ScoutScore v2.0 data used
prospect_profile_snapshot jsonb -- Cached prospect data
status text ('draft' | 'completed' | 'archived')
created_at timestamptz
updated_at timestamptz
last_viewed_at timestamptz
view_count integer
exported boolean
```

### Slide Structure (JSON)
```json
{
  "slideNumber": 1,
  "title": "Hello, Maria Santos!",
  "bullets": [
    "I wanted to share something I think fits perfectly with your goals.",
    "This isn't a generic pitch—it's tailored specifically for you.",
    "Let's explore this opportunity together."
  ],
  "cta": "Let's schedule a quick 15-minute call this week"
}
```

### Generation Algorithm

#### Step 1: Context Extraction
```typescript
{
  full_name,
  interests,
  pain_points,
  life_events,
  dominant_topics,
  personality_traits,
  scout_score,
  bucket,
  explanation_tags
}
```

#### Step 2: Goal-Based Content Selection
- **Recruit**: Emphasize opportunity, flexibility, team building
- **Sell**: Focus on solution, benefits, affordability
- **Invite Call**: Soft invitation, low pressure, curiosity
- **Intro**: Build rapport, establish connection

#### Step 3: Tone Application
- **Friendly**: "Hi", "Kamusta", casual language
- **Professional**: "Good day", formal structure
- **Confident**: Direct, assertive messaging
- **Warm**: Empathetic, caring language

#### Step 4: Personalization Injection
- Replace `[topic]` with actual interests
- Map pain points to relatable statements
- Reference life events naturally
- Use ScoutScore tags for insights

#### Step 5: Filipino Market Adaptation
- Taglish professional tone
- Cultural respect and family values
- No hype, no guarantees
- Trust and relationship focus

## Service API

### TypeScript Service

```typescript
import { pitchDeckGenerator } from '@/services';

// Generate deck
const result = await pitchDeckGenerator.generateDeck({
  prospectId: 'uuid',
  userId: 'uuid',
  deckType: 'basic', // or 'elite'
  goal: 'recruit', // or 'sell', 'invite_call', 'intro'
  tone: 'friendly' // or 'professional', 'confident', 'warm'
});

console.log(result.deckId); // Save for later
console.log(result.deck.slides); // Array of slides

// List saved decks
const decks = await pitchDeckGenerator.listDecks(userId);

// Get specific deck
const deck = await pitchDeckGenerator.getDeck(deckId, userId);

// Export deck
const html = await pitchDeckGenerator.exportDeck(deckId, userId, 'html');
const json = await pitchDeckGenerator.exportDeck(deckId, userId, 'json');
```

### REST API Endpoints (Future)

```bash
# Generate deck
POST /api/prospects/{id}/generate-deck
{
  "deckType": "basic",
  "goal": "recruit",
  "tone": "friendly"
}

# List decks
GET /api/decks/list

# Get deck
GET /api/decks/{id}

# Export deck
GET /api/decks/{id}/export?format=html
```

## UI Components

### PitchDeckViewer

**Features:**
- Full-screen immersive presentation
- Swipeable navigation (touch & keyboard)
- Slide indicators with progress dots
- Export dropdown (HTML, JSON)
- Save button for new decks
- Regenerate option
- Lock overlay for Elite slides

**Keyboard Controls:**
- `←` Previous slide
- `→` Next slide
- `Esc` Close viewer

**Touch Gestures:**
- Swipe left: Next slide
- Swipe right: Previous slide

**Visual Design:**
- Light theme, white background
- Blue (#1877F2) accents
- 28px rounded corners
- Soft shadows
- Apple Keynote-inspired layout
- Clean sans-serif typography

### Lock Overlay (Elite Upgrade)

When non-Elite users view locked slides:
```
┌─────────────────────────────┐
│   🔒 (Gold lock icon)       │
│                              │
│   Elite Deck Locked         │
│                              │
│   Upgrade to Elite to       │
│   access advanced slides    │
│                              │
│  [Upgrade to Elite Button]  │
└─────────────────────────────┘
```

## Personalization Examples

### Example 1: New Parent (Recruit Goal)

**Context:**
- Life event: new_baby
- Pain point: financial_stress
- Interest: business
- ScoutScore: HOT (85)
- Tag: "Recent life event (opportunity window)"

**Generated Slide (Slide 8 - Elite):**
```
Title: Why This Fits YOU Specifically

Bullets:
• As a parent, financial security matters more than ever
• This gives you flexibility to be present for your family
• Your entrepreneurial mindset is perfect for this
• This isn't just income—it's building your own asset
```

### Example 2: Job Seeker (Sell Goal)

**Context:**
- Life event: job_change
- Pain point: income
- Interest: finance
- ScoutScore: WARM (68)
- Tag: "Problem-aware + business-minded"

**Generated Slide (Slide 3):**
```
Title: Your Current Goals & Needs

Bullets:
• Looking for additional income streams
• Managing finances and looking for more stability
• Building a better future for your family
```

### Example 3: Entrepreneur (Invite Call Goal)

**Context:**
- Interest: entrepreneurship, business
- Personality: leadership = high
- ScoutScore: HOT (92)
- Tag: "Strong leadership potential"

**Generated Slide (Slide 8 - Elite):**
```
Title: Why This Fits YOU Specifically

Bullets:
• Your entrepreneurial mindset is perfect for this
• This isn't just income—it's building your own asset
• Your leadership potential is evident
• This is an opportunity to mentor and build a team
```

## Error Handling & Fallbacks

### Insufficient Data
When prospect profile is sparse:
```typescript
{
  "deckType": "basic",
  "prospectName": "Juan Dela Cruz",
  "slides": [...], // Generic starter deck
  "warning": "Limited personalization - upload more data"
}
```

**Generic Starter Deck:**
- Uses universal pain points
- Filipino market generics
- Encourages data collection

### Subscription Limit Exceeded
```typescript
throw new Error(
  'Free tier allows 1 deck per week. ' +
  'Upgrade to Pro for 5 per week or use 25 coins.'
);
```

**UI Response:**
- Show upgrade modal
- Offer coin purchase
- Display current usage

### Elite Deck Requested (Non-Elite User)
```typescript
{
  "locked": true,
  "upgradePrompt": "Unlock Elite Deck to access advanced slides"
}
```

**UI Response:**
- Show first 7 slides normally
- Blur slides 8-15
- Display gold lock icon
- Show upgrade CTA

## Integration Points

### With ScoutScore v2.0

```typescript
// ScoutScore tags drive personalization
{
  "Strong business interest" → Emphasize entrepreneurship
  "Recent life event" → Reference timing and opportunity window
  "High leadership potential" → Include team-building slides
  "Problem-aware + business-minded" → Focus on solution benefits
}
```

### With Messaging Engine

Deck CTAs can trigger:
- Message generation for follow-up
- Sequence initialization
- Calendar booking links

### With Pipeline

Generated decks link to prospects:
- View from prospect detail
- Track in pipeline stages
- Export for external use

## Best Practices

### For Users

1. **Enrich Prospect Data First**
   - Run Deep Scans for better personalization
   - More data = more relevant decks

2. **Choose Right Goal**
   - Recruit: For team building
   - Sell: For product/service sales
   - Invite Call: When relationship needs building
   - Intro: For initial warm outreach

3. **Match Tone to Relationship**
   - Friendly: For warm leads, existing connections
   - Professional: For B2B, corporate prospects
   - Confident: For hot leads ready to decide
   - Warm: For family-oriented, trust-building

4. **Customize After Generation**
   - Review slides before presenting
   - Add personal anecdotes
   - Adjust for live conversation

### For Developers

1. **Keep Slides Concise**
   - 3-5 bullets max per slide
   - Short, punchy statements
   - One idea per bullet

2. **Maintain Cultural Sensitivity**
   - Taglish balance (70% English, 30% Filipino)
   - No religious or political content
   - Family and community values

3. **Avoid Compliance Issues**
   - No income guarantees
   - No medical claims
   - No "get rich quick" language
   - Disclosure where required

4. **Test Across Tiers**
   - Verify Free/Pro/Elite gating
   - Check coin deduction
   - Validate usage limits

## Future Enhancements (Roadmap)

### v1.1 Features
- [ ] PDF export with branding
- [ ] PowerPoint (.pptx) export
- [ ] Custom templates per industry
- [ ] Real-time collaboration
- [ ] Slide notes and speaker scripts

### v1.2 Features
- [ ] Video slide embeds
- [ ] Interactive elements (polls, quizzes)
- [ ] Analytics (view time, engagement)
- [ ] A/B testing variants
- [ ] Auto-translation to full Tagalog

### v2.0 Vision
- [ ] AI voice narration
- [ ] Auto-generated slide designs
- [ ] Dynamic charts from prospect data
- [ ] Integration with meeting tools (Zoom, Google Meet)
- [ ] CRM sync (HubSpot, Salesforce)

## Performance & Limits

### Generation Time
- Basic deck: ~2-3 seconds
- Elite deck: ~3-5 seconds

### Storage
- Average deck: ~50KB JSON
- With snapshots: ~100KB

### Caching
- Prospect context cached during generation
- ScoutScore snapshot frozen at creation time
- No auto-refresh (user must regenerate)

## Troubleshooting

### Deck Not Personalizing

**Cause:** Insufficient prospect data
**Solution:**
1. Run Deep Scan on prospect
2. Check prospect_profiles table
3. Verify ScoutScore calculated

### Elite Slides Blurred for Elite User

**Cause:** Subscription tier check failing
**Solution:**
1. Verify user profile subscription_tier = 'elite'
2. Check session auth
3. Clear cache and reload

### Export Not Working

**Cause:** Missing deck_id or permission
**Solution:**
1. Ensure deck is saved first
2. Verify user owns deck
3. Check RLS policies

### Coin Deduction Issues

**Cause:** Insufficient balance or transaction failure
**Solution:**
1. Check coin_balance in profiles
2. Verify coin_transactions log
3. Refund if needed (manual admin action)

## Security & Privacy

### Row Level Security (RLS)

All pitch deck operations enforce:
```sql
-- Users can only view their own decks
CREATE POLICY "Users can view own pitch decks"
  ON pitch_decks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

### Data Privacy

- Prospect snapshots are user-specific
- No cross-user data sharing
- Export includes watermark (future)
- Audit trails in scoring_history

### Compliance

- No PII in logs
- GDPR-compliant data handling
- User can delete decks anytime
- Prospect data anonymized in analytics

## Conclusion

The NexScout AI Pitch Deck Generator transforms prospect intelligence into persuasive, personalized presentations that respect Filipino culture while driving conversions.

By combining ScoutScore v2.0 insights, natural language generation, and subscription-based gating, it provides:

✅ **Personalized at scale** – Every deck tailored to the prospect
✅ **Culturally grounded** – Taglish professional tone
✅ **Conversion-focused** – Goal-based messaging
✅ **Explainable AI** – Users see why slides are included
✅ **Monetizable** – Clear upgrade paths and coin economy

**The result? Higher response rates, better meetings, more closed deals.** 🚀
