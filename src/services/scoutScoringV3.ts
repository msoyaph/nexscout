import { supabase } from '../lib/supabase';
import { PainPointProfile } from './painPointClassifierPH';
import { SocialGraphBuilder } from './socialGraphBuilder';

export interface ProspectSignals {
  engagementScore: number;
  businessInterestScore: number;
  lifeEventScore: number;
  responsivenessScore: number;
  leadershipScore: number;
  relationshipScore: number;
  mutualFriendsCount?: number;
  painProfile?: PainPointProfile;
  socialRelationshipScore?: number;
  socialTrustSignal?: number;
}

export interface ScoutScoreV3Result {
  prospectId: string;
  score: number;
  bucket: 'hot' | 'warm' | 'cold';
  explanationTags: string[];
  scoreVersion: string;
  breakdown: {
    engagement: number;
    businessInterest: number;
    painNeed: number;
    lifeEvent: number;
    responsiveness: number;
    leadership: number;
    socialTrust: number;
  };
}

export class ScoutScoringV3 {
  private static readonly WEIGHTS = {
    engagement: 0.16,
    businessInterest: 0.16,
    painNeed: 0.14,
    lifeEvent: 0.12,
    responsiveness: 0.10,
    leadership: 0.10,
    socialRelationship: 0.12,
    socialTrust: 0.10,
  };

  static calculateScoreV3(signals: ProspectSignals): ScoutScoreV3Result {
    const socialTrust = signals.socialTrustSignal || this.calculateSocialTrust(signals.mutualFriendsCount || 0);
    const painNeed = this.calculatePainNeed(signals.painProfile);
    const socialRelationship = signals.socialRelationshipScore || this.calculateSocialTrust(signals.mutualFriendsCount || 0);

    const breakdown = {
      engagement: signals.engagementScore || 0,
      businessInterest: signals.businessInterestScore || 0,
      painNeed,
      lifeEvent: signals.lifeEventScore || 0,
      responsiveness: signals.responsivenessScore || 0,
      leadership: signals.leadershipScore || 0,
      socialTrust,
      socialRelationship,
    };

    const score =
      this.WEIGHTS.engagement * breakdown.engagement +
      this.WEIGHTS.businessInterest * breakdown.businessInterest +
      this.WEIGHTS.painNeed * breakdown.painNeed +
      this.WEIGHTS.lifeEvent * breakdown.lifeEvent +
      this.WEIGHTS.responsiveness * breakdown.responsiveness +
      this.WEIGHTS.leadership * breakdown.leadership +
      this.WEIGHTS.socialRelationship * breakdown.socialRelationship +
      this.WEIGHTS.socialTrust * breakdown.socialTrust;

    const finalScore = Math.min(Math.max(score, 0), 100);

    const bucket = this.determineBucket(finalScore);

    const explanationTags = this.generateExplanationTags(signals, breakdown);

    return {
      prospectId: '',
      score: Math.round(finalScore),
      bucket,
      explanationTags,
      scoreVersion: 'v3',
      breakdown,
    };
  }

  private static calculateSocialTrust(mutualFriendsCount: number): number {
    return Math.min((mutualFriendsCount / 200) * 100, 100);
  }

  private static calculatePainNeed(painProfile?: PainPointProfile): number {
    if (!painProfile || !painProfile.categories) {
      return 0;
    }

    const scores = Object.values(painProfile.categories);
    return scores.length > 0 ? Math.max(...scores) : 0;
  }

  private static determineBucket(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 80) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  }

  private static generateExplanationTags(
    signals: ProspectSignals,
    breakdown: any
  ): string[] {
    const tags: string[] = [];

    if (breakdown.socialRelationship >= 70) {
      tags.push('🫂 Strong relationship on social media');
    }

    if (signals.socialTrustSignal && signals.socialTrustSignal >= 60) {
      tags.push('👀 Frequently engages with your posts');
    }

    if (breakdown.socialRelationship >= 50 && breakdown.socialTrust >= 50) {
      tags.push('💬 Has commented on your content recently');
    }

    if (breakdown.socialRelationship < 30 && breakdown.socialTrust < 30) {
      tags.push('🧊 Very little interaction on social media');
    }

    if ((signals.mutualFriendsCount || 0) >= 50) {
      tags.push('👥 High mutual trust');
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

    if (breakdown.leadership >= 70) {
      tags.push('👑 Leadership potential');
    }

    if (breakdown.socialTrust >= 60) {
      tags.push('🤝 Strong network connection');
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

  static async scoreProspectsForScanV3(scanId: string): Promise<void> {
    const { data: items, error } = await supabase
      .from('scan_processed_items')
      .select('*')
      .eq('scan_id', scanId);

    if (error || !items) {
      console.error('Failed to fetch scan items:', error);
      return;
    }

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
        prospect.mutualFriends = Math.max(
          prospect.mutualFriends,
          item.metadata.mutual_friends
        );
      }

      if (item.type === 'post') {
        prospect.posts.push(item.content);
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    for (const [name, prospect] of prospectMap.entries()) {
      await SocialGraphBuilder.enrichProspectFromSocialGraph(user.id, prospect.id);

      const { data: painProfile } = await supabase
        .from('prospect_pain_profiles')
        .select('*')
        .eq('prospect_id', prospect.id)
        .maybeSingle();

      const updatedMetadata = prospect.metadata;

      const signals: ProspectSignals = {
        engagementScore: this.calculateEngagement(prospect.posts),
        businessInterestScore: this.calculateBusinessInterest(updatedMetadata),
        lifeEventScore: this.calculateLifeEvent(updatedMetadata),
        responsivenessScore: 50,
        leadershipScore: this.calculateLeadership(updatedMetadata),
        relationshipScore: 50,
        mutualFriendsCount: prospect.mutualFriends,
        socialRelationshipScore: updatedMetadata.social_relationship_score,
        socialTrustSignal: updatedMetadata.social_trust_signal,
        painProfile: painProfile
          ? {
              categories: painProfile.categories,
              dominantCategory: painProfile.dominant_category,
              hasStrongSignal: painProfile.has_strong_signal,
            }
          : undefined,
      };

      const scoreResult = this.calculateScoreV3(signals);
      scoreResult.prospectId = prospect.id;

      await this.persistScore(scoreResult, scanId);
    }
  }

  private static calculateEngagement(posts: string[]): number {
    const baseScore = Math.min(posts.length * 10, 60);

    const hasRecentActivity = posts.some(p =>
      p.toLowerCase().includes('hour') || p.toLowerCase().includes('min')
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

  private static calculateLifeEvent(metadata: any): number {
    const lifeEventKeywords = ['wedding', 'graduation', 'new job', 'promotion', 'birthday'];

    let score = 30;

    if (metadata.additional_info) {
      const info = metadata.additional_info.toLowerCase();
      for (const keyword of lifeEventKeywords) {
        if (info.includes(keyword)) {
          score += 20;
          break;
        }
      }
    }

    return Math.min(score, 100);
  }

  private static calculateLeadership(metadata: any): number {
    const leadershipTitles = ['ceo', 'founder', 'director', 'manager', 'head', 'vp', 'president'];

    let score = 30;

    if (metadata.additional_info) {
      const info = metadata.additional_info.toLowerCase();
      for (const title of leadershipTitles) {
        if (info.includes(title)) {
          score += 40;
          break;
        }
      }
    }

    return Math.min(score, 100);
  }

  private static async persistScore(
    scoreResult: ScoutScoreV3Result,
    scanId: string
  ): Promise<void> {
    await supabase.from('scan_processed_items').update({
      score: scoreResult.score,
      metadata: {
        score_version: scoreResult.scoreVersion,
        bucket: scoreResult.bucket,
        explanation_tags: scoreResult.explanationTags,
        breakdown: scoreResult.breakdown,
      },
    }).eq('id', scoreResult.prospectId);
  }
}
