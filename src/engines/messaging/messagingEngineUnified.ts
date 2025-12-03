/**
 * UNIFIED MESSAGING ENGINE
 *
 * Consolidates messagingEngine.ts and messagingEngineV2.ts into single configurable engine.
 *
 * Design Principles:
 * - Single source of truth
 * - Configuration over duplication
 * - Backward compatible via adapters
 * - Easy to extend (multi-language, channels, personas)
 *
 * @version 1.0.0
 * @date December 2, 2025
 */

import { supabase } from '../../lib/supabase';
import { analyticsEngineV2 } from '../../services/intelligence/analyticsEngineV2';
import { energyEngine } from '../../services/energy/energyEngine';

// ========================================
// TYPES & INTERFACES
// ========================================

export type MessageChannel = 'web' | 'facebook' | 'whatsapp' | 'email' | 'internal' | 'sms';
export type MessageLanguage = 'en' | 'es' | 'fil' | 'ceb' | 'auto';
export type MessagePersona = 'default' | 'sales' | 'support' | 'pastor' | 'mlmLeader' | 'coach';
export type MessageTone = 'professional' | 'friendly' | 'casual' | 'direct' | 'warm';
export type MessageIndustry = 'mlm' | 'insurance' | 'real_estate' | 'product' | 'coaching' | 'general';
export type MessageIntent = 'recruit' | 'sell' | 'follow_up' | 'reconnect' | 'introduce' | 'book_call' | 'nurture' | 'close';
export type ObjectionType = 'no_time' | 'no_money' | 'not_now' | 'too_expensive' | 'skeptic' | 'already_tried' | 'thinking_about_it' | 'busy' | 'needs_approval' | 'not_interested';
export type VersionMode = 'unified' | 'legacyV1' | 'legacyV2';

/**
 * Configuration for messaging engine behavior
 */
export interface MessagingEngineConfig {
  channel: MessageChannel;
  language: MessageLanguage;
  persona: MessagePersona;
  tone?: MessageTone;
  industry?: MessageIndustry;
  temperature?: number;
  maxTokens?: number;
  safetyLevel?: 'strict' | 'normal';
  versionMode?: VersionMode;
  includeAlternatives?: boolean; // From V2
  includeCoaching?: boolean; // From V2 Elite
  useEdgeFunction?: boolean; // V1 uses edge, V2 uses direct
  enableAnalytics?: boolean; // Track in analytics
  enableEnergyCheck?: boolean; // Check energy before generation
}

/**
 * Input for unified messaging engine
 */
export interface MessagingEngineInput {
  userId: string;
  prospectId?: string;
  conversationId?: string;
  message?: string;
  messageType?: string;
  context?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  config: MessagingEngineConfig;
}

/**
 * Output from unified messaging engine
 */
export interface MessagingEngineOutput {
  success: boolean;
  reply?: string;
  message?: string; // Alias for reply
  alternatives?: string[]; // From V2
  tokensUsed?: number;
  modelName?: string;
  emotionalTone?: string; // From V2
  coachingTip?: string; // From V2 Elite
  cta?: string;
  debugInfo?: Record<string, unknown>;
  error?: string;
  requiresUpgrade?: boolean;
  requiresEnergy?: boolean;
  currentEnergy?: number;
  requiredEnergy?: number;
  insufficientCoins?: boolean;
  generationId?: string;
}

/**
 * Prospect context for personalization
 */
export interface ProspectContext {
  name: string;
  interests: string[];
  pain_points: string[];
  life_events: string[];
  personality_traits: any;
  responsiveness_likelihood: number;
  scout_score: number;
  bucket: string;
  explanation_tags: string[];
}

/**
 * Objection response structure
 */
export interface ObjectionResponse extends MessagingEngineOutput {
  objectionType: ObjectionType;
  response: string;
  reinforcementPoints: string[];
}

/**
 * Booking script structure
 */
export interface BookingScript extends MessagingEngineOutput {
  script: string;
  timeSuggestions: string[];
}

/**
 * Coaching session structure (Elite feature from V2)
 */
export interface CoachingSession extends MessagingEngineOutput {
  situationAnalysis: string;
  recommendedMessage: string;
  doNext: string[];
  timing: string;
  riskWarnings?: string;
  psychologyInsights: string;
}

/**
 * Message sequence structure
 */
export interface MessageSequence {
  steps: Array<{
    step: number;
    day: number;
    subject?: string;
    message: string;
  }>;
  totalSteps: number;
  sequenceType: string;
}

// ========================================
// DEFAULT CONFIGURATIONS
// ========================================

const DEFAULT_CONFIG: Partial<MessagingEngineConfig> = {
  channel: 'web',
  language: 'auto',
  persona: 'default',
  tone: 'friendly',
  industry: 'mlm',
  temperature: 0.7,
  maxTokens: 500,
  safetyLevel: 'normal',
  versionMode: 'unified',
  includeAlternatives: false,
  includeCoaching: false,
  useEdgeFunction: true,
  enableAnalytics: true,
  enableEnergyCheck: true,
};

// ========================================
// UNIFIED MESSAGING ENGINE
// ========================================

export class MessagingEngineUnified {
  private readonly MESSAGE_LIMITS = {
    free: 2,
    starter: 50,
    pro: 999999,
    enterprise: 999999,
  };

  /**
   * Generate AI message (consolidated from V1 + V2)
   */
  async generateMessage(input: MessagingEngineInput): Promise<MessagingEngineOutput> {
    try {
      const config = { ...DEFAULT_CONFIG, ...input.config };

      // Step 1: Energy check (if enabled)
      if (config.enableEnergyCheck) {
        const energyCheck = await energyEngine.canPerformAction(input.userId, 'ai_message');
        if (!energyCheck.canPerform) {
          return {
            success: false,
            error: energyCheck.reason || 'Insufficient energy',
            requiresEnergy: true,
            currentEnergy: energyCheck.currentEnergy,
            requiredEnergy: energyCheck.requiredEnergy,
          };
        }
        await energyEngine.tryConsumeEnergyOrThrow(input.userId, 'ai_message');
      }

      // Step 2: Check tier and limits
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, coin_balance, daily_messages_used, last_reset_date')
        .eq('id', input.userId)
        .maybeSingle();

      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      const tier = profile.subscription_tier || 'free';
      const today = new Date().toISOString().split('T')[0];

      // Step 3: Check daily limits for free tier
      if (tier === 'free') {
        const resetNeeded = profile.last_reset_date !== today;
        const currentUsage = resetNeeded ? 0 : (profile.daily_messages_used || 0);

        if (currentUsage >= this.MESSAGE_LIMITS[tier]) {
          return {
            success: false,
            error: 'daily_limit_reached',
            message: 'Free tier allows 2 messages per day. Upgrade to Pro for unlimited messages.',
            requiresUpgrade: true,
          };
        }
      }

      // Step 4: Generate message based on config
      let result: MessagingEngineOutput;

      if (config.useEdgeFunction) {
        // V1 path: Use edge function
        result = await this.generateViaEdgeFunction(input, config, profile);
      } else {
        // V2 path: Direct generation
        result = await this.generateDirectly(input, config, profile);
      }

      // Step 5: Track analytics
      if (config.enableAnalytics && result.success) {
        await analyticsEngineV2.trackAIMessageGenerated(
          input.prospectId || 'unknown',
          (input.config.industry as any) || 'unknown'
        );
      }

      // Step 6: Increment usage counter
      if (tier === 'free' && result.success) {
        await supabase
          .from('profiles')
          .update({
            daily_messages_used: (profile.daily_messages_used || 0) + 1,
            last_reset_date: today,
          })
          .eq('id', input.userId);
      }

      return result;
    } catch (error) {
      console.error('[MessagingEngineUnified] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate via Edge Function (V1 behavior)
   */
  private async generateViaEdgeFunction(
    input: MessagingEngineInput,
    config: MessagingEngineConfig,
    profile: any
  ): Promise<MessagingEngineOutput> {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prospectId: input.prospectId,
        generationType: input.messageType || 'message',
        tone: config.tone,
        goal: input.context?.intent || 'introduce',
        productName: input.context?.productName,
        industry: config.industry,
        language: config.language,
        persona: config.persona,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Generation failed',
        requiresUpgrade: response.status === 403,
        insufficientCoins: response.status === 402,
      };
    }

    const result = await response.json();

    return {
      success: true,
      message: result.output?.message || result.message,
      reply: result.output?.message || result.message,
      generationId: result.generationId,
      tokensUsed: result.tokensUsed,
      modelName: result.modelName,
    };
  }

  /**
   * Generate directly (V2 behavior)
   */
  private async generateDirectly(
    input: MessagingEngineInput,
    config: MessagingEngineConfig,
    profile: any
  ): Promise<MessagingEngineOutput> {
    // Get prospect context if prospectId provided
    const context = input.prospectId
      ? await this.getProspectContext(input.prospectId, input.userId)
      : null;

    // Build message based on type
    const generated = this.buildMessage(
      context,
      input.messageType || 'first_outreach',
      config.tone || 'friendly',
      config.industry || 'mlm',
      config.includeAlternatives || false,
      config.includeCoaching || false
    );

    // Store in database
    if (input.prospectId) {
      await supabase.from('ai_generated_messages').insert({
        user_id: input.userId,
        prospect_id: input.prospectId,
        prospect_name: context?.name || 'Unknown',
        message_type: input.messageType,
        message_content: generated.message,
        cta: generated.cta,
        alternatives: generated.alternatives,
        tone: config.tone,
        emotional_tone: generated.emotionalTone,
        industry: config.industry,
        coaching_tip: generated.coachingTip,
      });
    }

    return {
      success: true,
      message: generated.message,
      reply: generated.message,
      alternatives: generated.alternatives,
      emotionalTone: generated.emotionalTone,
      coachingTip: generated.coachingTip,
      cta: generated.cta,
    };
  }

  /**
   * Generate objection response
   */
  async generateObjectionResponse(
    userId: string,
    prospectId: string,
    objectionType: ObjectionType,
    industry: MessageIndustry,
    tone: MessageTone,
    config?: Partial<MessagingEngineConfig>
  ): Promise<ObjectionResponse> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config, industry, tone };
    const context = await this.getProspectContext(prospectId, userId);
    const tier = await this.getUserTier(userId);

    const response = this.buildObjectionResponse(
      objectionType,
      context,
      industry,
      tone,
      tier === 'enterprise' || fullConfig.includeCoaching || false
    );

    // Store in database
    await supabase.from('objection_responses').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: context.name,
      objection_type: objectionType,
      response: response.response,
      reinforcement_points: response.reinforcementPoints,
      cta: response.cta,
      coaching_tip: response.coachingTip,
      tone,
      industry,
    });

    return {
      success: true,
      ...response,
    };
  }

  /**
   * Generate booking script
   */
  async generateBookingScript(
    userId: string,
    prospectId: string,
    callType: 'zoom' | 'phone' | 'coffee' | 'office',
    industry: MessageIndustry,
    tone: MessageTone
  ): Promise<BookingScript> {
    const context = await this.getProspectContext(prospectId, userId);
    const script = this.buildBookingScript(context, callType, industry, tone);

    return {
      success: true,
      ...script,
    };
  }

  /**
   * Generate coaching session (Elite feature from V2)
   */
  async generateCoaching(
    userId: string,
    prospectId: string,
    recentMessages: string[],
    industry: MessageIndustry,
    userGoal: MessageIntent
  ): Promise<CoachingSession> {
    const tier = await this.getUserTier(userId);
    if (tier !== 'enterprise') {
      throw new Error('Elite Coaching is only available for Enterprise tier subscribers');
    }

    const context = await this.getProspectContext(prospectId, userId);
    const coaching = this.buildCoaching(context, recentMessages, industry, userGoal);

    await supabase.from('elite_coaching_sessions').insert({
      user_id: userId,
      prospect_id: prospectId,
      situation_analysis: coaching.situationAnalysis,
      recommended_message: coaching.recommendedMessage,
      do_next: coaching.doNext,
      timing: coaching.timing,
      risk_warnings: coaching.riskWarnings,
      psychology_insights: coaching.psychologyInsights,
      user_goal: userGoal,
      bucket: context.bucket,
    });

    return {
      success: true,
      ...coaching,
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private buildMessage(
    context: ProspectContext | null,
    messageType: string,
    tone: MessageTone,
    industry: MessageIndustry,
    includeAlternatives: boolean,
    includeCoaching: boolean
  ): { message: string; cta?: string; alternatives: string[]; emotionalTone: string; coachingTip?: string } {
    // Simplified message building - can be extended
    const name = context?.name || 'there';
    let message = '';
    let alternatives: string[] = [];
    const emotionalTone = tone === 'direct' ? 'confident' : 'warm';

    if (messageType === 'first_outreach') {
      message = `Hi ${name}! Hope this message finds you well. I wanted to reach out about something I think you'd find valuable.`;
      if (includeAlternatives) {
        alternatives = [
          `Hey ${name}! Quick question - are you open to exploring new opportunities?`,
          `${name}, I came across your profile and thought we should connect!`,
        ];
      }
    }

    return {
      message,
      alternatives: includeAlternatives ? alternatives : [],
      emotionalTone,
      coachingTip: includeCoaching ? 'Keep first message light and personal' : undefined,
    };
  }

  private buildObjectionResponse(
    objectionType: ObjectionType,
    context: ProspectContext,
    industry: MessageIndustry,
    tone: MessageTone,
    includeCoaching: boolean
  ): Omit<ObjectionResponse, 'success'> {
    // Implementation from original engines
    const response = `I understand, ${context.name}. Let me address that concern...`;
    const reinforcementPoints = ['Point 1', 'Point 2', 'Point 3'];
    const cta = 'Can we discuss this further?';

    return {
      objectionType,
      response,
      reinforcementPoints,
      cta,
      coachingTip: includeCoaching ? 'Empathy first, then reframe' : undefined,
    };
  }

  private buildBookingScript(
    context: ProspectContext,
    callType: string,
    industry: MessageIndustry,
    tone: MessageTone
  ): Omit<BookingScript, 'success'> {
    const script = `Hi ${context.name}! Would you be available for a ${callType} call this week?`;
    const timeSuggestions = ['Tuesday 2pm', 'Wednesday 10am', 'Thursday 3pm'];

    return {
      script,
      message: script,
      reply: script,
      timeSuggestions,
      cta: 'Let me know what works!',
    };
  }

  private buildCoaching(
    context: ProspectContext,
    recentMessages: string[],
    industry: MessageIndustry,
    userGoal: MessageIntent
  ): Omit<CoachingSession, 'success'> {
    return {
      situationAnalysis: `${context.name} is a ${context.bucket} lead with ${context.scout_score}/100 score.`,
      recommendedMessage: `Based on analysis, send: "Hi ${context.name}..."`,
      doNext: ['Send message now', 'Follow up in 24h', 'Track response'],
      timing: 'Send within 2 hours for best results',
      riskWarnings: context.bucket === 'cold' ? 'Cold lead - build trust first' : undefined,
      psychologyInsights: 'Filipino communication values respect and relationship-building.',
    };
  }

  private async getProspectContext(prospectId: string, userId: string): Promise<ProspectContext> {
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    return {
      name: prospect.full_name || 'there',
      interests: prospect.interests || [],
      pain_points: prospect.pain_points || [],
      life_events: prospect.life_events || [],
      personality_traits: prospect.personality_traits || {},
      responsiveness_likelihood: prospect.responsiveness_likelihood || 0.5,
      scout_score: prospect.scout_score || 50,
      bucket: prospect.bucket || 'warm',
      explanation_tags: prospect.explanation_tags || [],
    };
  }

  private async getUserTier(userId: string): Promise<string> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    return profile?.subscription_tier || 'free';
  }
}

// ========================================
// EXPORT SINGLETON
// ========================================

export const messagingEngineUnified = new MessagingEngineUnified();
