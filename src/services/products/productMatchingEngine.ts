import { supabase } from '../../lib/supabase';

/**
 * Product Matching Engine
 * Automatically matches products to prospects based on:
 * - Persona alignment
 * - Pain point matching
 * - Benefit alignment
 * - ScoutScore compatibility
 */

export interface MatchResult {
  productId: string;
  productName: string;
  matchScore: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  matchReasons: string[];
  personaMatch: string | null;
  painPointsMatched: string[];
  benefitsAligned: string[];
}

export interface ProspectProfile {
  id: string;
  full_name: string;
  tags: string[];
  pain_points?: string[];
  interests?: string[];
  scoutscore?: number;
  budget_sensitivity?: 'low' | 'medium' | 'high';
}

export interface ProductProfile {
  id: string;
  name: string;
  main_category: string;
  personas: string[];
  pains: string[];
  desires: string[];
  ideal_prospect_tags: string[];
  key_benefits: string[];
  base_price?: number;
  price_min?: number;
  price_max?: number;
}

/**
 * Calculate match score between prospect and product
 */
export function calculateMatchScore(
  prospect: ProspectProfile,
  product: ProductProfile
): MatchResult {
  let score = 0;
  const matchReasons: string[] = [];
  const painPointsMatched: string[] = [];
  const benefitsAligned: string[] = [];
  let personaMatch: string | null = null;

  // 1. Persona Match (30 points max)
  const prospectTags = prospect.tags || [];
  const productPersonas = product.personas || [];
  const matchingPersonas = prospectTags.filter(tag =>
    productPersonas.some(persona => persona.toLowerCase().includes(tag.toLowerCase()))
  );

  if (matchingPersonas.length > 0) {
    const personaScore = Math.min(30, matchingPersonas.length * 15);
    score += personaScore;
    personaMatch = matchingPersonas[0];
    matchReasons.push(`Perfect match for ${matchingPersonas.join(', ')} persona`);
  }

  // 2. Pain Point Match (30 points max)
  const prospectPains = prospect.pain_points || [];
  const productPains = product.pains || [];

  if (prospectPains.length > 0 && productPains.length > 0) {
    const matchingPains = prospectPains.filter(pain =>
      productPains.some(prodPain =>
        prodPain.toLowerCase().includes(pain.toLowerCase()) ||
        pain.toLowerCase().includes(prodPain.toLowerCase())
      )
    );

    if (matchingPains.length > 0) {
      const painScore = Math.min(30, matchingPains.length * 10);
      score += painScore;
      painPointsMatched.push(...matchingPains);
      matchReasons.push(`Addresses ${matchingPains.length} key pain points`);
    }
  }

  // 3. Tag Alignment (20 points max)
  const productTags = product.ideal_prospect_tags || [];
  const matchingTags = prospectTags.filter(tag =>
    productTags.includes(tag)
  );

  if (matchingTags.length > 0) {
    const tagScore = Math.min(20, matchingTags.length * 10);
    score += tagScore;
    matchReasons.push(`Ideal for ${matchingTags.join(', ')}`);
  }

  // 4. Interest Alignment (10 points max)
  const prospectInterests = prospect.interests || [];
  const matchingInterests = prospectInterests.filter(interest =>
    product.main_category.toLowerCase().includes(interest.toLowerCase())
  );

  if (matchingInterests.length > 0) {
    score += 10;
    matchReasons.push('Matches prospect interests');
  }

  // 5. ScoutScore Compatibility (10 points max)
  if (prospect.scoutscore && prospect.scoutscore >= 70) {
    score += 10;
    matchReasons.push('High-quality prospect (ScoutScore 70+)');
  } else if (prospect.scoutscore && prospect.scoutscore >= 50) {
    score += 5;
    matchReasons.push('Good prospect quality');
  }

  // Determine confidence level
  let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
  if (score >= 70) {
    confidenceLevel = 'high';
  } else if (score >= 40) {
    confidenceLevel = 'medium';
  }

  // Align benefits (for display)
  if (product.key_benefits) {
    benefitsAligned.push(...product.key_benefits.slice(0, 3));
  }

  return {
    productId: product.id,
    productName: product.name,
    matchScore: Math.min(100, score),
    confidenceLevel,
    matchReasons,
    personaMatch,
    painPointsMatched,
    benefitsAligned,
  };
}

/**
 * Find best product matches for a prospect
 */
export async function findProductMatchesForProspect(
  userId: string,
  prospectId: string,
  limit: number = 5
): Promise<MatchResult[]> {
  try {
    // Fetch prospect data
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('id, full_name, tags, pain_points, interests, scoutscore')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .single();

    if (prospectError || !prospect) {
      throw new Error('Prospect not found');
    }

    // Fetch all active products for user
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, main_category, personas, pains, desires, ideal_prospect_tags, key_benefits, base_price, price_min, price_max')
      .eq('user_id', userId)
      .eq('active', true)
      .eq('is_complete', true);

    if (productsError || !products || products.length === 0) {
      return [];
    }

    // Calculate match score for each product
    const matches = products.map(product =>
      calculateMatchScore(prospect as ProspectProfile, product as ProductProfile)
    );

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top matches
    return matches.slice(0, limit);
  } catch (error) {
    console.error('Error finding product matches:', error);
    return [];
  }
}

/**
 * Save product recommendation to database
 */
export async function saveProductRecommendation(
  userId: string,
  prospectId: string,
  match: MatchResult
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('product_recommendations')
      .insert({
        user_id: userId,
        prospect_id: prospectId,
        product_id: match.productId,
        match_score: match.matchScore,
        confidence_level: match.confidenceLevel,
        match_reasons: match.matchReasons,
        persona_match: match.personaMatch,
        pain_points_matched: match.painPointsMatched,
        benefits_aligned: match.benefitsAligned,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving recommendation:', error);
    return null;
  }
}

/**
 * Batch generate recommendations for multiple prospects
 */
export async function generateBatchRecommendations(
  userId: string,
  prospectIds: string[]
): Promise<{ prospectId: string; matches: MatchResult[] }[]> {
  const results = [];

  for (const prospectId of prospectIds) {
    const matches = await findProductMatchesForProspect(userId, prospectId, 3);
    results.push({ prospectId, matches });

    // Save top match if score is high
    if (matches.length > 0 && matches[0].matchScore >= 50) {
      await saveProductRecommendation(userId, prospectId, matches[0]);
    }
  }

  return results;
}

/**
 * Track product analytics event
 */
export async function trackProductEvent(
  userId: string,
  eventType: string,
  eventCategory: string,
  data: {
    productId?: string;
    prospectId?: string;
    sessionId?: string;
    channel?: string;
    [key: string]: any;
  }
): Promise<void> {
  try {
    await supabase
      .from('product_analytics_events')
      .insert({
        user_id: userId,
        product_id: data.productId || null,
        prospect_id: data.prospectId || null,
        event_type: eventType,
        event_category: eventCategory,
        event_data: data,
        session_id: data.sessionId || null,
        channel: data.channel || 'web',
      });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}
