import { supabase } from '../../lib/supabase';
import { scoutScoreV4Engine } from '../../services/intelligence/scoutScoreV4';
import { scoutScoreV5Engine } from '../../services/intelligence/scoutScoreV5';
import { behavioralTimelineEngine } from '../../services/intelligence/behavioralTimelineEngine';
import { socialGraphBuilder } from '../../services/intelligence/socialGraphBuilder';
import { opportunityPredictionEngine } from '../../services/intelligence/opportunityPredictionEngine';
import { conversionPatternMapper } from '../../services/intelligence/conversionPatternMapper';
import type { Industry } from '../../services/intelligence/conversionPatternMapper';

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

    score = Math.min(Math.max(score, 0), 100);
    const rating = this.getRating(score);

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v1_simple',
      score: Math.round(score),
      rating,
      confidence: 0.6,
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
    const { data: prospect } = await supabase
      .from('prospects')
      .select('*, prospect_profiles(*), prospect_events(*)')
      .eq('id', input.prospectId)
      .eq('user_id', input.userId)
      .maybeSingle();

    if (!prospect) {
      return this.getDefaultOutput(input, config, startTime);
    }

    const features = {
      engagement_score: this.extractEngagementScore(prospect),
      business_interest_score: this.extractBusinessInterestScore(prospect),
      pain_point_score: this.extractPainPointScore(prospect),
      life_event_score: this.extractLifeEventScore(prospect),
      responsiveness_score: this.extractResponsivenessScore(prospect),
      leadership_score: this.extractLeadershipScore(prospect),
      relationship_score: this.extractRelationshipScore(prospect),
    };

    const weights = config.weights || {
      engagement: 0.18,
      opportunity: 0.20,
      painPoints: 0.20,
      socialGraph: 0.15,
      behavior: 0.15,
      relationship: 0.12,
    };

    const score =
      features.engagement_score * (weights.engagement || 0.18) +
      features.business_interest_score * (weights.opportunity || 0.20) +
      features.pain_point_score * (weights.painPoints || 0.20) +
      features.life_event_score * 0.15 +
      features.responsiveness_score * 0.15 +
      features.leadership_score * 0.12;

    const normalizedScore = Math.min(Math.max(score, 0), 100);
    const rating = this.getRating(normalizedScore);

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v2_mlm',
      score: Math.round(normalizedScore),
      rating,
      confidence: 0.75,
      breakdown: config.includeBreakdown
        ? {
            engagement: features.engagement_score,
            opportunity: features.business_interest_score,
            painPoints: features.pain_point_score,
          }
        : undefined,
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
    const socialGraphData = config.includeSocialGraph
      ? await this.getSocialGraphData(input.prospectId, input.userId)
      : null;

    const signals = {
      engagementScore: 50,
      businessInterestScore: 50,
      lifeEventScore: 30,
      responsivenessScore: 40,
      leadershipScore: 30,
      relationshipScore: 40,
      socialRelationshipScore: socialGraphData ? socialGraphData.influenceScore * 100 : 30,
      socialTrustSignal: socialGraphData ? socialGraphData.centralityScore * 100 : 30,
    };

    const weights = {
      engagement: 0.16,
      businessInterest: 0.16,
      painNeed: 0.14,
      lifeEvent: 0.12,
      responsiveness: 0.10,
      leadership: 0.10,
      socialRelationship: 0.12,
      socialTrust: 0.10,
    };

    const score =
      weights.engagement * signals.engagementScore +
      weights.businessInterest * signals.businessInterestScore +
      weights.lifeEvent * signals.lifeEventScore +
      weights.responsiveness * signals.responsivenessScore +
      weights.leadership * signals.leadershipScore +
      weights.socialRelationship * signals.socialRelationshipScore +
      weights.socialTrust * signals.socialTrustSignal;

    const finalScore = Math.min(Math.max(score, 0), 100);
    const rating = this.getRating(finalScore);

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v3_social',
      score: Math.round(finalScore),
      rating,
      confidence: 0.78,
      breakdown: config.includeBreakdown
        ? {
            engagement: signals.engagementScore,
            opportunity: signals.businessInterestScore,
            socialInfluence: signals.socialRelationshipScore,
          }
        : undefined,
      socialGraph: config.includeSocialGraph ? socialGraphData : undefined,
      metadata: {
        calculatedAt: new Date().toISOString(),
        version: 'v3_social',
        dataSourcesCombined: 3,
        processingTimeMs: Date.now() - startTime,
      },
    };
  }

  private async calculateV4Behavioral(
    input: ScoutScoreInput,
    config: ScoutScoreConfig,
    startTime: number
  ): Promise<ScoutScoreOutput> {
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
      breakdown: config.includeBreakdown ? v4Result.breakdown : undefined,
      explanation: config.includeInsights ? v4Result.explanation : undefined,
      insights: config.includeInsights ? v4Result.insights : undefined,
      recommendations: config.includeRecommendations
        ? {
            nextStep: v4Result.recommendations[0],
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
    const v5Result = await scoutScoreV5Engine.calculateScoutScoreV5({
      prospectId: input.prospectId,
      userId: input.userId,
      industry: config.industry,
      horizonDays: config.horizonDays,
    });

    return {
      success: true,
      prospectId: input.prospectId,
      userId: input.userId,
      mode: 'v5_intelligence',
      score: v5Result.v5Score,
      rating: v5Result.v5Score >= 75 ? 'hot' : v5Result.v5Score >= 50 ? 'warm' : 'cold',
      confidence: v5Result.reasoning.confidenceLevel === 'very_high' ? 0.95 : v5Result.reasoning.confidenceLevel === 'high' ? 0.85 : v5Result.reasoning.confidenceLevel === 'medium' ? 0.70 : 0.50,
      breakdown: config.includeBreakdown ? v5Result.dimensions : undefined,
      explanation: config.includeInsights ? [v5Result.reasoning.summary] : undefined,
      insights: config.includeInsights ? v5Result.reasoning.actionableInsights : undefined,
      recommendations: config.includeRecommendations ? v5Result.recommendations : undefined,
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
