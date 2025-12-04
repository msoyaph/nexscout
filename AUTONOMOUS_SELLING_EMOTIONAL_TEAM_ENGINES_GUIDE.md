# NexScout Autonomous Selling + Emotional Persuasion + Team Leader Engines v1.0

## 🚀 IMPLEMENTATION GUIDE

This document provides the complete architecture and implementation plan for three revolutionary AI engines.

---

## ✅ DATABASE SCHEMA STATUS

**Tables Created:**
- `ai_policies` - Safety rules and autonomous settings
- `autonomous_sessions` - Conversation session tracking
- `conversation_messages` - Full message history with emotional data
- `emotional_snapshots` - Emotional trend tracking
- `team_member_profiles` - Extended team member data
- `coaching_sessions` - AI coaching records
- `ai_strategy_presets` - Reusable playbooks

**Note:** Some tables may need manual creation via Supabase dashboard due to migration complexity.

---

## 🧠 ENGINE 1: AUTONOMOUS SELLING ENGINE

### Purpose
Enable fully autonomous AI-driven sales conversations across multiple channels with tier-based safety controls.

### State Machine
```typescript
type ConversationState = 
  | 'greeting'
  | 'discovery'
  | 'qualification'
  | 'presentation'
  | 'objection_handling'
  | 'closing_attempt'
  | 'followup_planning'
  | 'handoff_to_human'
  | 'completed';
```

### Core Functions

```typescript
// /src/services/ai/autonomousSellingEngine.ts

export interface AutonomousSessionContext {
  sessionId: string;
  userId: string;
  prospectId: string;
  tier: 'free' | 'pro' | 'elite' | 'team' | 'enterprise';
  goal: 'recruit' | 'sell' | 'book_call' | 'support';
  channel: 'web_chat' | 'fb_messenger' | 'whatsapp' | 'viber';
}

// Start new autonomous session
export async function startAutonomousSession(params: {
  userId: string;
  prospectId?: string;
  channel: string;
  goal: string;
}): Promise<{ sessionId: string }> {
  // 1. Load user tier & policy
  // 2. Create autonomous_sessions record
  // 3. Return session ID
}

// Handle incoming prospect message
export async function handleIncomingProspectMessage(params: {
  context: AutonomousSessionContext;
  messageText: string;
}): Promise<{ 
  reply: string; 
  nextState: string; 
  requireUserApproval: boolean;
}> {
  // 1. Load session data
  // 2. Call Emotional Persuasion Engine
  // 3. Generate AI reply via LLM
  // 4. Apply safety gate (tier-based)
  // 5. Save to conversation_messages
  // 6. Return reply + approval requirement
}

// Stop autonomous session
export async function stopAutonomousSession(sessionId: string): Promise<void> {
  // Update status to 'closed'
}
```

### State Transitions

```
greeting → discovery → qualification
                            ↓
presentation → objection_handling → closing_attempt
                            ↓                 ↓
                   followup_planning    handoff_to_human
                            ↓                 ↓
                        completed        completed
```

### Tier-Based Behavior

**Free:**
- AI suggests replies only
- User must approve every message
- No autonomous sending

**Pro:**
- Semi-autonomous
- Normal messages auto-send
- Closing attempts require approval

**Elite/Team/Enterprise:**
- Fully autonomous (if policy allows)
- Respects daily limits
- Auto-handles objections
- Closes deals automatically

---

## ❤️ ENGINE 2: EMOTIONAL PERSUASION ENGINE

### Purpose
Analyze prospect emotions in real-time and apply appropriate persuasion strategies.

### Core Functions

```typescript
// /src/services/ai/emotionalPersuasionEngine.ts

export interface EmotionalAnalysisResult {
  primaryEmotion: string;     // 'stressed', 'curious', 'skeptical', 'excited', 'neutral'
  confidence: number;          // 0-1
  valence: number;             // -1 (negative) to +1 (positive)
  arousal: number;             // 0 (calm) to 1 (highly activated)
  recommendedStrategy: string; // 'empathy', 'urgency', 'social_proof', 'logic', 'story'
  toneOverride?: string;       // 'warm_confident', 'calm_reassuring'
}

// Analyze prospect message for emotional content
export async function analyzeProspectMessage(text: string): Promise<EmotionalAnalysisResult> {
  // 1. Detect language (English, Filipino, Taglish)
  // 2. Check for emotional keywords:
  //    - Price fear: "kulang sa budget", "hirap sa pera", "mahal"
  //    - Skepticism: "baka scam", "natatakot", "not sure"
  //    - Excitement: "interested", "sounds good", "gusto ko"
  //    - Stress: "busy", "walang time", "overwhelmed"
  // 3. Calculate valence and arousal
  // 4. Recommend persuasion strategy
  // 5. Return analysis
}

// Modify LLM prompt based on emotional analysis
export async function decoratePromptWithEmotion(params: {
  basePrompt: string;
  analysis: EmotionalAnalysisResult;
  goal: 'recruit' | 'sell' | 'book_call' | 'support';
}): Promise<string> {
  // Add emotional context to prompt:
  // "The prospect is feeling [emotion]. Use [strategy] approach. Tone: [tone]."
}
```

### Emotion-Strategy Mapping

```typescript
const EMOTION_STRATEGY_MAP = {
  'stressed': {
    strategy: 'empathy',
    tone: 'calm_reassuring',
    approach: 'Acknowledge stress, simplify, remove pressure'
  },
  'skeptical': {
    strategy: 'social_proof',
    tone: 'confident_logical',
    approach: 'Share testimonials, proof, logic-based arguments'
  },
  'excited': {
    strategy: 'urgency',
    tone: 'enthusiastic',
    approach: 'Match energy, create urgency, close quickly'
  },
  'price_concern': {
    strategy: 'value_reframing',
    tone: 'empathetic_firm',
    approach: 'Reframe cost as investment, show ROI, payment plans'
  },
  'curious': {
    strategy: 'information',
    tone: 'warm_informative',
    approach: 'Provide details, answer questions, build trust'
  }
};
```

### Taglish Patterns

```typescript
const EMOTIONAL_PATTERNS = {
  price_fear: [
    'kulang sa budget', 'hirap sa pera', 'walang pera',
    'mahal', 'expensive', 'di ko kaya bayaran'
  ],
  skepticism: [
    'baka scam', 'parang scam', 'natatakot ako',
    'not sure', 'hindi ako sigurado', 'legit ba'
  ],
  excitement: [
    'interested', 'sounds good', 'gusto ko',
    'paano mag start', 'san mag sign up'
  ],
  stress: [
    'busy', 'walang time', 'overwhelmed',
    'dami ko ginagawa', 'hectic'
  ]
};
```

---

## 👥 ENGINE 3: TEAM LEADER ENGINE

### Purpose
AI-powered team performance analysis and coaching for team leaders.

### Core Functions

```typescript
// /src/services/ai/teamLeaderEngine.ts

export interface TeamMemberSnapshot {
  userId: string;
  level: 'newbie' | 'rising' | 'pro' | 'elite_leader';
  strengths: string[];      // ['prospecting', 'storytelling', 'closing']
  weaknesses: string[];     // ['follow_up', 'objection_handling']
  activityScore: number;    // 0-100
  closingRate: number;      // 0-100%
}

// Analyze team member performance
export async function analyzeMemberPerformance(memberUserId: string): Promise<TeamMemberSnapshot> {
  // 1. Query usage_tracking for activity
  // 2. Query prospects + prospect_scores for closing rate
  // 3. Query mission_completions for engagement
  // 4. Query ai_generated_messages for messaging effectiveness
  // 5. Calculate scores
  // 6. Identify strengths and weaknesses
  // 7. Return snapshot
}

// Generate AI coaching plan
export async function generateCoachingPlan(memberUserId: string): Promise<{
  focusArea: string;
  summary: string;
  recommendations: string;
  actionItems: Array<{ title: string; coinsReward?: number }>;
}> {
  // 1. Get member snapshot
  // 2. Identify weakest area
  // 3. Generate coaching summary via LLM
  // 4. Create actionable recommendations
  // 5. Convert to missions (optional)
  // 6. Return coaching plan
}

// Schedule coaching session
export async function scheduleCoachingSession(params: {
  leaderUserId: string;
  memberUserId: string;
  when: Date;
}): Promise<{ sessionId: string }> {
  // 1. Create coaching_sessions record
  // 2. Generate AI coaching content
  // 3. Optionally create calendar event
  // 4. Return session ID
}
```

### Performance Metrics

```typescript
// Activity Score Calculation
function calculateActivityScore(data: {
  prospectsScannedThisWeek: number;
  messagesThisWeek: number;
  followUpsThisWeek: number;
  missionsCompleted: number;
}): number {
  let score = 0;
  score += Math.min(data.prospectsScannedThisWeek * 5, 30);  // Max 30 points
  score += Math.min(data.messagesThisWeek * 3, 25);          // Max 25 points
  score += Math.min(data.followUpsThisWeek * 4, 20);         // Max 20 points
  score += Math.min(data.missionsCompleted * 5, 25);         // Max 25 points
  return Math.min(score, 100);
}

// Closing Rate Calculation
function calculateClosingRate(data: {
  totalConversations: number;
  closedDeals: number;
}): number {
  if (data.totalConversations === 0) return 0;
  return (data.closedDeals / data.totalConversations) * 100;
}
```

---

## 🛡️ SAFETY GATE & TIER GATING

### Implementation

```typescript
// /src/services/ai/aiSafetyGate.ts

export interface AiPolicy {
  allow_full_autonomous: boolean;
  require_user_approval_for_close: boolean;
  max_daily_contacts: number;
  max_messages_per_contact: number;
  allowed_channels: string[];
  blocked_phrases: string[];
}

export function canRunAutonomousSelling(params: {
  tier: string;
  policy: AiPolicy;
}): 'none' | 'suggest_only' | 'semi_autonomous' | 'full_autonomous' {
  
  if (params.tier === 'free') {
    return 'suggest_only';
  }
  
  if (params.tier === 'pro') {
    return 'semi_autonomous';
  }
  
  if (['elite', 'team', 'enterprise'].includes(params.tier)) {
    if (params.policy.allow_full_autonomous) {
      return 'full_autonomous';
    }
    return 'semi_autonomous';
  }
  
  return 'none';
}

export async function checkDailyLimits(userId: string, policy: AiPolicy): Promise<boolean> {
  // Query conversation_messages for today
  // Count unique prospects contacted
  // Return true if under limit
}

export function containsBlockedPhrases(message: string, policy: AiPolicy): boolean {
  return policy.blocked_phrases.some(phrase => 
    message.toLowerCase().includes(phrase.toLowerCase())
  );
}
```

### Safety Rules

1. **Rate Limiting**: Respect max_daily_contacts and max_messages_per_contact
2. **Blocked Phrases**: Never send messages with blocked phrases
3. **Channel Restrictions**: Only send via allowed_channels
4. **Manual Review**: Flag sensitive messages for review
5. **Tier Gating**: Enforce tier-based capabilities
6. **Legal Compliance**: Include legal_disclaimer when required

---

## 📱 UI/UX PAGES

### 1. Autonomous Selling Center

**Page:** `/pages/ai-tools/AutonomousSellingCenterPage.tsx`

**Sections:**
- Hero card with tier badge
- Channel toggles (Web Chat, Messenger, WhatsApp, Viber)
- Strategy preset selector
- Active sessions list
- Session transcript modal

**Components:**
- `<AutoSessionCard />` - Individual session card
- `<SessionTranscriptModal />` - Full conversation view
- `<EmotionalGauge />` - Visual emotion indicator
- `<TakeOverButton />` - Handoff to manual control

### 2. Conversation Intelligence

**Page:** `/pages/analytics/ConversationIntelligencePage.tsx`

**Features:**
- Date range filters
- Channel breakdown
- Emotional analytics charts
- Conversion funnel
- Top objections list
- Success rate by emotion

**Visualizations:**
- Line chart: Emotional trend over time
- Bar chart: Messages by emotion type
- Pie chart: Conversion by persuasion strategy
- Heatmap: Time of day performance

### 3. Team Leader Console

**Page:** `/pages/team/TeamLeaderConsolePage.tsx`

**Sections:**
- Team overview dashboard
- Member performance table
- AI insight chips per member
- Coaching session calendar
- Quick coaching plan generator

**Visible To:** Elite + Team + Enterprise tiers with leader role

---

## 🔄 MESSAGING OVERRIDE LOGIC

### Integration Flow

```typescript
// Before ANY message is sent:

async function sendAIMessage(params: {
  userId: string;
  prospectId: string;
  baseMessage: string;
}) {
  
  // 1. Load emotional context
  const emotionalAnalysis = await emotionalPersuasionEngine.analyzeProspectMessage(
    lastProspectMessage
  );
  
  // 2. Decorate prompt with emotion
  const enhancedPrompt = await emotionalPersuasionEngine.decoratePromptWithEmotion({
    basePrompt: generateBasePrompt(params),
    analysis: emotionalAnalysis,
    goal: 'recruit'
  });
  
  // 3. Generate AI reply
  const aiReply = await callLLM(enhancedPrompt);
  
  // 4. Apply safety gate
  const tier = await getUserTier(params.userId);
  const policy = await getAiPolicy(params.userId);
  const mode = aiSafetyGate.canRunAutonomousSelling({ tier, policy });
  
  // 5. Check if approval needed
  const requiresApproval = (
    mode === 'suggest_only' ||
    (mode === 'semi_autonomous' && isClosingAttempt(aiReply)) ||
    aiSafetyGate.containsBlockedPhrases(aiReply, policy)
  );
  
  // 6. Save message
  await supabase.from('conversation_messages').insert({
    session_id: sessionId,
    user_id: params.userId,
    prospect_id: params.prospectId,
    sender_type: 'ai',
    message_text: aiReply,
    emotion_primary: emotionalAnalysis.primaryEmotion,
    persuasion_strategy: emotionalAnalysis.recommendedStrategy,
    is_ai_suggested: true,
    is_sent_live: !requiresApproval
  });
  
  // 7. Send or queue for approval
  if (requiresApproval) {
    return { status: 'awaiting_approval', message: aiReply };
  } else {
    await sendMessage(params.prospectId, aiReply);
    return { status: 'sent', message: aiReply };
  }
}
```

---

## 🎯 IMPLEMENTATION CHECKLIST

### Database
- [ ] Create all 7 tables via migration or manual SQL
- [ ] Enable RLS on all tables
- [ ] Create indexes for performance
- [ ] Test policies with sample data

### Backend Services
- [ ] Build `autonomousSellingEngine.ts`
- [ ] Build `emotionalPersuasionEngine.ts`
- [ ] Build `teamLeaderEngine.ts`
- [ ] Build `aiSafetyGate.ts`
- [ ] Integrate with existing messaging pipeline
- [ ] Add tier checking to all functions

### Frontend Pages
- [ ] Create `AutonomousSellingCenterPage.tsx`
- [ ] Create `ConversationIntelligencePage.tsx`
- [ ] Create `TeamLeaderConsolePage.tsx`
- [ ] Add navigation links
- [ ] Add tier gates to routes
- [ ] Build supporting components

### Integration
- [ ] Wire Emotional Engine into MessagingHub
- [ ] Add "Autonomous Mode" toggle to ProspectDetail
- [ ] Update PersonalAboutPage to feed context
- [ ] Ensure Company Intelligence accessible
- [ ] Test end-to-end flow

### Testing
- [ ] Test Free tier (suggest only)
- [ ] Test Pro tier (semi-autonomous)
- [ ] Test Elite tier (full autonomous)
- [ ] Test emotional detection accuracy
- [ ] Test safety gates
- [ ] Test team coaching

---

## 🚀 QUICK START CODE SNIPPETS

### Creating Default Policy

```typescript
async function createDefaultPolicy(userId: string) {
  const { data, error } = await supabase
    .from('ai_policies')
    .insert({
      user_id: userId,
      name: 'Default Policy',
      description: 'Standard safety settings',
      allow_full_autonomous: false,
      require_user_approval_for_close: true,
      max_daily_contacts: 30,
      max_messages_per_contact: 7,
      allowed_channels: ['web_chat'],
      blocked_phrases: ['guaranteed money', 'get rich quick'],
      legal_disclaimer: 'Results may vary. This is not financial advice.',
      locale: 'en-PH'
    })
    .select()
    .single();
    
  return data;
}
```

### Starting Autonomous Session

```typescript
import { autonomousSellingEngine } from '../services/ai/autonomousSellingEngine';

async function startChat(prospectId: string) {
  const session = await autonomousSellingEngine.startAutonomousSession({
    userId: currentUser.id,
    prospectId,
    channel: 'web_chat',
    goal: 'recruit'
  });
  
  console.log('Session started:', session.sessionId);
}
```

### Analyzing Emotions

```typescript
import { emotionalPersuasionEngine } from '../services/ai/emotionalPersuasionEngine';

const analysis = await emotionalPersuasionEngine.analyzeProspectMessage(
  "Kulang ako sa budget eh, tsaka natatakot ako baka scam lang"
);

console.log(analysis);
// {
//   primaryEmotion: 'stressed',
//   confidence: 0.85,
//   valence: -0.6,
//   arousal: 0.7,
//   recommendedStrategy: 'empathy',
//   toneOverride: 'calm_reassuring'
// }
```

---

**This is a comprehensive guide. Implementation requires building all services, pages, and integrations as outlined above. The system is designed to be production-ready with proper safety controls, tier gating, and Filipino market optimization.** 🚀✨
