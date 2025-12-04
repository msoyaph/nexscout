import { supabase } from '../../lib/supabase';

export type ProductIntelInput = {
  userId: string;
  productId: string;
  crawlDepth?: 'light' | 'normal' | 'deep';
};

export type CompetitorProfile = {
  id: string;
  name: string;
  url?: string;
  sourceType: 'web_search' | 'company_record' | 'user_tagged';
  priceRange?: string;
  nicheTags: string[];
  mainBenefits: string[];
  mainObjections: string[];
  positioningAngle?: string;
  qualityScore: number;
};

export type ProductIntelV5Result = {
  success: boolean;
  productId: string;
  timestamp: string;
  primaryProductSummary: {
    name: string;
    corePromise: string;
    nicheTags: string[];
    strengthScore: number;
  };
  competitorProfiles: CompetitorProfile[];
  comparativeSummary: {
    competitivePosition: 'strong' | 'average' | 'weak';
    recommendedPositioningHooks: string[];
    pricingObservations: string[];
    complianceFlags: string[];
  };
  suggestedScripts: {
    elevatorPitch: string;
    comparisonPitch: string;
    objectionHandlingSnippets: string[];
    upsellHooks: string[];
  };
};

async function loadProductContext(productId: string, userId: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      company_profiles (
        company_name,
        industry,
        website,
        description
      )
    `)
    .eq('id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !product) {
    throw new Error('Product not found or access denied');
  }

  return product;
}

async function searchCompetitors(
  product: any,
  depth: 'light' | 'normal' | 'deep'
): Promise<CompetitorProfile[]> {
  const competitors: CompetitorProfile[] = [];

  const searchKeywords = [
    product.name,
    product.main_category,
    ...(product.key_benefits || []).slice(0, 2),
  ].filter(Boolean);

  const maxCompetitors = depth === 'light' ? 3 : depth === 'normal' ? 5 : 10;

  const competitorData = await findSimilarProducts(
    searchKeywords,
    product.main_category,
    maxCompetitors
  );

  for (const comp of competitorData) {
    competitors.push({
      id: comp.id || `comp-${Date.now()}-${Math.random()}`,
      name: comp.name,
      url: comp.url,
      sourceType: comp.sourceType || 'web_search',
      priceRange: comp.priceRange,
      nicheTags: comp.nicheTags || [],
      mainBenefits: comp.mainBenefits || [],
      mainObjections: comp.mainObjections || [],
      positioningAngle: comp.positioningAngle,
      qualityScore: comp.qualityScore || 50,
    });
  }

  return competitors;
}

async function findSimilarProducts(
  keywords: string[],
  category: string,
  limit: number
) {
  const { data: similarProducts } = await supabase
    .from('products')
    .select('id, name, product_url, price_min, price_max, key_benefits, tags')
    .eq('main_category', category)
    .eq('active', true)
    .limit(limit);

  return (
    similarProducts?.map((p) => ({
      id: p.id,
      name: p.name,
      url: p.product_url,
      sourceType: 'company_record' as const,
      priceRange: p.price_min && p.price_max ? `₱${p.price_min}-₱${p.price_max}` : undefined,
      nicheTags: p.tags || [],
      mainBenefits: p.key_benefits || [],
      mainObjections: [],
      positioningAngle: undefined,
      qualityScore: 60,
    })) || []
  );
}

function analyzeCompetitivePosition(
  product: any,
  competitors: CompetitorProfile[]
): {
  position: 'strong' | 'average' | 'weak';
  strengthScore: number;
  hooks: string[];
  pricingObs: string[];
} {
  let strengthScore = 50;
  const hooks: string[] = [];
  const pricingObs: string[] = [];

  if (product.key_benefits?.length >= 3) {
    strengthScore += 15;
  }

  if (product.product_url) {
    strengthScore += 10;
  }

  if (product.primary_promise) {
    strengthScore += 10;
  }

  if (competitors.length === 0) {
    hooks.push('First mover advantage in this niche');
    strengthScore += 15;
  } else if (competitors.length <= 3) {
    hooks.push('Limited competition - easier to stand out');
    strengthScore += 10;
  } else {
    hooks.push('Crowded market - differentiation is key');
    strengthScore -= 5;
  }

  const avgCompQuality =
    competitors.reduce((sum, c) => sum + c.qualityScore, 0) / (competitors.length || 1);

  if (strengthScore > avgCompQuality) {
    hooks.push('Your product has stronger positioning than most competitors');
  } else {
    hooks.push('Opportunity to improve positioning vs competitors');
  }

  if (product.price_min && competitors.length > 0) {
    const competitorPrices = competitors
      .filter((c) => c.priceRange)
      .map((c) => {
        const match = c.priceRange?.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

    if (competitorPrices.length > 0) {
      const avgPrice = competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length;
      if (product.price_min < avgPrice * 0.8) {
        pricingObs.push('Your pricing is competitive - good value proposition');
      } else if (product.price_min > avgPrice * 1.2) {
        pricingObs.push('Premium pricing - emphasize quality and exclusivity');
      } else {
        pricingObs.push('Mid-range pricing - balance value and quality');
      }
    }
  }

  const position: 'strong' | 'average' | 'weak' =
    strengthScore >= 70 ? 'strong' : strengthScore >= 50 ? 'average' : 'weak';

  return {
    position,
    strengthScore,
    hooks,
    pricingObs,
  };
}

function generateScripts(product: any, competitors: CompetitorProfile[], analysis: any): any {
  const productName = product.name;
  const promise = product.primary_promise || 'transform your life';
  const benefits = product.key_benefits || [];

  const elevatorPitch = `Ako ay nag-aalok ng ${productName}, ${promise}. ${
    benefits.length > 0
      ? `Ang key benefits nito: ${benefits.slice(0, 3).join(', ')}.`
      : 'Proven effective at trusted ng maraming users.'
  }`;

  const comparisonPitch =
    competitors.length > 0
      ? `Compared to other options, ang ${productName} stands out dahil ${
          analysis.hooks[0] || 'sa quality at value nito'
        }. ${
          analysis.pricingObs[0] ||
          'Sulit ang presyo para sa benefits na makukuha mo.'
        }`
      : `Ang ${productName} ay unique solution para sa ${promise}. Walang direct competitor na kasingganda nito.`;

  const objectionSnippets = [
    `"Mahal?" - ${analysis.pricingObs[0] || 'Investment ito sa future mo, at ang results ay worth it.'}`,
    `"May ibang options ba?" - Yes, pero ${productName} offers better value dahil ${
      benefits[0] || 'quality nito'
    }.`,
    `"Paano kung di ako satisfied?" - May guarantee kami at maraming satisfied customers na.`,
  ];

  const upsellHooks = [
    `Gusto mo ba ng mas mabilis na results? Try our premium package.`,
    `Maraming customers combine this with [complementary product] for best results.`,
    `Limited time offer: Add another unit at discounted price!`,
  ];

  return {
    elevatorPitch,
    comparisonPitch,
    objectionHandlingSnippets: objectionSnippets,
    upsellHooks,
  };
}

async function saveIntelSnapshot(
  productId: string,
  userId: string,
  result: ProductIntelV5Result,
  depth: string
) {
  const { data: snapshot, error: snapshotError } = await supabase
    .from('product_intel_snapshots')
    .insert({
      product_id: productId,
      user_id: userId,
      depth_level: depth,
      competitive_position: result.comparativeSummary.competitivePosition,
      primary_product_strength_score: result.primaryProductSummary.strengthScore,
      core_promise: result.primaryProductSummary.corePromise,
      niche_tags: result.primaryProductSummary.nicheTags,
      recommended_positioning_hooks: result.comparativeSummary.recommendedPositioningHooks,
      pricing_observations: result.comparativeSummary.pricingObservations,
      compliance_flags: result.comparativeSummary.complianceFlags,
      elevator_pitch: result.suggestedScripts.elevatorPitch,
      comparison_pitch: result.suggestedScripts.comparisonPitch,
      objection_handling_snippets: result.suggestedScripts.objectionHandlingSnippets,
      upsell_hooks: result.suggestedScripts.upsellHooks,
      raw_data_json: result,
      status: 'completed',
    })
    .select()
    .single();

  if (snapshotError) {
    console.error('Error saving snapshot:', snapshotError);
    return null;
  }

  for (const comp of result.competitorProfiles) {
    await supabase.from('product_competitors').insert({
      product_id: productId,
      snapshot_id: snapshot.id,
      competitor_name: comp.name,
      competitor_url: comp.url,
      source_type: comp.sourceType,
      price_range: comp.priceRange,
      niche_tags: comp.nicheTags,
      main_benefits: comp.mainBenefits,
      main_objections: comp.mainObjections,
      positioning_angle: comp.positioningAngle,
      quality_score: comp.qualityScore,
    });
  }

  return snapshot;
}

export async function runProductIntelligenceV5(
  input: ProductIntelInput
): Promise<ProductIntelV5Result> {
  try {
    const { userId, productId, crawlDepth = 'normal' } = input;

    const product = await loadProductContext(productId, userId);

    const competitors = await searchCompetitors(product, crawlDepth);

    const analysis = analyzeCompetitivePosition(product, competitors);

    const scripts = generateScripts(product, competitors, analysis);

    const result: ProductIntelV5Result = {
      success: true,
      productId,
      timestamp: new Date().toISOString(),
      primaryProductSummary: {
        name: product.name,
        corePromise: product.primary_promise || 'Help customers achieve their goals',
        nicheTags: product.tags || [],
        strengthScore: analysis.strengthScore,
      },
      competitorProfiles: competitors,
      comparativeSummary: {
        competitivePosition: analysis.position,
        recommendedPositioningHooks: analysis.hooks,
        pricingObservations: analysis.pricingObs,
        complianceFlags: [],
      },
      suggestedScripts: scripts,
    };

    await saveIntelSnapshot(productId, userId, result, crawlDepth);

    return result;
  } catch (error) {
    console.error('Product Intelligence V5 Error:', error);
    throw error;
  }
}

export const productIntelligenceEngineV5 = {
  run: runProductIntelligenceV5,
  id: 'productIntelligenceV5',
  name: 'Product Intelligence Engine v5.0',
  description: 'Analyzes products vs competitors and generates selling strategies',
};
