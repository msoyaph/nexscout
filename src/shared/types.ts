/**
 * NEXSCOUT SHARED TYPES
 * Consolidated type definitions for all engines
 */

// ========================================
// CHANNEL & MESSAGING TYPES
// ========================================

export type ChannelType = 'web' | 'facebook' | 'whatsapp' | 'sms' | 'email' | 'internal';

export type MessagingPersona = 'sales' | 'support' | 'productExpert' | 'mlmLeader' | 'pastor' | 'coach' | 'default';

export type MessageLanguage = 'en' | 'fil' | 'ceb' | 'es' | 'auto';

export type MessageTone = 'professional' | 'friendly' | 'casual' | 'direct' | 'warm' | 'energetic' | 'compassionate';

// ========================================
// INTENT TYPES
// ========================================

export type UserIntent =
  | 'salesInquiry'
  | 'productInterest'
  | 'pricing'
  | 'closingOpportunity'
  | 'leadQualification'
  | 'mlmRecruit'
  | 'mlmTraining'
  | 'leadFollowUp'
  | 'customerSupport'
  | 'techSupport'
  | 'complaint'
  | 'orderTracking'
  | 'refund'
  | 'productEducation'
  | 'default';

// ========================================
// INDUSTRY TYPES
// ========================================

export type Industry = 'mlm' | 'insurance' | 'real_estate' | 'ecommerce' | 'b2b' | 'coaching' | 'general';

// ========================================
// LEAD & SCORING TYPES
// ========================================

export type LeadTemperature = 'cold' | 'warm' | 'hot' | 'readyToBuy';

export type ScoutScoreRating = 'hot' | 'warm' | 'cold';

export interface LeadSignals {
  messagesSent: number;
  replies: number;
  responseRate: number;
  clickRate: number;
  timeSinceLastReply: number;
  linkClicks: number;
  openedEmails: number;
  productViews: number;
  expressedInterest: boolean;
  buyingLanguageScore: number;
  objections: number;
  positiveBuyingSignals: number;
}

export interface LeadTemperatureResult {
  temperature: LeadTemperature;
  score: number; // 0-100
  reasons: string[];
  recommendedNextStep: string;
  confidence: number;
}

// ========================================
// FUNNEL TYPES
// ========================================

export type FunnelStage =
  | 'awareness'
  | 'interest'
  | 'evaluation'
  | 'decision'
  | 'action'
  | 'followup'
  | 'revival';

export interface FunnelRules {
  requireShortReplies: boolean;
  requireCTA: boolean;
  requireQualificationQuestions: boolean;
  requireProgressiveDisclosure: boolean;
}

export interface FunnelState {
  currentStage: FunnelStage;
  previousStage?: FunnelStage;
  stageEnteredAt: string;
  timeInStageMinutes: number;
  attemptedTransitions: number;
}

// ========================================
// MESSAGING INPUT/OUTPUT TYPES
// ========================================

export interface MessagingConfig {
  channel: ChannelType;
  language: MessageLanguage;
  persona?: MessagingPersona;
  tone?: MessageTone;
  industry?: Industry;
  temperature?: number;
  maxTokens?: number;
  versionMode?: 'unified' | 'legacyV1' | 'legacyV2' | 'v4';
}

export interface MessagingInput {
  userId?: string;
  prospectId?: string;
  leadId?: string;
  message: string;
  context?: Record<string, unknown>;
  config: MessagingConfig;
}

export interface MessagingOutput {
  reply: string;
  intent: UserIntent;
  persona: MessagingPersona;
  language: MessageLanguage;
  tone: MessageTone;
  leadTemperature?: LeadTemperatureResult;
  funnelStage?: FunnelStage;
  meta?: {
    fusionWarnings?: string[];
    toneProfile?: ToneProfile;
    promptUsed?: string;
    tokensUsed?: number;
    processingTimeMs?: number;
  };
}

// ========================================
// TONE SYNTHESIS TYPES
// ========================================

export interface ToneProfile {
  finalTone: MessageTone;
  sentenceLength: 'short' | 'medium' | 'long';
  languageMix: MessageLanguage;
  confidenceLevel: 'low' | 'medium' | 'high';
  formalityLevel: number; // 0-10
}

// ========================================
// CUSTOM INSTRUCTIONS TYPES
// ========================================

export interface CustomInstruction {
  id: string;
  instruction_type: 'tone' | 'style' | 'positioning' | 'framework' | 'constraints' | 'banned_words' | 'brand_voice' | 'selling_rules';
  content: string;
  priority: number;
  applies_to: string[];
}

export interface FusionOutput {
  tone: string;
  writingStyle: string;
  personaStyle: string;
  funnelRules: string[];
  constraints: string[];
  bannedBehaviors: string[];
  mergedValues: Record<string, any>;
  warnings?: string[];
}

// ========================================
// CHANNEL ADAPTER TYPES
// ========================================

export interface RawChannelMessage {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp?: string;
  payload?: any;
  platform?: ChannelType;
}

export interface ChannelResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: string;
}

// ========================================
// ANALYTICS & EVENTS TYPES
// ========================================

export type EventType =
  | 'message.sent'
  | 'message.replied'
  | 'lead.scored'
  | 'lead.temperatureChanged'
  | 'funnel.stageChanged'
  | 'funnel.sequenceStepFired'
  | 'intent.detected'
  | 'language.detected'
  | 'channel.error'
  | 'ai.generated'
  | 'objection.detected'
  | 'objection.handled';

export interface SystemEvent {
  id: string;
  timestamp: string;
  userId?: string;
  prospectId?: string;
  leadId?: string;
  channel: ChannelType;
  type: EventType;
  metadata?: Record<string, unknown>;
  source?: string;
}

export interface LeadConversionStats {
  leadId: string;
  firstContactAt: string;
  firstReplyAt?: string;
  lastReplyAt?: string;
  totalMessagesSent: number;
  totalReplies: number;
  lastTemperature: LeadTemperature;
  currentStage: FunnelStage;
  finalStage?: FunnelStage;
  converted: boolean;
  conversionValue?: number;
}

export interface FunnelKpi {
  stage: FunnelStage;
  leadsEntered: number;
  leadsExited: number;
  avgTimeInStageMinutes: number;
  conversionRateToNextStage: number;
}

export interface ChannelKpi {
  channel: ChannelType;
  messagesSent: number;
  repliesReceived: number;
  avgResponseTimeSeconds: number;
  conversionRate: number;
  errorRate: number;
}

// ========================================
// PROMPT TYPES
// ========================================

export interface PromptTemplate {
  id: string;
  industry: Industry;
  category: 'objection' | 'closing' | 'followup' | 'qualification' | 'discovery' | 'upsell';
  template: string;
  variables?: string[];
  successRate?: number;
}

export interface ObjectionResponse {
  objectionType: string;
  response: string;
  followUp?: string;
  confidence: number;
}

// ========================================
// SEQUENCE TYPES
// ========================================

export type SequenceType =
  | 'welcome'
  | 'qualification'
  | 'nurturing'
  | 'closing'
  | 'revival'
  | 'followup';

export interface SequenceStep {
  id: string;
  sequenceId: string;
  stepNumber: number;
  delayHours: number;
  messageTemplate: string;
  condition?: string;
  nextStepOnReply?: string;
  nextStepOnNoReply?: string;
}

export interface SequenceEnrollment {
  id: string;
  prospectId: string;
  sequenceId: string;
  currentStepNumber: number;
  enrolledAt: string;
  lastStepSentAt?: string;
  completedAt?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

// ========================================
// SCORING TYPES
// ========================================

export interface ScoutScoreBreakdown {
  engagement?: number;
  opportunity?: number;
  painPoints?: number;
  graphCentrality?: number;
  behaviorMomentum?: number;
  relationshipWarmth?: number;
  freshness?: number;
  baseScore?: number;
  socialInfluence?: number;
  opportunityReadiness?: number;
  patternMatch?: number;
}

export interface ScoutScoreResult {
  score: number; // 0-100
  rating: ScoutScoreRating;
  confidence: number;
  breakdown?: ScoutScoreBreakdown;
  insights?: string[];
  recommendations?: {
    nextStep?: string;
    timing?: string;
    approach?: string;
    messageTemplate?: string;
  };
}
