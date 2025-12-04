import { supabase } from '../../../lib/supabase';
import { emotionalTrackingEngine } from './emotionalTrackingEngine';

interface PitchPersonalization {
  prospectId: string;
  deckId: string;
  emotionalProfile: any;
  behavioralProfile: any;
  adaptations: string[];
  slideModifications: any[];
  toneAdjustments: string[];
  contentPriority: string[];
}

export const hyperPersonalizedPitchEngineV5 = {
  async personalizePitchDeck(params: {
    prospectId: string;
    baseDeckId: string;
    emotionalData?: any;
    behavioralData?: any;
    productData?: any[];
  }): Promise<PitchPersonalization> {
    const { prospectId, baseDeckId, productData } = params;

    let emotionalData = params.emotionalData;
    if (!emotionalData) {
      emotionalData = await emotionalTrackingEngine.getLatestEmotionalState(prospectId);
    }

    const adaptations: string[] = [];
    const slideModifications: any[] = [];
    const toneAdjustments: string[] = [];
    const contentPriority: string[] = [];

    if (emotionalData) {
      const emotionAdaptations = this.adaptForEmotion(emotionalData);
      adaptations.push(...emotionAdaptations.changes);
      slideModifications.push(...emotionAdaptations.slides);
      toneAdjustments.push(...emotionAdaptations.tone);
    }

    if (params.behavioralData) {
      const behaviorAdaptations = this.adaptForBehavior(params.behavioralData);
      adaptations.push(...behaviorAdaptations.changes);
      contentPriority.push(...behaviorAdaptations.priority);
    }

    const personalization: PitchPersonalization = {
      prospectId,
      deckId: baseDeckId,
      emotionalProfile: emotionalData,
      behavioralProfile: params.behavioralData,
      adaptations,
      slideModifications,
      toneAdjustments,
      contentPriority
    };

    await this.savePersonalizationRecord(personalization);

    return personalization;
  },

  adaptForEmotion(emotionalData: any): any {
    const changes: string[] = [];
    const slides: any[] = [];
    const tone: string[] = [];

    const primaryEmotion = emotionalData.primaryEmotion;
    const buyingIntent = emotionalData.buyingIntentScore;

    switch (primaryEmotion) {
      case 'fear':
        changes.push('Emphasis on security and guarantees');
        changes.push('Add risk mitigation slides');
        slides.push({ type: 'security_guarantee', priority: 'high' });
        slides.push({ type: 'testimonials', priority: 'high' });
        tone.push('reassuring', 'professional', 'trustworthy');
        break;

      case 'excitement':
        changes.push('Highlight opportunity and growth');
        changes.push('Add success stories prominently');
        slides.push({ type: 'success_stories', priority: 'high' });
        slides.push({ type: 'income_potential', priority: 'high' });
        tone.push('enthusiastic', 'inspiring', 'energetic');
        break;

      case 'skepticism':
        changes.push('Provide proof and data');
        changes.push('Add compliance and legitimacy info');
        slides.push({ type: 'proof_results', priority: 'high' });
        slides.push({ type: 'legitimacy', priority: 'high' });
        slides.push({ type: 'company_background', priority: 'medium' });
        tone.push('factual', 'transparent', 'evidence-based');
        break;

      case 'urgency':
        changes.push('Add time-sensitive offers');
        changes.push('Emphasize limited availability');
        slides.push({ type: 'limited_offer', priority: 'high' });
        slides.push({ type: 'fast_action_bonus', priority: 'medium' });
        tone.push('urgent', 'action-oriented', 'direct');
        break;

      case 'interest':
        changes.push('Educational approach');
        changes.push('Deep dive into benefits');
        slides.push({ type: 'how_it_works', priority: 'high' });
        slides.push({ type: 'detailed_benefits', priority: 'high' });
        tone.push('informative', 'engaging', 'detailed');
        break;

      default:
        changes.push('Balanced approach');
        tone.push('professional', 'friendly');
    }

    if (buyingIntent > 0.7) {
      changes.push('Add strong CTA on every slide');
      changes.push('Shorten deck to 5-7 slides');
      slides.push({ type: 'pricing', priority: 'high' });
      slides.push({ type: 'next_steps', priority: 'high' });
    }

    return { changes, slides, tone };
  },

  adaptForBehavior(behaviorData: any): any {
    const changes: string[] = [];
    const priority: string[] = [];

    const archetype = behaviorData.archetype;
    const decisionSpeed = behaviorData.decisionMakingSpeed;
    const priceOrientation = behaviorData.priceOrientation;

    switch (archetype) {
      case 'logical_buyer':
        changes.push('Data-driven presentation');
        changes.push('ROI calculations prominent');
        priority.push('statistics', 'proof', 'comparisons', 'roi');
        break;

      case 'emotional_buyer':
        changes.push('Story-based presentation');
        changes.push('Lifestyle and transformation focus');
        priority.push('stories', 'testimonials', 'lifestyle', 'community');
        break;

      case 'price_sensitive':
        changes.push('Value proposition emphasis');
        changes.push('Cost breakdown and payment plans');
        priority.push('pricing', 'payment_plans', 'value', 'savings');
        break;

      case 'opportunity_seeker':
        changes.push('Income potential highlighted');
        changes.push('Earnings examples and calculations');
        priority.push('income', 'earnings', 'growth', 'potential');
        break;

      case 'fast_decision_maker':
        changes.push('Concise presentation (5 slides max)');
        changes.push('Clear pricing and CTA upfront');
        priority.push('summary', 'pricing', 'cta', 'next_steps');
        break;

      case 'slow_researcher':
        changes.push('Detailed presentation (12+ slides)');
        changes.push('FAQ and resource section');
        priority.push('details', 'faq', 'resources', 'comparisons', 'testimonials');
        break;
    }

    if (priceOrientation === 'price_focused') {
      priority.unshift('pricing', 'payment_plans', 'discounts');
    } else if (priceOrientation === 'value_focused') {
      priority.unshift('benefits', 'quality', 'long_term_value');
    }

    return { changes, priority };
  },

  async savePersonalizationRecord(personalization: PitchPersonalization): Promise<void> {
    await supabase.from('pitch_personalization_records').insert({
      prospect_id: personalization.prospectId,
      deck_id: personalization.deckId,
      emotional_profile: personalization.emotionalProfile,
      behavioral_profile: personalization.behavioralProfile,
      adaptations_made: personalization.adaptations,
      slide_modifications: personalization.slideModifications,
      tone_adjustments: personalization.toneAdjustments,
      content_priority_order: personalization.contentPriority,
      conversion_result: null,
      feedback_score: null
    });
  },

  async recordConversionResult(prospectId: string, deckId: string, converted: boolean, feedbackScore?: number): Promise<void> {
    await supabase
      .from('pitch_personalization_records')
      .update({
        conversion_result: converted,
        feedback_score: feedbackScore,
        updated_at: new Date().toISOString()
      })
      .eq('prospect_id', prospectId)
      .eq('deck_id', deckId);
  },

  async getTopPerformingPersonalizations(limit: number = 10): Promise<any[]> {
    const { data } = await supabase
      .from('pitch_personalization_records')
      .select('*')
      .eq('conversion_result', true)
      .order('feedback_score', { ascending: false })
      .limit(limit);

    return data || [];
  }
};
