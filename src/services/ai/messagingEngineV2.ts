import { supabase } from '../../lib/supabase';

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
  objectionType: string;
  response: string;
  reinforcementPoints: string[];
  cta?: string;
  coachingTip?: string;
}

export interface BookingScript {
  script: string;
  cta: string;
  timeSuggestions: string[];
  coachingTip?: string;
}

export interface CoachingSession {
  situationAnalysis: string;
  recommendedMessage: string;
  doNext: string[];
  timing: string;
  riskWarnings?: string;
  psychologyInsights: string;
}

export interface GeneratedMessage {
  message: string;
  cta?: string;
  alternatives: string[];
  emotionalTone: string;
  coachingTip?: string;
}

class MessagingEngineV2Service {
  private readonly MESSAGE_LIMITS = {
    free: 2,
    pro: 999999,
    elite: 999999,
  };

  async generateObjectionResponse(
    userId: string,
    prospectId: string,
    objectionType: 'no_time' | 'no_money' | 'not_now' | 'too_expensive' | 'skeptic' | 'already_tried' | 'thinking_about_it' | 'busy' | 'needs_approval' | 'not_interested',
    industry: 'mlm' | 'insurance' | 'real_estate' | 'product',
    tone: 'friendly' | 'professional' | 'warm' | 'direct'
  ): Promise<ObjectionResponse> {
    const context = await this.getProspectContext(prospectId, userId);
    const tier = await this.getUserTier(userId);

    const response = this.buildObjectionResponse(objectionType, context, industry, tone, tier === 'elite');

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

    return response;
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
    const industryFraming = industry === 'mlm'
      ? 'opportunity to build extra income'
      : industry === 'insurance'
      ? 'protection plan that fits your budget'
      : 'investment opportunity with flexible terms';

    const response = `I hear you, ${context.name}. Budget is a real consideration.

Pero that is exactly why I thought of you for this ${industryFraming}. Hindi ito expense-think of it as investment sa future mo.

${industry === 'mlm' ? 'You can start small and grow as you earn. Maraming nag-start with limited budget and are now thriving.' : 'May flexible payment options tayo, and the value you get back is way more than what you put in.'}

Let me show you how people in similar situations made it work. No pressure-just info.`;

    return {
      objectionType: 'no_money',
      response,
      reinforcementPoints: [
        'Investment, not expense',
        'Flexible starting options',
        'Real ROI from others in similar situations',
        'Built for Filipino budgets',
      ],
      cta: 'Pwede ko ba i-share yung breakdown?',
      coachingTip: coaching ? 'Position as investment. Show flexibility. Use social proof.' : undefined,
    };
  }

  private handleNotNow(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `Totally understand, ${context.name}. Timing matters talaga.

No pressure from me at all. I just want you to know that the opportunity is here when you are ready.

Sometimes the right time is when we make it the right time, pero I respect your pace. Can I check in with you in a few weeks? Or feel free to reach out anytime if something changes.`;

    return {
      objectionType: 'not_now',
      response,
      reinforcementPoints: [
        'Respect their timing',
        'Door stays open',
        'Soft future touchpoint',
        'No pressure approach',
      ],
      cta: 'Can I follow up in 2-3 weeks?',
      coachingTip: coaching
        ? 'Give space. Show respect. Plant seed for future. Stay warm.'
        : undefined,
    };
  }

  private handleTooExpensive(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I get it, ${context.name}. Price can seem high at first.

Pero let me put it in perspective: hindi to about the upfront cost, it is about the value and return you get. When you break it down daily or monthly, it is actually super affordable.

Plus, ${industry === 'mlm' ? 'you will earn this back quickly as you build' : industry === 'insurance' ? 'the protection and peace of mind you get is priceless' : 'real estate appreciates-your money grows'}.

Can I walk you through how the numbers actually work in your favor?`;

    return {
      objectionType: 'too_expensive',
      response,
      reinforcementPoints: [
        'Value over cost',
        'Break down into daily or monthly',
        'ROI perspective',
        'Long-term benefit focus',
      ],
      cta: 'Let me show you the real numbers',
      coachingTip: coaching ? 'Reframe cost as value. Use ROI framing. Offer breakdown.' : undefined,
    };
  }

  private handleSkeptic(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `Hey ${context.name}, I totally respect your skepticism. In fact, healthy skepticism is good.

I was the same way before I really looked into this. What changed my mind was seeing real results from real people-not hype, just actual proof.

This is legit, registered, and backed by a strong track record. I would not recommend it to you kung hindi ko napatunayan mismo.

Would it help if I connect you with someone who had the same concerns and is now super happy they went for it?`;

    return {
      objectionType: 'skeptic',
      response,
      reinforcementPoints: [
        'Validate their skepticism',
        'Offer real proof, not hype',
        'Legitimacy and track record',
        'Connect with similar success stories',
      ],
      cta: 'Want to talk to someone who was skeptical too?',
      coachingTip: coaching
        ? 'Never fight skepticism. Validate it. Offer proof. Use testimonials.'
        : undefined,
    };
  }

  private handleAlreadyTried(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I hear you, ${context.name}. If you tried something before na hindi nag-work, I totally get why you would be hesitant.

But let me ask-what if this is different? What if the system, support, and timing are better this time?

Hindi lahat ng opportunities are created equal. This one has proven success, strong mentorship, and a community that actually supports you. You are not alone dito.

Would you be open to seeing what makes this different from what you tried before?`;

    return {
      objectionType: 'already_tried',
      response,
      reinforcementPoints: [
        'Acknowledge past experience',
        'Differentiate this opportunity',
        'Emphasize system and support',
        'Community and mentorship focus',
      ],
      cta: 'Can I show you what makes this different?',
      coachingTip: coaching
        ? 'Validate past. Emphasize differentiation. Focus on support system.'
        : undefined,
    };
  }

  private handleThinkingAboutIt(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `Of course, ${context.name}. Take your time to think it through. Decisions like this should not be rushed.

I just want to make sure you have all the info you need. If may questions ka or anything na unclear, just let me know.

Minsan overthinking can hold us back from good opportunities, pero I trust your judgment. When you are ready, I am here.`;

    return {
      objectionType: 'thinking_about_it',
      response,
      reinforcementPoints: [
        'Respect decision process',
        'Offer clarity and support',
        'Gentle nudge without pressure',
        'Stay available',
      ],
      cta: 'Any questions I can answer to help you decide?',
      coachingTip: coaching
        ? 'Give space. Offer clarity. Gentle reminder about overthinking. Stay supportive.'
        : undefined,
    };
  }

  private handleBusy(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I know you are super busy, ${context.name}. I would not bother you if I did not think this was worth your time.

Real talk: this is designed for busy people like you. Flexible, efficient, and does not require you to drop everything.

Even just 10-15 minutes to hear the overview could be huge for your future. I promise I will respect your time.`;

    return {
      objectionType: 'busy',
      response,
      reinforcementPoints: [
        'Acknowledge their busy schedule',
        'Emphasize time efficiency',
        'Low time commitment ask',
        'Future value focus',
      ],
      cta: 'Can we do 10 minutes this week?',
      coachingTip: coaching ? 'Acknowledge busy. Keep ask small. Value their time.' : undefined,
    };
  }

  private handleNeedsApproval(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `I totally understand, ${context.name}. Big decisions should be discussed with your partner or family.

Actually, that is a great sign-it means you take this seriously. What I suggest is: let me give you all the details so you can present it clearly to them.

Or better yet, would it help if I could talk to both of you together? That way all questions are answered directly.`;

    return {
      objectionType: 'needs_approval',
      response,
      reinforcementPoints: [
        'Respect their decision process',
        'Support them in presenting it well',
        'Offer to talk to decision-makers together',
        'Provide clear info for discussion',
      ],
      cta: 'Can I help you present this to them?',
      coachingTip: coaching
        ? 'Never pressure. Support their process. Offer to include partner/family.'
        : undefined,
    };
  }

  private handleNotInterested(context: ProspectContext, industry: string, tone: string, coaching: boolean): ObjectionResponse {
    const response = `No worries, ${context.name}. I totally respect that.

I just wanted to make sure it was not a misunderstanding or lack of info. But if it is truly not for you right now, that is completely okay.

The door is always open kung magbago isip mo or if I can help in any other way. Thanks for hearing me out.`;

    return {
      objectionType: 'not_interested',
      response,
      reinforcementPoints: [
        'Respect their decision',
        'Leave door open for future',
        'Graceful exit',
        'Maintain relationship',
      ],
      coachingTip: coaching
        ? 'Respect the no. Do not chase. Leave door open. Graceful and warm exit.'
        : undefined,
    };
  }

  async generateBookingScript(
    userId: string,
    prospectId: string,
    goal: 'book_call',
    industry: 'mlm' | 'insurance' | 'real_estate' | 'product',
    tone: 'friendly' | 'professional' | 'warm'
  ): Promise<BookingScript> {
    const context = await this.getProspectContext(prospectId, userId);
    const tier = await this.getUserTier(userId);

    const script = this.buildBookingScript(context, industry, tone, tier === 'elite');

    await supabase.from('meeting_booking_scripts').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: context.name,
      script: script.script,
      cta: script.cta,
      time_suggestions: script.timeSuggestions,
      coaching_tip: script.coachingTip,
      goal,
      industry,
      tone,
    });

    return script;
  }

  private buildBookingScript(
    context: ProspectContext,
    industry: string,
    tone: string,
    includeCoaching: boolean
  ): BookingScript {
    const bucket = context.bucket;
    const personalRef = this.getPersonalRef(context);

    let script = '';
    let cta = '';
    const timeSuggestions = ['later today', 'tonight', 'tomorrow afternoon', 'this weekend'];

    if (bucket === 'hot') {
      script = `${context.name}, ${personalRef}

I would love to share more details with you. Pwede ka ba for a quick 10-15 minute call? Virtual lang, super quick.

I think you will find this really valuable. When works best for you?`;
      cta = 'Pwede ka ba later or tomorrow?';
    } else if (bucket === 'warm') {
      script = `Hi ${context.name}! ${personalRef}

I wanted to connect with you about something I think fits your goals perfectly. No pressure-just a short intro call, 10-15 minutes lang.

${industry === 'mlm' ? 'It is about building extra income with flexibility.' : industry === 'insurance' ? 'It is about securing your future financially.' : 'It is about smart investment opportunities.'}

When are you free for a quick chat?`;
      cta = 'Free ka ba this week?';
    } else {
      script = `Hey ${context.name}! ${personalRef}

I know life gets busy, but I wanted to offer you a quick intro call-no commitment, just 10 minutes to share something that could really benefit you.

If you are curious, let me know when works. If not, no worries at all.`;
      cta = 'Open ka ba for 10 minutes this week?';
    }

    return {
      script,
      cta,
      timeSuggestions,
      coachingTip: includeCoaching
        ? `Best timing: ${context.responsiveness_likelihood > 70 ? 'Send now or within 2 hours' : 'Send during evening hours (6-8pm)'}. Keep tone ${bucket === 'hot' ? 'direct' : 'soft'}. Follow up in ${bucket === 'hot' ? '1 day' : '2-3 days'} if no reply.`
        : undefined,
    };
  }

  async generateCoaching(
    userId: string,
    prospectId: string,
    recentMessages: string[],
    industry: string,
    userGoal: 'recruit' | 'sell' | 'follow_up' | 'close_call'
  ): Promise<CoachingSession> {
    const tier = await this.getUserTier(userId);
    if (tier !== 'elite') {
      throw new Error('Elite Coaching is only available for Elite tier subscribers');
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
      scoutscore_context: {
        score: context.scout_score,
        bucket: context.bucket,
        tags: context.explanation_tags,
      },
    });

    return coaching;
  }

  private buildCoaching(
    context: ProspectContext,
    recentMessages: string[],
    industry: string,
    userGoal: string
  ): CoachingSession {
    const bucket = context.bucket;
    const responsiveness = context.responsiveness_likelihood;

    const situationAnalysis = `${context.name} is a ${bucket.toUpperCase()} lead with ${context.scout_score}/100 ScoutScore. Responsiveness: ${responsiveness}%. Personality shows ${this.getPersonalityInsight(context.personality_traits)}. ${context.pain_points.length > 0 ? `Key pain points: ${context.pain_points.slice(0, 2).join(', ')}.` : ''} ${context.life_events.length > 0 ? `Recent life event: ${context.life_events[0]}.` : ''}`;

    const recommendedMessage = this.buildRecommendedMessage(context, userGoal, industry);

    const doNext = [
      bucket === 'hot'
        ? 'Send message now or within 2 hours'
        : 'Send message during optimal time (6-8pm)',
      responsiveness > 70
        ? 'Follow up within 24 hours if no reply'
        : 'Wait 2-3 days before follow-up',
      'Track response and adjust tone accordingly',
      userGoal === 'close_call' ? 'Be prepared to handle objections' : 'Build more rapport before asking',
    ];

    const timing = responsiveness > 70
      ? 'Send within 2 hours. They are highly responsive.'
      : responsiveness > 50
      ? 'Send tonight between 6-8pm for best results.'
      : 'Send tomorrow afternoon. Give them space.';

    const riskWarnings = bucket === 'cold' && userGoal === 'close_call'
      ? 'WARNING: This is a cold lead. Closing too fast may push them away. Focus on building trust first.'
      : recentMessages.length > 3
      ? 'WARNING: You have sent multiple messages. Avoid appearing pushy. Give them space.'
      : undefined;

    const psychologyInsights = `Filipino communication values respect and relationship-building. ${context.pain_points.includes('financial_stress') ? 'Financial stress present-use empathetic tone.' : ''} ${context.life_events.some(e => e.includes('baby') || e.includes('family')) ? 'Family-focused-emphasize security and future.' : ''} ${bucket === 'hot' ? 'High engagement-they are interested. Be confident but not pushy.' : 'Lower engagement-build trust before asking for commitment.'}`;

    return {
      situationAnalysis,
      recommendedMessage,
      doNext,
      timing,
      riskWarnings,
      psychologyInsights,
    };
  }

  private buildRecommendedMessage(context: ProspectContext, userGoal: string, industry: string): string {
    const personalRef = this.getPersonalRef(context);

    if (userGoal === 'recruit') {
      return `Hi ${context.name}! ${personalRef}\n\nI thought of you for an opportunity that fits your goals. It is flexible, proven, and perfect for building extra income without quitting anything.\n\nInterested to learn more? Just 10 minutes of your time.`;
    } else if (userGoal === 'sell') {
      return `Hey ${context.name}! ${personalRef}\n\nI have something that I think you will really benefit from. ${industry === 'insurance' ? 'It is about securing your family financially.' : industry === 'real_estate' ? 'It is a solid investment opportunity.' : 'It is designed specifically for people like you.'}\n\nCan I share the details with you?`;
    } else if (userGoal === 'close_call') {
      return `${context.name}, based on our conversation, I think you are ready to move forward. Let me know if you have any final questions, or if you want to get started, I can walk you through the next steps.\n\nWhat works better for you?`;
    } else {
      return `Hi ${context.name}! Just checking in. ${personalRef}\n\nLet me know if you need anything or if you have questions. I am here to help!`;
    }
  }

  async generateMessage(
    userId: string,
    prospectId: string,
    messageType: 'first_outreach' | 'follow_up' | 'reconnect' | 'nurture' | 'book_call' | 'objection' | 'closing' | 'slow_nurture',
    tone: 'friendly' | 'professional' | 'warm' | 'direct',
    industry: 'mlm' | 'insurance' | 'real_estate' | 'product'
  ): Promise<GeneratedMessage> {
    await this.checkMessageLimits(userId);

    const context = await this.getProspectContext(prospectId, userId);
    const tier = await this.getUserTier(userId);

    const generated = this.buildMessage(context, messageType, tone, industry, tier === 'elite');

    await supabase.from('ai_generated_messages').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: context.name,
      message_type: messageType,
      message_content: generated.message,
      cta: generated.cta,
      alternatives: generated.alternatives,
      tone,
      emotional_tone: generated.emotionalTone,
      industry,
      scoutscore_context: {
        score: context.scout_score,
        bucket: context.bucket,
        tags: context.explanation_tags,
      },
      prospect_context: context,
      coaching_tip: generated.coachingTip,
    });

    await this.incrementMessageCount(userId);

    return generated;
  }

  private buildMessage(
    context: ProspectContext,
    messageType: string,
    tone: string,
    industry: string,
    includeCoaching: boolean
  ): GeneratedMessage {
    const bucket = context.bucket;
    const personalRef = this.getPersonalRef(context);

    let message = '';
    let cta = '';
    let alternatives: string[] = [];
    let emotionalTone = 'warm';
    let coachingTip = '';

    if (messageType === 'first_outreach') {
      message = `Hi ${context.name}! ${personalRef}\n\nI wanted to reach out kasi I think you would be interested in something I have been working on. It aligns well with your interests and goals.\n\nOpen ka ba to learn more?`;
      cta = 'Can we chat briefly?';
      alternatives = [
        `Hey ${context.name}! ${personalRef} I have something you might really like. Can I share it with you?`,
        `${context.name}, hope you are doing well! I thought of you for an opportunity that fits your goals. Interested?`,
      ];
      emotionalTone = tone === 'direct' ? 'confident' : 'warm';
      coachingTip = 'First message-keep it light and personal. Do not pitch yet.';
    } else if (messageType === 'follow_up') {
      message = `Hi ${context.name}! Just following up on my last message. I know life gets busy, but I really think this could benefit you.\n\nLet me know if you want to hear more!`;
      cta = 'Still interested?';
      alternatives = [
        `${context.name}, just checking in! Did you get a chance to think about what I shared?`,
        `Hey ${context.name}! No pressure, just wanted to see if you had any questions about what I mentioned.`,
      ];
      emotionalTone = 'soft';
      coachingTip = 'Keep follow-ups gentle. Avoid sounding pushy.';
    } else if (messageType === 'reconnect') {
      message = `Hey ${context.name}! It has been a while. Hope you are doing great!\n\n${this.getLifeEventRef(context)}\n\nWould love to catch up. Free ka ba for a quick chat?`;
      cta = 'Coffee or quick call?';
      alternatives = [
        `${context.name}, miss our chats! How have you been? Let me know if you want to catch up.`,
        `Long time, ${context.name}! Would be great to reconnect. When are you free?`,
      ];
      emotionalTone = 'warm';
      coachingTip = 'Pure reconnection. Build rapport first, do not pitch immediately.';
    } else if (messageType === 'nurture') {
      message = `Hi ${context.name}! ${personalRef}\n\nJust wanted to share something I thought you would find helpful. No strings attached-just value.\n\nHope you find it useful!`;
      emotionalTone = 'empathetic';
      alternatives = [
        `${context.name}, saw this and immediately thought of you. Thought it might help!`,
        `Hey ${context.name}! Sharing something valuable I came across. Hope it helps you!`,
      ];
      coachingTip = 'Give value first. Build trust without asking for anything.';
    }

    return {
      message,
      cta,
      alternatives,
      emotionalTone,
      coachingTip: includeCoaching ? coachingTip : undefined,
    };
  }

  private getPersonalRef(context: ProspectContext): string {
    if (context.interests.length > 0) {
      return `I saw your interest in ${context.interests[0]}.`;
    }
    if (context.life_events.length > 0) {
      return `I noticed your recent life changes.`;
    }
    return `I have been following your journey.`;
  }

  private getLifeEventRef(context: ProspectContext): string {
    if (context.life_events.some(e => e.includes('baby'))) {
      return 'Congrats on your new addition to the family!';
    }
    if (context.life_events.some(e => e.includes('job'))) {
      return 'Hope the new job is going well!';
    }
    return 'Hope everything is going great with you!';
  }

  private getPersonalityInsight(traits: any): string {
    if (!traits) return 'balanced personality';
    if (traits.extroverted) return 'extroverted and social nature';
    if (traits.goal_oriented) return 'goal-driven mindset';
    return 'thoughtful approach';
  }

  private async getProspectContext(prospectId: string, userId: string): Promise<ProspectContext> {
    const { data: prospect, error } = await supabase
      .from('prospects')
      .select(
        `
        full_name,
        prospect_profiles!inner(
          interests,
          pain_points,
          life_events,
          personality_traits,
          responsiveness_likelihood
        ),
        prospect_scores!inner(
          scout_score,
          bucket,
          explanation_tags
        )
      `
      )
      .eq('id', prospectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !prospect) throw new Error('Prospect not found');

    const profile = prospect.prospect_profiles[0] || {};
    const score = prospect.prospect_scores[0] || {};

    return {
      name: prospect.full_name,
      interests: profile.interests || [],
      pain_points: profile.pain_points || [],
      life_events: profile.life_events || [],
      personality_traits: profile.personality_traits || {},
      responsiveness_likelihood: profile.responsiveness_likelihood || 50,
      scout_score: score.scout_score || 0,
      bucket: score.bucket || 'cold',
      explanation_tags: score.explanation_tags || [],
    };
  }

  private async getUserTier(userId: string): Promise<string> {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    return data?.subscription_tier || 'free';
  }

  private async checkMessageLimits(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier, daily_messages_used, last_message_reset_date')
      .eq('id', userId)
      .maybeSingle();

    if (!data) throw new Error('User not found');

    const tier = data.subscription_tier || 'free';
    const today = new Date().toISOString().split('T')[0];

    if (data.last_message_reset_date !== today) {
      await supabase
        .from('profiles')
        .update({
          daily_messages_used: 0,
          last_message_reset_date: today,
        })
        .eq('id', userId);
      return;
    }

    const limit = this.MESSAGE_LIMITS[tier as keyof typeof this.MESSAGE_LIMITS];
    if (data.daily_messages_used >= limit) {
      throw new Error(`Daily message limit reached. ${tier === 'free' ? 'Upgrade to Pro for unlimited messages.' : ''}`);
    }
  }

  private async incrementMessageCount(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('daily_messages_used')
      .eq('id', userId)
      .maybeSingle();

    await supabase
      .from('profiles')
      .update({ daily_messages_used: (data?.daily_messages_used || 0) + 1 })
      .eq('id', userId);
  }
}

export const messagingEngineV2 = new MessagingEngineV2Service();
