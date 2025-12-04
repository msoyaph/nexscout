import { supabase } from '../../../lib/supabase';

interface ProspectSignals {
  pain_points?: string[];
  intent_tags?: string[];
  industry?: string;
  persona?: string;
  budget_range?: { min: number; max: number };
  urgency?: 'low' | 'medium' | 'high';
  buying_stage?: 'awareness' | 'consideration' | 'decision';
  demographics?: {
    age_range?: string;
    location?: string;
    occupation?: string;
  };
}

interface ProductMatch {
  product: any;
  variant?: any;
  score: number;
  match_reasons: string[];
  recommended_script?: string;
  objection_handlers?: string[];
}

interface MatchingCriteria {
  prospectSignals: ProspectSignals;
  products: any[];
  variants?: any[];
  customRules?: any[];
}

function calculateSimilarityScore(array1: string[] = [], array2: string[] = []): number {
  if (array1.length === 0 || array2.length === 0) return 0;

  const set1 = new Set(array1.map(s => s.toLowerCase()));
  const set2 = new Set(array2.map(s => s.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

function matchPersona(productPersonas: string[] = [], prospectPersona?: string): number {
  if (!prospectPersona) return 0.5;

  const lowerProspect = prospectPersona.toLowerCase();
  const lowerProduct = productPersonas.map(p => p.toLowerCase());

  if (lowerProduct.includes(lowerProspect)) return 1.0;
  if (lowerProduct.includes('general_market')) return 0.7;

  const partialMatches = lowerProduct.filter(p =>
    p.includes(lowerProspect) || lowerProspect.includes(p)
  );

  return partialMatches.length > 0 ? 0.8 : 0.3;
}

function matchBudget(productPrice: number, budgetRange?: { min: number; max: number }): number {
  if (!budgetRange || !productPrice) return 0.5;

  if (productPrice >= budgetRange.min && productPrice <= budgetRange.max) {
    return 1.0;
  }

  if (productPrice < budgetRange.min) {
    const difference = budgetRange.min - productPrice;
    const range = budgetRange.max - budgetRange.min;
    return Math.max(0.6, 1.0 - (difference / range));
  }

  if (productPrice > budgetRange.max) {
    const difference = productPrice - budgetRange.max;
    const range = budgetRange.max - budgetRange.min;
    return Math.max(0.3, 1.0 - (difference / range) * 0.5);
  }

  return 0.5;
}

function matchUrgency(productTags: string[] = [], urgency?: string): number {
  if (!urgency) return 0.5;

  const urgencyIndicators = {
    high: ['instant', 'immediate', 'quick', 'fast', 'emergency', 'urgent'],
    medium: ['soon', 'timely', 'efficient', 'effective'],
    low: ['long-term', 'sustainable', 'gradual', 'steady']
  };

  const indicators = urgencyIndicators[urgency as keyof typeof urgencyIndicators] || [];
  const lowerTags = productTags.map(t => t.toLowerCase());

  const matches = indicators.filter(ind =>
    lowerTags.some(tag => tag.includes(ind))
  );

  if (matches.length > 0) return 1.0;
  return 0.5;
}

function matchBuyingStage(productCategory: string, stage?: string): number {
  if (!stage) return 0.5;

  const stageMatches = {
    awareness: ['educational', 'information', 'guide', 'ebook'],
    consideration: ['comparison', 'demo', 'trial', 'consultation'],
    decision: ['purchase', 'buy', 'order', 'membership']
  };

  const matches = stageMatches[stage as keyof typeof stageMatches] || [];
  const lowerCategory = productCategory.toLowerCase();

  const hasMatch = matches.some(m => lowerCategory.includes(m));
  return hasMatch ? 1.0 : 0.5;
}

export const offerMatchingEngine = {
  async findBestMatch(criteria: MatchingCriteria): Promise<ProductMatch | null> {
    const { prospectSignals, products, variants, customRules } = criteria;

    if (!products || products.length === 0) {
      return null;
    }

    const productCache = await this.getProductIntelligence(products.map(p => p.id));

    const matches: ProductMatch[] = [];

    for (const product of products) {
      const cache = productCache.find(c => c.product_id === product.id);

      let score = 0;
      const matchReasons: string[] = [];

      const painPointScore = calculateSimilarityScore(
        cache?.pain_points_solved || [],
        prospectSignals.pain_points || []
      );
      if (painPointScore > 0) {
        score += painPointScore * 40;
        if (painPointScore > 0.5) {
          matchReasons.push(`Solves ${Math.round(painPointScore * 100)}% of pain points`);
        }
      }

      const tagScore = calculateSimilarityScore(
        cache?.tags || [],
        prospectSignals.intent_tags || []
      );
      if (tagScore > 0) {
        score += tagScore * 30;
        if (tagScore > 0.5) {
          matchReasons.push(`${Math.round(tagScore * 100)}% tag match`);
        }
      }

      const personaScore = matchPersona(
        cache?.detected_personas || [],
        prospectSignals.persona
      );
      score += personaScore * 20;
      if (personaScore > 0.7) {
        matchReasons.push('Strong persona alignment');
      }

      if (product.price && prospectSignals.budget_range) {
        const budgetScore = matchBudget(product.price, prospectSignals.budget_range);
        score += budgetScore * 10;
        if (budgetScore > 0.8) {
          matchReasons.push('Within budget');
        }
      }

      if (prospectSignals.urgency) {
        const urgencyScore = matchUrgency(cache?.tags || [], prospectSignals.urgency);
        score += urgencyScore * 5;
      }

      if (prospectSignals.buying_stage && cache?.classification_data) {
        const stageScore = matchBuyingStage(
          cache.classification_data.category || '',
          prospectSignals.buying_stage
        );
        score += stageScore * 5;
      }

      if (customRules && customRules.length > 0) {
        const ruleBonus = this.applyCustomRules(product, prospectSignals, customRules);
        score += ruleBonus;
        if (ruleBonus > 0) {
          matchReasons.push('Matches custom rules');
        }
      }

      if (matchReasons.length === 0) {
        matchReasons.push('General match');
      }

      matches.push({
        product,
        score,
        match_reasons: matchReasons,
        recommended_script: this.selectSellingScript(product, prospectSignals.persona),
        objection_handlers: cache?.classification_data?.objection_handlers
      });
    }

    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) return null;

    const bestMatch = matches[0];

    if (variants && variants.length > 0) {
      const productVariants = variants.filter(v => v.product_id === bestMatch.product.id);
      if (productVariants.length > 0) {
        const bestVariant = this.selectBestVariant(productVariants, prospectSignals);
        bestMatch.variant = bestVariant;
      }
    }

    return bestMatch;
  },

  async findTopMatches(criteria: MatchingCriteria, limit: number = 3): Promise<ProductMatch[]> {
    const { prospectSignals, products, variants, customRules } = criteria;

    if (!products || products.length === 0) {
      return [];
    }

    const productCache = await this.getProductIntelligence(products.map(p => p.id));
    const matches: ProductMatch[] = [];

    for (const product of products) {
      const cache = productCache.find(c => c.product_id === product.id);

      let score = 0;
      const matchReasons: string[] = [];

      const painPointScore = calculateSimilarityScore(
        cache?.pain_points_solved || [],
        prospectSignals.pain_points || []
      );
      score += painPointScore * 40;

      const tagScore = calculateSimilarityScore(
        cache?.tags || [],
        prospectSignals.intent_tags || []
      );
      score += tagScore * 30;

      const personaScore = matchPersona(
        cache?.detected_personas || [],
        prospectSignals.persona
      );
      score += personaScore * 20;

      if (product.price && prospectSignals.budget_range) {
        const budgetScore = matchBudget(product.price, prospectSignals.budget_range);
        score += budgetScore * 10;
      }

      if (customRules && customRules.length > 0) {
        const ruleBonus = this.applyCustomRules(product, prospectSignals, customRules);
        score += ruleBonus;
      }

      if (score > 20) {
        if (painPointScore > 0.5) matchReasons.push('Addresses key pain points');
        if (personaScore > 0.7) matchReasons.push('Perfect persona fit');
        if (tagScore > 0.5) matchReasons.push('High intent match');

        matches.push({
          product,
          score,
          match_reasons: matchReasons.length > 0 ? matchReasons : ['Relevant match'],
          recommended_script: this.selectSellingScript(product, prospectSignals.persona),
          objection_handlers: cache?.classification_data?.objection_handlers
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit);
  },

  selectSellingScript(product: any, persona?: string): string {
    if (!product) return 'default';

    if (product.scripts && persona && product.scripts[persona]) {
      return product.scripts[persona];
    }

    if (product.default_script) {
      return product.default_script;
    }

    return 'default';
  },

  selectBestVariant(variants: any[], signals: ProspectSignals): any {
    if (variants.length === 0) return null;
    if (variants.length === 1) return variants[0];

    const scored = variants.map(variant => {
      let score = 0;

      if (signals.budget_range && variant.price) {
        const budgetScore = matchBudget(variant.price, signals.budget_range);
        score += budgetScore * 60;
      }

      if (signals.urgency === 'high' && variant.variant_name?.toLowerCase().includes('express')) {
        score += 20;
      }

      if (signals.buying_stage === 'decision' && variant.is_premium) {
        score += 20;
      }

      return { variant, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].variant;
  },

  applyCustomRules(product: any, signals: ProspectSignals, rules: any[]): number {
    let bonus = 0;

    for (const rule of rules) {
      if (!rule.is_active) continue;

      try {
        const conditions = rule.conditions || {};
        let allConditionsMet = true;

        if (conditions.min_price && product.price < conditions.min_price) {
          allConditionsMet = false;
        }

        if (conditions.max_price && product.price > conditions.max_price) {
          allConditionsMet = false;
        }

        if (conditions.required_tags && Array.isArray(conditions.required_tags)) {
          const hasRequiredTags = conditions.required_tags.some((tag: string) =>
            product.tags?.includes(tag)
          );
          if (!hasRequiredTags) allConditionsMet = false;
        }

        if (conditions.persona && signals.persona !== conditions.persona) {
          allConditionsMet = false;
        }

        if (allConditionsMet) {
          const actions = rule.actions || {};
          bonus += actions.score_boost || 10;
        }
      } catch (err) {
        console.error('Error applying custom rule:', err);
      }
    }

    return bonus;
  },

  async getProductIntelligence(productIds: string[]): Promise<any[]> {
    if (productIds.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('product_intelligence_cache')
        .select('*')
        .in('product_id', productIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching product intelligence:', error);
      return [];
    }
  },

  async saveMatchingRule(rule: {
    owner_type: string;
    owner_id?: string;
    rule_name: string;
    rule_type: string;
    conditions: any;
    actions: any;
    priority?: number;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('offer_matching_rules')
        .insert({
          ...rule,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error saving matching rule:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};
