/**
 * Unified ScoutScore Types
 * Supports base versions (v1-v5) and overlay versions (v6-v8)
 */

export type Industry =
  | 'mlm'
  | 'insurance'
  | 'real_estate'
  | 'ecommerce'
  | 'clinic'
  | 'loans'
  | 'auto'
  | 'franchise'
  | 'coaching'
  | 'saas'
  | 'travel'
  | 'beauty'
  | 'other';

export interface BaseScoutScore {
  version: 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
  industry?: Industry;
  score: number; // 0–100
  leadTemperature: 'cold' | 'warm' | 'hot';
  intentSignal: string | null;
  conversionLikelihood: number; // 0–100
  recommendedCTA: string | null;
  breakdown?: Record<string, number>;
  insights?: string[];
}

export interface OverlayScoreV6 {
  version: 'v6';
  industry: Industry;
  personaProfile: string; // e.g. 'mlm_aspirant', 'homebuyer', 'clinic_patient', 'b2b_buyer'
  personaFitScore: number; // 0–100
  personaNotes: string[];
}

export interface OverlayScoreV7 {
  version: 'v7';
  ctaFitScore: number; // 0–100
  lastCTAType: string | null;
  suggestedCTAType: string | null;
  ctaNotes: string[];
}

export interface OverlayScoreV8 {
  version: 'v8';
  emotionalState: 'neutral' | 'excited' | 'anxious' | 'skeptical' | 'confused' | 'hopeful';
  trustScore: number; // 0–100
  riskFlags: string[]; // e.g. ['scam_trauma', 'fear_of_commitment']
  toneAdjustment: 'softer' | 'more_confident' | 'more_reassuring' | 'more_clarifying' | 'none';
}

export interface ScoutScoreFinal {
  base: BaseScoutScore;
  v6?: OverlayScoreV6;
  v7?: OverlayScoreV7;
  v8?: OverlayScoreV8;
  finalScore: number; // combined
  finalLeadTemperature: 'cold' | 'warm' | 'hot';
  finalIntentSignal: string | null;
  finalRecommendedCTA: string | null;
  finalInsights: string[];
  debugBreakdown?: {
    baseScore: number;
    v6Adjustment?: number;
    v7Adjustment?: number;
    v8Adjustment?: number;
    weights: {
      base: number;
      v6: number;
      v7: number;
      v8: number;
    };
  };
}

export interface ScoutScoreInput {
  prospectId: string;
  userId: string;
  industry?: Industry;
  activeIndustry?: Industry;
  textContent?: string;
  lastMessages?: Array<{ sender: 'user' | 'assistant'; message: string; timestamp?: string }>;
  lastCTAType?: string | null;
  browserCaptureData?: any;
  socialGraphData?: any;
  historicalData?: any;
}

export interface ScoutScoreConfig {
  baseVersion: 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
  enableV6?: boolean;
  enableV7?: boolean;
  enableV8?: boolean;
  industry?: Industry;
  activeIndustry?: Industry;
  debug?: boolean;
  // Legacy config fields (for backward compatibility)
  mode?: string;
  language?: string;
  includeBreakdown?: boolean;
  includeInsights?: boolean;
  includeRecommendations?: boolean;
  includeTimeline?: boolean;
  includeSocialGraph?: boolean;
  includeOpportunityPrediction?: boolean;
  includeConversionPatterns?: boolean;
  horizonDays?: number;
  weights?: Record<string, number>;
}


