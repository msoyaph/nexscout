/**
 * Industry-specific weight profiles for ScoutScore v5
 * Ensures scoring weights are isolated per industry
 */

export type Industry = 'mlm' | 'insurance' | 'real_estate' | 'ecommerce' | 'direct_selling';

export interface ScoringWeights {
  baseScore: number;
  behavioralMomentum: number;
  socialInfluence: number;
  opportunityReadiness: number;
  patternMatch: number;
  engagement: number;
  opportunity: number;
  painPoints: number;
  socialGraph: number;
  behavior: number;
  relationship: number;
  freshness: number;
}

// Base neutral weights (used when no industry is specified)
export const BASE_NEUTRAL_WEIGHTS: ScoringWeights = {
  baseScore: 0.35,
  behavioralMomentum: 0.25,
  socialInfluence: 0.15,
  opportunityReadiness: 0.15,
  patternMatch: 0.10,
  engagement: 0.18,
  opportunity: 0.22,
  painPoints: 0.20,
  socialGraph: 0.15,
  behavior: 0.12,
  relationship: 0.08,
  freshness: 0.05,
};

// MLM-specific weights (higher emphasis on social influence and opportunity)
export const MLM_WEIGHTS: Partial<ScoringWeights> = {
  baseScore: 0.30,
  behavioralMomentum: 0.25,
  socialInfluence: 0.20, // Higher - MLM relies on network
  opportunityReadiness: 0.15,
  patternMatch: 0.10,
  engagement: 0.20,
  opportunity: 0.25, // Higher - opportunity-seeking is key
  painPoints: 0.18,
  socialGraph: 0.20, // Higher - social proof matters
  behavior: 0.12,
  relationship: 0.10, // Higher - relationship-building
  freshness: 0.05,
};

// Insurance-specific weights (higher emphasis on pain points and life events)
export const INSURANCE_WEIGHTS: Partial<ScoringWeights> = {
  baseScore: 0.35,
  behavioralMomentum: 0.20,
  socialInfluence: 0.10, // Lower - less social proof needed
  opportunityReadiness: 0.15,
  patternMatch: 0.20, // Higher - proven patterns matter more
  engagement: 0.15,
  opportunity: 0.18,
  painPoints: 0.25, // Higher - financial protection needs
  socialGraph: 0.10,
  behavior: 0.15,
  relationship: 0.12,
  freshness: 0.05,
};

// Real Estate-specific weights (higher emphasis on opportunity and timing)
export const REAL_ESTATE_WEIGHTS: Partial<ScoringWeights> = {
  baseScore: 0.35,
  behavioralMomentum: 0.30, // Higher - timing is critical
  socialInfluence: 0.10,
  opportunityReadiness: 0.20, // Higher - investment readiness
  patternMatch: 0.05,
  engagement: 0.15,
  opportunity: 0.25, // Higher - investment opportunity signals
  painPoints: 0.15,
  socialGraph: 0.10,
  behavior: 0.15,
  relationship: 0.10,
  freshness: 0.10, // Higher - recency matters for property interest
};

// Ecommerce-specific weights (higher emphasis on engagement and behavior)
export const ECOMMERCE_WEIGHTS: Partial<ScoringWeights> = {
  baseScore: 0.30,
  behavioralMomentum: 0.25,
  socialInfluence: 0.15,
  opportunityReadiness: 0.15,
  patternMatch: 0.15,
  engagement: 0.25, // Higher - online engagement matters
  opportunity: 0.20,
  painPoints: 0.15,
  socialGraph: 0.10,
  behavior: 0.20, // Higher - browsing/clicking behavior
  relationship: 0.05, // Lower - less relationship needed
  freshness: 0.10, // Higher - online activity recency
};

// Industry weight mapping
export const INDUSTRY_WEIGHTS: Record<Industry, Partial<ScoringWeights>> = {
  mlm: MLM_WEIGHTS,
  insurance: INSURANCE_WEIGHTS,
  real_estate: REAL_ESTATE_WEIGHTS,
  ecommerce: ECOMMERCE_WEIGHTS,
  direct_selling: MLM_WEIGHTS, // Direct selling uses MLM weights
};

/**
 * Get weights for a specific industry, with fallback to base neutral weights
 */
export function getIndustryWeights(industry?: Industry): ScoringWeights {
  if (!industry || !INDUSTRY_WEIGHTS[industry]) {
    return BASE_NEUTRAL_WEIGHTS;
  }

  // Merge industry-specific weights with base weights
  return {
    ...BASE_NEUTRAL_WEIGHTS,
    ...INDUSTRY_WEIGHTS[industry],
  };
}


