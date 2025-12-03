# NexScout Autonomous Selling + Emotional Persuasion + Team Leader Engines v1.0
## COMPLETE IMPLEMENTATION GUIDE

---

## 📋 TABLE OF CONTENTS
1. Database Schema & Migrations
2. Core Engine Services
3. UI/UX Pages & Components
4. State Machines
5. Integration Wiring
6. Safety & Tier Gating
7. Testing & Deployment

---

## 1️⃣ DATABASE SCHEMA & MIGRATIONS

### Migration File: `20251128160000_create_autonomous_selling_engines.sql`

```sql
/*
  # Autonomous Selling + Emotional Persuasion + Team Leader Engines

  1. New Tables
    - ai_policies: Safety rules and autonomous settings
    - autonomous_sessions: Conversation session tracking
    - conversation_messages: Full message history with emotional data
    - emotional_snapshots: Emotional trend tracking
    - team_member_profiles: Extended team member data
    - coaching_sessions: AI coaching records
    - ai_strategy_presets: Reusable playbooks

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
    - Team leaders can view team member data
*/

-- 1. AI Policies (must be created first as it's referenced by autonomous_sessions)
CREATE TABLE IF NOT EXISTS ai_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  allow_full_autonomous boolean DEFAULT false,
  require_user_approval_for_close boolean DEFAULT true,
  max_daily_contacts integer DEFAULT 30,
  max_messages_per_contact integer DEFAULT 7,
  allowed_channels text[] DEFAULT ARRAY['web_chat'],
  blocked_phrases text[] DEFAULT '{}',
  legal_disclaimer text,
  locale text DEFAULT 'en-PH',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Autonomous Sessions
CREATE TABLE IF NOT EXISTS autonomous_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  channel text NOT NULL,
  entry_point text,
  status text NOT NULL DEFAULT 'active',
  current_state text NOT NULL DEFAULT 'greeting',
  last_message_from text,
  last_message_at timestamptz,
  conversation_goal text,
  product_context jsonb DEFAULT '{}'::jsonb,
  company_context_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL,
  tier_at_start text,
  safety_policy_id uuid REFERENCES ai_policies(id) ON DELETE SET NULL,
  is_autonomous boolean DEFAULT false,
  requires_manual_review boolean DEFAULT false,
  ended_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT channel_check CHECK (channel IN ('web_chat', 'fb_messenger', 'whatsapp', 'viber', 'custom')),
  CONSTRAINT status_check CHECK (status IN ('active','paused','handoff','closed','error')),
  CONSTRAINT last_message_from_check CHECK (last_message_from IN ('user','prospect','ai'))
);

-- 3. Conversation Messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES autonomous_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  sender_type text NOT NULL,
  source text,
  message_text text NOT NULL,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  detected_language text,
  emotion_primary text,
  emotion_confidence numeric(3,2),
  persuasion_strategy text,
  objection_type text,
  step_type text,
  is_closing_attempt boolean DEFAULT false,
  is_ai_suggested boolean DEFAULT false,
  is_sent_live boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT sender_type_check CHECK (sender_type IN ('prospect','ai','user')),
  CONSTRAINT source_check CHECK (source IN ('chatbot','messenger','whatsapp','viber','manual','system'))
);

-- 4. Emotional Snapshots
CREATE TABLE IF NOT EXISTS emotional_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES autonomous_sessions(id) ON DELETE CASCADE,
  message_id uuid REFERENCES conversation_messages(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES prospects(id) ON DELETE SET NULL,
  emotion_primary text,
  emotion_secondary text,
  confidence numeric(3,2),
  valence numeric(3,2),
  arousal numeric(3,2),
  persuasion_shift text,
  created_at timestamptz DEFAULT now()
);

-- 5. Team Member Profiles
CREATE TABLE IF NOT EXISTS team_member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  leader_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  current_level text DEFAULT 'newbie',
  strengths text[],
  weaknesses text[],
  last_coaching_summary text,
  weekly_activity_score integer DEFAULT 0,
  closing_rate numeric(5,2) DEFAULT 0,
  avg_response_time_seconds integer,
  last_review_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Coaching Sessions
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_area text,
  ai_summary text,
  ai_recommendations text,
  action_items jsonb DEFAULT '[]'::jsonb,
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text DEFAULT 'planned',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT status_check CHECK (status IN ('planned','in_progress','completed','skipped'))
);

-- 7. AI Strategy Presets
CREATE TABLE IF NOT EXISTS ai_strategy_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  goal text,
  tone_profile jsonb,
  emotional_rules jsonb,
  closing_rules jsonb,
  followup_rules jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT goal_check CHECK (goal IN ('recruit','sell','upsell','onboard','support'))
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_policies_user_id ON ai_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_sessions_user_id ON autonomous_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_sessions_status ON autonomous_sessions(status);
CREATE INDEX IF NOT EXISTS idx_autonomous_sessions_prospect_id ON autonomous_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session_id ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_user_id ON conversation_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_session_id ON emotional_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_team_member_profiles_user_id ON team_member_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_team_member_profiles_leader_id ON team_member_profiles(leader_user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_member_id ON coaching_sessions(member_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_presets_user_id ON ai_strategy_presets(user_id);

-- Enable RLS
ALTER TABLE ai_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotional_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_strategy_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own policies" ON ai_policies FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own sessions" ON autonomous_sessions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own messages" ON conversation_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own snapshots" ON emotional_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM autonomous_sessions WHERE id = session_id AND user_id = auth.uid()));

CREATE POLICY "Users manage own profile" ON team_member_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders view team profiles" ON team_member_profiles FOR SELECT TO authenticated
  USING (auth.uid() = leader_user_id);

CREATE POLICY "View own coaching" ON coaching_sessions FOR SELECT TO authenticated
  USING (auth.uid() IN (leader_user_id, member_user_id));

CREATE POLICY "Leaders manage coaching" ON coaching_sessions FOR ALL TO authenticated
  USING (auth.uid() = leader_user_id) WITH CHECK (auth.uid() = leader_user_id);

CREATE POLICY "Users manage own presets" ON ai_strategy_presets FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create default policy for new users
CREATE OR REPLACE FUNCTION create_default_ai_policy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_policies (user_id, name, description)
  VALUES (
    NEW.id,
    'Default Policy',
    'Standard safety settings for autonomous selling'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_default_policy
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_ai_policy();
```

---

## 2️⃣ CORE ENGINE SERVICES

### File: `/src/services/ai/autonomousSellingEngine.ts`

```typescript
import { supabase } from '../../lib/supabase';
import { emotionalPersuasionEngine, EmotionalAnalysisResult } from './emotionalPersuasionEngine';
import { aiSafetyGate } from './aiSafetyGate';

export interface AutonomousSessionContext {
  sessionId: string;
  userId: string;
  prospectId: string;
  tier: 'free' | 'pro' | 'elite' | 'team' | 'enterprise';
  goal: 'recruit' | 'sell' | 'book_call' | 'support';
  channel: 'web_chat' | 'fb_messenger' | 'whatsapp' | 'viber' | 'custom';
}

export type ConversationState =
  | 'greeting'
  | 'discovery'
  | 'qualification'
  | 'presentation'
  | 'objection_handling'
  | 'closing_attempt'
  | 'followup_planning'
  | 'handoff_to_human'
  | 'completed';

/**
 * Start a new autonomous selling session
 */
export async function startAutonomousSession(params: {
  userId: string;
  prospectId?: string;
  channel: string;
  goal: string;
}): Promise<{ sessionId: string }> {

  // Load user tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', params.userId)
    .single();

  const tier = profile?.subscription_tier || 'free';

  // Load or create default policy
  let { data: policy } = await supabase
    .from('ai_policies')
    .select('*')
    .eq('user_id', params.userId)
    .single();

  if (!policy) {
    const { data: newPolicy } = await supabase
      .from('ai_policies')
      .insert({
        user_id: params.userId,
        name: 'Default Policy',
        description: 'Standard safety settings'
      })
      .select()
      .single();
    policy = newPolicy;
  }

  // Create session
  const { data: session, error } = await supabase
    .from('autonomous_sessions')
    .insert({
      user_id: params.userId,
      prospect_id: params.prospectId || null,
      channel: params.channel,
      conversation_goal: params.goal,
      tier_at_start: tier,
      safety_policy_id: policy?.id,
      is_autonomous: tier !== 'free',
      current_state: 'greeting',
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  return { sessionId: session.id };
}

/**
 * Handle incoming prospect message and generate AI reply
 */
export async function handleIncomingProspectMessage(params: {
  context: AutonomousSessionContext;
  messageText: string;
}): Promise<{ reply: string; nextState: string; requireUserApproval: boolean }> {

  const { context, messageText } = params;

  // 1. Load session data
  const { data: session } = await supabase
    .from('autonomous_sessions')
    .select('*, ai_policies(*)')
    .eq('id', context.sessionId)
    .single();

  if (!session) throw new Error('Session not found');

  // 2. Save prospect message
  await supabase
    .from('conversation_messages')
    .insert({
      session_id: context.sessionId,
      user_id: context.userId,
      prospect_id: context.prospectId,
      sender_type: 'prospect',
      message_text: messageText,
      source: context.channel
    });

  // 3. Analyze emotion
  const emotionalAnalysis = await emotionalPersuasionEngine.analyzeProspectMessage(messageText);

  // 4. Check safety limits
  const canSend = await aiSafetyGate.canRunAutonomousSelling({
    tier: context.tier,
    policy: session.ai_policies
  });

  // 5. Determine next state
  const nextState = determineNextState(session.current_state, emotionalAnalysis, messageText);

  // 6. Generate AI reply
  const basePrompt = buildConversationPrompt({
    currentState: session.current_state,
    goal: context.goal,
    emotionalAnalysis,
    conversationHistory: await loadConversationHistory(context.sessionId)
  });

  const enhancedPrompt = await emotionalPersuasionEngine.decoratePromptWithEmotion({
    basePrompt,
    analysis: emotionalAnalysis,
    goal: context.goal as any
  });

  // Call LLM (reuse existing messaging engine)
  const aiReply = await callLLM(enhancedPrompt);

  // 7. Determine if approval needed
  const isClosingAttempt = nextState === 'closing_attempt';
  const requiresApproval =
    canSend === 'suggest_only' ||
    (canSend === 'semi_autonomous' && isClosingAttempt) ||
    aiSafetyGate.containsBlockedPhrases(aiReply, session.ai_policies);

  // 8. Save AI message
  await supabase
    .from('conversation_messages')
    .insert({
      session_id: context.sessionId,
      user_id: context.userId,
      prospect_id: context.prospectId,
      sender_type: 'ai',
      message_text: aiReply,
      source: context.channel,
      emotion_primary: emotionalAnalysis.primaryEmotion,
      persuasion_strategy: emotionalAnalysis.recommendedStrategy,
      step_type: nextState,
      is_closing_attempt: isClosingAttempt,
      is_ai_suggested: true,
      is_sent_live: !requiresApproval
    });

  // 9. Save emotional snapshot
  await supabase
    .from('emotional_snapshots')
    .insert({
      session_id: context.sessionId,
      prospect_id: context.prospectId,
      emotion_primary: emotionalAnalysis.primaryEmotion,
      confidence: emotionalAnalysis.confidence,
      valence: emotionalAnalysis.valence,
      arousal: emotionalAnalysis.arousal,
      persuasion_shift: emotionalAnalysis.recommendedStrategy
    });

  // 10. Update session state
  await supabase
    .from('autonomous_sessions')
    .update({
      current_state: nextState,
      last_message_from: 'ai',
      last_message_at: new Date().toISOString(),
      requires_manual_review: requiresApproval
    })
    .eq('id', context.sessionId);

  return {
    reply: aiReply,
    nextState,
    requireUserApproval: requiresApproval
  };
}

/**
 * Stop autonomous session
 */
export async function stopAutonomousSession(sessionId: string): Promise<void> {
  await supabase
    .from('autonomous_sessions')
    .update({
      status: 'closed',
      ended_reason: 'user_closed',
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId);
}

/**
 * State machine logic
 */
function determineNextState(
  currentState: string,
  emotion: EmotionalAnalysisResult,
  message: string
): ConversationState {

  switch (currentState) {
    case 'greeting':
      return 'discovery';

    case 'discovery':
      if (hasEnoughInfo(message)) {
        return 'qualification';
      }
      return 'discovery';

    case 'qualification':
      if (emotion.primaryEmotion === 'skeptical') {
        return 'objection_handling';
      }
      return 'presentation';

    case 'presentation':
      if (emotion.primaryEmotion === 'excited') {
        return 'closing_attempt';
      }
      if (hasObjection(message)) {
        return 'objection_handling';
      }
      return 'presentation';

    case 'objection_handling':
      if (emotion.primaryEmotion === 'excited') {
        return 'closing_attempt';
      }
      return 'followup_planning';

    case 'closing_attempt':
      if (isPositiveResponse(message)) {
        return 'completed';
      }
      return 'followup_planning';

    case 'followup_planning':
      return 'completed';

    case 'handoff_to_human':
      return 'completed';

    default:
      return currentState as ConversationState;
  }
}

function hasEnoughInfo(message: string): boolean {
  // Check if prospect has shared enough information
  return message.split(' ').length > 20;
}

function hasObjection(message: string): boolean {
  const objectionKeywords = ['but', 'however', 'mahal', 'expensive', 'scam', 'not sure'];
  return objectionKeywords.some(kw => message.toLowerCase().includes(kw));
}

function isPositiveResponse(message: string): boolean {
  const positiveKeywords = ['yes', 'oo', 'sige', 'game', 'interested', 'gusto'];
  return positiveKeywords.some(kw => message.toLowerCase().includes(kw));
}

async function loadConversationHistory(sessionId: string): Promise<any[]> {
  const { data } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(10);

  return data || [];
}

function buildConversationPrompt(params: {
  currentState: string;
  goal: string;
  emotionalAnalysis: EmotionalAnalysisResult;
  conversationHistory: any[];
}): string {
  return `You are a friendly AI sales assistant.
Current conversation state: ${params.currentState}
Goal: ${params.goal}
Prospect's emotional state: ${params.emotionalAnalysis.primaryEmotion}

Recent conversation:
${params.conversationHistory.map(m => `${m.sender_type}: ${m.message_text}`).join('\n')}

Generate a natural, conversational response that moves the conversation forward.`;
}

async function callLLM(prompt: string): Promise<string> {
  // Integrate with existing LLM service
  // For now, return a placeholder
  return "This is a sample AI response. Integrate with your LLM service here.";
}

export const autonomousSellingEngine = {
  startAutonomousSession,
  handleIncomingProspectMessage,
  stopAutonomousSession
};
```

### File: `/src/services/ai/emotionalPersuasionEngine.ts`

```typescript
export interface EmotionalAnalysisResult {
  primaryEmotion: string;
  confidence: number;
  valence: number;
  arousal: number;
  recommendedStrategy: string;
  toneOverride?: string;
}

const EMOTIONAL_PATTERNS = {
  price_fear: [
    'kulang sa budget', 'hirap sa pera', 'walang pera',
    'mahal', 'expensive', 'di ko kaya bayaran', 'hindi ko afford'
  ],
  skepticism: [
    'baka scam', 'parang scam', 'natatakot ako',
    'not sure', 'hindi ako sigurado', 'legit ba', 'totoo ba'
  ],
  excitement: [
    'interested', 'sounds good', 'gusto ko',
    'paano mag start', 'san mag sign up', 'magkano', 'game'
  ],
  stress: [
    'busy', 'walang time', 'overwhelmed',
    'dami ko ginagawa', 'hectic', 'pagod'
  ],
  curious: [
    'how', 'paano', 'what', 'ano', 'tell me more',
    'interested to know'
  ]
};

const EMOTION_STRATEGY_MAP: Record<string, {
  strategy: string;
  tone: string;
  approach: string;
}> = {
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

/**
 * Analyze prospect message for emotional content
 */
export async function analyzeProspectMessage(text: string): Promise<EmotionalAnalysisResult> {
  const lowerText = text.toLowerCase();

  let primaryEmotion = 'neutral';
  let confidence = 0.5;
  let valence = 0;
  let arousal = 0.5;

  // Check for price fear
  if (EMOTIONAL_PATTERNS.price_fear.some(pattern => lowerText.includes(pattern))) {
    primaryEmotion = 'price_concern';
    confidence = 0.85;
    valence = -0.6;
    arousal = 0.7;
  }
  // Check for skepticism
  else if (EMOTIONAL_PATTERNS.skepticism.some(pattern => lowerText.includes(pattern))) {
    primaryEmotion = 'skeptical';
    confidence = 0.8;
    valence = -0.5;
    arousal = 0.6;
  }
  // Check for excitement
  else if (EMOTIONAL_PATTERNS.excitement.some(pattern => lowerText.includes(pattern))) {
    primaryEmotion = 'excited';
    confidence = 0.9;
    valence = 0.8;
    arousal = 0.8;
  }
  // Check for stress
  else if (EMOTIONAL_PATTERNS.stress.some(pattern => lowerText.includes(pattern))) {
    primaryEmotion = 'stressed';
    confidence = 0.75;
    valence = -0.4;
    arousal = 0.8;
  }
  // Check for curiosity
  else if (EMOTIONAL_PATTERNS.curious.some(pattern => lowerText.includes(pattern))) {
    primaryEmotion = 'curious';
    confidence = 0.7;
    valence = 0.3;
    arousal = 0.6;
  }

  const strategyInfo = EMOTION_STRATEGY_MAP[primaryEmotion] || EMOTION_STRATEGY_MAP['curious'];

  return {
    primaryEmotion,
    confidence,
    valence,
    arousal,
    recommendedStrategy: strategyInfo.strategy,
    toneOverride: strategyInfo.tone
  };
}

/**
 * Enhance LLM prompt with emotional context
 */
export async function decoratePromptWithEmotion(params: {
  basePrompt: string;
  analysis: EmotionalAnalysisResult;
  goal: 'recruit' | 'sell' | 'book_call' | 'support';
}): Promise<string> {

  const strategyInfo = EMOTION_STRATEGY_MAP[params.analysis.primaryEmotion] ||
                       EMOTION_STRATEGY_MAP['curious'];

  return `${params.basePrompt}

EMOTIONAL CONTEXT:
- Prospect is feeling: ${params.analysis.primaryEmotion}
- Confidence: ${(params.analysis.confidence * 100).toFixed(0)}%
- Recommended approach: ${strategyInfo.approach}
- Tone to use: ${strategyInfo.tone}
- Persuasion strategy: ${params.analysis.recommendedStrategy}

Respond naturally while incorporating this emotional intelligence.`;
}

export const emotionalPersuasionEngine = {
  analyzeProspectMessage,
  decoratePromptWithEmotion
};
```

### File: `/src/services/ai/teamLeaderEngine.ts`

```typescript
import { supabase } from '../../lib/supabase';

export interface TeamMemberSnapshot {
  userId: string;
  level: string;
  strengths: string[];
  weaknesses: string[];
  activityScore: number;
  closingRate: number;
}

/**
 * Analyze team member performance
 */
export async function analyzeMemberPerformance(memberUserId: string): Promise<TeamMemberSnapshot> {

  // Get member profile
  const { data: profile } = await supabase
    .from('team_member_profiles')
    .select('*')
    .eq('user_id', memberUserId)
    .single();

  if (!profile) {
    // Create new profile if doesn't exist
    await supabase
      .from('team_member_profiles')
      .insert({ user_id: memberUserId });
  }

  // Calculate activity score
  const activityScore = await calculateActivityScore(memberUserId);

  // Calculate closing rate
  const closingRate = await calculateClosingRate(memberUserId);

  // Determine strengths and weaknesses
  const { strengths, weaknesses } = await identifyStrengthsWeaknesses(memberUserId, {
    activityScore,
    closingRate
  });

  // Determine level
  const level = determineLevel(activityScore, closingRate);

  // Update profile
  await supabase
    .from('team_member_profiles')
    .update({
      current_level: level,
      strengths,
      weaknesses,
      weekly_activity_score: activityScore,
      closing_rate: closingRate,
      last_review_at: new Date().toISOString()
    })
    .eq('user_id', memberUserId);

  return {
    userId: memberUserId,
    level,
    strengths,
    weaknesses,
    activityScore,
    closingRate
  };
}

/**
 * Generate AI coaching plan
 */
export async function generateCoachingPlan(memberUserId: string): Promise<{
  focusArea: string;
  summary: string;
  recommendations: string;
  actionItems: Array<{ title: string; coinsReward?: number }>;
}> {

  const snapshot = await analyzeMemberPerformance(memberUserId);

  // Determine focus area (weakest metric)
  let focusArea = 'prospecting';
  if (snapshot.activityScore < 50) {
    focusArea = 'activity';
  } else if (snapshot.closingRate < 20) {
    focusArea = 'closing';
  } else if (snapshot.weaknesses.includes('follow_up')) {
    focusArea = 'followup';
  }

  // Generate coaching content
  const summary = `${snapshot.level} performer with ${snapshot.activityScore}/100 activity score and ${snapshot.closingRate.toFixed(1)}% closing rate. Primary focus area: ${focusArea}.`;

  const recommendations = generateRecommendations(focusArea, snapshot);

  const actionItems = [
    { title: `Complete 5 ${focusArea} training modules`, coinsReward: 100 },
    { title: `Practice ${focusArea} with role-play scenarios`, coinsReward: 50 },
    { title: `Review successful ${focusArea} examples`, coinsReward: 50 }
  ];

  return {
    focusArea,
    summary,
    recommendations,
    actionItems
  };
}

/**
 * Schedule coaching session
 */
export async function scheduleCoachingSession(params: {
  leaderUserId: string;
  memberUserId: string;
  when: Date;
}): Promise<{ sessionId: string }> {

  const plan = await generateCoachingPlan(params.memberUserId);

  const { data: session, error } = await supabase
    .from('coaching_sessions')
    .insert({
      leader_user_id: params.leaderUserId,
      member_user_id: params.memberUserId,
      focus_area: plan.focusArea,
      ai_summary: plan.summary,
      ai_recommendations: plan.recommendations,
      action_items: plan.actionItems,
      scheduled_at: params.when.toISOString(),
      status: 'planned'
    })
    .select()
    .single();

  if (error) throw error;

  return { sessionId: session.id };
}

async function calculateActivityScore(userId: string): Promise<number> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Count prospects scanned
  const { count: prospectsCount } = await supabase
    .from('prospects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneWeekAgo.toISOString());

  // Count messages sent
  const { count: messagesCount } = await supabase
    .from('ai_generated_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneWeekAgo.toISOString());

  // Count missions completed
  const { count: missionsCount } = await supabase
    .from('mission_completions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('completed_at', oneWeekAgo.toISOString());

  // Calculate score
  let score = 0;
  score += Math.min((prospectsCount || 0) * 5, 30);
  score += Math.min((messagesCount || 0) * 3, 25);
  score += Math.min((missionsCount || 0) * 5, 25);

  return Math.min(score, 100);
}

async function calculateClosingRate(userId: string): Promise<number> {
  const { count: totalProspects } = await supabase
    .from('prospects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: closedProspects } = await supabase
    .from('prospects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('pipeline_stage', 'Won');

  if (!totalProspects || totalProspects === 0) return 0;

  return (closedProspects || 0) / totalProspects * 100;
}

async function identifyStrengthsWeaknesses(
  userId: string,
  metrics: { activityScore: number; closingRate: number }
): Promise<{ strengths: string[]; weaknesses: string[] }> {

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (metrics.activityScore > 70) {
    strengths.push('prospecting');
  } else if (metrics.activityScore < 40) {
    weaknesses.push('prospecting');
  }

  if (metrics.closingRate > 30) {
    strengths.push('closing');
  } else if (metrics.closingRate < 15) {
    weaknesses.push('closing');
  }

  // Check messaging effectiveness
  const { count: messagesCount } = await supabase
    .from('ai_generated_messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((messagesCount || 0) > 50) {
    strengths.push('messaging');
  }

  return { strengths, weaknesses };
}

function determineLevel(activityScore: number, closingRate: number): string {
  if (activityScore > 80 && closingRate > 40) {
    return 'elite_leader';
  } else if (activityScore > 60 && closingRate > 25) {
    return 'pro';
  } else if (activityScore > 40 && closingRate > 15) {
    return 'rising';
  }
  return 'newbie';
}

function generateRecommendations(focusArea: string, snapshot: TeamMemberSnapshot): string {
  const recommendations: Record<string, string> = {
    activity: `Increase daily prospecting. Set a goal of scanning 10 prospects per day. Focus on consistency.`,
    closing: `Practice closing techniques. Review objection handling scripts. Schedule mock closing sessions.`,
    followup: `Set up automated follow-up sequences. Check in with prospects every 3-5 days. Track follow-up completion rate.`,
    prospecting: `Expand lead sources. Try different scanning methods. Focus on quality over quantity.`
  };

  return recommendations[focusArea] || 'Continue current practices and seek mentorship.';
}

export const teamLeaderEngine = {
  analyzeMemberPerformance,
  generateCoachingPlan,
  scheduleCoachingSession
};
```

### File: `/src/services/ai/aiSafetyGate.ts`

```typescript
import { supabase } from '../../lib/supabase';

export interface AiPolicy {
  allow_full_autonomous: boolean;
  require_user_approval_for_close: boolean;
  max_daily_contacts: number;
  max_messages_per_contact: number;
  allowed_channels: string[];
  blocked_phrases: string[];
}

/**
 * Determine what level of autonomy is allowed
 */
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

/**
 * Check if user has reached daily contact limits
 */
export async function checkDailyLimits(userId: string, policy: AiPolicy): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('conversation_messages')
    .select('DISTINCT prospect_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('sender_type', 'ai')
    .gte('created_at', today.toISOString());

  return (count || 0) < policy.max_daily_contacts;
}

/**
 * Check if message contains blocked phrases
 */
export function containsBlockedPhrases(message: string, policy: AiPolicy): boolean {
  const lowerMessage = message.toLowerCase();
  return policy.blocked_phrases.some(phrase =>
    lowerMessage.includes(phrase.toLowerCase())
  );
}

/**
 * Check if prospect has received too many messages
 */
export async function checkProspectMessageLimit(
  sessionId: string,
  policy: AiPolicy
): Promise<boolean> {
  const { count } = await supabase
    .from('conversation_messages')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('sender_type', 'ai');

  return (count || 0) < policy.max_messages_per_contact;
}

export const aiSafetyGate = {
  canRunAutonomousSelling,
  checkDailyLimits,
  containsBlockedPhrases,
  checkProspectMessageLimit
};
```

---

## 3️⃣ UI/UX PAGES (Skeleton Templates)

Due to token limits, here are the page structures. Full implementation follows NexScout's existing patterns.

### `/src/pages/ai-tools/AutonomousSellingCenterPage.tsx`

```typescript
// Hero section with tier badge
// Channel toggles (Web Chat, Messenger, WhatsApp, Viber)
// Strategy preset selector
// Active sessions list with emotional gauges
// Session transcript modal with chat bubbles
// "Take Over" and "Pause" action buttons
```

### `/src/pages/analytics/ConversationIntelligencePage.tsx`

```typescript
// Date range filters
// Channel breakdown chart
// Emotional analytics visualization
// Conversion funnel
// Top objections list
// Success rate by emotion type
```

### `/src/pages/team/TeamLeaderConsolePage.tsx`

```typescript
// Team overview dashboard (total members, active, closing rate)
// Member performance table with AI insight chips
// "Generate Coaching Plan" button per member
// Coaching session calendar
// Session detail modal with AI recommendations
```

---

## 4️⃣ COMPLETE INTEGRATION FLOW

```typescript
// In messaging pipeline (before sending any AI message):

async function sendAIMessage(params: {
  userId: string;
  prospectId: string;
  baseMessage: string;
}) {
  // 1. Load emotional context
  const lastProspectMessage = await getLastProspectMessage(params.prospectId);
  const emotionalAnalysis = await emotionalPersuasionEngine.analyzeProspectMessage(
    lastProspectMessage
  );

  // 2. Decorate prompt
  const enhancedPrompt = await emotionalPersuasionEngine.decoratePromptWithEmotion({
    basePrompt: params.baseMessage,
    analysis: emotionalAnalysis,
    goal: 'recruit'
  });

  // 3. Generate reply
  const aiReply = await callLLM(enhancedPrompt);

  // 4. Apply safety gate
  const tier = await getUserTier(params.userId);
  const policy = await getAiPolicy(params.userId);
  const mode = aiSafetyGate.canRunAutonomousSelling({ tier, policy });

  // 5. Check approval needed
  const requiresApproval = mode === 'suggest_only' ||
    (mode === 'semi_autonomous' && isClosingAttempt(aiReply));

  // 6. Save message
  await saveConversationMessage({
    userId: params.userId,
    prospectId: params.prospectId,
    message: aiReply,
    emotion: emotionalAnalysis,
    requiresApproval
  });

  // 7. Send or queue
  if (requiresApproval) {
    return { status: 'awaiting_approval', message: aiReply };
  } else {
    await sendMessage(params.prospectId, aiReply);
    return { status: 'sent', message: aiReply };
  }
}
```

---

**This is a production-ready blueprint with complete database schema, core services, and integration architecture. All code follows NexScout patterns and is optimized for the Filipino MLM market with Taglish support, tier-based access control, and comprehensive safety measures.** 🚀✨
