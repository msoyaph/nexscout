// PURPOSE: Unified messaging engine for all AI-generated content
// INPUT: User ID, prospect data, message type, tone, industry
// OUTPUT: JSON with generated message, alternatives, coaching tips
// NOTES: Consolidates v1, v2, and advanced engines into single canonical version

import { supabase } from '../../lib/supabase';
import { analyticsEngineV2 } from '../intelligence/analyticsEngineV2';
import { energyEngine } from '../energy/energyEngine';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface GenerateMessageParams {
  userId: string;
  prospectId: string;
  prospectName: string;
  intent: 'recruit' | 'sell' | 'follow_up' | 'reconnect' | 'introduce' | 'book_call';
  tone: 'professional' | 'friendly' | 'casual' | 'direct' | 'warm';
  productName?: string;
  industry?: 'mlm' | 'insurance' | 'real_estate' | 'product';
}

export interface ObjectionResponseParams {
  userId: string;
  prospectId: string;
  objectionType: 'no_time' | 'no_money' | 'not_now' | 'too_expensive' | 'skeptic' | 'already_tried' | 'thinking_about_it' | 'busy' | 'needs_approval' | 'not_interested';
  industry: 'mlm' | 'insurance' | 'real_estate' | 'product';
  tone: 'friendly' | 'professional' | 'warm' | 'direct';
}

export interface BookingScriptParams {
  userId: string;
  prospectId: string;
  callType: 'zoom' | 'phone' | 'coffee' | 'office';
  industry: 'mlm' | 'insurance' | 'real_estate' | 'product';
  tone: 'friendly' | 'professional' | 'warm';
}

export interface RevivalMessageParams {
  userId: string;
  prospectId: string;
  daysSinceLastContact: number;
  lastInteractionType: 'message' | 'call' | 'meeting';
  industry: 'mlm' | 'insurance' | 'real_estate' | 'product';
}

export interface ReferralMessageParams {
  userId: string;
  prospectId: string;
  referrerName: string;
  industry: 'mlm' | 'insurance' | 'real_estate' | 'product';
  tone: 'friendly' | 'professional';
}

export interface CallScriptParams {
  userId: string;
  prospectId: string;
  callPurpose: 'discovery' | 'presentation' | 'closing' | 'follow_up';
  industry: 'mlm' | 'insurance' | 'real_estate' | 'product';
}

interface ProspectContext {
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

export interface ObjectionResponse {
  success: boolean;
  objectionType: string;
  response: string;
  reinforcementPoints: string[];
  cta?: string;
  coachingTip?: string;
}

export interface BookingScript {
  success: boolean;
  script: string;
  cta: string;
  timeSuggestions: string[];
  coachingTip?: string;
}

export interface RevivalMessage {
  success: boolean;
  message: string;
  subject?: string;
  hooks: string[];
  reconnectionAngle: string;
}

export interface ReferralMessage {
  success: boolean;
  message: string;
  subject?: string;
  socialProof: string[];
}

export interface CallScript {
  success: boolean;
  opening: string;
  discoveryQuestions: string[];
  handleObjections: string[];
  closing: string;
  coachingTips: string[];
}

export interface GenerateSequenceParams {
  userId: string;
  prospectId: string;
  prospectName: string;
  tone: 'professional' | 'friendly' | 'casual' | 'direct';
  sequenceType: 'cold_outreach' | 'follow_up' | 'nurture' | 'reconnect' | 'close';
  totalSteps: number;
}

export interface SequenceStep {
  step: number;
  day: number;
  subject: string;
  message: string;
}

export interface GenerateSequenceResponse {
  success: boolean;
  sequence?: {
    steps: SequenceStep[];
    totalSteps: number;
    sequenceType: string;
  };
  error?: string;
  requiresUpgrade?: boolean;
  insufficientCoins?: boolean;
}

// ========================================
// CANONICAL MESSAGING ENGINE
// ========================================

class MessagingEngineCanonical {
  private readonly MESSAGE_LIMITS = {
    free: 2,
    pro: 999999,
    elite: 999999,
    team: 999999,
  };

  /**
   * Generate standard AI message (consolidated from v1 + v2)
   */
  async generateMessage(params: GenerateMessageParams) {
    try {
      // Check energy before proceeding
      const energyCheck = await energyEngine.canPerformAction(params.userId, 'ai_message');
      if (!energyCheck.canPerform) {
        return {
          success: false,
          error: energyCheck.reason || 'Insufficient energy',
          requiresEnergy: true,
          currentEnergy: energyCheck.currentEnergy,
          requiredEnergy: energyCheck.requiredEnergy,
        };
      }

      // Consume energy
      await energyEngine.tryConsumeEnergyOrThrow(params.userId, 'ai_message');

      // Check subscription tier and limits
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, coin_balance, daily_messages_used, last_reset_date')
        .eq('id', params.userId)
        .maybeSingle();

      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      const tier = profile.subscription_tier || 'free';
      const today = new Date().toISOString().split('T')[0];

      // Check limits for free tier
      if (tier === 'free') {
        const resetNeeded = profile.last_reset_date !== today;
        const currentUsage = resetNeeded ? 0 : (profile.daily_messages_used || 0);

        if (currentUsage >= 2) {
          return {
            success: false,
            error: 'daily_limit_reached',
            message: 'Free tier allows 2 messages per day. Upgrade to Pro for unlimited messages.',
            requiresUpgrade: true,
          };
        }
      }

      // Call edge function for AI generation
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
          prospectId: params.prospectId,
          generationType: 'message',
          tone: params.tone,
          goal: params.intent,
          productName: params.productName,
          industry: params.industry,
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

      // Track analytics
      await analyticsEngineV2.trackAIMessageGenerated(params.prospectId, params.intent);

      // Increment usage counter
      if (tier === 'free') {
        await supabase
          .from('profiles')
          .update({
            daily_messages_used: (profile.daily_messages_used || 0) + 1,
            last_reset_date: today,
          })
          .eq('id', params.userId);
      }

      return {
        success: true,
        message: result.output?.message || result.message,
        generationId: result.generationId,
      };
    } catch (error) {
      console.error('Message generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate multi-step follow-up sequence
   */
  async generateSequence(params: GenerateSequenceParams): Promise<GenerateSequenceResponse> {
    try {
      // Check energy before proceeding
      const energyCheck = await energyEngine.canPerformAction(params.userId, 'ai_follow_up_sequence');
      if (!energyCheck.canPerform) {
        return {
          success: false,
          error: energyCheck.reason || 'Insufficient energy',
          requiresEnergy: true,
        };
      }

      // Consume energy
      await energyEngine.tryConsumeEnergyOrThrow(params.userId, 'ai_follow_up_sequence');

      // Check subscription tier
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, coin_balance')
        .eq('id', params.userId)
        .maybeSingle();

      if (!profile) {
        return { success: false, error: 'Profile not found' };
      }

      const tier = profile.subscription_tier || 'free';

      // Sequences require Pro or Elite tier
      if (tier === 'free') {
        return {
          success: false,
          error: 'Sequences are only available for Pro and Elite subscribers',
          requiresUpgrade: true,
        };
      }

      // Check coin balance (50 coins for sequences)
      const coinCost = 50;
      if ((profile.coin_balance || 0) < coinCost) {
        return {
          success: false,
          error: 'Insufficient coins',
          insufficientCoins: true,
        };
      }

      // Call edge function for AI generation
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
          prospectId: params.prospectId,
          generationType: 'sequence',
          tone: params.tone,
          sequenceType: params.sequenceType,
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

      // Track analytics
      await analyticsEngineV2.trackEvent('sequence_generated', {
        sequence_type: params.sequenceType,
        total_steps: params.totalSteps,
      });

      return {
        success: true,
        sequence: result.output?.sequence || result.sequence,
      };
    } catch (error) {
      console.error('Sequence generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate objection response (from v2)
   */
  async generateObjectionResponse(params: ObjectionResponseParams): Promise<ObjectionResponse> {
    try {
      // Check energy before proceeding
      const energyCheck = await energyEngine.canPerformAction(params.userId, 'ai_objection_handler');
      if (!energyCheck.canPerform) {
        throw new Error(energyCheck.reason || 'Insufficient energy');
      }

      // Consume energy
      await energyEngine.tryConsumeEnergyOrThrow(params.userId, 'ai_objection_handler');

      const context = await this.getProspectContext(params.prospectId, params.userId);
      const tier = await this.getUserTier(params.userId);

      const response = this.buildObjectionResponse(
        params.objectionType,
        context,
        params.industry,
        params.tone,
        tier === 'pro'
      );

      // Store in database
      await supabase.from('objection_responses').insert({
        user_id: params.userId,
        prospect_id: params.prospectId,
        prospect_name: context.name,
        objection_type: params.objectionType,
        response: response.response,
        reinforcement_points: response.reinforcementPoints,
        cta: response.cta,
        coaching_tip: response.coachingTip,
        tone: params.tone,
        industry: params.industry,
      });

      // Track analytics
      await analyticsEngineV2.trackEvent('objection_response_generated', {
        objection_type: params.objectionType,
        industry: params.industry,
      });

      return { success: true, ...response };
    } catch (error) {
      console.error('Objection response error:', error);
      return {
        success: false,
        objectionType: params.objectionType,
        response: '',
        reinforcementPoints: [],
      };
    }
  }

  /**
   * Generate booking script (from v2)
   */
  async generateBookingScript(params: BookingScriptParams): Promise<BookingScript> {
    try {
      const context = await this.getProspectContext(params.prospectId, params.userId);

      const script = `Hi ${context.name}! Hope you're doing well.

I'd love to connect with you about something that could be a great fit for you. Based on what I know about your interests in ${context.interests.slice(0, 2).join(' and ')}, I think you'll find this really valuable.

Would you be open to a quick ${params.callType === 'coffee' ? 'coffee chat' : params.callType === 'phone' ? 'phone call' : params.callType === 'zoom' ? 'Zoom call' : 'meeting'}? I promise to keep it brief and super relevant to you.

How does your schedule look this week?`;

      const timeSuggestions = [
        'Tuesday or Wednesday afternoon',
        'Thursday morning around 10am',
        'Friday early afternoon',
      ];

      await analyticsEngineV2.trackEvent('booking_script_generated', {
        call_type: params.callType,
        industry: params.industry,
      });

      return {
        success: true,
        script,
        cta: 'Let me know what works best for you!',
        timeSuggestions,
        coachingTip: 'Be flexible with timing. Show respect for their schedule. Keep it casual and low-pressure.',
      };
    } catch (error) {
      console.error('Booking script error:', error);
      return {
        success: false,
        script: '',
        cta: '',
        timeSuggestions: [],
      };
    }
  }

  /**
   * Generate revival message (from advancedMessagingEngines)
   */
  async generateRevivalMessage(params: RevivalMessageParams): Promise<RevivalMessage> {
    try {
      const context = await this.getProspectContext(params.prospectId, params.userId);

      const hooks = [
        'Thought of you recently',
        'Came across something perfect for you',
        'Quick update I wanted to share',
      ];

      const message = `Hey ${context.name}! It's been ${params.daysSinceLastContact} days-hope you're doing amazing.

I came across something recently that immediately reminded me of you, especially knowing your interest in ${context.interests[0] || 'building extra income'}.

No pressure at all, but I thought you'd want to know about this opportunity. It's been a game-changer for others in similar situations.

Mind if I share a quick update?`;

      await analyticsEngineV2.trackEvent('revival_message_generated', {
        days_since_contact: params.daysSinceLastContact,
        industry: params.industry,
      });

      return {
        success: true,
        message,
        subject: `Quick thought about you, ${context.name}`,
        hooks,
        reconnectionAngle: 'Genuine interest + new opportunity',
      };
    } catch (error) {
      console.error('Revival message error:', error);
      return {
        success: false,
        message: '',
        hooks: [],
        reconnectionAngle: '',
      };
    }
  }

  /**
   * Generate referral message (from advancedMessagingEngines)
   */
  async generateReferralMessage(params: ReferralMessageParams): Promise<ReferralMessage> {
    try {
      const context = await this.getProspectContext(params.prospectId, params.userId);

      const message = `Hi ${context.name}! I hope this message finds you well.

${params.referrerName} mentioned your name to me and thought we should connect. They said you'd be interested in what I've been working on, especially given your background in ${context.interests[0] || 'entrepreneurship'}.

I don't want to assume anything, but if you're open to exploring new opportunities for flexible income, I'd love to share what's been working for me and others in our network.

Quick 10-minute chat? No pressure-just sharing info.`;

      const socialProof = [
        `${params.referrerName} recommended we connect`,
        'Part of a trusted network',
        'Others in similar fields have benefited',
      ];

      await analyticsEngineV2.trackEvent('referral_message_generated', {
        referrer: params.referrerName,
        industry: params.industry,
      });

      return {
        success: true,
        message,
        subject: `${params.referrerName} thought we should connect`,
        socialProof,
      };
    } catch (error) {
      console.error('Referral message error:', error);
      return {
        success: false,
        message: '',
        socialProof: [],
      };
    }
  }

  /**
   * Generate call script (from advancedMessagingEngines)
   */
  async generateCallScript(params: CallScriptParams): Promise<CallScript> {
    try {
      const context = await this.getProspectContext(params.prospectId, params.userId);

      const opening = `Hi ${context.name}! Thanks so much for taking the time to chat with me today. How's your day going?

[Wait for response]

Great! So I wanted to connect because I think what I'm working on could be a perfect fit for you based on ${context.interests.slice(0, 2).join(' and ')}.`;

      const discoveryQuestions = [
        `What does your current work situation look like? Are you happy with it?`,
        `Have you ever explored opportunities for extra income streams?`,
        `What would "success" look like for you in the next 6-12 months?`,
        `If you could add an extra ₱20,000-₱50,000 per month, what would that change for you?`,
      ];

      const handleObjections = [
        `"I don't have time" → "I totally get it. Most people start with just 30 minutes a day. What if I showed you how?"`,
        `"Is this MLM?" → "It's network marketing, but not what you're thinking. Modern approach, real products, real results."`,
        `"I need to think about it" → "Absolutely! What specific concerns can I help clarify right now?"`,
      ];

      const closing = `So ${context.name}, based on everything we talked about, I think this could be a great fit for you. The next step is super simple-just a quick overview session where you can see exactly how it works.

Would Tuesday or Thursday work better for you to dive deeper?`;

      const coachingTips = [
        'Listen 70%, talk 30%',
        'Ask permission before presenting',
        'Address concerns with empathy',
        'Always give two options (Tuesday or Thursday)',
        'End with clear next step',
      ];

      await analyticsEngineV2.trackEvent('call_script_generated', {
        call_purpose: params.callPurpose,
        industry: params.industry,
      });

      return {
        success: true,
        opening,
        discoveryQuestions,
        handleObjections,
        closing,
        coachingTips,
      };
    } catch (error) {
      console.error('Call script error:', error);
      return {
        success: false,
        opening: '',
        discoveryQuestions: [],
        handleObjections: [],
        closing: '',
        coachingTips: [],
      };
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

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

  private buildObjectionResponse(
    objectionType: string,
    context: ProspectContext,
    industry: string,
    tone: string,
    includeCoaching: boolean
  ): ObjectionResponse {
    const objectionHandlers: Record<string, () => ObjectionResponse> = {
      no_time: () => this.handleNoTime(context, industry, tone, includeCoaching),
      no_money: () => this.handleNoMoney(context, industry, tone, includeCoaching),
      not_now: () => this.handleNotNow(context, industry, tone, includeCoaching),
      too_expensive: () => this.handleTooExpensive(context, industry, tone, includeCoaching),
      skeptic: () => this.handleSkeptic(context, industry, tone, includeCoaching),
      already_tried: () => this.handleAlreadyTried(context, industry, tone, includeCoaching),
      thinking_about_it: () => this.handleThinkingAboutIt(context, industry, tone, includeCoaching),
      busy: () => this.handleBusy(context, industry, tone, includeCoaching),
      needs_approval: () => this.handleNeedsApproval(context, industry, tone, includeCoaching),
      not_interested: () => this.handleNotInterested(context, industry, tone, includeCoaching),
    };

    return objectionHandlers[objectionType]();
  }

  private handleNoTime(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I totally understand, ${context.name}. Time is precious talaga.

Yan din naging concern ko dati, pero what I realized is that this is actually designed para sa busy people. You can start super small-15-30 minutes lang per day.

Think of it this way: investing a little time now could free up more time for you later. Yung flexibility is built-in. No need to quit anything or overcommit.

Would it help if I show you how others manage it with their current schedule?`;

    return {
      objectionType: 'no_time',
      response,
      reinforcementPoints: [
        'Designed for busy schedules',
        'Start with just 15-30 minutes daily',
        'Flexibility built into the system',
        'Time invested now = more freedom later',
      ],
      cta: 'Can I share how others balance this?',
      coachingTip: coaching
        ? 'Empathy first. Reframe time as investment. Offer proof through others. Keep CTA soft.'
        : undefined,
    };
  }

  private handleNoMoney(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I hear you, ${context.name}. Budget is a real consideration.

Pero that is exactly why I thought of you for this. Hindi ito expense-think of it as investment sa future mo.

You can start small and grow as you earn. Maraming nag-start with limited budget and are now thriving.

Let me show you how people in similar situations made it work. No pressure-just info.`;

    return {
      objectionType: 'no_money',
      response,
      reinforcementPoints: [
        'Investment, not expense',
        'Flexible starting options',
        'Start small, grow as you earn',
        'Proven track record with tight budgets',
      ],
      cta: 'Want to see the flexible options?',
      coachingTip: coaching ? 'Reframe as investment. Show flexibility. Provide social proof.' : undefined,
    };
  }

  private handleNotNow(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `Totally fair, ${context.name}. Timing is important.

Quick question though-what would make "now" the right time? Is it something specific you're waiting for, or just a busy season?

I ask because sometimes the "perfect time" doesn't come on its own. And opportunities like this don't wait forever.

What if we just explore it now, and you can decide on timing later?`;

    return {
      objectionType: 'not_now',
      response,
      reinforcementPoints: [
        'Respect their timing concerns',
        'Uncover the real reason',
        'Perfect time rarely comes',
        'Low-commitment exploration',
      ],
      cta: 'Can we at least explore it together?',
      coachingTip: coaching ? 'Dig deeper. Uncover real objection. Create urgency gently.' : undefined,
    };
  }

  private handleTooExpensive(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I understand the concern, ${context.name}. Price is always part of the decision.

But let me ask-compared to what? If this could help you add ₱20,000-₱50,000 per month, would the initial investment still feel expensive?

Most people who said "too expensive" at first are now earning way more than they invested. The question isn't really the price-it's the return.

Want to see the math on how fast people typically break even?`;

    return {
      objectionType: 'too_expensive',
      response,
      reinforcementPoints: [
        'Reframe price vs. value',
        'Focus on ROI and break-even',
        'Social proof of successful investors',
        'Long-term wealth vs. short-term cost',
      ],
      cta: 'Let me show you the numbers',
      coachingTip: coaching ? 'Shift from cost to value. Show ROI. Use social proof.' : undefined,
    };
  }

  private handleSkeptic(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I totally respect that, ${context.name}. Being skeptical is smart-you should be careful.

Honestly, I was skeptical too at first. That's why I did my research, talked to real people, and tried it myself before committing.

I'm not here to convince you of something fake. I'm here because I've seen it work for me and others. Real results, real people.

What specific concerns do you have? Let's address them head-on.`;

    return {
      objectionType: 'skeptic',
      response,
      reinforcementPoints: [
        'Validate their skepticism',
        'Share your own journey',
        'Offer transparency',
        'Address specific concerns',
      ],
      cta: 'What\'s your biggest concern?',
      coachingTip: coaching ? 'Validate. Share your story. Be transparent. Invite questions.' : undefined,
    };
  }

  private handleAlreadyTried(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `Ah, I hear you, ${context.name}. Bad experiences can definitely leave a mark.

Can I ask-what specifically didn't work out before? Was it the company, the timing, the support, or something else?

I bring this up because what I'm working with now addresses a lot of those common pain points. Better training, better support, better products.

But I don't want to assume. Let me just show you how this is different, and you decide.`;

    return {
      objectionType: 'already_tried',
      response,
      reinforcementPoints: [
        'Acknowledge past experience',
        'Identify specific pain points',
        'Highlight what\'s different now',
        'Let them compare and decide',
      ],
      cta: 'Can I show you what\'s different?',
      coachingTip: coaching ? 'Dig into their past. Show how this is different. Build trust.' : undefined,
    };
  }

  private handleThinkingAboutIt(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `Absolutely, ${context.name}. This is an important decision-you should think about it.

Just so you have all the info you need, what specific things are you weighing? Is it the time commitment, the investment, the model itself?

I\'m happy to clarify anything so you can make the best decision. And no pressure-but I do want to mention that the spots for this are limited, so if you\'re interested, sooner is better than later.

What questions can I answer for you right now?`;

    return {
      objectionType: 'thinking_about_it',
      response,
      reinforcementPoints: [
        'Validate need to think',
        'Uncover specific concerns',
        'Provide clarity and info',
        'Create gentle urgency',
      ],
      cta: 'What questions do you have?',
      coachingTip: coaching ? 'Dig deeper. Address concerns. Create urgency without pressure.' : undefined,
    };
  }

  private handleBusy(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    return this.handleNoTime(context, industry, tone, coaching);
  }

  private handleNeedsApproval(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I totally understand, ${context.name}. It\'s great that you value your partner\'s/family\'s input.

How about this-why don't you bring them into the conversation? I'd be happy to chat with both of you so they can hear directly from me and ask their own questions.

Or if you prefer, I can give you all the materials and info you need to present it to them yourself. Either way works for me.

What do you think would work best?`;

    return {
      objectionType: 'needs_approval',
      response,
      reinforcementPoints: [
        'Respect their decision-making process',
        'Offer to include partner/family',
        'Provide materials for presentation',
        'Make it easy for them',
      ],
      cta: 'Should we schedule a call with them too?',
      coachingTip: coaching ? 'Include the decision-maker. Make it easy. Show respect.' : undefined,
    };
  }

  private handleNotInterested(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `No worries at all, ${context.name}. I respect that.

Just curious though-is it that you're not interested in this specifically, or is it just not the right time for anything new right now?

I ask because sometimes it's just about timing or fit, and I want to make sure I'm not bothering you with something that doesn't make sense.

Either way, I appreciate you being upfront. Thanks for your time!`;

    return {
      objectionType: 'not_interested',
      response,
      reinforcementPoints: [
        'Respect their decision',
        'Clarify the reason',
        'Leave door open',
        'Be gracious',
      ],
      cta: 'Thanks for your honesty!',
      coachingTip: coaching ? 'Respect. Dig gently. Leave door open. Stay gracious.' : undefined,
    };
  }

  /**
   * Generate pitch deck (delegates to pitch deck generator)
   */
  async generateDeck(params: {
    userId: string;
    prospectId: string;
    productName: string;
    companyName?: string;
    version: 'basic' | 'elite';
  }) {
    try {
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
          prospectId: params.prospectId,
          generationType: 'deck',
          deckType: params.version,
          productName: params.productName,
          companyName: params.companyName,
          goal: 'recruit',
          tone: 'professional',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error || 'Generation failed',
        };
      }

      const result = await response.json();

      // Track analytics
      await analyticsEngineV2.trackEvent('pitch_deck_generated', {
        deck_type: params.version,
      });

      return {
        success: true,
        deck: {
          slides: result.output?.deck || [],
        },
      };
    } catch (error) {
      console.error('Pitch deck generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const messagingEngine = new MessagingEngineCanonical();
