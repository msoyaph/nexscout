import { supabase } from '../lib/supabase';
import { PainPointProfile } from './painPointClassifierPH';
import { BehaviorTimelineBuilder, BehaviorSummary } from './behaviorTimelineBuilder';

export interface ProspectSignalsV4 {
  engagementScore: number;
  businessInterestScore: number;
  painNeed: number;
  socialRelationshipScore: number;
  timelineStrength: number;
  opportunityPhaseScore: number;
  trendMomentumScore: number;
  sentimentScore: number;
  behaviorSummary?: BehaviorSummary;
  painProfile?: PainPointProfile;
}

export interface ScoutScoreV4Result {
  prospectId: string;
  score: number;
  bucket: 'hot' | 'warm' | 'cold';
  explanationTags: string[];
  scoreVersion: string;
  breakdown: {
    engagement: number;
    businessInterest: number;
    painNeed: number;
    socialRelationship: number;
    timelineStrength: number;
    opportunityPhase: number;
    trendMomentum: number;
    sentiment: number;
  };
  behaviorContext?: {
    momentumDirection: string;
    opportunityPhase?: string;
    timelineStrength: number;
  };
}

export class ScoutScoringV4 {
  private static readonly WEIGHTS = {
    engagement: 0.15,
    businessInterest: 0.15,
    painNeed: 0.15,
    socialRelationship: 0.15,
    timelineStrength: 0.15,
    opportunityPhase: 0.10,
    trendMomentum: 0.10,
    sentiment: 0.05,
  };

  static calculateScoreV4(signals: ProspectSignalsV4): ScoutScoreV4Result {
    const breakdown = {
      engagement: signals.engagementScore || 0,
      businessInterest: signals.businessInterestScore || 0,
      painNeed: signals.painNeed || 0,
      socialRelationship: signals.socialRelationshipScore || 0,
      timelineStrength: signals.timelineStrength || 0,
      opportunityPhase: signals.opportunityPhaseScore || 0,
      trendMomentum: signals.trendMomentumScore || 0,
      sentiment: signals.sentimentScore || 50,
    };

    const score =
      this.WEIGHTS.engagement * breakdown.engagement +
      this.WEIGHTS.businessInterest * breakdown.businessInterest +
      this.WEIGHTS.painNeed * breakdown.painNeed +
      this.WEIGHTS.socialRelationship * breakdown.socialRelationship +
      this.WEIGHTS.timelineStrength * breakdown.timelineStrength +
      this.WEIGHTS.opportunityPhase * breakdown.opportunityPhase +
      this.WEIGHTS.trendMomentum * breakdown.trendMomentum +
      this.WEIGHTS.sentiment * breakdown.sentiment;

    const finalScore = Math.min(Math.max(score, 0), 100);

    const bucket = this.determineBucket(finalScore);

    const explanationTags = this.generateExplanationTags(signals, breakdown);

    return {
      prospectId: '',
      score: Math.round(finalScore),
      bucket,
      explanationTags,
      scoreVersion: 'v4',
      breakdown,
      behaviorContext: signals.behaviorSummary
        ? {
            momentumDirection: signals.behaviorSummary.momentumDirection,
            opportunityPhase: signals.behaviorSummary.opportunityPhase,
            timelineStrength: signals.behaviorSummary.timelineStrength,
          }
        : undefined,
    };
  }

  private static determineBucket(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 75) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  }

  private static generateExplanationTags(signals: ProspectSignalsV4, breakdown: any): string[] {
    const tags: string[] = [];

    if (signals.behaviorSummary) {
      if (signals.behaviorSummary.momentumDirection === 'rising') {
        tags.push('📈 High behavior momentum (active recently)');
      }

      if (signals.behaviorSummary.opportunityPhase === 'OPPORTUNITY MODE') {
        tags.push('🚀 Showing business opportunity interest');
      }

      if (signals.behaviorSummary.opportunityPhase === 'HIGH NEED') {
        tags.push('💸 Financial need increasing recently');
      }

      if (signals.behaviorSummary.opportunityPhase === 'CAREER SHIFT') {
        tags.push('🔄 Multiple posts about income/insurance/business');
      }

      if (signals.behaviorSummary.momentumDirection === 'dropping' && breakdown.sentiment < 40) {
        tags.push('😞 Negative sentiment trend detected');
      }
    }

    if (breakdown.socialRelationship >= 70) {
      tags.push('👥 Strong social ties');
    }

    if (breakdown.painNeed >= 70) {
      tags.push('💸 Strong financial need');
    }

    if (signals.painProfile?.dominantCategory === 'open_for_opportunities') {
      tags.push('🔎 Open for opportunities');
    }

    if (breakdown.businessInterest >= 75) {
      tags.push('💼 Strong business interest');
    }

    if (breakdown.engagement >= 75) {
      tags.push('🔥 Highly engaged');
    }

    if (breakdown.timelineStrength >= 70) {
      tags.push('⚡ Consistent activity pattern');
    }

    if (signals.painProfile?.dominantCategory === 'looking_for_extra_income') {
      tags.push('💰 Looking for extra income');
    }

    if (signals.painProfile?.dominantCategory === 'financial_struggle') {
      tags.push('💸 Financial struggle detected');
    }

    if (signals.painProfile?.dominantCategory === 'business_minded_but_stuck') {
      tags.push('🚀 Business-minded');
    }

    return tags;
  }

  static async scoreProspectsForScanV4(scanId: string): Promise<void> {
    const { data: items, error } = await supabase
      .from('scan_processed_items')
      .select('*')
      .eq('scan_id', scanId);

    if (error || !items) {
      console.error('Failed to fetch scan items:', error);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const prospectMap = new Map<string, any>();

    for (const item of items) {
      const name = item.name || 'unknown';
      if (!prospectMap.has(name)) {
        prospectMap.set(name, {
          id: item.id,
          name,
          mutualFriends: 0,
          posts: [],
          metadata: item.metadata || {},
        });
      }

      const prospect = prospectMap.get(name);

      if (item.metadata?.mutual_friends) {
        prospect.mutualFriends = Math.max(prospect.mutualFriends, item.metadata.mutual_friends);
      }

      if (item.type === 'post') {
        prospect.posts.push(item.content);
      }
    }

    for (const [name, prospect] of prospectMap.entries()) {
      const behaviorSummary = await BehaviorTimelineBuilder.buildBehaviorSummary(
        user.id,
        prospect.id
      );

      const { data: painProfile } = await supabase
        .from('prospect_pain_profiles')
        .select('*')
        .eq('prospect_id', prospect.id)
        .maybeSingle();

      const trendMomentumScore = this.normalizeMomentum(behaviorSummary.momentumScore);

      const opportunityPhaseScore = this.calculateOpportunityPhaseScore(
        behaviorSummary.opportunityPhase
      );

      const signals: ProspectSignalsV4 = {
        engagementScore: this.calculateEngagement(prospect.posts),
        businessInterestScore: this.calculateBusinessInterest(prospect.metadata),
        painNeed: painProfile ? this.calculatePainNeed(painProfile) : 0,
        socialRelationshipScore: prospect.metadata.social_relationship_score || 0,
        timelineStrength: behaviorSummary.timelineStrength,
        opportunityPhaseScore,
        trendMomentumScore,
        sentimentScore: behaviorSummary.recentSentimentScore,
        behaviorSummary,
        painProfile: painProfile
          ? {
              categories: painProfile.categories,
              dominantCategory: painProfile.dominant_category,
              hasStrongSignal: painProfile.has_strong_signal,
            }
          : undefined,
      };

      const scoreResult = this.calculateScoreV4(signals);
      scoreResult.prospectId = prospect.id;

      await this.persistScore(scoreResult, scanId);
    }
  }

  private static normalizeMomentum(momentum: number): number {
    return Math.min(Math.max((momentum + 100) / 2, 0), 100);
  }

  private static calculateOpportunityPhaseScore(phase?: string): number {
    const scores: Record<string, number> = {
      'HIGH NEED': 100,
      'OPPORTUNITY MODE': 90,
      'CAREER SHIFT': 80,
      'LOOKING FOR EXTRA INCOME': 70,
    };

    return phase ? scores[phase] || 50 : 50;
  }

  private static calculateEngagement(posts: string[]): number {
    const baseScore = Math.min(posts.length * 10, 60);

    const hasRecentActivity = posts.some(
      p => p.toLowerCase().includes('hour') || p.toLowerCase().includes('min')
    );

    return baseScore + (hasRecentActivity ? 20 : 10);
  }

  private static calculateBusinessInterest(metadata: any): number {
    let score = 40;

    if (metadata.has_business_interest) score += 30;
    if (metadata.topics?.includes('business')) score += 15;
    if (metadata.topics?.includes('entrepreneurship')) score += 15;

    return Math.min(score, 100);
  }

  private static calculatePainNeed(painProfile: any): number {
    if (!painProfile || !painProfile.categories) {
      return 0;
    }

    const scores = Object.values(painProfile.categories) as number[];
    return scores.length > 0 ? Math.max(...scores) : 0;
  }

  private static async persistScore(scoreResult: ScoutScoreV4Result, scanId: string): Promise<void> {
    await supabase
      .from('scan_processed_items')
      .update({
        score: scoreResult.score,
        metadata: {
          score_version: scoreResult.scoreVersion,
          bucket: scoreResult.bucket,
          explanation_tags: scoreResult.explanationTags,
          breakdown: scoreResult.breakdown,
          behavior_context: scoreResult.behaviorContext,
        },
      })
      .eq('id', scoreResult.prospectId);
  }
}
