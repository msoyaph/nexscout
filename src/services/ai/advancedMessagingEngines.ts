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
}

export interface RevivalMessage {
  revivalMessage: string;
  microCTA?: string;
  valueDrop?: string;
  timingSuggestion: string;
  riskWarnings?: string;
  alternatives: string[];
  eliteCoachingTip?: string;
}

export interface ReferralMessage {
  referralMessage: string;
  referralAsk: string;
  benefitFraming?: string;
  examplesToSend: string[];
  softCTA: string;
  eliteCoachingTip?: string;
}

export interface SocialReply {
  publicReply: string;
  privateFollowUpSuggestion?: string;
  riskWarnings?: string;
  alternativeReplies: string[];
}

export interface CallScript {
  opening: string;
  rapport: string;
  discoveryQuestions: string[];
  miniPitch: string;
  transition: string;
  cta: string;
  fallbackCTA: string;
  objectionResponses: {
    no_time: string;
    no_money: string;
    not_now: string;
  };
  eliteCoachingTip?: string;
}

class AdvancedMessagingEnginesService {
  async generateRevivalMessage(
    userId: string,
    prospectId: string,
    lastInteractionDays: number,
    previousMessages: string[],
    industry: 'mlm' | 'insurance' | 'real_estate' | 'product',
    userGoal: 'reconnect' | 'revive' | 'bring_back' | 'value_drop'
  ): Promise<RevivalMessage> {
    const context = await this.getProspectContext(prospectId, userId);
    const tier = await this.getUserTier(userId);

    const revival = this.buildRevivalMessage(context, lastInteractionDays, industry, userGoal, tier === 'pro');

    await supabase.from('lead_revival_messages').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: context.name,
      revival_message: revival.revivalMessage,
      micro_cta: revival.microCTA,
      value_drop: revival.valueDrop,
      timing_suggestion: revival.timingSuggestion,
      risk_warnings: revival.riskWarnings,
      alternatives: revival.alternatives,
      elite_coaching_tip: revival.eliteCoachingTip,
      last_interaction_days: lastInteractionDays,
      bucket: context.bucket,
      user_goal: userGoal,
      industry,
    });

    return revival;
  }

  private buildRevivalMessage(
    context: ProspectContext,
    daysSince: number,
    industry: string,
    goal: string,
    includeCoaching: boolean
  ): RevivalMessage {
    const lifeEventRef = this.getLifeEventRef(context);
    const valueInsight = this.getValueInsight(industry, context);

    let message = '';
    let microCTA = '';
    let valueDrop = '';
    let timing = '';
    let alternatives: string[] = [];
    let warnings = '';

    if (daysSince > 90) {
      message = `Hey ${context.name}! It has been a while. ${lifeEventRef || 'Hope you are doing great!'}\n\n${valueDrop || valueInsight}\n\nNo pressure-just wanted to reconnect. How have you been?`;
      microCTA = 'Free ka ba for a quick catch-up?';
      timing = 'Send during evening hours (6-8pm). Long gaps need warm reconnection first.';
      alternatives = [
        `${context.name}, long time! ${lifeEventRef || 'Miss our chats.'} ${valueInsight} Hope you are well!`,
        `Hi ${context.name}! Just checking in. ${valueInsight} Would love to hear how you are doing.`,
      ];
      warnings = 'Do not mention missed opportunities or guilt. Pure relationship rebuild.';
    } else if (daysSince > 30) {
      message = `Kamusta ${context.name}! ${lifeEventRef}\n\n${valueInsight}\n\nThought you might find this helpful. Let me know if you want to chat about it!`;
      microCTA = 'Thoughts?';
      timing = 'Send in the afternoon or early evening. Medium-term revival needs value-first.';
      alternatives = [
        `Hey ${context.name}! ${valueInsight} Naisip kita when I came across this.`,
        `${context.name}, hope all is well! ${valueInsight} Sharing lang in case helpful.`,
      ];
      warnings = 'Lead with value. Avoid asking about previous conversations.';
    } else {
      message = `Hi ${context.name}! ${lifeEventRef}\n\nI know we have not connected recently, but ${valueInsight}\n\nWant to discuss?`;
      microCTA = 'Quick chat?';
      timing = 'Send now or within 2-3 hours. Short-term revival allows more direct approach.';
      alternatives = [
        `${context.name}, quick follow-up! ${valueInsight} Let me know if interested.`,
        `Hey ${context.name}! ${valueInsight} Thought this might help you.`,
      ];
      warnings = 'Keep it light. Do not over-explain the gap.';
    }

    valueDrop = valueInsight;

    return {
      revivalMessage: message,
      microCTA,
      valueDrop,
      timingSuggestion: timing,
      riskWarnings: warnings,
      alternatives,
      eliteCoachingTip: includeCoaching
        ? `Revival strategy: ${daysSince > 90 ? 'Pure reconnection-do not pitch yet.' : daysSince > 30 ? 'Value-first, soft CTA.' : 'Light nudge allowed.'} Wait ${daysSince > 90 ? '1 week' : daysSince > 30 ? '3-4 days' : '2 days'} before follow-up if no response.`
        : undefined,
    };
  }

  private getLifeEventRef(context: ProspectContext): string {
    if (context.life_events.some(e => e.includes('baby') || e.includes('newborn'))) {
      return 'Congrats again on your baby!';
    }
    if (context.life_events.some(e => e.includes('job') || e.includes('career'))) {
      return 'Hope the new job is going amazing!';
    }
    if (context.life_events.some(e => e.includes('wedding') || e.includes('married'))) {
      return 'Congrats on getting married!';
    }
    return '';
  }

  private getValueInsight(industry: string, context: ProspectContext): string {
    if (industry === 'mlm') {
      if (context.pain_points.some(p => p.includes('financial') || p.includes('income'))) {
        return 'I came across a flexible sideline opportunity that might fit your goals';
      }
      return 'I learned about a system that helps people build extra income on their own time';
    } else if (industry === 'insurance') {
      return 'I wanted to share a quick tip about protecting your family financially-no strings attached';
    } else if (industry === 'real_estate') {
      return 'There are some interesting property opportunities available right now';
    }
    return 'I thought of something that might benefit you';
  }

  async generateReferralMessage(
    userId: string,
    prospectId: string | null,
    context: 'post_meeting' | 'post_sale' | 'inactive_prospect' | 'warm_friend',
    industry: 'mlm' | 'insurance' | 'real_estate' | 'product',
    tone: 'friendly' | 'professional' | 'warm',
    rewardType: 'none' | 'discount' | 'freebie' | 'referral_bonus'
  ): Promise<ReferralMessage> {
    const tier = await this.getUserTier(userId);
    const prospectContext = prospectId ? await this.getProspectContext(prospectId, userId) : null;

    const referral = this.buildReferralMessage(prospectContext?.name || 'Friend', context, industry, tone, rewardType, tier === 'pro');

    await supabase.from('referral_messages').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: prospectContext?.name,
      referral_message: referral.referralMessage,
      referral_ask: referral.referralAsk,
      benefit_framing: referral.benefitFraming,
      examples_to_send: referral.examplesToSend,
      soft_cta: referral.softCTA,
      elite_coaching_tip: referral.eliteCoachingTip,
      context,
      reward_type: rewardType,
      industry,
    });

    return referral;
  }

  private buildReferralMessage(
    name: string,
    context: string,
    industry: string,
    tone: string,
    rewardType: string,
    includeCoaching: boolean
  ): ReferralMessage {
    let message = '';
    let ask = '';
    let benefit = '';
    let examples: string[] = [];
    let cta = '';

    const reward = rewardType === 'discount' ? ' Plus, may discount pa sila!'
      : rewardType === 'freebie' ? ' May special bonus pa ako for them!'
      : rewardType === 'referral_bonus' ? ' And both of you benefit!'
      : '';

    if (context === 'post_sale') {
      message = `Hey ${name}! Super happy you decided to go with this. Quick favor-baka may kilala ka na might benefit from this din?\n\n${this.getIndustryFraming(industry)} Just one or two people lang.${reward}`;
      ask = 'Baka may kilala ka na interested din?';
      benefit = 'They get the same value you are getting';
      cta = 'Just send their name or FB profile!';
    } else if (context === 'post_meeting') {
      message = `Thanks for your time earlier, ${name}! I really enjoyed our chat.\n\nQuick ask-do you know someone who might be interested in ${this.getIndustryFraming(industry)}? One or two people lang na you think would benefit.${reward}`;
      ask = 'Know anyone who might be interested?';
      benefit = 'I can help them the same way I am helping you';
      cta = 'Send lang their name and I will take care of the rest';
    } else if (context === 'warm_friend') {
      message = `Hey ${name}! Hope you are doing great. I have a small favor-may kilala ka ba who is looking for ${this.getIndustryFraming(industry)}?\n\nJust thinking of expanding my network and wanted to ask if you know anyone.${reward}`;
      ask = 'May kilala ka ba?';
      benefit = 'I can offer them valuable info';
      cta = 'Just one or two names lang!';
    } else {
      message = `Hi ${name}! I know we have not connected recently, but quick question-may kilala ka ba who might be interested in ${this.getIndustryFraming(industry)}?\n\nNo pressure, just expanding my reach.${reward}`;
      ask = 'Any referrals?';
      benefit = 'It could really help them';
      cta = 'Send their name if you think of anyone!';
    }

    examples = [
      `Hi! My friend ${name} recommended I reach out to you. I wanted to share something that might help you with [topic]. Free to chat?`,
      `Hey! ${name} thought you might be interested in [opportunity/service]. I would love to connect and share details. Open ka ba?`,
    ];

    return {
      referralMessage: message,
      referralAsk: ask,
      benefitFraming: benefit,
      examplesToSend: examples,
      softCTA: cta,
      eliteCoachingTip: includeCoaching
        ? 'Best timing: Within 24 hours of positive interaction. Keep ask super casual. Frame as favor, not demand. Follow up only once if no response.'
        : undefined,
    };
  }

  private getIndustryFraming(industry: string): string {
    if (industry === 'mlm') return 'extra income opportunities or flexible work';
    if (industry === 'insurance') return 'financial protection or planning';
    if (industry === 'real_estate') return 'property investment or homeownership';
    return 'helpful products or services';
  }

  async generateSocialReply(
    userId: string,
    prospectId: string | null,
    commentText: string,
    postType: 'personal' | 'business' | 'life_event' | 'pain_point' | 'neutral' | 'achievement',
    tone: 'friendly' | 'warm' | 'supportive',
    goal: 'relationship_building' | 'nurture' | 'soft_positioning'
  ): Promise<SocialReply> {
    const prospectContext = prospectId ? await this.getProspectContext(prospectId, userId) : null;

    const reply = this.buildSocialReply(commentText, postType, tone, goal);

    await supabase.from('social_media_replies').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: prospectContext?.name,
      comment_text: commentText,
      post_type: postType,
      public_reply: reply.publicReply,
      private_followup_suggestion: reply.privateFollowUpSuggestion,
      risk_warnings: reply.riskWarnings,
      alternative_replies: reply.alternativeReplies,
      goal,
    });

    return reply;
  }

  private buildSocialReply(
    commentText: string,
    postType: string,
    tone: string,
    goal: string
  ): SocialReply {
    let reply = '';
    let followUp = '';
    let warnings = 'Never sell publicly. Pure relationship building only.';
    let alternatives: string[] = [];

    if (postType === 'life_event') {
      reply = 'Congrats! So happy for you! 🎉';
      alternatives = ['Amazing news! Super proud of you!', 'This is wonderful! Cheers to you! 🥳'];
      followUp = 'Wait 1-2 days, then send DM: "How are you feeling about everything? Exciting times!"';
    } else if (postType === 'achievement') {
      reply = 'You deserve this! All your hard work is paying off! 👏';
      alternatives = ['Congrats! Well-earned!', 'So proud of you! Keep crushing it! 💪'];
      followUp = 'Send DM after a day: "Saw your post-super inspiring! Coffee soon?"';
    } else if (postType === 'pain_point') {
      reply = 'Sending good vibes your way. You got this! 💪';
      alternatives = ['Rooting for you! Things will get better.', 'Stay strong! Here if you need anything.'];
      followUp = 'Send supportive DM: "Hey, saw your post. If you ever need someone to talk to, I am here."';
    } else if (postType === 'business') {
      reply = 'Love this! Keep pushing forward! 🚀';
      alternatives = ['This is inspiring!', 'Great work! Keep it up!'];
      followUp = 'DM later: "Your business updates are impressive. Would love to learn more about your journey!"';
    } else if (postType === 'personal') {
      reply = 'This is great! Hope you are having an amazing day!';
      alternatives = ['Love this!', 'So happy to see you thriving!'];
      followUp = 'Casual DM: "Great post! How have you been?"';
    } else {
      reply = 'Thanks for sharing!';
      alternatives = ['Appreciate this!', 'Great content!'];
    }

    return {
      publicReply: reply,
      privateFollowUpSuggestion: followUp,
      riskWarnings: warnings,
      alternativeReplies: alternatives,
    };
  }

  async generateCallScript(
    userId: string,
    prospectId: string,
    goal: 'book_meeting' | 'qualify' | 'close' | 'present',
    industry: 'mlm' | 'insurance' | 'real_estate' | 'product',
    tone: 'friendly' | 'professional' | 'warm'
  ): Promise<CallScript> {
    const context = await this.getProspectContext(prospectId, userId);
    const tier = await this.getUserTier(userId);

    const script = this.buildCallScript(context, goal, industry, tone, tier === 'pro');

    await supabase.from('call_scripts').insert({
      user_id: userId,
      prospect_id: prospectId,
      prospect_name: context.name,
      opening: script.opening,
      rapport: script.rapport,
      discovery_questions: script.discoveryQuestions,
      mini_pitch: script.miniPitch,
      transition: script.transition,
      cta: script.cta,
      fallback_cta: script.fallbackCTA,
      objection_responses: script.objectionResponses,
      elite_coaching_tip: script.eliteCoachingTip,
      goal,
      industry,
      tone,
    });

    return script;
  }

  private buildCallScript(
    context: ProspectContext,
    goal: string,
    industry: string,
    tone: string,
    includeCoaching: boolean
  ): CallScript {
    const greeting = tone === 'professional' ? 'Good day' : 'Hey';

    const opening = `${greeting} ${context.name}! This is [Your Name]. Kumusta? Hope I am not catching you at a bad time?`;

    const rapportRef = context.interests.length > 0
      ? `I saw your interest in ${context.interests[0]}.`
      : context.life_events.length > 0
      ? `Congrats on your recent life changes!`
      : `I wanted to reach out kasi I think you would benefit from this.`;

    const rapport = `${rapportRef} How have you been?`;

    const discoveryQuestions = this.getDiscoveryQuestions(industry, context);

    const miniPitch = this.getMiniPitch(industry, goal);

    const transition = goal === 'book_meeting'
      ? 'I would love to share more details with you. Pwede ba tayo mag-quick call or meet up?'
      : goal === 'qualify'
      ? 'Based on what you said, I think this could really help you. Want to hear more?'
      : 'This sounds like a perfect fit for you. Are you open to moving forward?';

    const cta = goal === 'book_meeting'
      ? 'Pwede ka ba later today or tomorrow for 15 minutes?'
      : goal === 'qualify'
      ? 'Open ka ba to learn more?'
      : 'Ready to get started?';

    const fallbackCTA = goal === 'book_meeting'
      ? 'Or I can send you a quick overview via Messenger first?'
      : 'Or I can send you more info and we can chat later?';

    const objectionResponses = {
      no_time: 'I totally understand. This is actually designed for busy people like you. Just 10-15 minutes of your time could make a huge difference.',
      no_money: 'I hear you. That is exactly why I thought this would help-it is an investment that pays for itself quickly.',
      not_now: 'No problem at all. Can I check back with you in a few weeks? Or would you prefer I send some info you can review on your own time?',
    };

    return {
      opening,
      rapport,
      discoveryQuestions,
      miniPitch,
      transition,
      cta,
      fallbackCTA,
      objectionResponses,
      eliteCoachingTip: includeCoaching
        ? `Call timing: Best between 5-8pm. Keep opening under 30 seconds. Ask permission to continue. Listen more than you talk. If they sound rushed, offer to reschedule immediately.`
        : undefined,
    };
  }

  private getDiscoveryQuestions(industry: string, context: ProspectContext): string[] {
    if (industry === 'mlm') {
      return [
        'Kamusta work lately? Still enjoying it?',
        'Have you ever thought about building a sideline income?',
        context.pain_points.some(p => p.includes('financial'))
          ? 'How is your financial situation these days?'
          : 'What are your goals for the next year?',
      ];
    } else if (industry === 'insurance') {
      return [
        'Have you thought about your financial security recently?',
        'May insurance ka na ba for yourself and your family?',
        'What is your biggest concern when it comes to financial planning?',
      ];
    } else if (industry === 'real_estate') {
      return [
        'Have you thought about investing in property?',
        'Are you looking to buy a home or invest for the future?',
        'What is holding you back from getting into real estate?',
      ];
    }
    return [
      'What are you working on these days?',
      'What are your biggest goals right now?',
      'How can I help you achieve those goals?',
    ];
  }

  private getMiniPitch(industry: string, goal: string): string {
    if (industry === 'mlm') {
      return 'I am working with a proven system that helps people build flexible income. It is perfect for busy people who want to earn on their own time.';
    } else if (industry === 'insurance') {
      return 'I help families secure their financial future through smart protection plans. It is affordable and tailored to Filipino needs.';
    } else if (industry === 'real_estate') {
      return 'I specialize in helping people invest in property-whether for living or for building wealth. Flexible terms available.';
    }
    return 'I have something that I think will really help you based on your goals.';
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
          bucket
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
}

export const advancedMessagingEngines = new AdvancedMessagingEnginesService();
