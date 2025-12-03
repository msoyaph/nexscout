import { supabase } from '../../../lib/supabase';

interface TaxonomyResult {
  category: string;
  sub_category: string;
  sub_sub_category: string;
  tags: string[];
  key_benefits: string[];
  common_objections: string[];
  emotional_triggers: string[];
  ideal_personas: string[];
  confidence_score: number;
}

const TAXONOMY_PATTERNS = {
  'Health & Wellness': {
    'Food Supplement': {
      'Immunity Booster': ['c247', 'liven', 'coffee', 'antioxidant', 'immunity'],
      'Weight Management': ['slim', 'diet', 'weight loss', 'fat burner'],
      'Beauty & Skin': ['glutathione', 'whitening', 'collagen', 'glow']
    },
    'Fitness': {
      'Equipment': ['dumbbells', 'resistance', 'gym', 'workout'],
      'Programs': ['training', 'coaching', 'fitness plan']
    }
  },
  'MLM & Network Marketing': {
    'Health Products': {
      'Supplements': ['vitamins', 'minerals', 'capsules'],
      'Wellness': ['alkaline', 'detox', 'cleanse']
    },
    'Business Opportunity': {
      'Income Program': ['earn', 'passive income', 'business'],
      'Recruitment': ['downline', 'team building', 'network']
    }
  },
  'Insurance': {
    'Life Insurance': {
      'Term Life': ['term', 'temporary', 'coverage'],
      'Whole Life': ['permanent', 'lifetime', 'savings']
    },
    'Investment-Linked': {
      'VUL': ['variable', 'investment', 'fund'],
      'ULIP': ['unit-linked', 'returns']
    }
  },
  'Real Estate': {
    'Residential': {
      'House and Lot': ['house', 'lot', 'home', 'property'],
      'Condominium': ['condo', 'unit', 'high-rise']
    },
    'Commercial': {
      'Office': ['office space', 'business', 'commercial'],
      'Retail': ['shop', 'store', 'retail space']
    }
  }
};

const BENEFIT_PATTERNS = {
  health: ['healthy', 'wellness', 'fit', 'strong', 'energy', 'vitality'],
  financial: ['save', 'earn', 'income', 'profit', 'returns', 'wealth'],
  time: ['fast', 'quick', 'instant', 'convenient', 'efficient', 'save time'],
  emotional: ['confidence', 'peace', 'security', 'happiness', 'freedom'],
  social: ['status', 'recognition', 'network', 'community', 'connections']
};

const OBJECTION_PATTERNS = {
  price: ['expensive', 'costly', 'afford', 'budget', 'price'],
  time: ['busy', 'no time', 'hectic', 'schedule'],
  trust: ['scam', 'legitimate', 'proof', 'guarantee', 'trust'],
  complexity: ['complicated', 'difficult', 'confusing', 'understand'],
  competition: ['already have', 'competitor', 'alternative']
};

const EMOTIONAL_TRIGGERS = {
  fear: ['afraid', 'worry', 'concern', 'risk', 'danger', 'lose'],
  hope: ['dream', 'better', 'improve', 'success', 'achieve', 'goal'],
  urgency: ['now', 'limited', 'hurry', 'deadline', 'ending', 'last chance'],
  greed: ['profit', 'earn', 'money', 'wealth', 'rich', 'fortune'],
  pride: ['status', 'prestige', 'exclusive', 'elite', 'best'],
  love: ['family', 'children', 'future', 'protect', 'care', 'legacy']
};

function matchTaxonomy(text: string): { category: string; subCategory: string; subSubCategory: string; score: number } {
  const lowerText = text.toLowerCase();
  let bestMatch = {
    category: 'General',
    subCategory: 'Uncategorized',
    subSubCategory: 'General',
    score: 0
  };

  for (const [category, subCategories] of Object.entries(TAXONOMY_PATTERNS)) {
    for (const [subCategory, subSubCategories] of Object.entries(subCategories)) {
      for (const [subSubCategory, keywords] of Object.entries(subSubCategories)) {
        const matches = keywords.filter(keyword => lowerText.includes(keyword));
        const score = matches.length / keywords.length;

        if (score > bestMatch.score) {
          bestMatch = {
            category,
            subCategory,
            subSubCategory,
            score
          };
        }
      }
    }
  }

  return bestMatch;
}

function extractBenefits(text: string): string[] {
  const lowerText = text.toLowerCase();
  const benefits: string[] = [];

  for (const [benefit, keywords] of Object.entries(BENEFIT_PATTERNS)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      benefits.push(benefit);
    }
  }

  return benefits.length > 0 ? benefits : ['general_benefit'];
}

function extractObjections(text: string): string[] {
  const lowerText = text.toLowerCase();
  const objections: string[] = [];

  for (const [objection, keywords] of Object.entries(OBJECTION_PATTERNS)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      objections.push(objection);
    }
  }

  return objections.length > 0 ? objections : ['price', 'time', 'trust'];
}

function extractEmotions(text: string): string[] {
  const lowerText = text.toLowerCase();
  const emotions: string[] = [];

  for (const [emotion, keywords] of Object.entries(EMOTIONAL_TRIGGERS)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      emotions.push(emotion);
    }
  }

  return emotions.length > 0 ? emotions : ['hope'];
}

function extractPersonas(text: string, category: string): string[] {
  const lowerText = text.toLowerCase();
  const personas: string[] = [];

  const personaPatterns = {
    'OFW moms': ['ofw', 'overseas', 'abroad', 'mom', 'mother', 'family'],
    'busy employees': ['employee', 'work', 'office', 'busy', 'professional'],
    'health-conscious': ['health', 'fitness', 'wellness', 'active', 'organic'],
    'entrepreneurs': ['business', 'entrepreneur', 'owner', 'self-employed'],
    'aspiring sellers': ['seller', 'reseller', 'sideline', 'earn', 'income'],
    'retirees': ['retire', 'senior', 'pension', 'elderly'],
    'students': ['student', 'college', 'young', 'learner']
  };

  for (const [persona, keywords] of Object.entries(personaPatterns)) {
    const matches = keywords.filter(keyword => lowerText.includes(keyword));
    if (matches.length > 0) {
      personas.push(persona);
    }
  }

  if (category.includes('Health')) {
    personas.push('health-conscious');
  }

  if (category.includes('MLM')) {
    personas.push('aspiring sellers', 'entrepreneurs');
  }

  return personas.length > 0 ? personas.slice(0, 3) : ['general_market'];
}

function extractTags(text: string, category: string): string[] {
  const tags: string[] = [];

  tags.push(category.toLowerCase().replace(/\s+/g, '_'));

  const commonWords = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const freq = new Map<string, number>();
  commonWords.forEach(word => freq.set(word, (freq.get(word) || 0) + 1));

  const topWords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  tags.push(...topWords);

  return [...new Set(tags)];
}

export const taxonomyBuilderEngine = {
  async buildTaxonomy(entity: {
    type: string;
    id: string;
    name: string;
    description: string;
  }): Promise<TaxonomyResult> {
    const text = `${entity.name} ${entity.description}`;

    const taxonomyMatch = matchTaxonomy(text);
    const benefits = extractBenefits(text);
    const objections = extractObjections(text);
    const emotions = extractEmotions(text);
    const personas = extractPersonas(text, taxonomyMatch.category);
    const tags = extractTags(text, taxonomyMatch.category);

    const confidenceScore = (
      (taxonomyMatch.score * 0.4) +
      (benefits.length / 5 * 0.2) +
      (objections.length / 5 * 0.2) +
      (emotions.length / 6 * 0.1) +
      (personas.length / 3 * 0.1)
    );

    return {
      category: taxonomyMatch.category,
      sub_category: taxonomyMatch.subCategory,
      sub_sub_category: taxonomyMatch.subSubCategory,
      tags,
      key_benefits: benefits,
      common_objections: objections,
      emotional_triggers: emotions,
      ideal_personas: personas,
      confidence_score: Math.min(1.0, confidenceScore)
    };
  },

  async saveTaxonomy(
    entityType: string,
    entityId: string,
    taxonomy: TaxonomyResult
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('taxonomy_entities')
        .upsert({
          entity_type: entityType,
          entity_id: entityId,
          category: taxonomy.category,
          sub_category: taxonomy.sub_category,
          sub_sub_category: taxonomy.sub_sub_category,
          tags: taxonomy.tags,
          key_benefits: taxonomy.key_benefits,
          common_objections: taxonomy.common_objections,
          emotional_triggers: taxonomy.emotional_triggers,
          ideal_personas: taxonomy.ideal_personas,
          confidence_score: taxonomy.confidence_score,
          learning_iterations: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_type,entity_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error saving taxonomy:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getTaxonomy(entityType: string, entityId: string): Promise<TaxonomyResult | null> {
    try {
      const { data, error } = await supabase
        .from('taxonomy_entities')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        category: data.category,
        sub_category: data.sub_category,
        sub_sub_category: data.sub_sub_category,
        tags: data.tags,
        key_benefits: data.key_benefits,
        common_objections: data.common_objections,
        emotional_triggers: data.emotional_triggers,
        ideal_personas: data.ideal_personas,
        confidence_score: data.confidence_score
      };
    } catch (error) {
      console.error('Error getting taxonomy:', error);
      return null;
    }
  },

  async processBatch(entities: Array<{ type: string; id: string; name: string; description: string }>): Promise<{
    processed: number;
    errors: number;
  }> {
    let processed = 0;
    let errors = 0;

    for (const entity of entities) {
      try {
        const taxonomy = await this.buildTaxonomy(entity);
        const result = await this.saveTaxonomy(entity.type, entity.id, taxonomy);

        if (result.success) {
          processed++;
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`Error processing entity ${entity.id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  },

  async learnFromSuccess(entityType: string, entityId: string, successData: {
    converted: boolean;
    personaMatched?: string;
    objectionOvercome?: string;
  }): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('taxonomy_entities')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle();

      if (!existing) return;

      const updates: any = {
        learning_iterations: (existing.learning_iterations || 0) + 1,
        last_learned_at: new Date().toISOString()
      };

      if (successData.converted) {
        updates.confidence_score = Math.min(1.0, (existing.confidence_score || 0) + 0.05);
      }

      if (successData.personaMatched && !existing.ideal_personas.includes(successData.personaMatched)) {
        updates.ideal_personas = [...existing.ideal_personas, successData.personaMatched];
      }

      await supabase
        .from('taxonomy_entities')
        .update(updates)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);
    } catch (error) {
      console.error('Error learning from success:', error);
    }
  }
};
