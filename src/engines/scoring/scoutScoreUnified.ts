import { supabase } from '../../lib/supabase';
import { scoutScoreV4Engine } from '../../services/intelligence/scoutScoreV4';
import { scoutScoreV5Engine } from '../../services/intelligence/scoutScoreV5';
import { behavioralTimelineEngine } from '../../services/intelligence/behavioralTimelineEngine';
import { socialGraphBuilder } from '../../services/intelligence/socialGraphBuilder';
import { opportunityPredictionEngine } from '../../services/intelligence/opportunityPredictionEngine';
import { conversionPatternMapper } from '../../services/intelligence/conversionPatternMapper';
import type { Industry } from '../../services/intelligence/conversionPatternMapper';
import type {
  BaseScoutScore,
  OverlayScoreV6,
  OverlayScoreV7,
  OverlayScoreV8,
  ScoutScoreFinal,
  ScoutScoreConfig as NewScoutScoreConfig,
  ScoutScoreInput as NewScoutScoreInput,
} from '../../types/scoutScore';
import { scoutScoringV6Engine } from '../../services/scoutScoringV6';
import { scoutScoringV7Engine } from '../../services/scoutScoringV7';
import { scoutScoringV8Engine } from '../../services/scoutScoringV8';
import { scoutScoringV2 } from '../../services/scoutScoringV2';
import { scoutScoringV3Engine } from '../../services/scoutScoringV3';

export type ScoutScoreMode = 'v1_simple' | 'v2_mlm' | 'v3_social' | 'v4_behavioral' | 'v5_intelligence' | 'unified';

export type ScoutScoreRating = 'hot' | 'warm' | 'cold';

export interface ScoutScoreConfig {
  mode?: ScoutScoreMode;
  industry?: Industry;
  language?: 'en' | 'fil' | 'ceb' | 'auto';
  includeBreakdown?: boolean;
  includeInsights?: boolean;
  includeRecommendations?: boolean;
  includeTimeline?: boolean;
  includeSocialGraph?: boolean;
  includeOpportunityPrediction?: boolean;
  includeConversionPatterns?: boolean;
  horizonDays?: number;
  weights?: {
    engagement?: number;
    opportunity?: number;
    painPoints?: number;
    socialGraph?: number;
    behavior?: number;
    relationship?: number;
    freshness?: number;
  };
}

export interface ScoutScoreInput {
  prospectId: string;
  userId: string;
  textContent?: string;
  browserCaptureData?: any;
  socialGraphData?: any;
  historicalData?: any;
  prospectData?: {
    bio?: string;
    posts?: string[];
    comments?: string[];
    recentActivity?: string[];
    employment?: string;
    interests?: string[];
    personality?: string;
    referralSource?: string;
    referralQuality?: 'hot' | 'warm' | 'cold';
    responseSpeed?: number;
    engagementMetrics?: {
      comments: number;
      likes: number;
      shares: number;
    };
  };
  config?: ScoutScoreConfig;
}

export interface ScoutScoreOutput {
  success: boolean;
  prospectId: string;
  userId: string;
  mode: ScoutScoreMode;
  score: number;
  rating: ScoutScoreRating;
  confidence: number;
  // New unified fields (required for v1-v5)
  intentSignal?: string | null;
  conversionLikelihood?: number | null; // 0-100
  recommendedCTA?: string | null;
  // Legacy fields (for backward compatibility)
  breakdown?: {
    engagement?: number;
    opportunity?: number;
    painPoints?: number;
    graphCentrality?: number;
    behaviorMomentum?: number;
    relationshipWarmth?: number;
    freshness?: number;
    baseScore?: number;
    socialInfluence?: number;
    opportunityReadiness?: number;
    patternMatch?: number;
  };
  explanation?: string[];
  insights?: string[];
  recommendations?: {
    nextStep?: string;
    timing?: string;
    approach?: string;
    messageTemplate?: string;
  };
  // v2-specific: objection signals
  objectionSignals?: {
    hasBudgetObjection: boolean;
    hasTimingObjection: boolean;
    hasSpouseObjection: boolean;
  };
  // v3-specific: conversion heat
  conversionHeatScore?: number;
  // v4-specific: lead temperature
  leadTemperature?: 'cold' | 'warming_up' | 'warm' | 'hot';
  timeline?: {
    events: any[];
    analytics: any;
  };
  socialGraph?: {
    influenceScore?: number;
    centralityScore?: number;
    clusterId?: string;
    connectedNodes?: number;
  };
  opportunityPrediction?: {
    probability: number;
    rating: string;
    recommendedTiming: string;
  };
  conversionPatterns?: {
    matchedPatterns: any[];
    recommendations: string[];
  };
  metadata: {
    calculatedAt: string;
    version: string;
    dataSourcesCombined: number;
    processingTimeMs?: number;
  };
}

const DEFAULT_CONFIG: ScoutScoreConfig = {
  mode: 'unified',
  language: 'auto',
  includeBreakdown: true,
  includeInsights: true,
  includeRecommendations: true,
  includeTimeline: false,
  includeSocialGraph: false,
  includeOpportunityPrediction: false,
  includeConversionPatterns: false,
  horizonDays: 7,
};

class ScoutScoreUnifiedEngine {
  /**
   * Main orchestrator function for v6-v8 overlay scoring
   * Supports base versions (v1-v5) with optional overlay layers (v6-v8)
   */
  async computeScoutScoreFinal(
    input: NewScoutScoreInput,
    config: NewScoutScoreConfig
  ): Promise<ScoutScoreFinal> {
    const startTime = Date.now();
    const debug = config.debug || false;

    // Industry safety check - persona lock
    const activeIndustry = config.activeIndustry || config.industry;
    const industry = config.industry;
    
    // Warn if industry mismatch
    if (activeIndustry && industry && activeIndustry !== industry) {
      console.warn(
        `[ScoutScore] Industry mismatch detected: activeIndustry=${activeIndustry}, industry=${industry}. ` +
        `V6/V7 overlays will use activeIndustry=${activeIndustry} for persona/CTA matching.`
      );
    }
    
    // V6/V7 require industry - skip if missing
    if (!activeIndustry && (config.enableV6 || config.enableV7)) {
      console.warn('[ScoutScore] V6/V7 requires industry - skipping overlay layers');
    }
    
    // Version blending check (dev only)
    if (process.env.NODE_ENV === 'development' || debug) {
      // This check is implicit - we only use one baseVersion at a time
      // But we can warn if multiple overlay flags are enabled incorrectly
      if (config.enableV6 && !activeIndustry) {
        console.warn('[ScoutScore] V6 enabled but no industry provided - will be skipped');
      }
      if (config.enableV7 && !activeIndustry) {
        console.warn('[ScoutScore] V7 enabled but no industry provided - will be skipped');
      }
    }

    // Run base engine (v1-v5)
    const base = await this.runBaseVersion(input, config, startTime);

    // Optionally run overlays
    let v6: OverlayScoreV6 | undefined;
    let v7: OverlayScoreV7 | undefined;
    let v8: OverlayScoreV8 | undefined;

    // Run V6 overlay (persona scoring) - requires industry
    if (config.enableV6 && activeIndustry) {
      try {
        v6 = await scoutScoringV6Engine.calculatePersonaOverlay(input, base, activeIndustry);
        if (debug) {
          console.log('[ScoutScore V6] Persona overlay calculated:', {
            personaProfile: v6.personaProfile,
            personaFitScore: v6.personaFitScore,
            notes: v6.personaNotes,
          });
        }
      } catch (error) {
        console.error('[ScoutScore V6] Error calculating persona overlay:', error);
        if (debug) {
          console.error('[ScoutScore V6] Error details:', error);
        }
      }
    }

    // Run V7 overlay (CTA fit) - requires industry
    if (config.enableV7 && activeIndustry) {
      try {
        v7 = await scoutScoringV7Engine.calculateCTAOverlay(input, base, activeIndustry);
        if (debug) {
          console.log('[ScoutScore V7] CTA overlay calculated:', {
            ctaFitScore: v7.ctaFitScore,
            lastCTAType: v7.lastCTAType,
            suggestedCTAType: v7.suggestedCTAType,
            notes: v7.ctaNotes,
          });
        }
      } catch (error) {
        console.error('[ScoutScore V7] Error calculating CTA overlay:', error);
        if (debug) {
          console.error('[ScoutScore V7] Error details:', error);
        }
      }
    }

    // Run V8 overlay (emotional/trust) - works without industry but better with it
    if (config.enableV8) {
      try {
        v8 = await scoutScoringV8Engine.calculateEmotionalOverlay(input, base, activeIndustry);
        if (debug) {
          console.log('[ScoutScore V8] Emotional overlay calculated:', {
            emotionalState: v8.emotionalState,
            trustScore: v8.trustScore,
            riskFlags: v8.riskFlags,
            toneAdjustment: v8.toneAdjustment,
          });
        }
      } catch (error) {
        console.error('[ScoutScore V8] Error calculating emotional overlay:', error);
        if (debug) {
          console.error('[ScoutScore V8] Error details:', error);
        }
      }
    }

    // Combine scores
    const combined = this.combineScores(base, v6, v7, v8, debug);
    
    // Derive final temperature
    const finalLeadTemperature = this.deriveFinalTemperature(combined.finalScore);
    
    // Final CTA (prefer v7 suggestion, fallback to base)
    const finalRecommendedCTA = v7?.suggestedCTAType || base.recommendedCTA;
    
    // Combine insights
    const finalInsights: string[] = [
      ...(base.insights || []),
      ...(v6?.personaNotes || []),
      ...(v7?.ctaNotes || []),
      ...(v8 ? [
        `Emotional state: ${v8.emotionalState}`,
        `Trust score: ${v8.trustScore}%`,
        ...(v8.riskFlags.length > 0 ? [`Risk flags: ${v8.riskFlags.join(', ')}`] : []),
        ...(v8.toneAdjustment !== 'none' ? [`Recommended tone: ${v8.toneAdjustment.replace('_', ' ')}`] : []),
      ] : []),
    ];

    // Debug logging
    if (debug) {
      console.log('[ScoutScore Final] Score combination:', {
        baseScore: base.score,
        finalScore: combined.finalScore,
        breakdown: combined.debugBreakdown,
      });
      
      finalInsights.push(
        `[DEBUG] Base score (${base.version}): ${base.score}`,
        ...(v6 ? [`[DEBUG] V6 persona fit: ${v6.personaFitScore} (${v6.personaProfile})`] : []),
        ...(v7 ? [`[DEBUG] V7 CTA fit: ${v7.ctaFitScore} (last: ${v7.lastCTAType || 'none'}, suggested: ${v7.suggestedCTAType || 'none'})`] : []),
        ...(v8 ? [`[DEBUG] V8 trust: ${v8.trustScore}, emotional: ${v8.emotionalState}, tone: ${v8.toneAdjustment}`] : []),
        `[DEBUG] Final combined score: ${combined.finalScore} → ${finalLeadTemperature}`
      );
    }

    return {
      base,
      v6,
      v7,
      v8,
      finalScore: combined.finalScore,
      finalLeadTemperature,
      finalIntentSignal: base.intentSignal,
      finalRecommendedCTA,
      finalInsights,
      debugBreakdown: combined.debugBreakdown,
    };
  }

  /**
   * Run base version (v1-v5)
   */
  private async runBaseVersion(
    input: NewScoutScoreInput,
    config: NewScoutScoreConfig,
    startTime: number
  ): Promise<BaseScoutScore> {
    // Convert new input to legacy format
    const legacyInput: ScoutScoreInput = {
      prospectId: input.prospectId,
      userId: input.userId,
      textContent: input.textContent,
      browserCaptureData: input.browserCaptureData,
      socialGraphData: input.socialGraphData,
      historicalData: input.historicalData,
    };

    const legacyConfig: ScoutScoreConfig = {
      mode: this.mapBaseVersionToMode(config.baseVersion),
      industry: config.industry,
      ...config,
    };

    const output = await this.calculateScoutScore(legacyInput, legacyConfig);

    return {
      version: config.baseVersion,
      industry: config.industry,
      score: output.score,
      leadTemperature: output.leadTemperature || output.rating,
      intentSignal: output.intentSignal || null,
      conversionLikelihood: output.conversionLikelihood || output.score,
      recommendedCTA: output.recommendedCTA || null,
      breakdown: output.breakdown as Record<string, number> | undefined,
      insights: output.insights || [],
    };
  }

  private mapBaseVersionToMode(baseVersion: 'v1' | 'v2' | 'v3' | 'v4' | 'v5'): ScoutScoreMode {
    const map: Record<string, ScoutScoreMode> = {
      v1: 'v1_simple',
      v2: 'v2_mlm',
      v3: 'v3_social',
      v4: 'v4_behavioral',
      v5: 'v5_intelligence',
    };
    return map[baseVersion] || 'v1_simple';
  }

  /**
   * Combine base score with overlay adjustments
   */
  private combineScores(
    base: BaseScoutScore,
    v6?: OverlayScoreV6,
    v7?: OverlayScoreV7,
    v8?: OverlayScoreV8,
    debug?: boolean
  ): {
    finalScore: number;
    debugBreakdown?: ScoutScoreFinal['debugBreakdown'];
  } {
    // Default weights: base 70%, overlays 10% each
    const weights = {
      base: 0.70,
      v6: 0.10,
      v7: 0.10,
      v8: 0.10,
    };

    let finalScore = base.score * weights.base;

    const adjustments = {
      v6: 0,
      v7: 0,
      v8: 0,
    };

    // V6 adjustment: persona fit influences score
    if (v6) {
      // Persona fit acts as a multiplier on base score
      // High persona fit (80+) boosts, low fit (40-) slightly reduces
      const personaAdjustment = (v6.personaFitScore - 50) * 0.2; // -10 to +10 range
      adjustments.v6 = personaAdjustment;
      finalScore += v6.personaFitScore * weights.v6;
    }

    // V7 adjustment: CTA fit influences score
    if (v7) {
      // CTA fit score contributes directly
      // Good CTA fit (80+) boosts, poor fit (40-) reduces
      const ctaAdjustment = (v7.ctaFitScore - 50) * 0.15; // -7.5 to +7.5 range
      adjustments.v7 = ctaAdjustment;
      finalScore += v7.ctaFitScore * weights.v7;
    }

    // V8 adjustment: emotional state and trust influence score
    if (v8) {
      // Trust score contributes directly
      // High trust (80+) boosts, low trust (40-) reduces
      const trustAdjustment = (v8.trustScore - 60) * 0.15; // -3 to +6 range (centered at 60)
      adjustments.v8 = trustAdjustment;
      finalScore += v8.trustScore * weights.v8;

      // Risk flags reduce score
      if (v8.riskFlags.length > 0) {
        finalScore -= v8.riskFlags.length * 3;
        adjustments.v8 -= v8.riskFlags.length * 3;
      }
    }

    // Clamp to 0-100
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    return {
      finalScore,
      debugBreakdown: debug
        ? {
            baseScore: base.score,
            v6Adjustment: v6 ? adjustments.v6 : undefined,
            v7Adjustment: v7 ? adjustments.v7 : undefined,
            v8Adjustment: v8 ? adjustments.v8 : undefined,
            weights,
          }
        : undefined,
    };
  }

  /**
   * Derive final lead temperature from combined score
   */
  private deriveFinalTemperature(finalScore: number): 'cold' | 'warm' | 'hot' {
    if (finalScore >= 75) return 'hot';
    if (finalScore >= 50) return 'warm';
    return 'cold';
  }

  async calculateScoutScore(input: ScoutScoreInput): Promise<ScoutScoreOutput> {
    const startTime = Date.now();
    const config = { ...DEFAULT_CONFIG, ...input.config };

    try {
      switch (config.mode) {
        case 'v1_simple':
          return await this.calculateV1Simple(input, config, startTime);
        case 'v2_mlm':
          return await this.calculateV2MLM(input, config, startTime);
        case 'v3_social':
          return await this.calculateV3Social(input, config, startTime);
        case 'v4_behavioral':
          return await this.calculateV4Behavioral(input, config, startTime);
        case 'v5_intelligence':
          return await this.calculateV5Intelligence(input, config, startTime);
        case 'unified':
        default:
          return await this.calculateUnified(input, config, startTime);
      }
    } catch (error) {
      console.error('ScoutScore calculation error:', error);
      return this.getDefaultOutput(input, config, startTime);
    }
  }

  private async calculateV1Simple(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
    const text = (input.textContent || '').toLowerCase();

    let score = 50;
    const factors: string[] = [];

    const painKeywords = ['kailangan', 'need', 'hirap', 'struggle', 'kulang', 'problem', 'gastos', 'bills', 'utang', 'debt', 'pagod', 'stressed'];
    const opportunityKeywords = ['extra income', 'side hustle', 'business', 'negosyo', 'opportunity', 'investment', 'passive income', 'online'];
    const priceKeywords = ['price', 'magkano', 'how much', 'cost', 'presyo'];

    const painMatches = painKeywords.filter(kw => text.includes(kw));
    if (painMatches.length > 0) {
      score += painMatches.length * 8;
      factors.push(`${painMatches.length} pain points detected`);
    }

    const opportunityMatches = opportunityKeywords.filter(kw => text.includes(kw));
    if (opportunityMatches.length > 0) {
      score += opportunityMatches.length * 10;
      factors.push(`${opportunityMatches.length} opportunity signals`);
    }

    // Detect intent signal
    let intentSignal: string | null = null;
    if (priceKeywords.some(kw => text.includes(kw))) {
      intentSignal = 'price_check';
    } else if (opportunityMatches.length > painMatches.length) {
      intentSignal = 'interest';
    } else if (painMatches.length > 0) {
      intentSignal = 'info_only';
    }

    score = Math.min(Math.max(score, 0), 100);
    const rating = this.getRating(score);

    // Map rating to conversion likelihood
    const conversionLikelihood = rating === 'hot' ? 75 : rating === 'warm' ? 40 : 10;

    // Generate recommended CTA
    let recommendedCTA: string | null = null;
    if (intentSignal === 'price_check') {
      recommendedCTA = 'show_price';
    } else if (intentSignal === 'interest') {
      recommendedCTA = 'invite_to_call';
    } else {
      recommendedCTA = 'share_basic_info';
    }

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v1_simple',
      score: Math.round(score),
      rating,
      confidence: 0.6,
      intentSignal,
      conversionLikelihood,
      recommendedCTA,
      explanation: factors,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'v1_simple',
        dataSourcesCombined: 1,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async calculateV2MLM(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
    // v2 mode: Use the canonical v2 engine with objection detection
    const { scoutScoringV2 } = await import('../../services/scoutScoringV2');
    
    const v2Result = await scoutScoringV2.calculateScoutScore(
      input.prospectId,
      input.userId,
      input.textContent
    );

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v2_mlm',
      score: v2Result.score,
      rating: v2Result.bucket,
      confidence: v2Result.confidence,
      // Extended unified fields
      intentSignal: v2Result.intentSignal || null,
      conversionLikelihood: v2Result.conversionLikelihood || null,
      recommendedCTA: v2Result.recommendedCTA || null,
      objectionSignals: v2Result.objectionSignals,
      breakdown: config.includeBreakdown
        ? {
            engagement: v2Result.feature_vector.engagement_score,
            opportunity: v2Result.feature_vector.business_interest_score,
            painPoints: v2Result.feature_vector.pain_point_score,
          }
        : undefined,
      explanation: v2Result.explanation_tags,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'v2_mlm',
        dataSourcesCombined: 2,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async calculateV3Social(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
    // NEW v3: CTA/Click tracking instead of social
    const { scoutScoringV3Engine } = await import('../../services/scoutScoringV3');
    
    const v3Result = await scoutScoringV3Engine.calculateCTAHeatScore({
      prospectId: input.prospectId,
      userId: input.userId,
      windowDays: 30,
    });

    const rating = v3Result.conversionHeatScore >= 70 ? 'hot' : 
                   v3Result.conversionHeatScore >= 40 ? 'warm' : 'cold';

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v3_social',
      score: v3Result.conversionHeatScore,
      rating,
      confidence: 0.80,
      intentSignal: v3Result.intentSignal,
      conversionLikelihood: v3Result.conversionLikelihood,
      recommendedCTA: v3Result.recommendedCTA,
      conversionHeatScore: v3Result.conversionHeatScore,
      breakdown: config.includeBreakdown
        ? {
            engagement: v3Result.eventBreakdown.messageSeen * 10,
            opportunity: v3Result.eventBreakdown.ctaClicked * 10,
            painPoints: v3Result.eventBreakdown.formSubmitted * 20,
          }
        : undefined,
      insights: config.includeInsights ? v3Result.insights : undefined,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'v3_cta_tracking',
        dataSourcesCombined: 1, // CTA events only
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async calculateV4Behavioral(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
    // v4 mode: ONLY return v4 result, no blending with other versions
    const v4Result = await scoutScoreV4Engine.calculateScoutScoreV4({
      prospectId: input.prospectId,
      userId: input.userId,
      textContent: input.textContent,
      browserCaptureData: input.browserCaptureData,
      socialGraphData: input.socialGraphData,
      historicalData: input.historicalData,
    });

    const timeline = config.includeTimeline
      ? await behavioralTimelineEngine.buildBehavioralTimeline({
          prospectId: input.prospectId,
          userId: input.userId,
          windowDays: 90,
        })
      : null;

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v4_behavioral',
      score: v4Result.score,
      rating: v4Result.rating,
      confidence: v4Result.confidence,
      // Extended unified fields from v4
      intentSignal: v4Result.intentSignal || null,
      conversionLikelihood: v4Result.conversionLikelihood || null,
      recommendedCTA: v4Result.recommendedCTA || null,
      leadTemperature: v4Result.leadTemperature,
      breakdown: config.includeBreakdown ? v4Result.breakdown : undefined,
      explanation: config.includeInsights ? v4Result.explanation : undefined,
      insights: config.includeInsights ? v4Result.insights : undefined,
      recommendations: config.includeRecommendations
        ? {
            nextStep: v4Result.recommendations[0],
            timing: timeline?.analytics?.trendDirection === 'warming_up' ? 'this_week' : 'next_week',
            approach: v4Result.recommendations[1] || 'Value-first engagement',
          }
        : undefined,
      timeline: config.includeTimeline
        ? {
            events: timeline?.events || [],
            analytics: timeline?.analytics || {},
          }
        : undefined,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'v4_behavioral',
        dataSourcesCombined: 4,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async calculateV5Intelligence(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
    // v5 mode: ONLY return v5 result, no v4 blending
    const v5Result = await scoutScoreV5Engine.calculateScoutScoreV5({
      prospectId: input.prospectId,
      userId: input.userId,
      industry: config.industry,
      activeIndustry: config.industry, // Pass as activeIndustry for isolation check
      horizonDays: config.horizonDays,
    });

    // Map v5 lead temperature
    const leadTemperature = v5Result.v5Score >= 75 ? 'hot' : 
                           v5Result.v5Score >= 50 ? 'warm' : 'cold';

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v5_intelligence',
      score: v5Result.v5Score,
      rating: leadTemperature,
      confidence: v5Result.reasoning.confidenceLevel === 'very_high' ? 0.95 : 
                  v5Result.reasoning.confidenceLevel === 'high' ? 0.85 : 
                  v5Result.reasoning.confidenceLevel === 'medium' ? 0.70 : 0.50,
      // Extended unified fields
      intentSignal: this.generateIntentSignalFromV5(v5Result),
      conversionLikelihood: v5Result.v5Score, // Use v5 score as likelihood
      recommendedCTA: v5Result.recommendations.nextStep || v5Result.recommendations.messageTemplate || null,
      leadTemperature: leadTemperature,
      // Legacy breakdown (from v5 dimensions)
      breakdown: config.includeBreakdown ? {
        baseScore: v5Result.dimensions.baseScore,
        behaviorMomentum: v5Result.dimensions.behavioralMomentum,
        socialInfluence: v5Result.dimensions.socialInfluence,
        opportunityReadiness: v5Result.dimensions.opportunityReadiness,
        patternMatch: v5Result.dimensions.patternMatch,
      } : undefined,
      explanation: config.includeInsights ? [v5Result.reasoning.summary] : undefined,
      insights: config.includeInsights ? v5Result.reasoning.actionableInsights : undefined,
      recommendations: config.includeRecommendations ? {
        nextStep: v5Result.recommendations.nextStep,
        timing: v5Result.recommendations.timing,
        approach: v5Result.recommendations.approach,
        messageTemplate: v5Result.recommendations.messageTemplate,
      } : undefined,
      opportunityPrediction: config.includeOpportunityPrediction
        ? {
            probability: v5Result.dimensions.opportunityReadiness / 100,
            rating: v5Result.recommendations.timing,
            recommendedTiming: v5Result.recommendations.timing,
          }
        : undefined,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'v5_intelligence',
        dataSourcesCombined: v5Result.metadata.dataSourcesCombined,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private generateIntentSignalFromV5(v5Result: any): string | null {
    if (v5Result.reasoning.keyStrengths.some((s: string) => s.includes('High probability'))) {
      return 'high_intent';
    }
    if (v5Result.dimensions.opportunityReadiness >= 70) {
      return 'evaluating';
    }
    if (v5Result.dimensions.behavioralMomentum >= 70) {
      return 'warming_up';
    }
    return null;
  }

  private generateUnifiedIntentSignal(
    v4Result: any,
    timelineResult: any,
    opportunityResult: any
  ): string | null {
    if (opportunityResult?.prediction?.probability >= 0.8) {
      return 'high_intent';
    }
    if (timelineResult?.analytics?.trendDirection === 'warming_up') {
      return 'evaluating';
    }
    if (v4Result.breakdown?.opportunity >= 70) {
      return 'evaluating';
    }
    return null;
  }

  private resolveUnifiedCTA(ctaKey: string | null | undefined, industry?: string): string | null {
    if (!ctaKey || !industry) return ctaKey;
    
    // Resolve to industry-specific CTA if resolver available
    try {
      const { resolveIndustryCTA } = require('../../services/scout/industryCTAResolver');
      const resolved = resolveIndustryCTA(ctaKey, industry as any);
      return resolved?.text || ctaKey;
    } catch {
      return ctaKey;
    }
  }

  /**
   * Unified mode: Explicitly composite scoring combining multiple engines
   * This is NOT version blending - it's a deliberate composite mode that combines
   * v4 behavioral + timeline + social + opportunity + patterns
   * When mode is 'v1', 'v2', 'v3', 'v4', or 'v5', ONLY that version's result is returned
   */
  private async calculateUnified(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
    const [v4Result, timelineResult, socialGraphData, opportunityResult, patternsResult] = await Promise.all([
      scoutScoreV4Engine.calculateScoutScoreV4({
        prospectId: input.prospectId,
        userId: input.userId,
        textContent: input.textContent,
        browserCaptureData: input.browserCaptureData,
        socialGraphData: input.socialGraphData,
      }),
      config.includeTimeline
        ? behavioralTimelineEngine.buildBehavioralTimeline({
            prospectId: input.prospectId,
            userId: input.userId,
            windowDays: 90,
          })
        : Promise.resolve(null),
      config.includeSocialGraph ? this.getSocialGraphData(input.prospectId, input.userId) : Promise.resolve(null),
      config.includeOpportunityPrediction
        ? opportunityPredictionEngine.predictOpportunity({
            prospectId: input.prospectId,
            userId: input.userId,
            horizonDays: config.horizonDays || 7,
          })
        : Promise.resolve(null),
      config.includeConversionPatterns
        ? conversionPatternMapper.analyzeConversionPatterns({
            userId: input.userId,
            industry: config.industry,
          })
        : Promise.resolve(null),
    ]);

    // Unified mode: Explicitly composite - combines v4 + boosts from other engines
    // This is a deliberate composite, not version blending
    const baseScore = v4Result.score;

    let behaviorMomentumBoost = 0;
    if (timelineResult?.analytics) {
      if (timelineResult.analytics.trendDirection === 'warming_up') behaviorMomentumBoost += 10;
      if (timelineResult.analytics.opportunityMomentum > 60) behaviorMomentumBoost += 8;
      if (timelineResult.analytics.lastInteractionDaysAgo <= 3) behaviorMomentumBoost += 5;
    }

    let socialInfluenceBoost = 0;
    if (socialGraphData) {
      socialInfluenceBoost += (socialGraphData.influenceScore || 0) * 10;
      socialInfluenceBoost += (socialGraphData.centralityScore || 0) * 5;
    }

    let opportunityBoost = 0;
    if (opportunityResult?.prediction) {
      opportunityBoost = opportunityResult.prediction.probability * 10;
    }

    let patternBoost = 0;
    if (patternsResult?.globalPatterns) {
      const topPattern = patternsResult.globalPatterns
        .filter((p: any) => p.successRate >= 0.35)
        .sort((a: any, b: any) => b.successRate - a.successRate)[0];
      if (topPattern) {
        patternBoost = topPattern.successRate * 8;
      }
    }

    const unifiedScore = Math.min(
      baseScore + behaviorMomentumBoost + socialInfluenceBoost + opportunityBoost + patternBoost,
      100
    );

    const rating = this.getRating(unifiedScore);
    
    // Generate unified extended fields
    const leadTemperature = v4Result.leadTemperature || (rating === 'hot' ? 'hot' : rating === 'warm' ? 'warm' : 'cold');
    const intentSignal = v4Result.intentSignal || this.generateUnifiedIntentSignal(v4Result, timelineResult, opportunityResult);
    const conversionLikelihood = v4Result.conversionLikelihood || unifiedScore;
    const recommendedCTA = this.resolveUnifiedCTA(v4Result.recommendedCTA, config.industry);

    const insights: string[] = [];
    if (config.includeInsights) {
      insights.push(...(v4Result.insights || []));
      if (timelineResult?.analytics?.trendDirection === 'warming_up') {
        insights.push('Prospect engagement is increasing - optimal timing for outreach');
      }
      if (socialGraphData && socialGraphData.influenceScore > 0.7) {
        insights.push('Strong social influence - potential network multiplier');
      }
      if (opportunityResult?.prediction?.rating === 'very_high') {
        insights.push('Very high opportunity readiness - immediate action recommended');
      }
    }

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'unified',
      score: Math.round(unifiedScore),
      rating,
      confidence: 0.92,
      // Extended unified fields
      intentSignal,
      conversionLikelihood,
      recommendedCTA,
      leadTemperature,
      breakdown: config.includeBreakdown
        ? {
            ...v4Result.breakdown,
            baseScore: v4Result.score,
            behaviorMomentum: behaviorMomentumBoost,
            socialInfluence: socialInfluenceBoost,
            opportunityReadiness: opportunityBoost,
            patternMatch: patternBoost,
          }
        : undefined,
      explanation: config.includeInsights ? v4Result.explanation : undefined,
      insights: config.includeInsights ? insights : undefined,
      recommendations: config.includeRecommendations
        ? {
            nextStep: opportunityResult?.prediction?.recommendedNextStep || v4Result.recommendations[0],
            timing: opportunityResult?.prediction?.recommendedTiming || 'this_week',
            approach: patternsResult?.recommendations?.[0] || 'Value-first engagement',
          }
        : undefined,
      timeline: config.includeTimeline && timelineResult
        ? {
            events: timelineResult.events,
            analytics: timelineResult.analytics,
          }
        : undefined,
      socialGraph: config.includeSocialGraph ? socialGraphData : undefined,
      opportunityPrediction: config.includeOpportunityPrediction && opportunityResult
        ? {
            probability: opportunityResult.prediction.probability,
            rating: opportunityResult.prediction.rating,
            recommendedTiming: opportunityResult.prediction.recommendedTiming,
          }
        : undefined,
      conversionPatterns: config.includeConversionPatterns && patternsResult
        ? {
            matchedPatterns: patternsResult.globalPatterns.slice(0, 3),
            recommendations: patternsResult.recommendations,
          }
        : undefined,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'unified',
        dataSourcesCombined: 5,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async getSocialGraphData(prospectId: string, userId: string): Promise<any> {
    try {
      const graphResult = await socialGraphBuilder.buildSocialGraph({
        userId,
        existingGraph: true,
      });
      const node = graphResult.nodes.find((n) => n.id === prospectId);
      return node || null;
    } catch (error) {
      return null;
    }
  }

  private getRating(score: number): ScoutScoreRating {
    if (score >= 75) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  }

  private extractEngagementScore(prospect: any): number {
    return 50;
  }

  private extractBusinessInterestScore(prospect: any): number {
    return 50;
  }

  private extractPainPointScore(prospect: any): number {
    return 50;
  }

  private extractLifeEventScore(prospect: any): number {
    return 30;
  }

  private extractResponsivenessScore(prospect: any): number {
    return 40;
  }

  private extractLeadershipScore(prospect: any): number {
    return 30;
  }

  private extractRelationshipScore(prospect: any): number {
    return 40;
  }

  private getDefaultOutput(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): ScoutScoreOutput {
    return {
      success: false,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: config.mode || 'unified',
      score: 50,
      rating: 'warm',
      confidence: 0.3,
      explanation: ['Insufficient data for comprehensive analysis'],
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: config.mode || 'unified',
        dataSourcesCombined: 0,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  async batchCalculateScoutScore(
    prospects: Array<{ prospectId: string; userId: string }>,
    config?: ScoutScoreConfig
  ): Promise<ScoutScoreOutput[]> {
    const results = await Promise.all(
      prospects.map((prospect) =>
        this.calculateScoutScore({
          prospectId: prospect.prospectId,
          userId: prospect.userId,
          config,
        })
      )
    );
    return results.sort((a, b) => b.score - a.score);
  }

  async getTopProspects(userId: string, limit: number, config?: ScoutScoreConfig): Promise<ScoutScoreOutput[]> {
    const { data: prospects } = await supabase
      .from('prospects')
      .select('id')
      .eq('user_id', userId)
      .limit(limit * 2);

    if (!prospects || prospects.length === 0) {
      return [];
    }

    const results = await this.batchCalculateScoutScore(
      prospects.map((p) => ({ prospectId: p.id, userId })),
      config
    );

    return results.slice(0, limit);
  }
}

export const scoutScoreUnified = new ScoutScoreUnifiedEngine();
export const scoutScoreUnifiedEngine = scoutScoreUnified; // Alias for consistency

// Export convenience function for easy access
export async function computeScoutScoreFinal(
  input: NewScoutScoreInput,
  config: NewScoutScoreConfig
): Promise<ScoutScoreFinal> {
  return scoutScoreUnified.computeScoutScoreFinal(input, config);
}

// Re-export types for convenience
export type {
  BaseScoutScore,
  OverlayScoreV6,
  OverlayScoreV7,
  OverlayScoreV8,
  ScoutScoreFinal,
  ScoutScoreInput as NewScoutScoreInput,
  ScoutScoreConfig as NewScoutScoreConfig,
} from '../../types/scoutScore';
export type { Industry } from '../../types/scoutScore';
