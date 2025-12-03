import { supabase } from '../../lib/supabase';

export interface IndustryModel {
  industry: string;
  modelConfig: any;
  painPoints: string[];
  commonObjections: string[];
  buyingSignals: string[];
  personalityWeights: any;
  scoringWeights: any;
}

export class IndustryModelEngine {

  async getIndustryModel(industry: string): Promise<IndustryModel | null> {
    const { data } = await supabase
      .from('industry_models')
      .select('*')
      .eq('industry', industry)
      .eq('is_active', true)
      .maybeSingle();

    if (!data) return null;

    return {
      industry: data.industry,
      modelConfig: data.model_config,
      painPoints: data.pain_points || [],
      commonObjections: data.common_objections || [],
      buyingSignals: data.buying_signals || [],
      personalityWeights: data.personality_weights || {},
      scoringWeights: data.scoring_weights || {}
    };
  }

  async detectIndustry(prospectData: any, text: string): Promise<string> {
    const lowerText = text.toLowerCase();

    const industryKeywords: Record<string, string[]> = {
      'MLM': [
        'network marketing', 'mlm', 'multi-level', 'recruitment', 'downline', 'upline',
        'sponsor', 'team building', 'passive income', 'residual income', 'business opportunity',
        'financial freedom', 'side hustle', 'extra income', 'work from home'
      ],
      'Insurance': [
        'insurance', 'policy', 'coverage', 'premium', 'protection', 'life insurance',
        'health insurance', 'car insurance', 'family protection', 'beneficiary',
        'claim', 'underwriting', 'agent', 'vul', 'term insurance'
      ],
      'Real_Estate': [
        'real estate', 'property', 'condo', 'house', 'lot', 'pre-selling',
        'investment property', 'rental', 'commercial space', 'residential',
        'developer', 'broker', 'agent', 'title', 'deed', 'mortgage'
      ],
      'Small_Business': [
        'business', 'startup', 'entrepreneur', 'sales', 'marketing', 'customers',
        'revenue', 'profit', 'growth', 'scale', 'product', 'service',
        'b2b', 'b2c', 'smb', 'sme', 'freelance'
      ],
      'Wellness': [
        'health', 'wellness', 'supplement', 'fitness', 'nutrition', 'diet',
        'weight loss', 'detox', 'vitamins', 'organic', 'natural', 'herbal'
      ],
      'Financial_Services': [
        'investment', 'mutual fund', 'stocks', 'trading', 'forex', 'crypto',
        'financial advisor', 'wealth management', 'retirement', 'portfolio'
      ],
      'Education': [
        'training', 'course', 'seminar', 'workshop', 'coaching', 'mentoring',
        'certification', 'online class', 'tutorial', 'learning'
      ]
    };

    const scores: Record<string, number> = {};

    Object.entries(industryKeywords).forEach(([industry, keywords]) => {
      const matchCount = keywords.filter(keyword =>
        lowerText.includes(keyword)
      ).length;

      scores[industry] = matchCount;
    });

    const topIndustry = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])[0];

    if (topIndustry && topIndustry[1] > 0) {
      return topIndustry[0];
    }

    return 'General';
  }

  async applyIndustryTags(prospectId: string, prospectData: any, text: string, industry: string): Promise<string[]> {
    const { data: taggingRules } = await supabase
      .from('industry_tagging_rules')
      .select('*')
      .eq('industry', industry)
      .eq('is_active', true);

    if (!taggingRules || taggingRules.length === 0) {
      return [];
    }

    const appliedTags: string[] = [];
    const lowerText = text.toLowerCase();

    for (const rule of taggingRules) {
      let shouldApply = false;

      switch (rule.rule_type) {
        case 'keyword':
          const keywords = rule.rule_config.keywords || [];
          shouldApply = keywords.some((kw: string) => lowerText.includes(kw.toLowerCase()));
          break;

        case 'pattern':
          const patterns = rule.rule_config.patterns || [];
          shouldApply = patterns.some((pattern: string) => {
            try {
              const regex = new RegExp(pattern, 'i');
              return regex.test(text);
            } catch {
              return false;
            }
          });
          break;

        case 'sentiment':
          const requiredSentiment = rule.rule_config.sentiment;
          shouldApply = prospectData.sentiment === requiredSentiment;
          break;

        case 'behavior':
          const requiredBehaviors = rule.rule_config.behaviors || [];
          shouldApply = requiredBehaviors.some((behavior: string) => {
            return prospectData.interest_tags?.includes(behavior) ||
                   prospectData.objection_type?.includes(behavior);
          });
          break;
      }

      if (shouldApply) {
        appliedTags.push(rule.tag_to_apply);
      }
    }

    return appliedTags;
  }

  async calculateIndustryScore(prospectData: any, industry: string): Promise<number> {
    const model = await this.getIndustryModel(industry);
    if (!model) return 50;

    const weights = model.scoringWeights || {};
    let score = 0;
    let totalWeight = 0;

    if (weights.buying_intent && prospectData.buying_intent) {
      const intentScores: Record<string, number> = {
        'high': 100,
        'medium': 60,
        'low': 20
      };
      score += (intentScores[prospectData.buying_intent] || 50) * weights.buying_intent;
      totalWeight += weights.buying_intent;
    }

    if (weights.sentiment && prospectData.sentiment) {
      const sentimentScores: Record<string, number> = {
        'very_positive': 100,
        'positive': 75,
        'neutral': 50,
        'negative': 25,
        'very_negative': 0
      };
      score += (sentimentScores[prospectData.sentiment] || 50) * weights.sentiment;
      totalWeight += weights.sentiment;
    }

    if (weights.buying_capacity && prospectData.buying_capacity) {
      const capacityScores: Record<string, number> = {
        'very_high': 100,
        'high': 80,
        'medium': 60,
        'low': 30
      };
      score += (capacityScores[prospectData.buying_capacity] || 50) * weights.buying_capacity;
      totalWeight += weights.buying_capacity;
    }

    if (weights.pain_points && prospectData.interest_tags) {
      const painPointMatches = model.painPoints.filter(pp =>
        prospectData.interest_tags?.includes(pp)
      ).length;
      const painScore = Math.min((painPointMatches / model.painPoints.length) * 100, 100);
      score += painScore * weights.pain_points;
      totalWeight += weights.pain_points;
    }

    if (weights.objection_handling && prospectData.objection_type) {
      const hasCommonObjection = prospectData.objection_type.some((obj: string) =>
        model.commonObjections.includes(obj)
      );
      const objectionScore = hasCommonObjection ? 40 : 80;
      score += objectionScore * weights.objection_handling;
      totalWeight += weights.objection_handling;
    }

    if (totalWeight > 0) {
      return score / totalWeight;
    }

    return 50;
  }

  async getPersonalityApproach(personality: string, industry: string): Promise<any> {
    const model = await this.getIndustryModel(industry);
    if (!model) return this.getDefaultApproach(personality);

    const personalityWeights = model.personalityWeights || {};
    const approach = personalityWeights[personality];

    if (approach) {
      return approach;
    }

    return this.getDefaultApproach(personality);
  }

  private getDefaultApproach(personality: string): any {
    const approaches: Record<string, any> = {
      'driver': {
        communication_style: 'direct',
        focus: 'results',
        message_tone: 'efficient',
        key_points: ['ROI', 'efficiency', 'speed', 'results'],
        avoid: ['too much detail', 'slow pace', 'relationship building']
      },
      'amiable': {
        communication_style: 'friendly',
        focus: 'relationship',
        message_tone: 'warm',
        key_points: ['trust', 'support', 'community', 'helping others'],
        avoid: ['aggressive', 'pushy', 'cold']
      },
      'analytical': {
        communication_style: 'detailed',
        focus: 'data',
        message_tone: 'logical',
        key_points: ['proof', 'statistics', 'case studies', 'methodology'],
        avoid: ['emotion', 'hype', 'pressure']
      },
      'expressive': {
        communication_style: 'enthusiastic',
        focus: 'vision',
        message_tone: 'exciting',
        key_points: ['opportunity', 'innovation', 'success stories', 'recognition'],
        avoid: ['boring', 'too technical', 'negative']
      }
    };

    return approaches[personality] || approaches['amiable'];
  }

  async matchProductToProspect(prospectData: any, industry: string, products: any[]): Promise<any[]> {
    const model = await this.getIndustryModel(industry);
    if (!model) return [];

    const matches: any[] = [];

    for (const product of products) {
      let alignmentScore = 0;
      const reasons: string[] = [];

      if (prospectData.interest_tags) {
        const tagMatches = prospectData.interest_tags.filter((tag: string) =>
          product.tags?.includes(tag) || product.categories?.includes(tag)
        ).length;

        if (tagMatches > 0) {
          alignmentScore += tagMatches * 15;
          reasons.push(`Matches ${tagMatches} interest tags`);
        }
      }

      if (prospectData.budget && product.price) {
        const affordability = (prospectData.budget / product.price) * 100;
        if (affordability >= 100) {
          alignmentScore += 25;
          reasons.push('Within budget');
        } else if (affordability >= 70) {
          alignmentScore += 15;
          reasons.push('Slightly above budget');
        }
      }

      if (model.painPoints.some(pp => product.solves_pain_points?.includes(pp))) {
        alignmentScore += 20;
        reasons.push('Solves key pain points');
      }

      if (alignmentScore >= 40) {
        matches.push({
          product_id: product.id,
          product_name: product.name,
          alignment_score: Math.min(alignmentScore, 100),
          alignment_reasons: reasons
        });
      }
    }

    return matches.sort((a, b) => b.alignment_score - a.alignment_score);
  }

  async recommendNextAction(prospectData: any, industry: string): Promise<any> {
    const model = await this.getIndustryModel(industry);
    if (!model) {
      return {
        action: 'send_introduction',
        reason: 'No industry model available'
      };
    }

    if (!prospectData.last_interaction_at) {
      return {
        action: 'send_introduction',
        reason: 'First contact',
        message_template: 'introduction'
      };
    }

    if (prospectData.scoutscore_v10 >= 80) {
      return {
        action: 'schedule_call',
        reason: 'High score prospect',
        urgency: 'high'
      };
    }

    if (prospectData.objection_type && prospectData.objection_type.length > 0) {
      const mainObjection = prospectData.objection_type[0];
      return {
        action: 'handle_objection',
        reason: `Prospect has ${mainObjection} objection`,
        objection: mainObjection,
        recommended_response: await this.getObjectionResponse(mainObjection, industry)
      };
    }

    if (prospectData.sentiment === 'positive' || prospectData.sentiment === 'very_positive') {
      return {
        action: 'send_offer',
        reason: 'Positive sentiment detected',
        offer_type: 'soft_close'
      };
    }

    const hoursSinceLastContact = prospectData.last_interaction_at
      ? (Date.now() - new Date(prospectData.last_interaction_at).getTime()) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceLastContact >= 48) {
      return {
        action: 'send_follow_up',
        reason: 'No contact in 48+ hours',
        message_template: 'gentle_reminder'
      };
    }

    return {
      action: 'nurture',
      reason: 'Continue building relationship',
      message_template: 'value_content'
    };
  }

  private async getObjectionResponse(objection: string, industry: string): Promise<string> {
    const responses: Record<string, Record<string, string>> = {
      'price': {
        'MLM': 'I understand budget is important. Think of this as an investment in your future income, not an expense. Many of our successful members started with similar concerns.',
        'Insurance': 'I hear you. Let me show you how this protection actually saves you money in the long run, especially considering what could happen without it.',
        'Real_Estate': 'Great question. Let\'s look at the payment options and how property values have historically appreciated in this area.',
        'Small_Business': 'I understand ROI is crucial. Let me show you the data on how this has helped similar businesses like yours.'
      },
      'time': {
        'MLM': 'That\'s exactly why this works - it\'s designed for busy people. You can start with just 2-3 hours a week.',
        'Insurance': 'I appreciate your time. This takes just 15 minutes, but protects years of your family\'s future.',
        'Real_Estate': 'I get it. Let me send you the property details you can review in 5 minutes, then we can talk when convenient.',
        'Small_Business': 'Perfect - this solution actually saves you time by automating what you\'re already doing.'
      },
      'trust': {
        'MLM': 'I understand your concern. Let me share testimonials from people just like you, plus our company\'s track record.',
        'Insurance': 'Trust is everything in this business. Let me show you our company ratings and introduce you to some of my clients.',
        'Real_Estate': 'Absolutely valid concern. Here\'s our license, completed projects, and client reviews.',
        'Small_Business': 'Makes sense. Here\'s our case studies, client testimonials, and a no-obligation trial.'
      }
    };

    return responses[objection]?.[industry] || 'I understand your concern. Can we discuss what specific aspect worries you?';
  }

  async switchModelForConversation(prospectData: any, conversationContext: any): Promise<string> {
    const detectedIndustry = await this.detectIndustry(
      prospectData,
      JSON.stringify(conversationContext)
    );

    const model = await this.getIndustryModel(detectedIndustry);

    if (!model) {
      return 'General';
    }

    return detectedIndustry;
  }
}

export const industryModelEngine = new IndustryModelEngine();
