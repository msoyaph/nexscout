/**
 * ScoutScore V7 - CTA Fit / Accuracy Scoring Overlay
 * 
 * Evaluates how well current/last CTA matches lead temperature, industry, and intent
 */
import type { Industry, BaseScoutScore, OverlayScoreV7, ScoutScoreInput } from '../types/scoutScore';

interface CTADefinition {
  id: string;
  when: ('cold' | 'warm' | 'hot')[];
  examples: string[];
  description: string;
}

const CTA_TYPE_MAP: Record<Industry, CTADefinition[]> = {
  mlm: [
    {
      id: 'product_info',
      when: ['cold', 'warm'],
      examples: ['product information', 'learn about products', 'product details'],
      description: 'Request product information',
    },
    {
      id: 'starter_kit_offer',
      when: ['warm', 'hot'],
      examples: ['starter kit', 'get started', 'join with starter'],
      description: 'Offer starter kit to begin',
    },
    {
      id: 'business_call',
      when: ['hot'],
      examples: ['business call', 'opportunity call', 'discuss business'],
      description: 'Schedule business opportunity call',
    },
    {
      id: 'testimonial_share',
      when: ['warm'],
      examples: ['success stories', 'testimonials', 'reviews'],
      description: 'Share success stories and testimonials',
    },
  ],
  insurance: [
    {
      id: 'quote_request',
      when: ['cold', 'warm'],
      examples: ['get quote', 'quote', 'pricing', 'how much'],
      description: 'Request insurance quote',
    },
    {
      id: 'consultation_call',
      when: ['warm', 'hot'],
      examples: ['consultation', 'discuss needs', 'planning session'],
      description: 'Schedule consultation call',
    },
    {
      id: 'application_start',
      when: ['hot'],
      examples: ['apply', 'application', 'sign up', 'get covered'],
      description: 'Start insurance application',
    },
  ],
  real_estate: [
    {
      id: 'send_listing',
      when: ['cold', 'warm'],
      examples: ['property list', 'available properties', 'show listings'],
      description: 'Send property listings',
    },
    {
      id: 'schedule_viewing',
      when: ['warm', 'hot'],
      examples: ['schedule viewing', 'property viewing', 'site visit'],
      description: 'Schedule property viewing',
    },
    {
      id: 'reservation_invitation',
      when: ['hot'],
      examples: ['reserve', 'reservation', 'book unit', 'hold property'],
      description: 'Invite to reserve property',
    },
  ],
  ecommerce: [
    {
      id: 'product_catalog',
      when: ['cold', 'warm'],
      examples: ['product list', 'catalog', 'available products'],
      description: 'Share product catalog',
    },
    {
      id: 'add_to_cart',
      when: ['warm', 'hot'],
      examples: ['add to cart', 'order now', 'buy now'],
      description: 'Add items to cart',
    },
    {
      id: 'checkout_prompt',
      when: ['hot'],
      examples: ['checkout', 'complete order', 'place order'],
      description: 'Prompt to complete checkout',
    },
  ],
  clinic: [
    {
      id: 'consultation_booking',
      when: ['cold', 'warm', 'hot'],
      examples: ['book consultation', 'schedule appointment', 'set appointment'],
      description: 'Book medical consultation',
    },
    {
      id: 'treatment_package',
      when: ['warm', 'hot'],
      examples: ['treatment package', 'package deal', 'treatment plan'],
      description: 'Offer treatment package',
    },
  ],
  loans: [
    {
      id: 'loan_inquiry',
      when: ['cold', 'warm'],
      examples: ['loan inquiry', 'loan information', 'loan details'],
      description: 'General loan inquiry',
    },
    {
      id: 'application_start',
      when: ['warm', 'hot'],
      examples: ['apply for loan', 'loan application', 'submit application'],
      description: 'Start loan application',
    },
  ],
  auto: [
    {
      id: 'showroom_visit',
      when: ['cold', 'warm'],
      examples: ['showroom visit', 'view cars', 'test drive'],
      description: 'Visit showroom or view cars',
    },
    {
      id: 'test_drive',
      when: ['warm', 'hot'],
      examples: ['test drive', 'try car', 'drive test'],
      description: 'Schedule test drive',
    },
    {
      id: 'financing_discussion',
      when: ['hot'],
      examples: ['financing', 'payment plan', 'down payment'],
      description: 'Discuss financing options',
    },
  ],
  franchise: [
    {
      id: 'franchise_info',
      when: ['cold', 'warm'],
      examples: ['franchise info', 'franchise details', 'learn about franchise'],
      description: 'Request franchise information',
    },
    {
      id: 'franchise_presentation',
      when: ['warm', 'hot'],
      examples: ['presentation', 'discussion', 'meeting'],
      description: 'Attend franchise presentation',
    },
    {
      id: 'franchise_application',
      when: ['hot'],
      examples: ['apply', 'application', 'join franchise'],
      description: 'Submit franchise application',
    },
  ],
  coaching: [
    {
      id: 'coaching_info',
      when: ['cold', 'warm'],
      examples: ['coaching program', 'program details', 'learn more'],
      description: 'Request coaching program information',
    },
    {
      id: 'discovery_call',
      when: ['warm', 'hot'],
      examples: ['discovery call', 'free consultation', 'discuss goals'],
      description: 'Schedule discovery/consultation call',
    },
    {
      id: 'program_enrollment',
      when: ['hot'],
      examples: ['enroll', 'join program', 'start coaching'],
      description: 'Enroll in coaching program',
    },
  ],
  saas: [
    {
      id: 'demo_request',
      when: ['cold', 'warm'],
      examples: ['demo', 'trial', 'free trial', 'test'],
      description: 'Request product demo or trial',
    },
    {
      id: 'pricing_discussion',
      when: ['warm', 'hot'],
      examples: ['pricing', 'plans', 'packages', 'cost'],
      description: 'Discuss pricing and plans',
    },
    {
      id: 'subscription_start',
      when: ['hot'],
      examples: ['subscribe', 'get started', 'start trial'],
      description: 'Start subscription or trial',
    },
  ],
  travel: [
    {
      id: 'travel_packages',
      when: ['cold', 'warm'],
      examples: ['travel packages', 'tour packages', 'destinations'],
      description: 'Browse travel packages',
    },
    {
      id: 'booking_inquiry',
      when: ['warm', 'hot'],
      examples: ['book trip', 'reserve', 'booking', 'travel dates'],
      description: 'Inquire about booking',
    },
    {
      id: 'payment_processing',
      when: ['hot'],
      examples: ['payment', 'confirm booking', 'pay deposit'],
      description: 'Process payment for booking',
    },
  ],
  beauty: [
    {
      id: 'product_info',
      when: ['cold', 'warm'],
      examples: ['product information', 'product details', 'ingredients'],
      description: 'Request product information',
    },
    {
      id: 'sample_request',
      when: ['warm'],
      examples: ['sample', 'try product', 'test'],
      description: 'Request product sample',
    },
    {
      id: 'purchase_prompt',
      when: ['hot'],
      examples: ['buy', 'order', 'add to cart', 'purchase'],
      description: 'Prompt to purchase',
    },
  ],
  other: [
    {
      id: 'general_inquiry',
      when: ['cold', 'warm', 'hot'],
      examples: ['inquiry', 'information', 'learn more'],
      description: 'General inquiry',
    },
  ],
};

export class ScoutScoringV7Engine {
  /**
   * Calculate CTA fit overlay score
   */
  async calculateCTAOverlay(
    input: ScoutScoreInput,
    baseScore: BaseScoutScore,
    industry: Industry
  ): Promise<OverlayScoreV7> {
    const lastCTAType = input.lastCTAType || null;
    const leadTemperature = baseScore.leadTemperature;
    const intentSignal = baseScore.intentSignal;

    // Industry safety: use provided industry or fallback to 'other'
    const availableCTAs = CTA_TYPE_MAP[industry] || CTA_TYPE_MAP.other;
    
    if (!CTA_TYPE_MAP[industry]) {
      console.warn(`[ScoutScore V7] Industry "${industry}" not in CTA type map, using generic CTAs`);
    }

    // Evaluate current CTA fit
    let ctaFitScore = 50; // Neutral default
    let ctaNotes: string[] = [];

    if (lastCTAType) {
      const currentCTA = availableCTAs.find(cta => cta.id === lastCTAType);
      
      if (currentCTA) {
        // Check if CTA is appropriate for current temperature
        const isAppropriate = currentCTA.when.includes(leadTemperature);
        
        if (isAppropriate) {
          // CTA matches temperature - good fit
          if (leadTemperature === 'hot' && currentCTA.when.includes('hot')) {
            ctaFitScore = 90; // Perfect for hot leads
            ctaNotes.push('CTA is appropriate for hot lead');
          } else if (leadTemperature === 'warm' && currentCTA.when.includes('warm')) {
            ctaFitScore = 80; // Good for warm leads
            ctaNotes.push('CTA is appropriate for warm lead');
          } else {
            ctaFitScore = 70; // Acceptable
            ctaNotes.push('CTA is acceptable for current lead temperature');
          }
        } else {
          // CTA doesn't match temperature - misaligned
          if (leadTemperature === 'cold' && currentCTA.when.includes('hot')) {
            ctaFitScore = 30; // Too aggressive for cold lead
            ctaNotes.push('⚠️ CTA is too aggressive for cold lead - may scare away prospect');
          } else if (leadTemperature === 'hot' && currentCTA.when.includes('cold')) {
            ctaFitScore = 40; // Too weak for hot lead
            ctaNotes.push('⚠️ CTA is too weak for hot lead - may miss conversion opportunity');
          } else {
            ctaFitScore = 50; // Neutral mismatch
            ctaNotes.push('CTA may not be optimal for current lead temperature');
          }
        }
      } else {
        // Unknown CTA type
        ctaFitScore = 45;
        ctaNotes.push('Unknown CTA type - cannot evaluate fit');
      }
    } else {
      // No CTA used yet
      ctaNotes.push('No CTA has been used yet');
    }

    // Suggest best CTA based on temperature and intent
    const suggestedCTAType = this.suggestBestCTA(availableCTAs, leadTemperature, intentSignal);
    
    if (suggestedCTAType && suggestedCTAType !== lastCTAType) {
      ctaNotes.push(`💡 Suggested CTA: ${suggestedCTAType.id} - ${suggestedCTAType.description}`);
    } else if (suggestedCTAType && suggestedCTAType === lastCTAType) {
      ctaNotes.push(`✅ Current CTA is optimal: ${suggestedCTAType.description}`);
    }

    return {
      version: 'v7',
      ctaFitScore,
      lastCTAType,
      suggestedCTAType: suggestedCTAType?.id || null,
      ctaNotes,
    };
  }

  /**
   * Suggest best CTA based on temperature and intent
   */
  private suggestBestCTA(
    availableCTAs: CTADefinition[],
    temperature: 'cold' | 'warm' | 'hot',
    intentSignal: string | null
  ): CTADefinition | null {
    // Filter CTAs appropriate for current temperature
    const appropriateCTAs = availableCTAs.filter(cta => cta.when.includes(temperature));
    
    if (appropriateCTAs.length === 0) {
      // Fallback to any CTA
      return availableCTAs[0] || null;
    }

    // If hot lead, prefer hot-specific CTAs
    if (temperature === 'hot') {
      const hotOnlyCTAs = appropriateCTAs.filter(cta => 
        cta.when.includes('hot') && !cta.when.includes('cold') && !cta.when.includes('warm')
      );
      if (hotOnlyCTAs.length > 0) {
        return hotOnlyCTAs[0];
      }
    }

    // If warm lead, prefer warm-specific or hot CTAs
    if (temperature === 'warm') {
      const warmHotCTAs = appropriateCTAs.filter(cta => 
        cta.when.includes('warm') || cta.when.includes('hot')
      );
      if (warmHotCTAs.length > 0) {
        return warmHotCTAs[0];
      }
    }

    // Default to first appropriate CTA
    return appropriateCTAs[0];
  }
}

export const scoutScoringV7Engine = new ScoutScoringV7Engine();


