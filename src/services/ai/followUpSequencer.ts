import { supabase } from '../../lib/supabase';
import { coinTransactionService } from '../coinTransactionService';

export interface SequenceStep {
  stepNumber: number;
  dayOffset: number;
  subject: string;
  message: string;
  cta?: string;
  coachingTip?: string;
  scheduledReminder?: {
    enabled: boolean;
    sendAt: string;
  };
}

export interface FollowUpSequence {
  sequenceType: string;
  steps: SequenceStep[];
  recommendedTotalDurationDays: number;
  locked?: boolean;
  upgradePrompt?: string;
}

export interface GenerateSequenceInput {
  prospectId: string;
  userId: string;
  sequenceType: 'recruit' | 'sell' | 'follow_up' | 'reconnect' | 'book_call' | 'nurture';
  goal: 'recruit' | 'sell' | 'book_call' | 'nurture' | 'reconnect';
  tone: 'friendly' | 'professional' | 'warm' | 'direct';
  userIndustry?: 'mlm' | 'insurance' | 'real_estate' | 'product';
}

interface ProspectContext {
  full_name: string;
  topics: string[];
  interests: string[];
  pain_points: string[];
  life_events: string[];
  personality_traits: any;
  dominant_topics: string[];
  relationship_level: string;
  responsiveness_likelihood: number;
  mlm_leadership_potential: number;
  scout_score: number;
  bucket: string;
  explanation_tags: string[];
}

class FollowUpSequencerService {
  private readonly COSTS = {
    free: null,
    pro: 100,
    elite: 50,
  };

  private readonly MAX_STEPS = {
    free: 0,
    pro: 3,
    elite: 7,
  };

  async generateSequence(input: GenerateSequenceInput): Promise<{ sequenceId: string; sequence: FollowUpSequence; pendingTransactionId?: string }> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, coin_balance, weekly_sequences_used')
      .eq('id', input.userId)
      .maybeSingle();

    if (!profile) throw new Error('Profile not found');

    const tier = profile.subscription_tier || 'free';

    if (tier === 'free') {
      return {
        sequenceId: '',
        sequence: {
          sequenceType: input.sequenceType,
          steps: [],
          recommendedTotalDurationDays: 0,
          locked: true,
          upgradePrompt: 'Upgrade to Pro or Elite to unlock AI Follow-Up Sequencer and automate your follow-ups.',
        },
      };
    }

    await this.checkUsageLimits(input.userId, tier, profile.weekly_sequences_used || 0);

    const prospectContext = await this.getProspectContext(input.prospectId, input.userId);

    const maxSteps = this.MAX_STEPS[tier as keyof typeof this.MAX_STEPS];
    const includeCoaching = tier === 'elite';
    const includeScheduling = tier === 'elite';

    const sequence = this.buildSequence(
      prospectContext,
      input.sequenceType,
      input.goal,
      input.tone,
      input.userIndustry || 'mlm',
      maxSteps,
      includeCoaching,
      includeScheduling
    );

    const cost = this.COSTS[tier as keyof typeof this.COSTS];
    let pendingTransactionId: string | undefined;

    if (cost) {
      pendingTransactionId = await coinTransactionService.createPendingTransaction(
        input.userId,
        cost,
        'spend',
        `${input.sequenceType} sequence generation`,
        input.prospectId
      );
    }

    const sequenceData = {
      user_id: input.userId,
      prospect_id: input.prospectId,
      prospect_name: prospectContext.full_name,
      sequence_type: input.sequenceType,
      goal: input.goal,
      tone: input.tone,
      user_industry: input.userIndustry || 'mlm',
      steps: sequence.steps,
      step_count: sequence.steps.length,
      total_duration_days: sequence.recommendedTotalDurationDays,
      status: 'draft',
      prospect_context_snapshot: prospectContext,
      scoutscore_context: {
        score: prospectContext.scout_score,
        bucket: prospectContext.bucket,
        tags: prospectContext.explanation_tags,
      },
    };

    const { data: savedSequence, error } = await supabase
      .from('follow_up_sequences')
      .insert(sequenceData)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (tier === 'pro') {
      await supabase
        .from('profiles')
        .update({ weekly_sequences_used: (profile.weekly_sequences_used || 0) + 1 })
        .eq('id', input.userId);
    }

    return {
      sequenceId: savedSequence!.id,
      sequence,
      pendingTransactionId,
    };
  }

  async completeSequenceTransaction(pendingTransactionId: string): Promise<void> {
    await coinTransactionService.completePendingTransaction(pendingTransactionId);
  }

  async failSequenceTransaction(pendingTransactionId: string, reason: string): Promise<void> {
    await coinTransactionService.failPendingTransaction(pendingTransactionId, reason);
  }

  private buildSequence(
    context: ProspectContext,
    sequenceType: string,
    goal: string,
    tone: string,
    industry: string,
    maxSteps: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): FollowUpSequence {
    const steps: SequenceStep[] = [];
    const bucket = context.bucket;
    const responsiveness = context.responsiveness_likelihood || 50;

    const daySpacing = bucket === 'hot' ? 1 : bucket === 'warm' ? 2 : 3;

    if (sequenceType === 'recruit') {
      steps.push(
        this.createRecruitStep1(context, tone, 0, includeCoaching, includeScheduling),
        this.createRecruitStep2(context, tone, daySpacing, includeCoaching, includeScheduling),
        this.createRecruitStep3(context, tone, daySpacing * 2, includeCoaching, includeScheduling)
      );

      if (maxSteps >= 5) {
        steps.push(
          this.createRecruitStep4(context, tone, daySpacing * 3, includeCoaching, includeScheduling),
          this.createRecruitStep5(context, tone, daySpacing * 4, includeCoaching, includeScheduling)
        );
      }

      if (maxSteps >= 7) {
        steps.push(
          this.createRecruitStep6(context, tone, daySpacing * 5, includeCoaching, includeScheduling),
          this.createRecruitStep7(context, tone, daySpacing * 6, includeCoaching, includeScheduling)
        );
      }
    } else if (sequenceType === 'sell') {
      steps.push(
        this.createSellStep1(context, tone, industry, 0, includeCoaching, includeScheduling),
        this.createSellStep2(context, tone, industry, daySpacing, includeCoaching, includeScheduling),
        this.createSellStep3(context, tone, industry, daySpacing * 2, includeCoaching, includeScheduling)
      );

      if (maxSteps >= 5) {
        steps.push(
          this.createSellStep4(context, tone, industry, daySpacing * 3, includeCoaching, includeScheduling),
          this.createSellStep5(context, tone, industry, daySpacing * 4, includeCoaching, includeScheduling)
        );
      }
    } else if (sequenceType === 'book_call') {
      steps.push(
        this.createBookCallStep1(context, tone, 0, includeCoaching, includeScheduling),
        this.createBookCallStep2(context, tone, daySpacing, includeCoaching, includeScheduling),
        this.createBookCallStep3(context, tone, daySpacing * 2, includeCoaching, includeScheduling)
      );
    } else if (sequenceType === 'reconnect') {
      steps.push(
        this.createReconnectStep1(context, tone, 0, includeCoaching, includeScheduling),
        this.createReconnectStep2(context, tone, daySpacing + 1, includeCoaching, includeScheduling),
        this.createReconnectStep3(context, tone, daySpacing * 2 + 1, includeCoaching, includeScheduling)
      );
    } else if (sequenceType === 'nurture') {
      steps.push(
        this.createNurtureStep1(context, tone, 0, includeCoaching, includeScheduling),
        this.createNurtureStep2(context, tone, 3, includeCoaching, includeScheduling),
        this.createNurtureStep3(context, tone, 6, includeCoaching, includeScheduling)
      );

      if (maxSteps >= 5) {
        steps.push(
          this.createNurtureStep4(context, tone, 10, includeCoaching, includeScheduling),
          this.createNurtureStep5(context, tone, 14, includeCoaching, includeScheduling)
        );
      }
    } else {
      steps.push(
        this.createGenericStep1(context, tone, 0, includeCoaching, includeScheduling),
        this.createGenericStep2(context, tone, daySpacing, includeCoaching, includeScheduling),
        this.createGenericStep3(context, tone, daySpacing * 2, includeCoaching, includeScheduling)
      );
    }

    const totalDays = steps[steps.length - 1].dayOffset + 1;

    return {
      sequenceType,
      steps: steps.slice(0, maxSteps),
      recommendedTotalDurationDays: totalDays,
    };
  }

  private createRecruitStep1(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const greeting = tone === 'professional' ? 'Good day' : tone === 'direct' ? 'Hi' : 'Hey';
    const personalRef = this.getPersonalReference(context);

    const message = `${greeting} ${context.full_name}! ${personalRef}

Naisip kita kasi I think you would be interested in something I have been working on. It is flexible, proven, and helping a lot of people like us build extra income.

No pressure-just wanted to share. Open ka ba to hear more?`;

    return {
      stepNumber: 1,
      dayOffset,
      subject: 'Quick Thought',
      message,
      cta: 'Pwede tayo mag-quick chat?',
      coachingTip: includeCoaching
        ? 'Keep first message light and personal. Do not pitch yet-just open the door.'
        : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createRecruitStep2(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const painPointRef = this.getPainPointReference(context);

    const message = `Hi again ${context.full_name}! ${painPointRef}

I wanted to follow up kasi I really think this could be a good fit for you. Maraming Filipinos na tulad mo are finding success with this opportunity.

Gusto mo ba to learn more? I can share some real results.`;

    return {
      stepNumber: 2,
      dayOffset,
      subject: 'Following Up',
      message,
      cta: 'Free ka ba this week?',
      coachingTip: includeCoaching
        ? 'Reference their pain points. Show empathy and social proof.'
        : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 12),
          }
        : undefined,
    };
  }

  private createRecruitStep3(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const interestRef = this.getInterestReference(context);

    const message = `${context.full_name}, ${interestRef}

This opportunity is perfect for people who want to build something on the side without quitting their current work. Flexible schedule, proven system, and full support.

Let me send you a quick overview or we can have a 15-minute call. Which works better for you?`;

    return {
      stepNumber: 3,
      dayOffset,
      subject: 'Something Perfect for You',
      message,
      cta: 'Call or message?',
      coachingTip: includeCoaching
        ? 'Give them options. Low-commitment ask. Emphasize flexibility.'
        : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 18),
          }
        : undefined,
    };
  }

  private createRecruitStep4(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hi ${context.full_name}! Just checking in. I know you are busy, but I did not want you to miss this.

Others in your situation have started and are seeing real results already. If timing is not right now, no worries-but I wanted to make sure you at least knew about it.

Interested to learn more?`;

    return {
      stepNumber: 4,
      dayOffset,
      subject: 'Checking In',
      message,
      cta: 'Yes or maybe later?',
      coachingTip: includeCoaching
        ? 'Soft pressure. Acknowledge they are busy but create urgency.'
        : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 20),
          }
        : undefined,
    };
  }

  private createRecruitStep5(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, last follow-up from me on this. I really think this fits your goals and I do not want you to miss out.

If you are curious, let me know. If not, no hard feelings-I just wanted to make sure you had the chance.

Game ka ba?`;

    return {
      stepNumber: 5,
      dayOffset,
      subject: 'Final Follow-Up',
      message,
      cta: 'Let me know either way',
      coachingTip: includeCoaching
        ? 'Final ask. Use scarcity but stay respectful. Give them an out.'
        : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 19),
          }
        : undefined,
    };
  }

  private createRecruitStep6(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hey ${context.full_name}, wanted to share a quick success story. Someone with a similar background to yours just hit their first milestone.

Thought you might find it inspiring. Still open to exploring this?`;

    return {
      stepNumber: 6,
      dayOffset,
      subject: 'Success Story',
      message,
      cta: 'Want to hear more?',
      coachingTip: includeCoaching ? 'Use social proof. Share relatable wins.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createRecruitStep7(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, I will stop bothering you after this! But seriously, if you ever want to explore this, my door is open.

No pressure, no judgment. Just an opportunity I thought fit you well. Take care!`;

    return {
      stepNumber: 7,
      dayOffset,
      subject: 'Door is Open',
      message,
      coachingTip: includeCoaching ? 'Graceful exit. Leave door open but respect their space.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 16),
          }
        : undefined,
    };
  }

  private createSellStep1(
    context: ProspectContext,
    tone: string,
    industry: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const productRef = this.getProductReference(industry, context);
    const greeting = tone === 'professional' ? 'Good day' : 'Hi';

    const message = `${greeting} ${context.full_name}! ${productRef}

I wanted to share something that might really help you. It is designed for people like you and has helped so many Filipinos already.

Interested to learn more?`;

    return {
      stepNumber: 1,
      dayOffset,
      subject: 'Something for You',
      message,
      cta: 'Can I share details?',
      coachingTip: includeCoaching ? 'Soft intro. Mention benefits, not features.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createSellStep2(
    context: ProspectContext,
    tone: string,
    industry: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hi ${context.full_name}! Following up on my last message. This product has been life-changing for so many people.

Affordable, reliable, and perfect for your needs. Want me to send you more info or answer any questions?`;

    return {
      stepNumber: 2,
      dayOffset,
      subject: 'Quick Follow-Up',
      message,
      cta: 'Questions?',
      coachingTip: includeCoaching ? 'Emphasize affordability and reliability. Be helpful, not pushy.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 12),
          }
        : undefined,
    };
  }

  private createSellStep3(
    context: ProspectContext,
    tone: string,
    industry: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, just wanted to check in. I know life gets busy pero I did not want you to miss out on this.

Limited slots available and I want to make sure you have access if interested. Let me know!`;

    return {
      stepNumber: 3,
      dayOffset,
      subject: 'Limited Availability',
      message,
      cta: 'Interested?',
      coachingTip: includeCoaching ? 'Create urgency. Use scarcity tactfully.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 18),
          }
        : undefined,
    };
  }

  private createSellStep4(
    context: ProspectContext,
    tone: string,
    industry: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hi ${context.full_name}! I have a special promo running this week. Thought of you immediately.

This might be the perfect time to try it out. Want to hear the details?`;

    return {
      stepNumber: 4,
      dayOffset,
      subject: 'Special Promo',
      message,
      cta: 'Tell me more',
      coachingTip: includeCoaching ? 'Use promotions to re-engage. Time-limited offers work well.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 19),
          }
        : undefined,
    };
  }

  private createSellStep5(
    context: ProspectContext,
    tone: string,
    industry: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, last message from me on this. Just wanted to make sure you did not miss this opportunity.

If you are interested, let me know. If not, no worries at all. Take care!`;

    return {
      stepNumber: 5,
      dayOffset,
      subject: 'Final Reminder',
      message,
      coachingTip: includeCoaching ? 'Graceful close. Leave door open but respect their decision.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createBookCallStep1(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const greeting = tone === 'professional' ? 'Good day' : 'Hey';

    const message = `${greeting} ${context.full_name}! Hope you are doing well.

I wanted to invite you to a quick 15-minute call. No pressure-just want to share something I think you will find valuable.

Free ka ba this week?`;

    return {
      stepNumber: 1,
      dayOffset,
      subject: 'Quick Call?',
      message,
      cta: 'When are you available?',
      coachingTip: includeCoaching ? 'Keep it short. Emphasize the time commitment is small.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createBookCallStep2(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hi ${context.full_name}! Just following up on my invite for a quick call. I promise it will be worth your time.

We can do virtual or coffee-whatever works better for you. Game ka ba?`;

    return {
      stepNumber: 2,
      dayOffset,
      subject: 'Call Follow-Up',
      message,
      cta: 'Virtual or in-person?',
      coachingTip: includeCoaching ? 'Give options. Be flexible. Show it is low effort for them.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 12),
          }
        : undefined,
    };
  }

  private createBookCallStep3(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, last invite from me! I really think you will benefit from this conversation.

If you are open, just reply with your availability. If not, no worries. Hope to connect soon!`;

    return {
      stepNumber: 3,
      dayOffset,
      subject: 'Final Invite',
      message,
      coachingTip: includeCoaching ? 'Final ask. Be warm but direct. Give them an easy out.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 18),
          }
        : undefined,
    };
  }

  private createReconnectStep1(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hey ${context.full_name}! It has been a while. Hope you are doing well!

Just wanted to check in and see how things are going with you. Miss our chats!`;

    return {
      stepNumber: 1,
      dayOffset,
      subject: 'Long Time!',
      message,
      cta: 'How have you been?',
      coachingTip: includeCoaching ? 'Pure reconnection. Do not pitch yet-just rebuild rapport.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createReconnectStep2(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const lifeEventRef = this.getLifeEventReference(context);

    const message = `Hi ${context.full_name}! ${lifeEventRef}

Would love to catch up sometime. Coffee or a quick call?`;

    return {
      stepNumber: 2,
      dayOffset,
      subject: 'Catch Up?',
      message,
      cta: 'Free this week?',
      coachingTip: includeCoaching
        ? 'Reference something from their life. Show genuine interest.'
        : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 18),
          }
        : undefined,
    };
  }

  private createReconnectStep3(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, just wanted to say hi and keep in touch. If you are ever up for catching up, let me know!

Miss you, friend!`;

    return {
      stepNumber: 3,
      dayOffset,
      subject: 'Keeping in Touch',
      message,
      coachingTip: includeCoaching ? 'Warm close. No pressure. Leave door open for future.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 16),
          }
        : undefined,
    };
  }

  private createNurtureStep1(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const interestRef = this.getInterestReference(context);

    const message = `Hi ${context.full_name}! ${interestRef}

I came across this article/tip that I think you will find helpful. Just wanted to share. No strings attached!`;

    return {
      stepNumber: 1,
      dayOffset,
      subject: 'Thought of You',
      message,
      coachingTip: includeCoaching ? 'Give value first. Build trust. No ask yet.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createNurtureStep2(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hey ${context.full_name}! Hope you are having a great week.

Just checking in. Let me know if you ever need anything or have questions about anything we talked about before!`;

    return {
      stepNumber: 2,
      dayOffset,
      subject: 'Checking In',
      message,
      coachingTip: includeCoaching ? 'Stay top of mind. Be helpful without being salesy.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 12),
          }
        : undefined,
    };
  }

  private createNurtureStep3(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hi ${context.full_name}! Saw this success story and thought of you. Someone with similar goals to yours just achieved something amazing.

Thought it might inspire you. Keep going!`;

    return {
      stepNumber: 3,
      dayOffset,
      subject: 'Inspiring Story',
      message,
      coachingTip: includeCoaching ? 'Share social proof. Connect it to their goals.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 18),
          }
        : undefined,
    };
  }

  private createNurtureStep4(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, hope all is well with you!

Just wanted to drop a quick message. If you ever want to chat about opportunities, I am here. No pressure!`;

    return {
      stepNumber: 4,
      dayOffset,
      subject: 'Quick Hello',
      message,
      coachingTip: includeCoaching ? 'Gentle reminder you are available. Keep it low-key.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 19),
          }
        : undefined,
    };
  }

  private createNurtureStep5(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hey ${context.full_name}! Hope you are crushing your goals.

Just want you to know I am always here if you need advice, help, or just want to chat. Take care!`;

    return {
      stepNumber: 5,
      dayOffset,
      subject: 'Always Here',
      message,
      coachingTip: includeCoaching ? 'End on a supportive note. Build long-term relationship.' : undefined,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createGenericStep1(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const greeting = tone === 'professional' ? 'Good day' : 'Hi';

    const message = `${greeting} ${context.full_name}! Hope you are doing well.

I wanted to reach out about something that might interest you. Let me know if you are open to hearing more!`;

    return {
      stepNumber: 1,
      dayOffset,
      subject: 'Quick Message',
      message,
      cta: 'Open to learning more?',
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 17),
          }
        : undefined,
    };
  }

  private createGenericStep2(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `Hi ${context.full_name}! Just following up on my previous message. I think this could really benefit you.

Let me know if you want more details!`;

    return {
      stepNumber: 2,
      dayOffset,
      subject: 'Following Up',
      message,
      cta: 'Interested?',
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 12),
          }
        : undefined,
    };
  }

  private createGenericStep3(
    context: ProspectContext,
    tone: string,
    dayOffset: number,
    includeCoaching: boolean,
    includeScheduling: boolean
  ): SequenceStep {
    const message = `${context.full_name}, last message from me on this. Just wanted to make sure you had the chance.

If interested, let me know. If not, no worries at all!`;

    return {
      stepNumber: 3,
      dayOffset,
      subject: 'Final Follow-Up',
      message,
      scheduledReminder: includeScheduling
        ? {
            enabled: true,
            sendAt: this.calculateSendTime(dayOffset, 18),
          }
        : undefined,
    };
  }

  private getPersonalReference(context: ProspectContext): string {
    if (context.interests.length > 0) {
      return `I saw your posts about ${context.interests[0]} and I thought you might be interested in this.`;
    }
    if (context.dominant_topics.length > 0) {
      return `Your posts about ${context.dominant_topics[0]} caught my attention.`;
    }
    return 'I have been following your journey and thought of you.';
  }

  private getPainPointReference(context: ProspectContext): string {
    if (context.pain_points.some((p) => p.includes('financial') || p.includes('income'))) {
      return 'I know financial stability is important to you.';
    }
    if (context.pain_points.some((p) => p.includes('time') || p.includes('freedom'))) {
      return 'I know having more flexibility is important to you.';
    }
    if (context.pain_points.some((p) => p.includes('family'))) {
      return 'I know providing for your family is a priority.';
    }
    return 'I know you are looking for growth opportunities.';
  }

  private getInterestReference(context: ProspectContext): string {
    if (context.interests.includes('business') || context.interests.includes('entrepreneurship')) {
      return 'I know you are into business and entrepreneurship.';
    }
    if (context.interests.includes('family') || context.interests.includes('parenting')) {
      return 'I know family is super important to you.';
    }
    if (context.interests.length > 0) {
      return `I know you are interested in ${context.interests[0]}.`;
    }
    return 'I wanted to share something with you.';
  }

  private getLifeEventReference(context: ProspectContext): string {
    if (context.life_events.some((e) => e.includes('baby'))) {
      return 'Congrats again on your new addition to the family!';
    }
    if (context.life_events.some((e) => e.includes('job') || e.includes('career'))) {
      return 'Hope the new job is going well!';
    }
    if (context.life_events.length > 0) {
      return 'Hope things are going well with all your recent changes!';
    }
    return 'Hope everything is going great with you!';
  }

  private getProductReference(industry: string, context: ProspectContext): string {
    if (industry === 'insurance') {
      if (context.pain_points.some((p) => p.includes('health') || p.includes('security'))) {
        return 'I know security and peace of mind matter to you.';
      }
      return 'I wanted to talk to you about financial protection for your family.';
    }
    if (industry === 'real_estate') {
      return 'I wanted to share an investment opportunity in real estate.';
    }
    return 'I have something that I think fits your needs perfectly.';
  }

  private calculateSendTime(dayOffset: number, hour: number): string {
    const now = new Date();
    const sendDate = new Date(now);
    sendDate.setDate(sendDate.getDate() + dayOffset);
    sendDate.setHours(hour, 0, 0, 0);
    return sendDate.toISOString();
  }

  private async getProspectContext(prospectId: string, userId: string): Promise<ProspectContext> {
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select('full_name, metadata')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !prospect) throw new Error('Prospect not found');

    const metadata = prospect.metadata || {};

    return {
      full_name: prospect.full_name,
      topics: metadata.dominant_topics || metadata.tags || ['Business', 'Networking'],
      interests: metadata.interests || metadata.tags || ['Business', 'Growth'],
      pain_points: metadata.pain_points || ['Looking for opportunities'],
      life_events: metadata.life_events || [],
      personality_traits: metadata.personality_traits || {},
      dominant_topics: metadata.dominant_topics || metadata.tags || ['Business Growth'],
      relationship_level: metadata.relationship_level || 'warm',
      responsiveness_likelihood: metadata.responsiveness_likelihood || 0.65,
      mlm_leadership_potential: metadata.mlm_leadership_potential || 0.70,
      scout_score: metadata.scout_score || 50,
      bucket: metadata.bucket || 'warm',
      explanation_tags: metadata.explanation_tags || ['Active prospect'],
    };
  }

  private async checkUsageLimits(userId: string, tier: string, weeklyUsed: number): Promise<void> {
    if (tier === 'pro' && weeklyUsed >= 1) {
      throw new Error('Pro tier allows 1 sequence per week. Upgrade to Elite for unlimited sequences.');
    }
  }

  private async checkAndDeductCoins(userId: string, amount: number, description: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .maybeSingle();

    const currentBalance = profile?.coin_balance || 0;
    if (currentBalance < amount) {
      throw new Error('Insufficient coins. Please purchase more coins to continue.');
    }

    const newBalance = currentBalance - amount;
    await supabase.from('profiles').update({ coin_balance: newBalance }).eq('id', userId);
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'spend',
      description,
      balance_after: newBalance,
    });
  }

  async listSequences(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('follow_up_sequences')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getSequence(sequenceId: string, userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('follow_up_sequences')
      .select('*')
      .eq('id', sequenceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async activateSequence(sequenceId: string, userId: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    await supabase
      .from('follow_up_sequences')
      .update({
        status: 'active',
        activated_at: new Date().toISOString(),
      })
      .eq('id', sequenceId)
      .eq('user_id', userId);

    if (tier === 'elite') {
      await supabase.rpc('create_sequence_reminders', {
        p_sequence_id: sequenceId,
        p_user_id: userId,
      });
    }
  }

  async updateSequenceStep(sequenceId: string, userId: string, stepNumber: number, newMessage: string): Promise<void> {
    const sequence = await this.getSequence(sequenceId, userId);
    const steps = sequence.steps;

    const stepIndex = steps.findIndex((s: any) => s.stepNumber === stepNumber);
    if (stepIndex !== -1) {
      steps[stepIndex].message = newMessage;

      await supabase
        .from('follow_up_sequences')
        .update({ steps })
        .eq('id', sequenceId)
        .eq('user_id', userId);
    }
  }

  async logStepSent(sequenceId: string, userId: string, stepNumber: number, messageContent: string): Promise<void> {
    await supabase.from('sequence_step_logs').insert({
      sequence_id: sequenceId,
      user_id: userId,
      step_number: stepNumber,
      message_content: messageContent,
      sent_at: new Date().toISOString(),
    });

    await supabase
      .from('follow_up_sequences')
      .update({ current_step: stepNumber })
      .eq('id', sequenceId)
      .eq('user_id', userId);
  }
}

export const followUpSequencer = new FollowUpSequencerService();
