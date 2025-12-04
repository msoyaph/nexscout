import { supabase } from '../../../lib/supabase';

interface CompanyData {
  id?: string;
  name?: string;
  description?: string;
  industry?: string;
  brand_voice?: string;
  [key: string]: any;
}

interface ProductData {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  [key: string]: any;
}

interface VariantData {
  id?: string;
  variant_name?: string;
  description?: string;
  price?: number;
  benefits?: string[];
  [key: string]: any;
}

interface NormalizedCompany extends CompanyData {
  short_description?: string;
  canonical_keywords?: string[];
}

interface NormalizedProduct extends ProductData {
  ideal_customer?: string;
  pain_points_solved?: string[];
  use_cases?: string[];
}

interface NormalizedVariant extends VariantData {
  common_objections?: string[];
}

function cleanText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-.,!?()]/g, '')
    .substring(0, 500);
}

function summarize(text: string | null | undefined, maxLength: number = 150): string {
  if (!text) return '';

  const cleaned = cleanText(text);
  if (cleaned.length <= maxLength) return cleaned;

  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.length === 0) return cleaned.substring(0, maxLength) + '...';

  let summary = sentences[0].trim();
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...';
  }

  return summary;
}

function extractKeywords(text: string | null | undefined): string[] {
  if (!text) return [];

  const cleaned = cleanText(text).toLowerCase();

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been', 'be',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'can', 'could', 'may', 'might', 'must', 'this', 'that', 'these', 'those'
  ]);

  const words = cleaned
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function classifyIndustry(description: string | null | undefined): string {
  if (!description) return 'general';

  const text = description.toLowerCase();

  const industries = {
    'mlm': ['network marketing', 'mlm', 'multi-level', 'downline', 'upline', 'distributor'],
    'insurance': ['insurance', 'policy', 'coverage', 'premium', 'life insurance', 'health insurance'],
    'real_estate': ['real estate', 'property', 'housing', 'condo', 'lot', 'house and lot'],
    'online_selling': ['online selling', 'e-commerce', 'online store', 'shopee', 'lazada'],
    'coaching': ['coaching', 'training', 'mentor', 'course', 'workshop', 'seminar'],
    'health_wellness': ['health', 'wellness', 'fitness', 'nutrition', 'supplement', 'weight loss'],
    'beauty': ['beauty', 'cosmetics', 'skincare', 'makeup', 'spa', 'salon'],
    'finance': ['finance', 'investment', 'trading', 'stocks', 'forex', 'crypto'],
    'service_provider': ['service', 'consulting', 'freelance', 'agency', 'professional services'],
    'saas': ['software', 'saas', 'platform', 'app', 'technology', 'digital solution']
  };

  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return industry;
    }
  }

  return 'general';
}

function inferBrandVoice(description: string | null | undefined): string {
  if (!description) return 'professional';

  const text = description.toLowerCase();

  if (text.match(/\b(excited|amazing|awesome|incredible|fantastic)\b/)) {
    return 'enthusiastic';
  }

  if (text.match(/\b(proven|results|data|research|science)\b/)) {
    return 'authoritative';
  }

  if (text.match(/\b(friendly|welcoming|comfortable|easy)\b/)) {
    return 'friendly';
  }

  if (text.match(/\b(luxury|premium|exclusive|elite)\b/)) {
    return 'premium';
  }

  return 'professional';
}

function classifyProductCategory(description: string | null | undefined): string {
  if (!description) return 'uncategorized';

  const text = description.toLowerCase();

  const categories = {
    'health_supplement': ['supplement', 'vitamin', 'mineral', 'capsule', 'tablet'],
    'digital_product': ['ebook', 'course', 'training', 'video', 'software', 'app'],
    'physical_product': ['product', 'item', 'merchandise', 'goods'],
    'service': ['service', 'consulting', 'coaching', 'mentoring'],
    'membership': ['membership', 'subscription', 'access', 'community'],
    'insurance_product': ['insurance', 'policy', 'coverage', 'plan'],
    'investment': ['investment', 'fund', 'portfolio', 'equity']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }

  return 'uncategorized';
}

function extractProductTags(description: string | null | undefined): string[] {
  const keywords = extractKeywords(description);
  const category = classifyProductCategory(description);

  return [category, ...keywords.slice(0, 5)];
}

function extractIdealCustomer(description: string | null | undefined): string {
  if (!description) return 'general market';

  const text = description.toLowerCase();

  const personas = [
    { name: 'entrepreneurs', keywords: ['entrepreneur', 'business owner', 'self-employed', 'startup'] },
    { name: 'professionals', keywords: ['professional', 'corporate', 'executive', 'manager'] },
    { name: 'students', keywords: ['student', 'learner', 'beginner', 'young'] },
    { name: 'parents', keywords: ['parent', 'family', 'children', 'kids', 'mom', 'dad'] },
    { name: 'retirees', keywords: ['retire', 'senior', 'elderly', 'pension'] },
    { name: 'health_conscious', keywords: ['health conscious', 'fitness', 'wellness', 'active'] }
  ];

  for (const persona of personas) {
    if (persona.keywords.some(keyword => text.includes(keyword))) {
      return persona.name;
    }
  }

  return 'general market';
}

function extractPainPoints(description: string | null | undefined): string[] {
  if (!description) return [];

  const text = description.toLowerCase();
  const painPoints: string[] = [];

  const patterns = [
    { pain: 'lack_of_time', keywords: ['busy', 'no time', 'time-consuming', 'hectic'] },
    { pain: 'lack_of_money', keywords: ['expensive', 'costly', 'save money', 'affordable'] },
    { pain: 'lack_of_knowledge', keywords: ['confusing', 'complicated', 'don\'t know', 'unclear'] },
    { pain: 'health_issues', keywords: ['health problem', 'sick', 'pain', 'suffering'] },
    { pain: 'stress', keywords: ['stress', 'anxiety', 'worried', 'overwhelmed'] },
    { pain: 'inefficiency', keywords: ['slow', 'inefficient', 'waste', 'outdated'] }
  ];

  patterns.forEach(({ pain, keywords }) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      painPoints.push(pain);
    }
  });

  return painPoints;
}

function extractUseCases(description: string | null | undefined): string[] {
  if (!description) return [];

  const text = description.toLowerCase();
  const useCases: string[] = [];

  if (text.match(/\b(daily|everyday|routine)\b/)) {
    useCases.push('daily_use');
  }

  if (text.match(/\b(emergency|urgent|quick)\b/)) {
    useCases.push('emergency_solution');
  }

  if (text.match(/\b(long-term|sustainable|lasting)\b/)) {
    useCases.push('long_term_investment');
  }

  if (text.match(/\b(business|professional|work)\b/)) {
    useCases.push('business_application');
  }

  if (text.match(/\b(personal|individual|self)\b/)) {
    useCases.push('personal_use');
  }

  return useCases.length > 0 ? useCases : ['general_use'];
}

function extractBenefits(description: string | null | undefined): string[] {
  if (!description) return [];

  const text = description.toLowerCase();
  const benefits: string[] = [];

  const patterns = [
    { benefit: 'save_time', keywords: ['fast', 'quick', 'save time', 'efficient', 'instant'] },
    { benefit: 'save_money', keywords: ['affordable', 'cheap', 'save money', 'discount', 'value'] },
    { benefit: 'improve_health', keywords: ['healthy', 'wellness', 'fit', 'energy', 'strong'] },
    { benefit: 'increase_income', keywords: ['earn', 'income', 'profit', 'money', 'revenue'] },
    { benefit: 'peace_of_mind', keywords: ['peace', 'secure', 'safe', 'protected', 'worry-free'] },
    { benefit: 'convenience', keywords: ['convenient', 'easy', 'simple', 'hassle-free'] }
  ];

  patterns.forEach(({ benefit, keywords }) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      benefits.push(benefit);
    }
  });

  return benefits;
}

function extractObjections(description: string | null | undefined): string[] {
  if (!description) return ['too_expensive', 'no_time', 'need_to_think'];

  const text = description.toLowerCase();
  const objections: string[] = [];

  if (text.includes('price') || text.includes('cost')) {
    objections.push('too_expensive');
  }

  if (text.includes('time') || text.includes('busy')) {
    objections.push('no_time');
  }

  if (text.includes('complicated') || text.includes('complex')) {
    objections.push('too_complicated');
  }

  if (objections.length === 0) {
    objections.push('too_expensive', 'no_time', 'need_to_think');
  }

  return objections;
}

function normalizePrice(price: number | string | null | undefined): number {
  if (price === null || price === undefined) return 0;

  if (typeof price === 'number') return Math.max(0, price);

  const numericPrice = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  return isNaN(numericPrice) ? 0 : Math.max(0, numericPrice);
}

export const dataNormalizationEngine = {
  normalizeCompany(company: CompanyData): NormalizedCompany {
    return {
      ...company,
      name: cleanText(company.name),
      industry: company.industry || classifyIndustry(company.description),
      brand_voice: company.brand_voice || inferBrandVoice(company.description),
      short_description: summarize(company.description),
      canonical_keywords: extractKeywords(company.description),
      description: cleanText(company.description)
    };
  },

  normalizeProduct(product: ProductData): NormalizedProduct {
    return {
      ...product,
      name: cleanText(product.name),
      category: product.category || classifyProductCategory(product.description),
      tags: product.tags || extractProductTags(product.description),
      ideal_customer: extractIdealCustomer(product.description),
      pain_points_solved: extractPainPoints(product.description),
      use_cases: extractUseCases(product.description),
      description: cleanText(product.description)
    };
  },

  normalizeVariant(variant: VariantData): NormalizedVariant {
    return {
      ...variant,
      variant_name: cleanText(variant.variant_name),
      benefits: extractBenefits(variant.description),
      price: normalizePrice(variant.price),
      common_objections: extractObjections(variant.description),
      description: cleanText(variant.description)
    };
  },

  async processQueue(limit: number = 10): Promise<{ processed: number; errors: number }> {
    try {
      const { data: queueItems, error } = await supabase
        .from('data_normalization_queue')
        .select('*')
        .eq('status', 'pending')
        .lt('attempts', 'max_attempts')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      if (!queueItems || queueItems.length === 0) {
        return { processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const item of queueItems) {
        try {
          await supabase
            .from('data_normalization_queue')
            .update({
              status: 'processing',
              processing_started_at: new Date().toISOString(),
              attempts: item.attempts + 1
            })
            .eq('id', item.id);

          const startTime = Date.now();
          let normalized: any;
          let cacheData: any = {};

          switch (item.entity_type) {
            case 'admin_companies':
              normalized = this.normalizeCompany(item.raw_data);
              cacheData = {
                normalized_data: normalized,
                classification_data: {
                  industry: normalized.industry,
                  brand_voice: normalized.brand_voice
                },
                tags: normalized.canonical_keywords || []
              };
              break;

            case 'admin_products':
              normalized = this.normalizeProduct(item.raw_data);
              cacheData = {
                product_id: item.entity_id,
                owner_type: item.owner_type,
                owner_id: item.owner_id,
                normalized_data: normalized,
                classification_data: {
                  category: normalized.category,
                  ideal_customer: normalized.ideal_customer
                },
                tags: normalized.tags || [],
                detected_personas: [normalized.ideal_customer],
                pain_points_solved: normalized.pain_points_solved || [],
                use_cases: normalized.use_cases || []
              };

              await supabase
                .from('product_intelligence_cache')
                .upsert(cacheData, {
                  onConflict: 'product_id',
                  ignoreDuplicates: false
                });
              break;

            case 'product_variants':
              normalized = this.normalizeVariant(item.raw_data);
              break;

            default:
              throw new Error(`Unknown entity type: ${item.entity_type}`);
          }

          const processingDuration = Date.now() - startTime;

          await supabase
            .from('data_normalization_queue')
            .update({
              status: 'completed',
              processing_completed_at: new Date().toISOString()
            })
            .eq('id', item.id);

          processed++;
        } catch (err) {
          console.error(`Error processing queue item ${item.id}:`, err);

          await supabase
            .from('data_normalization_queue')
            .update({
              status: item.attempts + 1 >= item.max_attempts ? 'failed' : 'pending',
              error_message: err instanceof Error ? err.message : 'Unknown error',
              processing_completed_at: new Date().toISOString()
            })
            .eq('id', item.id);

          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      console.error('Error processing normalization queue:', error);
      return { processed: 0, errors: 0 };
    }
  }
};
