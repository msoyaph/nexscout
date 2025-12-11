/**
 * ScoutScore V6 - Multi-Industry Persona Scoring Overlay
 * 
 * Translates industry + conversation content into persona profiles
 * and adjusts scoring based on persona fit
 */
import type { Industry, BaseScoutScore, OverlayScoreV6, ScoutScoreInput } from '../types/scoutScore';

interface PersonaProfile {
  id: string;
  keywords: string[];
  phrases: string[];
  notes: string[];
  description: string;
}

const PERSONA_PROFILES: Record<Industry, PersonaProfile[]> = {
  mlm: [
    {
      id: 'aspiring_side_hustler',
      keywords: ['extra income', 'sideline', 'part time', 'part-time', 'side hustle', 'kita', 'dagdag kita'],
      phrases: ['gusto ko ng extra income', 'may sideline ba', 'may part time work'],
      notes: ['Highly motivated by income opportunity', 'Flexible time availability', 'Quick decision makers'],
      description: 'Seeks additional income through flexible business opportunities',
    },
    {
      id: 'health_first_income_second',
      keywords: ['health', 'wellness', 'product', 'supplement', 'kalusugan', 'fit'],
      phrases: ['gusto ko try product', 'for health', 'wellness first'],
      notes: ['Product-focused initially', 'May convert to business opportunity', 'Health-conscious'],
      description: 'Interested primarily in products, potential business conversion',
    },
    {
      id: 'burned_by_previous_mlm',
      keywords: ['scam', 'waste', 'nagtry na ako', 'nawalan', 'naloko'],
      phrases: ['nagtry na ako ng MLM', 'scam yan', 'naloko na ako'],
      notes: ['High skepticism', 'Needs strong proof', 'Requires trust-building'],
      description: 'Has negative past experience, needs extra reassurance',
    },
    {
      id: 'network_builder',
      keywords: ['team', 'recruit', 'leadership', 'build', 'network', 'people'],
      phrases: ['gusto ko mag-recruit', 'build team', 'leadership'],
      notes: ['Natural leader', 'Team-oriented', 'High potential'],
      description: 'Focused on building and leading teams',
    },
  ],
  insurance: [
    {
      id: 'family_protector',
      keywords: ['family', 'kids', 'children', 'anak', 'pamilya', 'education', 'future'],
      phrases: ['para sa family', 'para sa future ng anak', 'education plan'],
      notes: ['Family-focused decisions', 'Long-term planning', 'Responsible buyer'],
      description: 'Makes decisions to protect family and secure children\'s future',
    },
    {
      id: 'ofw_supporter',
      keywords: ['OFW', 'overseas', 'abroad', 'remittance', 'padala'],
      phrases: ['OFW ako', 'working abroad', 'para sa family sa pinas'],
      notes: ['International perspective', 'Regular income', 'Strong sense of responsibility'],
      description: 'Overseas worker securing family back home',
    },
    {
      id: 'skeptical_about_policies',
      keywords: ['scam', 'legit', 'totoo ba', 'trust', 'reliable', 'proven'],
      phrases: ['legit ba to', 'scam ba', 'proven ba'],
      notes: ['High skepticism', 'Needs proof', 'Trust-building critical'],
      description: 'Skeptical about insurance policies, needs validation',
    },
    {
      id: 'health_conscious',
      keywords: ['health', 'hospital', 'medical', 'sickness', 'emergency'],
      phrases: ['health insurance', 'medical emergency', 'hospital coverage'],
      notes: ['Health-aware', 'Risk-averse', 'Values protection'],
      description: 'Focused on health and medical coverage',
    },
  ],
  real_estate: [
    {
      id: 'first_time_homebuyer',
      keywords: ['first time', 'buying house', 'own house', 'home', 'bahay'],
      phrases: ['first time buyer', 'gusto ko ng own house', 'home buying'],
      notes: ['Excited but cautious', 'Needs education', 'Price-sensitive'],
      description: 'First-time homebuyer, needs guidance',
    },
    {
      id: 'investor_flipper',
      keywords: ['investment', 'ROI', 'rent', 'income property', 'flip'],
      phrases: ['investment property', 'rental income', 'flip property'],
      notes: ['Business-minded', 'Quick decisions', 'Numbers-focused'],
      description: 'Real estate investor focused on returns',
    },
    {
      id: 'retiree_planner',
      keywords: ['retirement', 'retire', 'future', 'peaceful', 'quiet'],
      phrases: ['para sa retirement', 'peaceful place', 'retirement home'],
      notes: ['Long-term planning', 'Peace-seeking', 'Quality-focused'],
      description: 'Planning for retirement, values peace and quality',
    },
  ],
  ecommerce: [
    {
      id: 'bargain_hunter',
      keywords: ['sale', 'discount', 'promo', 'cheap', 'mura', 'lowest price'],
      phrases: ['may discount ba', 'sale', 'promo', 'mura lang'],
      notes: ['Price-sensitive', 'Deal-seeker', 'Quick buyer on deals'],
      description: 'Price-conscious, seeks deals and discounts',
    },
    {
      id: 'fast_cod_buyer',
      keywords: ['COD', 'cash on delivery', 'fast delivery', 'quick', 'bilis'],
      phrases: ['COD available', 'bilis delivery', 'cash on delivery'],
      notes: ['Convenience-focused', 'Prefers COD', 'Quick purchase decisions'],
      description: 'Prefers COD and fast delivery',
    },
    {
      id: 'quality_focused',
      keywords: ['quality', 'brand', 'original', 'authentic', 'durable'],
      phrases: ['original ba', 'authentic', 'good quality', 'durable'],
      notes: ['Quality over price', 'Brand-conscious', 'Willing to pay more'],
      description: 'Values quality and authenticity over price',
    },
  ],
  clinic: [
    {
      id: 'health_seeker',
      keywords: ['treatment', 'consultation', 'checkup', 'diagnosis', 'health'],
      phrases: ['need treatment', 'consultation', 'health check'],
      notes: ['Health-focused', 'Treatment-seeking', 'Urgent care'],
      description: 'Seeks medical treatment or consultation',
    },
    {
      id: 'aesthetic_seeker',
      keywords: ['beauty', 'aesthetic', 'skincare', 'treatment', 'improve'],
      phrases: ['aesthetic treatment', 'beauty services', 'skincare'],
      notes: ['Beauty-focused', 'Self-improvement', 'Appearance-conscious'],
      description: 'Interested in aesthetic and beauty treatments',
    },
  ],
  loans: [
    {
      id: 'urgent_borrower',
      keywords: ['urgent', 'asap', 'emergency', 'needed now', 'kailangan'],
      phrases: ['urgent need', 'asap', 'emergency', 'kailangan na'],
      notes: ['Time-sensitive', 'Urgent need', 'May accept higher rates'],
      description: 'Urgent borrowing need, time-sensitive',
    },
    {
      id: 'planned_borrower',
      keywords: ['plan', 'future', 'prepare', 'consider', 'research'],
      phrases: ['planning to borrow', 'for future', 'considering'],
      notes: ['Planned approach', 'Researching options', 'Rate-conscious'],
      description: 'Planning ahead, researching options',
    },
  ],
  auto: [
    {
      id: 'first_car_buyer',
      keywords: ['first car', 'first time', 'beginner', 'new driver'],
      phrases: ['first car', 'first time buyer', 'new driver'],
      notes: ['Needs guidance', 'Budget-conscious', 'Safety-focused'],
      description: 'First-time car buyer, needs assistance',
    },
    {
      id: 'upgrade_seeker',
      keywords: ['upgrade', 'better', 'newer', 'replace', 'trade'],
      phrases: ['upgrade car', 'replace', 'better model'],
      notes: ['Experience buyer', 'Knows what they want', 'Quality-focused'],
      description: 'Looking to upgrade existing vehicle',
    },
  ],
  franchise: [
    {
      id: 'first_franchise',
      keywords: ['first business', 'start business', 'franchise', 'invest'],
      phrases: ['first business', 'start business', 'franchise opportunity'],
      notes: ['New to business', 'Needs guidance', 'Risk-aware'],
      description: 'First-time franchise buyer',
    },
    {
      id: 'experienced_franchisee',
      keywords: ['multiple', 'expand', 'another location', 'success'],
      phrases: ['expand business', 'another location', 'multiple franchises'],
      notes: ['Experienced', 'Proven track record', 'Quick decisions'],
      description: 'Experienced franchisee looking to expand',
    },
  ],
  coaching: [
    {
      id: 'career_changer',
      keywords: ['career change', 'new career', 'transition', 'learn'],
      phrases: ['change career', 'new career', 'career transition'],
      notes: ['Seeking change', 'Learning-focused', 'Motivated'],
      description: 'Looking to change careers',
    },
    {
      id: 'skill_enhancer',
      keywords: ['improve', 'skills', 'better', 'advance', 'growth'],
      phrases: ['improve skills', 'skill development', 'career growth'],
      notes: ['Growth-oriented', 'Investment-minded', 'Self-improvement'],
      description: 'Seeks to enhance existing skills',
    },
  ],
  saas: [
    {
      id: 'solo_entrepreneur',
      keywords: ['solo', 'startup', 'small business', 'automate'],
      phrases: ['solo business', 'small startup', 'automate tasks'],
      notes: ['Resource-constrained', 'Efficiency-focused', 'Price-sensitive'],
      description: 'Solo entrepreneur or small startup',
    },
    {
      id: 'enterprise_buyer',
      keywords: ['team', 'company', 'enterprise', 'scale'],
      phrases: ['for company', 'team use', 'enterprise solution'],
      notes: ['Budget available', 'Team-focused', 'Scalability important'],
      description: 'Enterprise or team buyer',
    },
  ],
  travel: [
    {
      id: 'budget_traveler',
      keywords: ['budget', 'cheap', 'affordable', 'mura', 'promo'],
      phrases: ['budget travel', 'affordable', 'cheap package'],
      notes: ['Price-sensitive', 'Deal-seeker', 'Flexible'],
      description: 'Budget-conscious traveler',
    },
    {
      id: 'luxury_traveler',
      keywords: ['luxury', 'premium', 'best', 'quality', 'experience'],
      phrases: ['luxury travel', 'premium package', 'best experience'],
      notes: ['Quality-focused', 'Experience-oriented', 'Less price-sensitive'],
      description: 'Seeks premium travel experiences',
    },
  ],
  beauty: [
    {
      id: 'regular_customer',
      keywords: ['regular', 'favorite', 'always', 'fan', 'loyal'],
      phrases: ['regular customer', 'always buy', 'favorite brand'],
      notes: ['Brand loyal', 'Repeat buyer', 'Quick decisions'],
      description: 'Regular beauty product customer',
    },
    {
      id: 'trial_seeker',
      keywords: ['try', 'sample', 'test', 'new', 'discover'],
      phrases: ['try new', 'sample', 'test product'],
      notes: ['Experimenting', 'Trying new things', 'Open to suggestions'],
      description: 'Seeks to try new products',
    },
  ],
  other: [
    {
      id: 'generic_buyer',
      keywords: ['interested', 'want', 'need', 'looking'],
      phrases: ['interested', 'want to know', 'looking for'],
      notes: ['Generic interest', 'Needs qualification', 'Standard approach'],
      description: 'Generic buyer profile',
    },
  ],
};

export class ScoutScoringV6Engine {
  /**
   * Calculate persona fit overlay score
   */
  async calculatePersonaOverlay(
    input: ScoutScoreInput,
    baseScore: BaseScoutScore,
    industry: Industry
  ): Promise<OverlayScoreV6> {
    const messages = input.lastMessages || [];
    const combinedText = messages
      .filter(m => m.sender === 'user')
      .map(m => m.message.toLowerCase())
      .join(' ');

    // Industry safety: use provided industry or fallback to 'other'
    const personas = PERSONA_PROFILES[industry] || PERSONA_PROFILES.other;
    
    if (!PERSONA_PROFILES[industry]) {
      console.warn(`[ScoutScore V6] Industry "${industry}" not in persona profiles, using generic personas`);
    }
    
    // Score each persona
    const personaScores = personas.map(persona => {
      let score = 0;
      const matchedKeywords: string[] = [];
      
      // Check keywords
      for (const keyword of persona.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          score += 15;
          matchedKeywords.push(keyword);
        }
      }
      
      // Check phrases (higher weight)
      for (const phrase of persona.phrases) {
        if (combinedText.includes(phrase.toLowerCase())) {
          score += 25;
        }
      }
      
      return {
        persona,
        score: Math.min(100, score),
        matchedKeywords,
      };
    });

    // Find best matching persona
    personaScores.sort((a, b) => b.score - a.score);
    const topMatch = personaScores[0];
    
    // Calculate persona fit score (0-100)
    let personaFitScore = topMatch.score;
    
    // If multiple personas match, average top 2
    if (personaScores.length > 1 && personaScores[1].score > 30) {
      personaFitScore = Math.round((topMatch.score + personaScores[1].score) / 2);
    }
    
    // If no strong match, use generic
    if (personaFitScore < 30) {
      return {
        version: 'v6',
        industry,
        personaProfile: 'generic',
        personaFitScore: 50,
        personaNotes: ['No strong persona match detected - using generic profile'],
      };
    }

    const personaNotes: string[] = [
      `Matched persona: ${topMatch.persona.description}`,
      ...topMatch.persona.notes,
    ];

    if (topMatch.matchedKeywords.length > 0) {
      personaNotes.push(`Matched keywords: ${topMatch.matchedKeywords.slice(0, 3).join(', ')}`);
    }

    return {
      version: 'v6',
      industry,
      personaProfile: topMatch.persona.id,
      personaFitScore,
      personaNotes,
    };
  }
}

export const scoutScoringV6Engine = new ScoutScoringV6Engine();


