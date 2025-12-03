import { supabase } from '../../lib/supabase';
import { coinTransactionService } from '../coinTransactionService';
import { energyEngine } from '../energy/energyEngine';

export interface Slide {
  slideNumber: number;
  title: string;
  bullets: string[];
  cta?: string;
}

export interface PitchDeck {
  deckType: 'basic' | 'elite';
  prospectName: string;
  slides: Slide[];
  locked?: boolean;
  upgradePrompt?: string;
}

export interface GenerateDeckInput {
  prospectId: string;
  userId: string;
  deckType: 'basic' | 'elite';
  goal: 'recruit' | 'sell' | 'invite_call' | 'intro';
  tone: 'friendly' | 'professional' | 'confident' | 'warm';
  companyWebsite?: string;
  useCompanyData?: boolean;
}

interface ProspectContext {
  full_name: string;
  interests: string[];
  pain_points: string[];
  life_events: string[];
  dominant_topics: string[];
  personality_traits: any;
  scout_score: number;
  bucket: string;
  explanation_tags: string[];
  company_data?: {
    name?: string;
    industry?: string;
    value_proposition?: string;
    products?: string[];
    achievements?: string[];
    culture?: string;
  };
}

class PitchDeckGeneratorService {
  private readonly COSTS = {
    basic: 25,
    elite: 50,
  };

  async generateDeck(input: GenerateDeckInput): Promise<{ deckId: string; deck: PitchDeck; pendingTransactionId?: string }> {
    // Check energy before proceeding
    const energyCheck = await energyEngine.canPerformAction(input.userId, 'ai_pitch_deck');
    if (!energyCheck.canPerform) {
      throw new Error(energyCheck.reason || 'Insufficient energy');
    }

    // Consume energy
    await energyEngine.tryConsumeEnergyOrThrow(input.userId, 'ai_pitch_deck');

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, coin_balance, weekly_presentations_used, last_reset_date')
      .eq('id', input.userId)
      .single();

    if (!profile) throw new Error('Profile not found');

    const tier = profile.subscription_tier || 'free';

    await this.checkUsageLimits(input.userId, tier, input.deckType, profile.weekly_presentations_used || 0);

    if (input.deckType === 'elite' && tier !== 'elite') {
      return {
        deckId: '',
        deck: {
          deckType: 'elite',
          prospectName: '',
          slides: [],
          locked: true,
          upgradePrompt: 'Unlock Elite Deck to access advanced personalized slides with deeper insights and meeting frameworks.',
        },
      };
    }

    const pendingTransactionId = await coinTransactionService.createPendingTransaction(
      input.userId,
      this.COSTS[input.deckType],
      'spend',
      `${input.deckType} pitch deck generation`,
      input.prospectId
    );

    const prospectContext = await this.getProspectContext(input.prospectId, input.userId);

    if (input.useCompanyData || input.companyWebsite) {
      const companyData = await this.getCompanyData(input.userId, input.companyWebsite);
      prospectContext.company_data = companyData;
    }

    const slides = input.deckType === 'basic'
      ? this.generateBasicDeck(prospectContext, input.goal, input.tone)
      : this.generateEliteDeck(prospectContext, input.goal, input.tone);

    const deckData = {
      user_id: input.userId,
      prospect_id: input.prospectId,
      prospect_name: prospectContext.full_name,
      title: `${input.goal.charAt(0).toUpperCase() + input.goal.slice(1)} Deck for ${prospectContext.full_name}`,
      deck_type: input.deckType,
      goal: input.goal,
      tone: input.tone,
      slides,
      slide_count: slides.length,
      status: 'completed',
      scoutscore_context: {
        score: prospectContext.scout_score,
        bucket: prospectContext.bucket,
        tags: prospectContext.explanation_tags,
      },
      prospect_profile_snapshot: prospectContext,
      version: input.deckType,
    };

    const { data: savedDeck, error } = await supabase
      .from('pitch_decks')
      .insert(deckData)
      .select()
      .single();

    if (error) throw error;

    if (tier === 'free' || tier === 'pro') {
      await supabase
        .from('profiles')
        .update({ weekly_presentations_used: (profile.weekly_presentations_used || 0) + 1 })
        .eq('id', input.userId);
    }

    return {
      deckId: savedDeck.id,
      deck: {
        deckType: input.deckType,
        prospectName: prospectContext.full_name,
        slides,
      },
      pendingTransactionId,
    };
  }

  async completeDeckTransaction(pendingTransactionId: string): Promise<void> {
    await coinTransactionService.completePendingTransaction(pendingTransactionId);
  }

  async failDeckTransaction(pendingTransactionId: string, reason: string): Promise<void> {
    await coinTransactionService.failPendingTransaction(pendingTransactionId, reason);
  }

  private async getCompanyData(userId: string, websiteUrl?: string) {
    try {
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('company_name, industry, value_proposition, products, achievements, mission, culture, company_description')
        .eq('user_id', userId)
        .maybeSingle();

      if (companyProfile) {
        return {
          name: companyProfile.company_name,
          industry: companyProfile.industry,
          value_proposition: companyProfile.value_proposition || companyProfile.company_description,
          products: companyProfile.products || [],
          achievements: companyProfile.achievements || [],
          culture: companyProfile.culture || companyProfile.mission,
        };
      }

      if (websiteUrl) {
        const { data: crawledData } = await supabase
          .from('company_multi_site_data')
          .select('scraped_data')
          .eq('url', websiteUrl)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (crawledData?.scraped_data) {
          const scraped = crawledData.scraped_data as any;
          return {
            name: scraped.companyName,
            industry: scraped.industry || 'Technology',
            value_proposition: scraped.description || scraped.mission,
            products: scraped.products || [],
            achievements: [],
            culture: scraped.values?.join(', ') || scraped.brandTone,
          };
        }
      }

      return undefined;
    } catch (error) {
      console.error('Error fetching company data:', error);
      return undefined;
    }
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
      interests: metadata.interests || metadata.tags || ['Business', 'Networking'],
      pain_points: metadata.pain_points || ['Looking for opportunities'],
      life_events: metadata.life_events || [],
      dominant_topics: metadata.dominant_topics || metadata.tags || ['Business Growth'],
      personality_traits: metadata.personality_traits || {},
      scout_score: metadata.scout_score || 50,
      bucket: metadata.bucket || 'warm',
      explanation_tags: metadata.explanation_tags || ['Active prospect'],
    };
  }

  private generateBasicDeck(context: ProspectContext, goal: string, tone: string): Slide[] {
    const slides: Slide[] = [];

    slides.push(this.generateIntroSlide(context, tone));
    slides.push(this.generateNoticeSlide(context, tone));
    slides.push(this.generateNeedsSlide(context, goal, tone));
    slides.push(this.generateOpportunitySlide(context, goal, tone));
    slides.push(this.generateSolutionSlide(context, goal, tone));
    slides.push(this.generateSuccessSlide(goal, tone, context));
    slides.push(this.generateCTASlide(context, goal, tone));

    return slides;
  }

  private generateEliteDeck(context: ProspectContext, goal: string, tone: string): Slide[] {
    const slides = this.generateBasicDeck(context, goal, tone);

    slides.push(this.generatePersonalizedAngleSlide(context, goal, tone));
    slides.push(this.generateAlignmentSlide(context, goal, tone));
    slides.push(this.generateLifestyleImpactSlide(context, goal, tone));
    slides.push(this.generateObjectionHandlingSlide(goal, tone));
    slides.push(this.generateTimingSlide(context, tone));
    slides.push(this.generateNextStepsSlide(goal, tone));
    slides.push(this.generateConversationScriptSlide(context, goal, tone));
    slides.push(this.generateMeetingInviteSlide(context, tone));

    return slides;
  }

  private generateIntroSlide(context: ProspectContext, tone: string): Slide {
    const greeting = tone === 'professional' ? 'Good day' : tone === 'confident' ? 'Hi' : 'Hello';

    return {
      slideNumber: 1,
      title: `${greeting}, ${context.full_name}!`,
      bullets: [
        `I wanted to share something I think fits perfectly with your goals.`,
        `This is not a generic pitch-it is tailored specifically for you.`,
        `We can explore this opportunity together.`,
      ],
    };
  }

  private generateNoticeSlide(context: ProspectContext, tone: string): Slide {
    const bullets: string[] = [];

    if (context.interests.length > 0) {
      bullets.push(`Nakita ko your interest in ${context.interests[0]}`);
    }

    if (context.life_events.length > 0) {
      const event = context.life_events[0];
      if (event.includes('baby')) {
        bullets.push(`Congrats on your new baby! Exciting times ahead for your family`);
      } else if (event.includes('job')) {
        bullets.push(`I see you recently changed careers-congrats on the new chapter!`);
      } else {
        bullets.push(`I noticed you are going through some exciting life changes`);
      }
    }

    if (context.dominant_topics.length > 0) {
      bullets.push(`Your posts about ${context.dominant_topics[0]} really caught my attention`);
    }

    if (bullets.length === 0) {
      bullets.push(`I have been following your journey and I am impressed`);
      bullets.push(`Your mindset and energy align well with what I am about to share`);
    }

    return {
      slideNumber: 2,
      title: 'What I Noticed About You',
      bullets: bullets.slice(0, 4),
    };
  }

  private generateNeedsSlide(context: ProspectContext, goal: string, tone: string): Slide {
    const bullets: string[] = [];

    const painPointMapping: Record<string, string> = {
      financial_stress: 'Managing finances and looking for more stability',
      income: 'Looking for additional income streams',
      debt: 'Working to reduce financial obligations',
      job_dissatisfaction: 'Wanting more fulfillment from work',
      time_freedom: 'Seeking more flexibility and control over your schedule',
      health: 'Prioritizing health and wellness for you and your family',
      family: 'Providing the best future for your loved ones',
    };

    context.pain_points.forEach((pp) => {
      const key = Object.keys(painPointMapping).find((k) => pp.toLowerCase().includes(k));
      if (key && bullets.length < 3) {
        bullets.push(painPointMapping[key]);
      }
    });

    if (bullets.length === 0) {
      bullets.push('Looking for growth opportunities');
      bullets.push('Building a better future for your family');
      bullets.push('Creating more freedom and flexibility');
    }

    return {
      slideNumber: 3,
      title: 'Your Current Goals & Needs',
      bullets,
    };
  }

  private generateOpportunitySlide(context: ProspectContext, goal: string, tone: string): Slide {
    const title = goal === 'recruit' ? 'The Opportunity' : goal === 'sell' ? 'The Solution' : 'What I Want to Share';

    const bullets: string[] = [];

    if (context.company_data) {
      const { name, value_proposition, industry, products } = context.company_data;

      if (goal === 'recruit') {
        bullets.push(`Join ${name || 'our team'} - a leader in ${industry || 'the industry'}`);
        bullets.push(value_proposition || 'A proven system that helps people build income');
        bullets.push('Flexible schedule with complete training and support');
        if (products && products.length > 0) {
          bullets.push(`Work with our ${products[0]} and grow your own business`);
        }
      } else if (goal === 'sell') {
        bullets.push(`${name || 'We'} offer ${value_proposition || 'solutions designed for you'}`);
        if (products && products.length > 0) {
          bullets.push(`Our ${products[0]} - proven results for Filipino families`);
        } else {
          bullets.push('Proven results from thousands of satisfied clients');
        }
        bullets.push('Affordable, accessible, and backed by our guarantee');
      } else {
        bullets.push(`${name || 'We'} specialize in ${industry || 'helping people like you'}`);
        bullets.push(value_proposition || 'Solutions that align with your goals');
        bullets.push('Worth exploring together');
      }
    } else {
      if (goal === 'recruit') {
        bullets.push('A proven system that helps people build supplemental income');
        bullets.push('Flexible-you work when and how you want');
        bullets.push('Complete training and support from day one');
        bullets.push('Community of driven, success-minded individuals');
      } else if (goal === 'sell') {
        bullets.push('A solution designed specifically for people like you');
        bullets.push('Proven results from thousands of satisfied clients');
        bullets.push('Affordable and accessible for Filipino families');
        bullets.push('Backed by our guarantee and support');
      } else if (goal === 'invite_call') {
        bullets.push('I would love to share more details in a quick conversation');
        bullets.push('No pressure - just a genuine discussion about fit');
        bullets.push('Learn if this aligns with your goals');
      } else {
        bullets.push('Something I think you would genuinely benefit from');
        bullets.push('Aligns perfectly with your interests and goals');
        bullets.push('Worth exploring together');
      }
    }

    return {
      slideNumber: 4,
      title,
      bullets: bullets.slice(0, 4),
    };
  }

  private generateSolutionSlide(context: ProspectContext, goal: string, tone: string): Slide {
    return {
      slideNumber: 5,
      title: 'How This Helps You',
      bullets: [
        'Addresses the needs we just talked about',
        'Fits into your current lifestyle and schedule',
        'Provides a clear path forward with proven steps',
        'Supported by real people who have been where you are',
      ],
    };
  }

  private generateSuccessSlide(goal: string, tone: string, context?: ProspectContext): Slide {
    const bullets: string[] = [];

    if (context?.company_data?.achievements && context.company_data.achievements.length > 0) {
      context.company_data.achievements.slice(0, 3).forEach(achievement => {
        bullets.push(achievement);
      });
      bullets.push('Join our growing community of success stories');
    } else {
      bullets.push('Maraming Filipinos already benefiting from this');
      bullets.push('Real people, real results-not exaggerated promises');
      bullets.push('Some started exactly where you are now');
      bullets.push('Their success shows what is possible with commitment');
    }

    return {
      slideNumber: 6,
      title: 'Success Stories',
      bullets: bullets.slice(0, 4),
    };
  }

  private generateCTASlide(context: ProspectContext, goal: string, tone: string): Slide {
    let cta = '';
    const bullets: string[] = [];

    if (goal === 'recruit') {
      bullets.push('Are you open to learning more about this opportunity?');
      bullets.push('No commitment needed-just explore if it is a fit');
      bullets.push('I can answer any questions you have');
      cta = 'Schedule a quick 15-minute call this week';
    } else if (goal === 'sell') {
      bullets.push('Would you like to see how this works for you?');
      bullets.push('I can walk you through the details');
      bullets.push('Risk-free-satisfaction guaranteed');
      cta = 'Connect with me to discuss your options';
    } else if (goal === 'invite_call') {
      bullets.push('Free ka ba for a quick coffee chat?');
      bullets.push('Virtual or in-person-whatever works for you');
      bullets.push('No pressure, just a conversation');
      cta = 'Reply with your availability this week';
    } else {
      bullets.push('I would love to hear your thoughts on this');
      bullets.push('Open to questions or concerns');
      cta = 'Connect with me soon';
    }

    return {
      slideNumber: 7,
      title: 'Next Step',
      bullets,
      cta,
    };
  }

  private generatePersonalizedAngleSlide(context: ProspectContext, goal: string, tone: string): Slide {
    const bullets: string[] = [];

    if (context.interests.includes('business') || context.interests.includes('entrepreneurship')) {
      bullets.push('Your entrepreneurial mindset is perfect for this');
      bullets.push('This is not just income-it is building your own asset');
    }

    if (context.life_events.some(e => e.includes('baby') || e.includes('family'))) {
      bullets.push('As a parent, financial security matters more than ever');
      bullets.push('This gives you flexibility to be present for your family');
    }

    if (context.explanation_tags.some(t => t.includes('leadership'))) {
      bullets.push('Your leadership potential is evident');
      bullets.push('This is an opportunity to mentor and build a team');
    }

    if (bullets.length === 0) {
      bullets.push('This aligns perfectly with your current goals');
      bullets.push('Your profile shows you are ready for this next step');
    }

    return {
      slideNumber: 8,
      title: 'Why This Fits YOU Specifically',
      bullets: bullets.slice(0, 4),
    };
  }

  private generateAlignmentSlide(context: ProspectContext, goal: string, tone: string): Slide {
    return {
      slideNumber: 9,
      title: 'Financial & Lifestyle Alignment',
      bullets: [
        'Works with your current schedule-not against it',
        'Start small, grow at your own pace',
        'No need to quit your current job',
        'Designed for Filipino families and lifestyles',
      ],
    };
  }

  private generateLifestyleImpactSlide(context: ProspectContext, goal: string, tone: string): Slide {
    return {
      slideNumber: 10,
      title: 'Potential Lifestyle Impact',
      bullets: [
        'More time with family and loved ones',
        'Financial breathing room for goals and plans',
        'Confidence knowing you have multiple income sources',
        'Building something sustainable for the future',
      ],
      cta: 'This is what success could look like for you',
    };
  }

  private generateObjectionHandlingSlide(goal: string, tone: string): Slide {
    return {
      slideNumber: 11,
      title: 'Common Questions (Answered)',
      bullets: [
        '"Walang time?" - Designed to fit around your life',
        '"Mahal ba?" - Flexible payment options available',
        '"Legit ba?" - Registered business with proven track record',
        '"Para sa akin ba to?" - We can find out together',
      ],
    };
  }

  private generateTimingSlide(context: ProspectContext, tone: string): Slide {
    const bullets: string[] = ['Timing matters-and right now is a good time'];

    if (context.life_events.length > 0) {
      bullets.push('Your recent life changes create a perfect window');
    }

    if (context.bucket === 'hot') {
      bullets.push('Your engagement shows you are ready to take action');
    }

    bullets.push('The sooner you start, the sooner you see results');
    bullets.push('Others are already moving forward-do not miss out');

    return {
      slideNumber: 12,
      title: 'Why Now?',
      bullets: bullets.slice(0, 4),
    };
  }

  private generateNextStepsSlide(goal: string, tone: string): Slide {
    return {
      slideNumber: 13,
      title: 'Suggested Next Steps',
      bullets: [
        '1. Schedule a 15-minute intro call',
        '2. Review the details together',
        '3. Try the starter program (if you are ready)',
        '4. Join our community and start building',
      ],
      cta: 'Take the first step together with me',
    };
  }

  private generateConversationScriptSlide(context: ProspectContext, goal: string, tone: string): Slide {
    return {
      slideNumber: 14,
      title: 'Conversation Framework',
      bullets: [
        '"I thought of you kasi I know you are interested in [topic]"',
        '"No pressure-just wanted to share something na baka helpful"',
        '"Pwede ba tayo mag-quick call? 10-15 minutes lang"',
        '"Let me know if you have questions-happy to help"',
      ],
    };
  }

  private generateMeetingInviteSlide(context: ProspectContext, tone: string): Slide {
    return {
      slideNumber: 15,
      title: `Connect with Me, ${context.full_name}`,
      bullets: [
        'I am available this week for a quick chat',
        'Virtual or in-person-your choice',
        'Bring your questions-I will answer everything openly',
        'No obligation-just an honest conversation',
      ],
      cta: 'Reply with your availability and we can make this happen',
    };
  }

  private async checkUsageLimits(userId: string, tier: string, deckType: string, weeklyUsed: number): Promise<void> {
    if (tier === 'free' && weeklyUsed >= 1) {
      throw new Error('Free tier allows 1 deck per week. Upgrade to Pro for 5 per week or use 25 coins.');
    }

    if (tier === 'pro' && weeklyUsed >= 5) {
      throw new Error('Pro tier allows 5 decks per week. Upgrade to Elite for unlimited or use 25 coins.');
    }
  }

  private async checkAndDeductCoins(userId: string, amount: number, description: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', userId)
      .single();

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

  async listDecks(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pitch_decks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDeck(deckId: string, userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('pitch_decks')
      .select('*')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    await supabase
      .from('pitch_decks')
      .update({
        last_viewed_at: new Date().toISOString(),
        view_count: (data.view_count || 0) + 1,
      })
      .eq('id', deckId);

    return data;
  }

  async exportDeck(deckId: string, userId: string, format: 'json' | 'html'): Promise<string> {
    const deck = await this.getDeck(deckId, userId);

    await supabase
      .from('pitch_decks')
      .update({ exported: true })
      .eq('id', deckId);

    if (format === 'json') {
      return JSON.stringify(deck, null, 2);
    }

    return this.generateHTML(deck);
  }

  private generateHTML(deck: any): string {
    const slides = deck.slides || [];
    const slidesHTML = slides.map((slide: Slide) => `
      <div class="slide">
        <h2>${slide.title}</h2>
        <ul>
          ${slide.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
        </ul>
        ${slide.cta ? `<p class="cta">${slide.cta}</p>` : ''}
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${deck.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .slide { background: white; border-radius: 16px; padding: 40px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h2 { color: #1877F2; margin-bottom: 20px; }
    ul { list-style: none; padding: 0; }
    li { margin: 10px 0; padding-left: 20px; position: relative; }
    li:before { content: "•"; position: absolute; left: 0; color: #1877F2; }
    .cta { margin-top: 20px; font-weight: 600; color: #1877F2; }
  </style>
</head>
<body>
  <h1>${deck.title}</h1>
  ${slidesHTML}
</body>
</html>
    `;
  }
}

export const pitchDeckGenerator = new PitchDeckGeneratorService();
