/**
 * ScoutScore Debug Type Definitions
 * Used for displaying transparent scoring breakdown across v1-v8
 */

export type ScoutIndustry =
  | "mlm"
  | "insurance"
  | "real_estate"
  | "ecommerce"
  | "clinic"
  | "loans"
  | "auto"
  | "franchise"
  | "coaching"
  | "saas"
  | "travel"
  | "beauty"
  | "other";

export type LeadTemperature = "hot" | "warm" | "cold";

export interface ScoutScoreVersionV1 {
  score: number;
  signals: string[];
  explanation: string;
}

export interface ScoutScoreVersionV2 {
  score: number;
  objections: string[];
  sensitivityLevel: string;
  explanation?: string;
}

export interface ScoutScoreVersionV3 {
  score: number;
  interactions: string[];
  clickHeat: number;
  explanation?: string;
}

export interface ScoutScoreVersionV4 {
  score: number;
  timelineStrength: number;
  momentum: "warming" | "cooling" | "stable" | "volatile";
  daysSilent: number;
  explanation?: string;
}

export interface ScoutScoreVersionV5 {
  score: number;
  industryMatch: string;
  weightProfile: string;
  explanation?: string;
}

export interface ScoutScoreVersionV6 {
  score: number;
  personaFit: string;
  mismatchReasons: string[];
  explanation?: string;
}

export interface ScoutScoreVersionV7 {
  score: number;
  ctaRecommendation: string;
  ctaFitScore: number;
  explanation?: string;
}

export interface ScoutScoreVersionV8 {
  score: number;
  emotionalTone: string;
  confidence: number;
  dominantSignal: string;
  explanation?: string;
}

export interface ScoutScoreDebug {
  leadId: string;
  leadName?: string;
  finalScore: number;           // 0–100
  leadTemperature: LeadTemperature;
  industry: ScoutIndustry | string;
  versions: {
    v1: ScoutScoreVersionV1;
    v2: ScoutScoreVersionV2;
    v3: ScoutScoreVersionV3;
    v4: ScoutScoreVersionV4;
    v5: ScoutScoreVersionV5;
    v6: ScoutScoreVersionV6;
    v7: ScoutScoreVersionV7;
    v8: ScoutScoreVersionV8;
  };
  recommendedCTA: string;
  intentSignal: string;
  conversionLikelihood: number; // 0–100
}


