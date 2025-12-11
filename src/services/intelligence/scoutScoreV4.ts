import { supabase } from '../../lib/supabase';
import { socialGraphBuilder } from './socialGraphBuilder';

export interface ScoutScoreV4Input {
  prospectId: string;
  userId: string;
  textContent?: string;
  browserCaptureData?: any;
  socialGraphData?: any;
  historicalData?: any;
}

export interface ScoutScoreV4Result {
  score: number;
  rating: 'hot' | 'warm' | 'cold';
  confidence: number;
  breakdown: {
    engagement: number;
    opportunity: number;
    painPoints: number;
    graphCentrality: number;
    behaviorMomentum: number;
    relationshipWarmth: number;
    freshness: number;
  };
  explanation: string[];
  insights: string[];
  recommendations: string[];
  // Extended v4 fields for unified interface
  leadTemperature?: 'cold' | 'warming_up' | 'warm' | 'hot';
  intentSignal?: string | null;
  conversionLikelihood?: number | null;
  recommendedCTA?: string | null;
  lastInteractionDaysAgo?: number;
}

interface WeightConfig {
  engagement: number;
  opportunity: number;
  painPoints: number;
  socialGraph: number;
  behavior: number;
  relationship: number;
  freshness: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  engagement: 0.18,
  opportunity: 0.22,
  painPoints: 0.20,
  socialGraph: 0.15,
  behavior: 0.12,
  relationship: 0.08,
  freshness: 0.05,
};

const BEHAVIORAL_KEYWORDS = [
  'naghahanap ng sideline',
  'naghahanap ng trabaho',
  'may bills',
  'hospital',
  'tuition',
  'kailangan ng pera',
  'gusto mag business',
  'insurance',
  'investment',
  'new baby',
  'new job',
  'relocation',
];

const EMOTIONAL_SIGNALS = {
  crying: -0.3,
  angry: -0.2,
  praying: 0.1,
  sad: -0.2,
  excited: 0.4,
  money_focused: 0.5,
  business_minded: 0.6,
  goal_oriented: 0.5,
  positive: 0.3,
  supportive: 0.2,
  seeking_help: -0.1,
  grateful: 0.2,
  worried: -0.2,
  stressed: -0.3,
};

class ScoutScoreV4Engine {
  private weights: WeightConfig = DEFAULT_WEIGHTS;

  async calculateScoutScoreV4(input: ScoutScoreV4Input): Promise<ScoutScoreV4Result> {
    try {
      const engagementScore = await this.calculateEngagementScore(input);
      const opportunityScore = await this.calculateOpportunityScore(input);
      const painPointScore = await this.calculatePainPointScore(input);
      const graphCentralityScore = await this.calculateGraphCentralityScore(input);
      const behaviorMomentumScore = await this.calculateBehaviorMomentum(input);
      const relationshipWarmthScore = await this.calculateRelationshipWarmth(input);
      const freshnessScore = await this.calculateFreshnessScore(input);

      const totalScore =
        engagementScore * this.weights.engagement +
        opportunityScore * this.weights.opportunity +
        painPointScore * this.weights.painPoints +
        graphCentralityScore * this.weights.socialGraph +
        behaviorMomentumScore * this.weights.behavior +
        relationshipWarmthScore * this.weights.relationship +
        freshnessScore * this.weights.freshness;

      const normalizedScore = Math.min(100, Math.max(0, totalScore * 100));

      const rating = this.getRating(normalizedScore);
      const confidence = this.calculateConfidence(input);
      const explanation = this.generateExplanation({
        engagementScore,
        opportunityScore,
        painPointScore,
        graphCentralityScore,
        behaviorMomentumScore,
        relationshipWarmthScore,
        freshnessScore,
      });
      const insights = this.generateInsights(input);
      const recommendations = this.generateRecommendations(input, normalizedScore);

      // Calculate lead temperature from behavioral momentum and freshness
      const leadTemperature = this.determineLeadTemperature(behaviorMomentumScore, freshnessScore, normalizedScore);
      
      // Get last interaction days ago for time decay tracking
      const lastInteractionDaysAgo = await this.getLastInteractionDaysAgo(input.prospectId, input.userId);
      
      // Generate extended output fields
      const intentSignal = this.generateIntentSignal(opportunityScore, painPointScore, behaviorMomentumScore);
      const conversionLikelihood = this.calculateConversionLikelihood(normalizedScore, behaviorMomentumScore, freshnessScore);
      const recommendedCTA = this.generateRecommendedCTA(leadTemperature, opportunityScore, painPointScore);

      return {
        score: Math.round(normalizedScore),
        rating,
        confidence,
        breakdown: {
          engagement: Math.round(engagementScore * 100),
          opportunity: Math.round(opportunityScore * 100),
          painPoints: Math.round(painPointScore * 100),
          graphCentrality: Math.round(graphCentralityScore * 100),
          behaviorMomentum: Math.round(behaviorMomentumScore * 100),
          relationshipWarmth: Math.round(relationshipWarmthScore * 100),
          freshness: Math.round(freshnessScore * 100),
        },
        explanation,
        insights,
        recommendations,
        leadTemperature,
        intentSignal,
        conversionLikelihood,
        recommendedCTA,
        lastInteractionDaysAgo,
      };
    } catch (error) {
      console.error('ScoutScore v4 calculation error:', error);
      return this.getDefaultScore();
    }
  }

  private async calculateEngagementScore(input: ScoutScoreV4Input): Promise<number> {
    let score = 0.5;

    if (input.browserCaptureData) {
      const interactionCount = input.browserCaptureData.interactionCount || 0;
      score += Math.min(0.3, interactionCount * 0.05);

      const hasComments = input.browserCaptureData.hasComments || false;
      const hasLikes = input.browserCaptureData.hasLikes || false;

      if (hasComments) score += 0.15;
      if (hasLikes) score += 0.05;
    }

    if (input.textContent) {
      const wordCount = input.textContent.split(/\s+/).length;
      if (wordCount > 50) score += 0.1;
    }

    return Math.min(1, score);
  }

  private async calculateOpportunityScore(input: ScoutScoreV4Input): Promise<number> {
    let score = 0.3;

    if (input.textContent) {
      const text = input.textContent.toLowerCase();

      const opportunityKeywords = [
        'interested',
        'pm me',
        'open for business',
        'looking for',
        'want to start',
        'gusto mag',
      ];

      opportunityKeywords.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += 0.15;
        }
      });
    }

    if (input.browserCaptureData?.opportunitySignals) {
      score += input.browserCaptureData.opportunitySignals.length * 0.1;
    }

    return Math.min(1, score);
  }

  private async calculatePainPointScore(input: ScoutScoreV4Input): Promise<number> {
    let score = 0.2;

    if (input.textContent) {
      const text = input.textContent.toLowerCase();

      BEHAVIORAL_KEYWORDS.forEach((keyword) => {
        if (text.includes(keyword)) {
          score += 0.12;
        }
      });
    }

    if (input.browserCaptureData?.painPointSignals) {
      score += input.browserCaptureData.painPointSignals.length * 0.15;
    }

    return Math.min(1, score);
  }

  private async calculateGraphCentralityScore(input: ScoutScoreV4Input): Promise<number> {
    if (!input.socialGraphData) return 0.3;

    const centralityScore = input.socialGraphData.centralityScore || 0;
    const influenceScore = input.socialGraphData.influenceScore || 0;
    const clusterPosition = input.socialGraphData.clusterPosition || 'isolated';

    let score = centralityScore * 0.4 + influenceScore * 0.4;

    if (clusterPosition === 'bridge') {
      score += 0.2;
    } else if (clusterPosition === 'center') {
      score += 0.15;
    }

    return Math.min(1, score);
  }

  private async calculateBehaviorMomentum(input: ScoutScoreV4Input): Promise<number> {
    if (!input.historicalData) return 0.4;

    const recentInteractions = input.historicalData.recentInteractions || [];
    const emotionalTimeline = input.historicalData.emotionalTimeline || [];

    let score = 0.3;

    if (recentInteractions.length > 0) {
      const last7Days = recentInteractions.filter((i: any) => {
        const date = new Date(i.timestamp);
        const daysDiff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
      });

      score += Math.min(0.4, last7Days.length * 0.08);
    }

    if (emotionalTimeline.length >= 2) {
      const trend = this.calculateEmotionalTrend(emotionalTimeline);
      if (trend > 0) {
        score += 0.3;
      } else if (trend < -0.2) {
        score += 0.1;
      }
    }

    return Math.min(1, score);
  }

  private calculateEmotionalTrend(timeline: any[]): number {
    if (timeline.length < 2) return 0;

    const scores = timeline.map((entry: any) => {
      const signals = entry.sentimentSignals || [];
      return signals.reduce((sum: number, signal: string) => {
        return sum + (EMOTIONAL_SIGNALS[signal as keyof typeof EMOTIONAL_SIGNALS] || 0);
      }, 0);
    });

    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));

    const avgFirst = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;

    return avgSecond - avgFirst;
  }

  private async calculateRelationshipWarmth(input: ScoutScoreV4Input): Promise<number> {
    let score = 0.5;

    if (input.browserCaptureData?.mutualConnections) {
      const mutuals = input.browserCaptureData.mutualConnections;
      score += Math.min(0.3, mutuals * 0.02);
    }

    if (input.socialGraphData?.edgeWeight) {
      score += input.socialGraphData.edgeWeight * 0.2;
    }

    return Math.min(1, score);
  }

  private async calculateFreshnessScore(input: ScoutScoreV4Input): Promise<number> {
    // Try to get last interaction from database if not in input
    let lastInteractionDaysAgo = 999;
    
    if (input.browserCaptureData?.lastSeen) {
      const lastSeenDate = new Date(input.browserCaptureData.lastSeen);
      lastInteractionDaysAgo = (Date.now() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
    } else {
      // Fetch from database
      try {
        const { data: prospect } = await supabase
          .from('prospects')
          .select('updated_at, prospect_profiles(last_event_at)')
          .eq('id', input.prospectId)
          .eq('user_id', input.userId)
          .maybeSingle();
        
        if (prospect) {
          const lastEventAt = prospect.prospect_profiles?.[0]?.last_event_at || prospect.updated_at;
          if (lastEventAt) {
            lastInteractionDaysAgo = (Date.now() - new Date(lastEventAt).getTime()) / (1000 * 60 * 60 * 24);
          }
        }
      } catch (error) {
        console.error('Error fetching last interaction:', error);
      }
    }

    // Time-decay scoring with freshness logic
    if (lastInteractionDaysAgo <= 1) return 1.0;
    if (lastInteractionDaysAgo <= 3) return 0.9;
    if (lastInteractionDaysAgo <= 7) return 0.7;
    if (lastInteractionDaysAgo <= 14) return 0.5;
    if (lastInteractionDaysAgo <= 30) return 0.3;
    if (lastInteractionDaysAgo <= 60) return 0.15;
    return 0.1; // Heavy decay after 60 days
  }

  private getRating(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 70) return 'hot';
    if (score >= 45) return 'warm';
    return 'cold';
  }

  private calculateConfidence(input: ScoutScoreV4Input): number {
    let confidence = 0.5;

    if (input.textContent && input.textContent.length > 100) confidence += 0.15;
    if (input.browserCaptureData) confidence += 0.15;
    if (input.socialGraphData) confidence += 0.1;
    if (input.historicalData) confidence += 0.1;

    return Math.min(1, confidence);
  }

  private generateExplanation(breakdown: any): string[] {
    const explanations: string[] = [];

    if (breakdown.engagementScore > 0.7) {
      explanations.push('High engagement level with multiple interactions detected');
    }

    if (breakdown.opportunityScore > 0.6) {
      explanations.push('Strong opportunity signals - actively seeking business information');
    }

    if (breakdown.painPointScore > 0.5) {
      explanations.push('Clear pain points identified - financial needs or career concerns');
    }

    if (breakdown.graphCentralityScore > 0.6) {
      explanations.push('Well-connected in social network - potential influencer');
    }

    if (breakdown.behaviorMomentumScore > 0.6) {
      explanations.push('Positive behavioral momentum - increasing activity and engagement');
    }

    if (breakdown.freshnessScore > 0.8) {
      explanations.push('Very recent interaction - high likelihood of response');
    }

    return explanations;
  }

  private generateInsights(input: ScoutScoreV4Input): string[] {
    const insights: string[] = [];

    if (input.browserCaptureData?.platform === 'facebook') {
      insights.push('Captured from Facebook - strong personal connection potential');
    }

    if (input.socialGraphData?.clusterId) {
      insights.push(`Part of cluster ${input.socialGraphData.clusterId} - community-based approach recommended`);
    }

    if (input.textContent && input.textContent.toLowerCase().includes('insurance')) {
      insights.push('Insurance-related keywords detected - strong product-market fit');
    }

    return insights;
  }

  private generateRecommendations(input: ScoutScoreV4Input, score: number): string[] {
    const recommendations: string[] = [];

    if (score >= 70) {
      recommendations.push('Reach out immediately with personalized message');
      recommendations.push('Highlight pain point solutions in your pitch');
    } else if (score >= 45) {
      recommendations.push('Build rapport with value-first content');
      recommendations.push('Engage with their posts before direct messaging');
    } else {
      recommendations.push('Continue nurturing through content and engagement');
      recommendations.push('Wait for stronger opportunity signals before pitching');
    }

    if (input.browserCaptureData?.painPointSignals?.length > 0) {
      recommendations.push('Address their specific pain points in your approach');
    }

    return recommendations;
  }

  private determineLeadTemperature(
    behaviorMomentum: number,
    freshness: number,
    overallScore: number
  ): 'cold' | 'warming_up' | 'warm' | 'hot' {
    // Combine behavioral momentum and freshness for maturity assessment
    const maturityScore = (behaviorMomentum * 0.6) + (freshness * 0.4);
    
    if (maturityScore >= 0.8 && overallScore >= 75) return 'hot';
    if (maturityScore >= 0.6 && overallScore >= 60) return 'warm';
    if (maturityScore >= 0.4 && behaviorMomentum > freshness) return 'warming_up';
    return 'cold';
  }

  private async getLastInteractionDaysAgo(prospectId: string, userId: string): Promise<number> {
    try {
      const { data: prospect } = await supabase
        .from('prospects')
        .select('updated_at, prospect_profiles(last_event_at)')
        .eq('id', prospectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!prospect) return 999;

      const lastEventAt = prospect.prospect_profiles?.[0]?.last_event_at || prospect.updated_at;
      if (!lastEventAt) return 999;

      return Math.floor((Date.now() - new Date(lastEventAt).getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }

  private generateIntentSignal(
    opportunityScore: number,
    painPointScore: number,
    behaviorMomentum: number
  ): string | null {
    if (opportunityScore >= 0.7 && painPointScore >= 0.7) return 'high_intent';
    if (behaviorMomentum >= 0.7) return 'evaluating';
    if (opportunityScore >= 0.5) return 'just_browsing';
    if (painPointScore >= 0.5) return 'problem_aware';
    return null;
  }

  private calculateConversionLikelihood(
    score: number,
    behaviorMomentum: number,
    freshness: number
  ): number {
    // Base likelihood from score, adjusted by momentum and freshness
    let likelihood = score;
    
    // Boost from momentum (active engagement)
    likelihood += behaviorMomentum * 10;
    
    // Boost from freshness (recent interaction)
    likelihood += freshness * 5;
    
    // Cap at 100
    return Math.max(0, Math.min(100, Math.round(likelihood)));
  }

  private generateRecommendedCTA(
    leadTemperature: 'cold' | 'warming_up' | 'warm' | 'hot',
    opportunityScore: number,
    painPointScore: number
  ): string | null {
    if (leadTemperature === 'hot') return 'closing_offer';
    if (leadTemperature === 'warm' && opportunityScore >= 0.6) return 'direct_offer';
    if (leadTemperature === 'warming_up') return 'nurture_sequence';
    if (painPointScore >= 0.6) return 'reminder';
    return 'build_rapport';
  }

  private getDefaultScore(): ScoutScoreV4Result {
    return {
      score: 50,
      rating: 'warm',
      confidence: 0.3,
      breakdown: {
        engagement: 50,
        opportunity: 50,
        painPoints: 50,
        graphCentrality: 50,
        behaviorMomentum: 50,
        relationshipWarmth: 50,
        freshness: 50,
      },
      explanation: ['Insufficient data for detailed scoring'],
      insights: [],
      recommendations: ['Gather more information about this prospect'],
      leadTemperature: 'cold',
      intentSignal: null,
      conversionLikelihood: 50,
      recommendedCTA: 'build_rapport',
      lastInteractionDaysAgo: 999,
    };
  }
}

export const scoutScoreV4Engine = new ScoutScoreV4Engine();
