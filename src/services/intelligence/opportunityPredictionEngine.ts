import { scoutScoreV4Engine } from './scoutScoreV4';
import { behavioralTimelineEngine } from './behavioralTimelineEngine';
import { socialGraphBuilder } from './socialGraphBuilder';

export type OpportunityRating = 'very_high' | 'high' | 'medium' | 'low';
export type RecommendedTiming = 'today' | 'this_week' | 'next_week' | 'wait';

export interface OpportunityPrediction {
  prospectId: string;
  userId: string;
  horizonDays: number;
  probability: number;
  rating: OpportunityRating;
  reasonsPositive: string[];
  reasonsNegative: string[];
  recommendedNextStep: string;
  recommendedTiming: RecommendedTiming;
}

export interface OpportunityPredictionResult {
  success: boolean;
  prospectId: string;
  userId: string;
  prediction: OpportunityPrediction;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

class OpportunityPredictionEngine {
  async predictOpportunity(input: {
    prospectId: string;
    userId: string;
    horizonDays?: number;
  }): Promise<OpportunityPredictionResult> {
    const horizonDays = input.horizonDays || 7;

    try {
      const [scoutScoreResult, timelineResult, graphData] = await Promise.all([
        this.getScoutScore(input.prospectId, input.userId),
        behavioralTimelineEngine.buildBehavioralTimeline({
          prospectId: input.prospectId,
          userId: input.userId,
          windowDays: 90,
        }),
        this.getGraphData(input.prospectId, input.userId),
      ]);

      const probability = this.calculateProbability(
        scoutScoreResult,
        timelineResult,
        graphData,
        horizonDays
      );

      const rating = this.getRating(probability);

      const reasonsPositive = this.generatePositiveReasons(
        scoutScoreResult,
        timelineResult,
        graphData
      );

      const reasonsNegative = this.generateNegativeReasons(
        scoutScoreResult,
        timelineResult,
        graphData
      );

      const recommendedNextStep = this.getRecommendedNextStep(rating, timelineResult);
      const recommendedTiming = this.getRecommendedTiming(rating, timelineResult);

      const prediction: OpportunityPrediction = {
        prospectId: input.prospectId,
        userId: input.userId,
        horizonDays,
        probability,
        rating,
        reasonsPositive,
        reasonsNegative,
        recommendedNextStep,
        recommendedTiming,
      };

      return {
        success: true,
        prospectId: input.prospectId,
        userId: input.userId,
        prediction,
      };
    } catch (error) {
      console.error('Opportunity prediction error:', error);
      return {
        success: false,
        prospectId: input.prospectId,
        userId: input.userId,
        prediction: this.getDefaultPrediction(input.prospectId, input.userId, horizonDays),
      };
    }
  }

  private async getScoutScore(prospectId: string, userId: string): Promise<any> {
    try {
      return await scoutScoreV4Engine.calculateScoutScoreV4({
        prospectId,
        userId,
      });
    } catch (error) {
      return { score: 50, breakdown: {} };
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

  private calculateProbability(
    scoutScore: any,
    timeline: any,
    graphData: any,
    horizonDays: number
  ): number {
    const base = (scoutScore.score || 50) / 100;

    const trendBoost = (timeline.analytics?.opportunityMomentum || 0) / 100 * 0.2;

    const painPointBoost = (timeline.analytics?.painPointIntensity || 0) / 100 * 0.15;

    const graphBoost = graphData ? (graphData.centralityScore || 0) * 0.1 : 0;

    const daysSinceLastInteraction = timeline.analytics?.lastInteractionDaysAgo || 999;
    const freshnessPenalty = Math.max(0, (daysSinceLastInteraction - 14) * 0.02);

    const trendMultiplier = timeline.analytics?.trendDirection === 'warming_up' ? 1.1 :
                           timeline.analytics?.trendDirection === 'cooling_down' ? 0.9 : 1.0;

    let probability = (base + trendBoost + painPointBoost + graphBoost - freshnessPenalty) * trendMultiplier;

    if (horizonDays <= 3) {
      probability *= 0.8;
    } else if (horizonDays <= 7) {
      probability *= 0.95;
    } else if (horizonDays >= 14) {
      probability *= 1.05;
    }

    return clamp(probability, 0, 1);
  }

  private getRating(probability: number): OpportunityRating {
    if (probability >= 0.8) return 'very_high';
    if (probability >= 0.6) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  }

  private generatePositiveReasons(scoutScore: any, timeline: any, graphData: any): string[] {
    const reasons: string[] = [];

    if (scoutScore.score >= 70) {
      reasons.push('High ScoutScore indicates strong conversion potential');
    }

    if (timeline.analytics?.opportunityMomentum > 60) {
      reasons.push('High business-interest keywords detected in recent activity');
    }

    if (timeline.analytics?.painPointIntensity > 50) {
      reasons.push('Increasing mentions of financial stress or needs');
    }

    if (timeline.analytics?.trendDirection === 'warming_up') {
      reasons.push('Prospect engagement is increasing over time');
    }

    if (timeline.analytics?.lastInteractionDaysAgo <= 3) {
      reasons.push('Very recent activity - optimal timing window');
    }

    if (graphData && graphData.influenceScore > 0.7) {
      reasons.push('Strong position in social network - potential influencer');
    }

    if (graphData && graphData.clusterId) {
      reasons.push('Part of active social cluster - community-based approach possible');
    }

    if (timeline.events?.length > 15) {
      reasons.push('High engagement history with multiple touchpoints');
    }

    return reasons;
  }

  private generateNegativeReasons(scoutScore: any, timeline: any, graphData: any): string[] {
    const reasons: string[] = [];

    if (scoutScore.score < 40) {
      reasons.push('Low ScoutScore suggests limited conversion readiness');
    }

    if (timeline.analytics?.lastInteractionDaysAgo > 30) {
      reasons.push('No interaction for 30+ days - may have lost interest');
    }

    if (timeline.analytics?.trendDirection === 'cooling_down') {
      reasons.push('Engagement declining compared to previous period');
    }

    if (timeline.analytics?.opportunityMomentum < 20) {
      reasons.push('Limited opportunity signals detected');
    }

    if (timeline.events?.length < 3) {
      reasons.push('Insufficient interaction history for accurate prediction');
    }

    if (!graphData) {
      reasons.push('Limited social network data available');
    }

    return reasons;
  }

  private getRecommendedNextStep(rating: OpportunityRating, timeline: any): string {
    if (rating === 'very_high') {
      return 'Send personalized message immediately addressing their specific pain points or interests';
    }

    if (rating === 'high') {
      if (timeline.analytics?.painPointIntensity > 60) {
        return 'Lead with solution-focused message highlighting benefits that address their needs';
      }
      return 'Engage with warm, value-first content before making direct pitch';
    }

    if (rating === 'medium') {
      return 'Continue building rapport through social engagement and valuable content sharing';
    }

    return 'Focus on re-engagement through relevant content and wait for stronger signals';
  }

  private getRecommendedTiming(rating: OpportunityRating, timeline: any): RecommendedTiming {
    const daysSinceInteraction = timeline.analytics?.lastInteractionDaysAgo || 999;

    if (rating === 'very_high' && daysSinceInteraction <= 3) {
      return 'today';
    }

    if (rating === 'very_high' || (rating === 'high' && daysSinceInteraction <= 7)) {
      return 'this_week';
    }

    if (rating === 'high' || rating === 'medium') {
      return 'next_week';
    }

    return 'wait';
  }

  private getDefaultPrediction(
    prospectId: string,
    userId: string,
    horizonDays: number
  ): OpportunityPrediction {
    return {
      prospectId,
      userId,
      horizonDays,
      probability: 0.4,
      rating: 'medium',
      reasonsPositive: ['Insufficient data for detailed analysis'],
      reasonsNegative: ['Limited behavioral and interaction history'],
      recommendedNextStep: 'Gather more information through engagement',
      recommendedTiming: 'next_week',
    };
  }

  async getTopOpportunityProspects(
    userId: string,
    horizonDays: number,
    limit: number
  ): Promise<OpportunityPrediction[]> {
    try {
      const predictions: OpportunityPrediction[] = [];

      return predictions.sort((a, b) => b.probability - a.probability).slice(0, limit);
    } catch (error) {
      console.error('Error getting top opportunity prospects:', error);
      return [];
    }
  }
}

export const opportunityPredictionEngine = new OpportunityPredictionEngine();
