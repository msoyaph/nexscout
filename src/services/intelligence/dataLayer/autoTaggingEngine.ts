import { supabase } from '../../../lib/supabase';

interface ClassificationResult {
  classified_industry: string;
  detected_personas: string[];
  top_keywords: string[];
  confidence_scores: {
    industry: number;
    personas: Record<string, number>;
  };
}

interface ProductClassification {
  category: string;
  niche_flags: string[];
  persona_match: string[];
  confidence_scores: {
    category: number;
    niches: Record<string, number>;
  };
}

const INDUSTRY_PATTERNS = {
  mlm: {
    keywords: ['network marketing', 'mlm', 'multi-level', 'downline', 'upline', 'distributor', 'recruiting', 'team building'],
    weight: 1.0
  },
  insurance: {
    keywords: ['insurance', 'policy', 'coverage', 'premium', 'life insurance', 'health insurance', 'vul', 'investment-linked'],
    weight: 1.0
  },
  real_estate: {
    keywords: ['real estate', 'property', 'housing', 'condo', 'lot', 'house and lot', 'subdivision', 'broker'],
    weight: 1.0
  },
  online_selling: {
    keywords: ['online selling', 'e-commerce', 'online store', 'shopee', 'lazada', 'reseller', 'dropshipping'],
    weight: 0.9
  },
  coaching_training: {
    keywords: ['coaching', 'training', 'mentor', 'course', 'workshop', 'seminar', 'webinar', 'masterclass'],
    weight: 0.9
  },
  health_wellness: {
    keywords: ['health', 'wellness', 'fitness', 'nutrition', 'supplement', 'weight loss', 'gym', 'yoga'],
    weight: 0.85
  },
  beauty: {
    keywords: ['beauty', 'cosmetics', 'skincare', 'makeup', 'spa', 'salon', 'aesthetic', 'anti-aging'],
    weight: 0.85
  },
  finance: {
    keywords: ['finance', 'investment', 'trading', 'stocks', 'forex', 'crypto', 'mutual fund', 'portfolio'],
    weight: 0.95
  },
  crypto: {
    keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'blockchain', 'token', 'nft', 'defi', 'web3'],
    weight: 0.95
  },
  service_provider: {
    keywords: ['service', 'consulting', 'freelance', 'agency', 'professional services', 'outsourcing'],
    weight: 0.8
  },
  saas: {
    keywords: ['software', 'saas', 'platform', 'app', 'technology', 'digital solution', 'automation', 'cloud'],
    weight: 0.9
  }
};

const PERSONA_PATTERNS = {
  entrepreneurs: {
    keywords: ['entrepreneur', 'business owner', 'self-employed', 'startup', 'founder', 'solopreneur'],
    characteristics: ['ambitious', 'growth-oriented', 'risk-taker']
  },
  professionals: {
    keywords: ['professional', 'corporate', 'executive', 'manager', 'employee', 'career'],
    characteristics: ['stable income', 'career-focused', 'time-constrained']
  },
  students: {
    keywords: ['student', 'learner', 'beginner', 'young', 'college', 'university'],
    characteristics: ['budget-conscious', 'tech-savvy', 'learning-oriented']
  },
  parents: {
    keywords: ['parent', 'family', 'children', 'kids', 'mom', 'dad', 'household'],
    characteristics: ['family-oriented', 'safety-conscious', 'value-driven']
  },
  retirees: {
    keywords: ['retire', 'senior', 'elderly', 'pension', 'golden years'],
    characteristics: ['fixed income', 'health-conscious', 'stability-seeking']
  },
  health_enthusiasts: {
    keywords: ['health conscious', 'fitness', 'wellness', 'active', 'lifestyle', 'organic'],
    characteristics: ['proactive', 'quality-focused', 'informed buyers']
  },
  aspiring_sellers: {
    keywords: ['aspiring', 'want to earn', 'sideline', 'extra income', 'passive income'],
    characteristics: ['income-motivated', 'opportunity-seeking', 'flexible']
  },
  homebased_workers: {
    keywords: ['work from home', 'remote', 'homebased', 'online work', 'freelancer'],
    characteristics: ['flexibility-focused', 'digital-native', 'self-motivated']
  }
};

const NICHE_FLAGS = {
  high_ticket: {
    indicators: ['premium', 'luxury', 'exclusive', 'high-end', 'vip'],
    price_threshold: 10000
  },
  mass_market: {
    indicators: ['affordable', 'budget', 'accessible', 'everyone', 'mass'],
    price_threshold: 1000
  },
  b2b: {
    indicators: ['business', 'enterprise', 'corporate', 'b2b', 'company']
  },
  b2c: {
    indicators: ['consumer', 'personal', 'individual', 'b2c', 'retail']
  },
  subscription_based: {
    indicators: ['subscription', 'monthly', 'recurring', 'membership', 'plan']
  },
  one_time_purchase: {
    indicators: ['one-time', 'single', 'once', 'lifetime']
  },
  digital_delivery: {
    indicators: ['digital', 'online', 'instant', 'download', 'virtual']
  },
  physical_delivery: {
    indicators: ['physical', 'shipping', 'delivery', 'tangible', 'product']
  }
};

function calculateConfidence(text: string, patterns: string[]): number {
  const lowerText = text.toLowerCase();
  let matches = 0;

  for (const pattern of patterns) {
    if (lowerText.includes(pattern)) {
      matches++;
    }
  }

  return Math.min(1.0, matches / Math.max(1, patterns.length * 0.3));
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const freq = new Map<string, number>();
  words.forEach(word => freq.set(word, (freq.get(word) || 0) + 1));

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export const autoTaggingEngine = {
  classifyCompany(company: any): ClassificationResult {
    const text = `${company.name || ''} ${company.description || ''}`.toLowerCase();
    const keywords = extractKeywords(text);

    let bestIndustry = 'general';
    let bestScore = 0;
    const industryScores: Record<string, number> = {};

    for (const [industry, config] of Object.entries(INDUSTRY_PATTERNS)) {
      const confidence = calculateConfidence(text, config.keywords);
      const weightedScore = confidence * config.weight;
      industryScores[industry] = weightedScore;

      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestIndustry = industry;
      }
    }

    const detectedPersonas: string[] = [];
    const personaScores: Record<string, number> = {};

    for (const [persona, config] of Object.entries(PERSONA_PATTERNS)) {
      const confidence = calculateConfidence(text, config.keywords);
      personaScores[persona] = confidence;

      if (confidence > 0.3) {
        detectedPersonas.push(persona);
      }
    }

    if (detectedPersonas.length === 0) {
      detectedPersonas.push('general_market');
      personaScores.general_market = 0.5;
    }

    return {
      classified_industry: bestIndustry,
      detected_personas: detectedPersonas.slice(0, 3),
      top_keywords: keywords,
      confidence_scores: {
        industry: bestScore,
        personas: personaScores
      }
    };
  },

  classifyProduct(product: any): ProductClassification {
    const text = `${product.name || ''} ${product.description || ''}`.toLowerCase();

    const categoryPatterns = {
      health_supplement: ['supplement', 'vitamin', 'capsule', 'nutrition', 'health'],
      digital_product: ['ebook', 'course', 'training', 'video', 'software'],
      physical_product: ['product', 'item', 'merchandise', 'goods'],
      service: ['service', 'consulting', 'coaching'],
      membership: ['membership', 'subscription', 'access'],
      insurance_product: ['insurance', 'policy', 'coverage'],
      investment: ['investment', 'fund', 'portfolio']
    };

    let bestCategory = 'uncategorized';
    let bestCategoryScore = 0;

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      const score = calculateConfidence(text, patterns);
      if (score > bestCategoryScore) {
        bestCategoryScore = score;
        bestCategory = category;
      }
    }

    const nicheFlags: string[] = [];
    const nicheScores: Record<string, number> = {};

    for (const [niche, config] of Object.entries(NICHE_FLAGS)) {
      const score = calculateConfidence(text, config.indicators);
      nicheScores[niche] = score;

      if ('price_threshold' in config && product.price) {
        const priceNum = typeof product.price === 'number' ? product.price : parseFloat(product.price);
        if (niche === 'high_ticket' && priceNum >= config.price_threshold) {
          nicheFlags.push(niche);
        } else if (niche === 'mass_market' && priceNum < config.price_threshold) {
          nicheFlags.push(niche);
        }
      } else if (score > 0.4) {
        nicheFlags.push(niche);
      }
    }

    const personaMatch: string[] = [];
    for (const [persona, config] of Object.entries(PERSONA_PATTERNS)) {
      const score = calculateConfidence(text, config.keywords);
      if (score > 0.3) {
        personaMatch.push(persona);
      }
    }

    if (personaMatch.length === 0) {
      personaMatch.push('general_market');
    }

    return {
      category: bestCategory,
      niche_flags: nicheFlags,
      persona_match: personaMatch.slice(0, 3),
      confidence_scores: {
        category: bestCategoryScore,
        niches: nicheScores
      }
    };
  },

  async batchClassifyProducts(ownerType: string, ownerId?: string): Promise<{ processed: number; errors: number }> {
    try {
      let query = supabase
        .from('admin_products')
        .select('*')
        .eq('owner_type', ownerType);

      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }

      const { data: products, error } = await query;

      if (error) throw error;
      if (!products || products.length === 0) {
        return { processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const product of products) {
        try {
          const classification = this.classifyProduct(product);

          await supabase
            .from('product_intelligence_cache')
            .upsert({
              product_id: product.id,
              owner_type: product.owner_type,
              owner_id: product.owner_id,
              classification_data: classification,
              tags: classification.niche_flags,
              detected_personas: classification.persona_match,
              confidence_scores: classification.confidence_scores,
              last_processed_at: new Date().toISOString()
            }, {
              onConflict: 'product_id',
              ignoreDuplicates: false
            });

          processed++;
        } catch (err) {
          console.error(`Error classifying product ${product.id}:`, err);
          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Error in batch classification:', error);
      return { processed: 0, errors: 0 };
    }
  },

  async classifyAndCache(entityType: 'company' | 'product', entityData: any): Promise<any> {
    if (entityType === 'company') {
      return this.classifyCompany(entityData);
    } else {
      const classification = this.classifyProduct(entityData);

      if (entityData.id) {
        await supabase
          .from('product_intelligence_cache')
          .upsert({
            product_id: entityData.id,
            owner_type: entityData.owner_type || 'system',
            owner_id: entityData.owner_id,
            classification_data: classification,
            tags: classification.niche_flags,
            detected_personas: classification.persona_match,
            confidence_scores: classification.confidence_scores,
            last_processed_at: new Date().toISOString()
          }, {
            onConflict: 'product_id',
            ignoreDuplicates: false
          });
      }

      return classification;
    }
  }
};
