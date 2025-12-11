import { scoutScoreV4Engine } from './scoutScoreV4';
import { behavioralTimelineEngine } from './behavioralTimelineEngine';
import { socialGraphBuilder } from './socialGraphBuilder';
import { opportunityPredictionEngine } from './opportunityPredictionEngine';
import { conversionPatternMapper } from './conversionPatternMapper';
import type { Industry } from './conversionPatternMapper';
import { getIndustryWeights, type ScoringWeights } from '../../config/scout/industryWeights';

export interface ScoutScoreV5Result {
  success: boolean;
  prospectId: string;
  userId: string;
  v4Score: number;
  v5Score: number;
  scoreBoost: number;
  reasoning: {
    summary: string;
    keyStrengths: string[];
    keyWeaknesses: string[];
    actionableInsights: string[];
    confidenceLevel: 'very_high' | 'high' | 'medium' | 'low';
  };
  dimensions: {
    baseScore: number;
    behavioralMomentum: number;
    socialInfluence: number;
    opportunityReadiness: number;
    patternMatch: number;
  };
  recommendations: {
    nextStep: string;
    timing: string;
    approach: string;
    messageTemplate?: string;
  };
  metadata: {
    dataSourcesCombined: number;
    timelineEventsAnalyzed: number;
    patternsMatched: number;
    graphNodesConsidered: number;
  };
}

class ScoutScoreV5Engine {
  async calculateScoutScoreV5(input: {
    prospectId: string;
    userId: string;
    industry?: Industry;
    activeIndustry?: Industry; // Active industry setting - must match industry for proper scoring
    horizonDays?: number;
  }): Promise<ScoutScoreV5Result> {
    const horizonDays = input.horizonDays || 7;
    const industry = input.industry;
    const activeIndustry = input.activeIndustry || industry;

    // Industry isolation check: if active industry doesn't match, use neutral weights
    const shouldIsolate = activeIndustry && industry && activeIndustry !== industry;
    if (shouldIsolate) {
      console.warn(`[ScoutScore V5] Industry mismatch: activeIndustry=${activeIndustry}, industry=${industry}. Using neutral scoring.`);
    }

    try {
      // Only fetch industry-specific patterns if industry matches active industry
      const patternResultPromise = (activeIndustry === industry && industry)
        ? conversionPatternMapper.analyzeConversionPatterns({
            userId: input.userId,
            industry: industry,
          })
        : Promise.resolve({
            success: false,
            globalPatterns: [],
            personaPatterns: {},
            industryPatterns: {},
            recommendations: ['Using neutral patterns - industry mismatch'],
          });

      const [v4Result, timelineResult, graphResult, opportunityResult, patternResult] = await Promise.all([
        scoutScoreV4Engine.calculateScoutScoreV4({
          prospectId: input.prospectId,
          userId: input.userId,
        }),
        behavioralTimelineEngine.buildBehavioralTimeline({
          prospectId: input.prospectId,
          userId: input.userId,
          windowDays: 90,
        }),
        this.getGraphData(input.prospectId, input.userId),
        opportunityPredictionEngine.predictOpportunity({
          prospectId: input.prospectId,
          userId: input.userId,
          horizonDays,
        }),
        patternResultPromise,
      ]);

      // Get industry-specific weights (or neutral if mismatch)
      const weights = shouldIsolate 
        ? getIndustryWeights(undefined) // Neutral weights
        : getIndustryWeights(activeIndustry || industry);

      const dimensions = this.calculateDimensions(
        v4Result,
        timelineResult,
        graphResult,
        opportunityResult,
        patternResult
      );

      const v5Score = this.calculateV5Score(dimensions, weights);
      const scoreBoost = v5Score - v4Result.score;

      // Add industry to reasoning context
      const reasoning = this.generateLLMReasoning(
        v4Result,
        timelineResult,
        graphResult,
        opportunityResult,
        patternResult,
        dimensions,
        v5Score,
        industry,
        shouldIsolate
      );

      const recommendations = this.generateRecommendations(
        opportunityResult,
        patternResult,
        timelineResult,
        reasoning,
        industry
      );

      const metadata = {
        dataSourcesCombined: 5,
        timelineEventsAnalyzed: timelineResult.events.length,
        patternsMatched: patternResult.globalPatterns.length,
        graphNodesConsidered: graphResult?.connectedNodes?.length || 0,
      };

      return {
        success: true,
        prospectId: input.prospectId,
        userId: input.userId,
        v4Score: v4Result.score,
        v5Score,
        scoreBoost,
        reasoning,
        dimensions,
        recommendations,
        metadata,
      };
    } catch (error) {
      console.error('ScoutScore v5 calculation error:', error);
      return this.getDefaultResult(input.prospectId, input.userId);
    }
  }

  private async getGraphData(prospectId: string, userId: string): Promise<any> {
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

  private calculateDimensions(
    v4Result: any,
    timelineResult: any,
    graphResult: any,
    opportunityResult: any,
    patternResult: any
  ): ScoutScoreV5Result['dimensions'] {
    const baseScore = v4Result.score;

    const behavioralMomentum = this.calculateBehavioralMomentumScore(timelineResult);

    const socialInfluence = this.calculateSocialInfluenceScore(graphResult);

    const opportunityReadiness = opportunityResult.prediction.probability * 100;

    const patternMatch = this.calculatePatternMatchScore(patternResult, v4Result);

    return {
      baseScore: Math.round(baseScore),
      behavioralMomentum: Math.round(behavioralMomentum),
      socialInfluence: Math.round(socialInfluence),
      opportunityReadiness: Math.round(opportunityReadiness),
      patternMatch: Math.round(patternMatch),
    };
  }

  private calculateBehavioralMomentumScore(timelineResult: any): number {
    const { analytics } = timelineResult;

    let score = 50;

    if (analytics.trendDirection === 'warming_up') score += 25;
    else if (analytics.trendDirection === 'cooling_down') score -= 20;
    else if (analytics.trendDirection === 'volatile') score += 10;

    score += analytics.opportunityMomentum * 0.2;
    score += analytics.painPointIntensity * 0.15;
    score += analytics.engagementMomentum * 0.15;

    if (analytics.lastInteractionDaysAgo <= 3) score += 10;
    else if (analytics.lastInteractionDaysAgo <= 7) score += 5;
    else if (analytics.lastInteractionDaysAgo > 30) score -= 15;

    return Math.max(0, Math.min(100, score));
  }

  private calculateSocialInfluenceScore(graphResult: any): number {
    if (!graphResult) return 30;

    let score = 40;

    score += (graphResult.influenceScore || 0) * 30;
    score += (graphResult.centralityScore || 0) * 20;
    score += Math.min((graphResult.connectedNodes?.length || 0) * 2, 10);

    return Math.max(0, Math.min(100, score));
  }

  private calculatePatternMatchScore(patternResult: any, v4Result: any): number {
    let score = 50;

    const topPatterns = patternResult.globalPatterns
      .filter((p: any) => p.successRate >= 0.35)
      .sort((a: any, b: any) => b.successRate - a.successRate);

    if (topPatterns.length > 0) {
      const bestPattern = topPatterns[0];
      score += bestPattern.successRate * 40;
    }

    if (v4Result.breakdown?.painPointClarity > 60) score += 10;
    if (v4Result.breakdown?.emotionalResonance > 60) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculateV5Score(dimensions: ScoutScoreV5Result['dimensions'], weights: ScoringWeights): number {
    const weightedScore =
      dimensions.baseScore * weights.baseScore +
      dimensions.behavioralMomentum * weights.behavioralMomentum +
      dimensions.socialInfluence * weights.socialInfluence +
      dimensions.opportunityReadiness * weights.opportunityReadiness +
      dimensions.patternMatch * weights.patternMatch;

    return Math.round(Math.max(0, Math.min(100, weightedScore)));
  }

  private generateLLMReasoning(
    v4Result: any,
    timelineResult: any,
    graphResult: any,
    opportunityResult: any,
    patternResult: any,
    dimensions: ScoutScoreV5Result['dimensions'],
    v5Score: number,
    industry?: Industry,
    shouldIsolate?: boolean
  ): ScoutScoreV5Result['reasoning'] {
    // Add industry isolation warning to reasoning if mismatch
    const keyStrengths: string[] = [];
    const keyWeaknesses: string[] = [];
    const actionableInsights: string[] = [];

    if (dimensions.baseScore >= 70) {
      keyStrengths.push('Strong foundational ScoutScore with high conversion indicators');
    } else if (dimensions.baseScore < 40) {
      keyWeaknesses.push('Low base ScoutScore indicates limited readiness');
    }

    if (dimensions.behavioralMomentum >= 70) {
      keyStrengths.push('Highly positive behavioral trend with strong momentum');
      actionableInsights.push('Strike while the iron is hot - prospect is in an active engagement phase');
    } else if (dimensions.behavioralMomentum < 40) {
      keyWeaknesses.push('Declining or stagnant behavioral engagement');
      actionableInsights.push('Consider re-engagement strategy or wait for better timing signals');
    }

    if (dimensions.socialInfluence >= 70) {
      keyStrengths.push('Strong social network influence - potential multiplier effect');
      actionableInsights.push('This prospect could influence their network - consider community-based approach');
    }

    if (dimensions.opportunityReadiness >= 70) {
      keyStrengths.push(`High probability (${dimensions.opportunityReadiness}%) of positive response`);
      actionableInsights.push(opportunityResult.prediction.recommendedNextStep);
    } else if (dimensions.opportunityReadiness < 40) {
      keyWeaknesses.push('Low immediate opportunity readiness');
    }

    if (dimensions.patternMatch >= 70) {
      keyStrengths.push('Strong match with proven conversion patterns');
      patternResult.recommendations.forEach((rec: string) => {
        if (!actionableInsights.includes(rec)) {
          actionableInsights.push(rec);
        }
      });
    }

    if (timelineResult.analytics.painPointIntensity >= 60) {
      keyStrengths.push('Clear pain points identified - solution-ready prospect');
      actionableInsights.push('Lead with pain point acknowledgment and solution focus');
    }

    if (timelineResult.analytics.lastInteractionDaysAgo > 30) {
      keyWeaknesses.push('Extended period of inactivity - may have lost interest');
    }

    // Add industry isolation warning if mismatch
    if (shouldIsolate) {
      keyWeaknesses.push('Industry mismatch - scoring may not be industry-optimized');
      actionableInsights.push('Verify industry setting matches prospect industry for accurate scoring');
    }

    const summary = this.generateSummary(keyStrengths, keyWeaknesses, v5Score);
    const confidenceLevel = this.calculateConfidenceLevel(dimensions, timelineResult);

    return {
      summary,
      keyStrengths,
      keyWeaknesses,
      actionableInsights,
      confidenceLevel,
    };
  }

  private generateSummary(
    strengths: string[],
    weaknesses: string[],
    v5Score: number
  ): string {

    if (v5Score >= 80) {
      return `Exceptional prospect with ${strengths.length} key strengths. High confidence in successful conversion with immediate action. ${strengths[0] || ''}`;
    } else if (v5Score >= 65) {
      return `Strong prospect showing solid potential across multiple dimensions. ${strengths.length} key strengths outweigh ${weaknesses.length} areas of concern. Recommended for priority outreach.`;
    } else if (v5Score >= 50) {
      return `Moderate prospect with mixed signals. ${strengths.length} strengths balanced by ${weaknesses.length} weaknesses. Strategic approach needed with careful timing.`;
    } else if (v5Score >= 35) {
      return `Below-average prospect with limited readiness indicators. ${weaknesses.length} significant concerns identified. Consider nurturing strategy or wait for better signals.`;
    } else {
      return `Low-priority prospect with minimal conversion indicators at this time. Focus on higher-scoring opportunities or implement long-term re-engagement strategy.`;
    }
  }

  private calculateConfidenceLevel(
    dimensions: ScoutScoreV5Result['dimensions'],
    timelineResult: any
  ): 'very_high' | 'high' | 'medium' | 'low' {
    const eventCount = timelineResult.events.length;
    const avgDimensionScore =
      (dimensions.baseScore +
        dimensions.behavioralMomentum +
        dimensions.socialInfluence +
        dimensions.opportunityReadiness +
        dimensions.patternMatch) /
      5;

    if (eventCount >= 20 && avgDimensionScore >= 70) return 'very_high';
    if (eventCount >= 10 && avgDimensionScore >= 60) return 'high';
    if (eventCount >= 5 && avgDimensionScore >= 45) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    opportunityResult: any,
    patternResult: any,
    timelineResult: any,
    reasoning: ScoutScoreV5Result['reasoning'],
    industry?: Industry
  ): ScoutScoreV5Result['recommendations'] {
    const nextStep = opportunityResult.prediction.recommendedNextStep;
    
    // Filter recommendations by industry if provided
    const industryFilteredPatterns = industry && patternResult.industryPatterns?.[industry]
      ? patternResult.industryPatterns[industry]
      : patternResult.globalPatterns || [];

    const timing = this.formatTiming(opportunityResult.prediction.recommendedTiming, timelineResult);

    const approach = this.selectApproach(patternResult, timelineResult, reasoning, industry);

    const messageTemplate = this.generateMessageTemplate(reasoning, timelineResult);

    return {
      nextStep,
      timing,
      approach,
      messageTemplate,
    };
  }

  private formatTiming(recommendedTiming: string, timelineResult: any): string {
    const timingMap: Record<string, string> = {
      today: 'Reach out today - optimal timing window is NOW',
      this_week: 'Contact within the next 2-3 days for best results',
      next_week: 'Schedule outreach for next week after additional engagement',
      wait: 'Hold off on direct outreach - focus on nurturing and re-engagement',
    };

    let timing = timingMap[recommendedTiming] || timingMap.next_week;

    if (timelineResult.analytics.trendDirection === 'warming_up') {
      timing += ' (Engagement is increasing - momentum in your favor)';
    }

    return timing;
  }

  private selectApproach(
    patternResult: any,
    timelineResult: any,
    reasoning: ScoutScoreV5Result['reasoning'],
    industry?: Industry
  ): string {
    if (timelineResult.analytics.painPointIntensity >= 60) {
      return 'Pain-point focused approach: Lead with empathy and solution focus';
    }

    if (reasoning.keyStrengths.some((s) => s.includes('social network'))) {
      return 'Community-based approach: Leverage social connections and group engagement';
    }

    // Use industry-specific patterns if available
    const patternsToUse = industry && patternResult.industryPatterns?.[industry]
      ? patternResult.industryPatterns[industry]
      : patternResult.globalPatterns || [];

    const topPattern = patternsToUse
      .filter((p: any) => p.successRate >= 0.35)
      .sort((a: any, b: any) => b.successRate - a.successRate)[0];

    if (topPattern) {
      return `Proven pattern approach: ${topPattern.sequenceSummary} (${Math.round(topPattern.successRate * 100)}% success rate)`;
    }

    return 'Value-first approach: Build rapport through content and engagement before pitching';
  }

  private generateMessageTemplate(
    reasoning: ScoutScoreV5Result['reasoning'],
    timelineResult: any
  ): string | undefined {
    if (reasoning.confidenceLevel === 'low') {
      return undefined;
    }

    const hasPainPoints = timelineResult.analytics.painPointIntensity >= 50;
    const hasOpportunitySignals = timelineResult.analytics.opportunityMomentum >= 50;

    if (hasPainPoints && hasOpportunitySignals) {
      return 'Hey [Name]! Noticed you\'ve been exploring [opportunity topic]. I might have something that could help with [pain point]. Quick 5-min chat this week?';
    } else if (hasPainPoints) {
      return 'Hi [Name], saw your recent post about [pain point]. I completely understand - been there myself. Mind if I share something that helped me?';
    } else if (hasOpportunitySignals) {
      return 'Hey [Name]! Love seeing your interest in [opportunity topic]. I\'ve been in that space for a while - would love to share some insights. Coffee chat?';
    }

    return 'Hi [Name]! Been meaning to reach out. Saw [recent activity] and thought we should connect. Got 10 minutes this week?';
  }

  private getDefaultResult(prospectId: string, userId: string): ScoutScoreV5Result {
    return {
      success: false,
      prospectId,
      userId,
      v4Score: 50,
      v5Score: 50,
      scoreBoost: 0,
      reasoning: {
        summary: 'Insufficient data for comprehensive v5 analysis',
        keyStrengths: [],
        keyWeaknesses: ['Limited data across intelligence engines'],
        actionableInsights: ['Gather more behavioral and interaction data before outreach'],
        confidenceLevel: 'low',
      },
      dimensions: {
        baseScore: 50,
        behavioralMomentum: 50,
        socialInfluence: 30,
        opportunityReadiness: 40,
        patternMatch: 50,
      },
      recommendations: {
        nextStep: 'Focus on data collection and engagement',
        timing: 'Wait for stronger signals',
        approach: 'Passive engagement and content sharing',
      },
      metadata: {
        dataSourcesCombined: 0,
        timelineEventsAnalyzed: 0,
        patternsMatched: 0,
        graphNodesConsidered: 0,
      },
    };
  }

  async batchCalculateScoutScoreV5(
    prospects: Array<{ prospectId: string; userId: string }>,
    industry?: Industry
  ): Promise<ScoutScoreV5Result[]> {
    const results = await Promise.all(
      prospects.map((prospect) =>
        this.calculateScoutScoreV5({
          prospectId: prospect.prospectId,
          userId: prospect.userId,
          industry,
        })
      )
    );

    return results.sort((a, b) => b.v5Score - a.v5Score);
  }

  async getTopProspects(
    userId: string,
    limit: number,
    industry?: Industry
  ): Promise<ScoutScoreV5Result[]> {
    return [];
  }
}

export const scoutScoreV5Engine = new ScoutScoreV5Engine();
