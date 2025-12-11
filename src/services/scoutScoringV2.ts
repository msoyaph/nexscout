import { supabase } from '../lib/supabase';
import { PHILIPPINE_MLM_KEYWORDS, OBJECTION_KEYWORDS } from '../config/scout/mlmKeywords';

export interface FeatureVector {
  engagement_score: number;
  business_interest_score: number;
  pain_point_score: number;
  life_event_score: number;
  responsiveness_score: number;
  leadership_score: number;
  relationship_score: number;
}

export interface WeightVector {
  engagement_score: number;
  business_interest_score: number;
  pain_point_score: number;
  life_event_score: number;
  responsiveness_score: number;
  leadership_score: number;
  relationship_score: number;
}

export interface ObjectionSignals {
  hasBudgetObjection: boolean;
  hasTimingObjection: boolean;
  hasSpouseObjection: boolean;
}

export interface ScoutScoreResult {
  score: number;
  bucket: 'hot' | 'warm' | 'cold';
  confidence: number;
  explanation_tags: string[];
  top_features: Array<{ feature: string; contribution: number; value: number }>;
  feature_vector: FeatureVector;
  weight_vector: WeightVector;
  // New v2 extended fields
  intentSignal?: string | null;
  conversionLikelihood?: number | null;
  recommendedCTA?: string | null;
  objectionSignals?: ObjectionSignals;
  lastInteractionDaysAgo?: number;
}

const DEFAULT_WEIGHTS: WeightVector = {
  engagement_score: 0.18,
  business_interest_score: 0.20,
  pain_point_score: 0.20,
  life_event_score: 0.15,
  responsiveness_score: 0.15,
  leadership_score: 0.12,
  relationship_score: 0.10,
};

class ScoutScoringV2Service {
  async calculateScoutScore(prospectId: string, userId: string, textContent?: string): Promise<ScoutScoreResult> {
    const featureVector = await this.extractFeatures(prospectId, userId);
    const weightVector = await this.getUserWeights(userId);

    // Detect objections from text content
    const objectionSignals = textContent 
      ? this.detectObjections(textContent)
      : { hasBudgetObjection: false, hasTimingObjection: false, hasSpouseObjection: false };

    // Get last interaction time for time-decay
    const lastInteractionDaysAgo = await this.getLastInteractionDaysAgo(prospectId, userId);

    // Apply time-decay penalty (simple weight reduction for old interactions)
    const decayPenalty = this.calculateTimeDecayPenalty(lastInteractionDaysAgo);
    const rawScore = this.computeWeightedScore(featureVector, weightVector);
    const scoreWithDecay = rawScore * (1 - decayPenalty);

    const normalizedScore = this.normalizeScore(scoreWithDecay);

    const bucket = this.classifyBucket(normalizedScore);
    const confidence = this.calculateConfidence(featureVector);
    const topFeatures = this.identifyTopFeatures(featureVector, weightVector);
    const explanationTags = this.generateExplanationTags(featureVector, topFeatures);

    // Generate extended output fields
    const intentSignal = this.generateIntentSignal(featureVector, objectionSignals);
    const conversionLikelihood = this.calculateConversionLikelihood(normalizedScore, objectionSignals);
    const recommendedCTA = this.generateRecommendedCTA(bucket, objectionSignals);

    await this.saveFeatureVector(prospectId, userId, featureVector);
    await this.saveScore(prospectId, userId, {
      score: normalizedScore,
      bucket,
      confidence,
      explanation_tags: explanationTags,
      top_features: topFeatures,
      feature_vector: featureVector,
      weight_vector: weightVector,
    });

    return {
      score: normalizedScore,
      bucket,
      confidence,
      explanation_tags: explanationTags,
      top_features: topFeatures,
      feature_vector: featureVector,
      weight_vector: weightVector,
      intentSignal,
      conversionLikelihood,
      recommendedCTA,
      objectionSignals,
      lastInteractionDaysAgo,
    };
  }

  private detectObjections(text: string): ObjectionSignals {
    const lowerText = text.toLowerCase();
    
    const hasBudgetObjection = OBJECTION_KEYWORDS.budget.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    const hasTimingObjection = OBJECTION_KEYWORDS.timing.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    const hasSpouseObjection = OBJECTION_KEYWORDS.spouse.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );

    return {
      hasBudgetObjection,
      hasTimingObjection,
      hasSpouseObjection,
    };
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

      const daysSince = Math.floor(
        (Date.now() - new Date(lastEventAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysSince;
    } catch {
      return 999;
    }
  }

  private calculateTimeDecayPenalty(daysAgo: number): number {
    // Light decay: 5% after 30 days, 10% after 60 days, max 20% after 90 days
    if (daysAgo <= 30) return 0;
    if (daysAgo <= 60) return 0.05;
    if (daysAgo <= 90) return 0.10;
    return Math.min(0.20, 0.10 + (daysAgo - 90) * 0.001);
  }

  private generateIntentSignal(features: FeatureVector, objections: ObjectionSignals): string | null {
    if (objections.hasBudgetObjection) return 'budget_concern';
    if (objections.hasTimingObjection) return 'timing_objection';
    if (objections.hasSpouseObjection) return 'spouse_approval_needed';
    if (features.business_interest_score >= 70) return 'high_business_interest';
    if (features.pain_point_score >= 70) return 'high_pain_awareness';
    if (features.leadership_score >= 70) return 'leadership_potential';
    return 'general_interest';
  }

  private calculateConversionLikelihood(score: number, objections: ObjectionSignals): number {
    // Base likelihood from score
    let likelihood = score;
    
    // Adjust for objections
    if (objections.hasBudgetObjection) likelihood -= 15;
    if (objections.hasTimingObjection) likelihood -= 10;
    if (objections.hasSpouseObjection) likelihood -= 20;

    return Math.max(0, Math.min(100, Math.round(likelihood)));
  }

  private generateRecommendedCTA(
    bucket: 'hot' | 'warm' | 'cold',
    objections: ObjectionSignals
  ): string | null {
    if (objections.hasBudgetObjection) return 'address_price_concerns';
    if (objections.hasTimingObjection) return 'schedule_follow_up';
    if (objections.hasSpouseObjection) return 'provide_spouse_info_packet';
    
    if (bucket === 'hot') return 'direct_close_offer';
    if (bucket === 'warm') return 'nurture_sequence';
    return 'build_rapport';
  }

  private async extractFeatures(prospectId: string, userId: string): Promise<FeatureVector> {
    const { data: prospect } = await supabase
      .from('prospects')
      .select(`
        *,
        prospect_profiles!inner(*),
        prospect_events(*)
      `)
      .eq('id', prospectId)
      .eq('user_id', userId)
      .single();

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const profile = prospect.prospect_profiles[0];
    const events = prospect.prospect_events || [];

    return {
      engagement_score: this.calculateEngagementScore(profile, events),
      business_interest_score: this.calculateBusinessInterestScore(profile),
      pain_point_score: this.calculatePainPointScore(profile),
      life_event_score: this.calculateLifeEventScore(profile),
      responsiveness_score: this.calculateResponsivenessScore(profile, events),
      leadership_score: this.calculateLeadershipScore(profile, events),
      relationship_score: this.calculateRelationshipScore(profile, events),
    };
  }

  private calculateEngagementScore(profile: any, events: any[]): number {
    let score = 0;

    const eventCount = profile.total_events_count || 0;
    if (eventCount > 50) score += 40;
    else if (eventCount > 20) score += 30;
    else if (eventCount > 10) score += 20;
    else if (eventCount > 5) score += 10;

    const recencyScore = this.calculateRecencyScore(profile.last_event_at);
    score += recencyScore * 30;

    const engagementScore = profile.engagement_score || 0;
    score += (engagementScore / 100) * 30;

    return Math.min(100, score);
  }

  private calculateBusinessInterestScore(profile: any): number {
    let score = 0;
    const topics = profile.dominant_topics || [];
    const interests = profile.interests || [];

    const businessKeywords = [...PHILIPPINE_MLM_KEYWORDS.business, ...PHILIPPINE_MLM_KEYWORDS.finance];

    const businessTopics = topics.filter((t: string) =>
      businessKeywords.some(kw => t.toLowerCase().includes(kw.toLowerCase()))
    );
    score += Math.min(50, businessTopics.length * 15);

    const businessInterests = interests.filter((i: string) =>
      businessKeywords.some(kw => i.toLowerCase().includes(kw.toLowerCase()))
    );
    score += Math.min(30, businessInterests.length * 10);

    const rawBusinessScore = profile.business_interest_score || 0;
    score += (rawBusinessScore / 100) * 20;

    return Math.min(100, score);
  }

  private calculatePainPointScore(profile: any): number {
    let score = 0;
    const painPoints = profile.pain_points || [];

    const highValuePainPoints = [
      'financial_stress', 'income', 'debt', 'money',
      'job_dissatisfaction', 'time_freedom', 'overworked'
    ];

    painPoints.forEach((pp: string) => {
      if (highValuePainPoints.some(hvp => pp.toLowerCase().includes(hvp))) {
        score += 25;
      } else {
        score += 10;
      }
    });

    const rawPainScore = profile.pain_point_score || 0;
    score += (rawPainScore / 100) * 30;

    return Math.min(100, score);
  }

  private calculateLifeEventScore(profile: any): number {
    let score = 0;
    const lifeEvents = profile.life_events || [];

    const impactfulEvents: Record<string, number> = {
      new_baby: 40,
      baby: 40,
      marriage: 35,
      new_job: 30,
      job_change: 30,
      promotion: 25,
      relocation: 20,
      graduation: 20,
      milestone_birthday: 15,
    };

    lifeEvents.forEach((event: string) => {
      const eventLower = event.toLowerCase();
      for (const [key, value] of Object.entries(impactfulEvents)) {
        if (eventLower.includes(key)) {
          score += value;
          break;
        }
      }
    });

    const rawLifeScore = profile.life_event_score || 0;
    score += (rawLifeScore / 100) * 20;

    return Math.min(100, score);
  }

  private calculateResponsivenessScore(profile: any, events: any[]): number {
    let score = 50;

    const sentimentAvg = profile.sentiment_avg || 0;
    if (sentimentAvg > 0.5) score += 25;
    else if (sentimentAvg > 0) score += 10;
    else if (sentimentAvg < -0.3) score -= 20;

    const personality = profile.personality_traits || {};
    if (personality.openness === 'high') score += 15;
    if (personality.responsiveness === 'high') score += 20;
    if (personality.engagement === 'active') score += 10;

    const rawResponsivenessScore = profile.responsiveness_likelihood || 0;
    score += (rawResponsivenessScore / 100) * 20;

    return Math.max(0, Math.min(100, score));
  }

  private calculateLeadershipScore(profile: any, events: any[]): number {
    let score = 0;

    const personality = profile.personality_traits || {};
    if (personality.leadership === 'high') score += 40;
    else if (personality.leadership === 'medium') score += 20;

    const leadershipKeywords = ['lead', 'manage', 'team', 'organize', 'coordinate', 'mentor'];
    const topics = profile.dominant_topics || [];
    const interests = profile.interests || [];

    const leadershipTopics = [...topics, ...interests].filter((t: string) =>
      leadershipKeywords.some(kw => t.toLowerCase().includes(kw))
    );
    score += Math.min(30, leadershipTopics.length * 10);

    const rawLeadershipScore = profile.mlm_leadership_potential || 0;
    score += (rawLeadershipScore / 100) * 30;

    return Math.min(100, score);
  }

  private calculateRelationshipScore(profile: any, events: any[]): number {
    let score = 30;

    const eventCount = events.length;
    if (eventCount > 30) score += 30;
    else if (eventCount > 15) score += 20;
    else if (eventCount > 5) score += 10;

    const sentimentAvg = profile.sentiment_avg || 0;
    if (sentimentAvg > 0.3) score += 20;

    const recencyBonus = this.calculateRecencyScore(profile.last_event_at) * 20;
    score += recencyBonus;

    return Math.min(100, score);
  }

  private calculateRecencyScore(lastEventAt: string | null): number {
    if (!lastEventAt) return 0;

    const daysSinceLastEvent = Math.floor(
      (Date.now() - new Date(lastEventAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastEvent <= 1) return 1.0;
    if (daysSinceLastEvent <= 3) return 0.9;
    if (daysSinceLastEvent <= 7) return 0.7;
    if (daysSinceLastEvent <= 14) return 0.5;
    if (daysSinceLastEvent <= 30) return 0.3;
    return 0.1;
  }

  private async getUserWeights(userId: string): Promise<WeightVector> {
    const { data } = await supabase
      .from('user_scoring_profiles')
      .select('weights')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.weights) {
      return data.weights as WeightVector;
    }

    await supabase.from('user_scoring_profiles').insert({
      user_id: userId,
      weights: DEFAULT_WEIGHTS,
    });

    return DEFAULT_WEIGHTS;
  }

  private computeWeightedScore(features: FeatureVector, weights: WeightVector): number {
    let score = 0;

    score += features.engagement_score * weights.engagement_score;
    score += features.business_interest_score * weights.business_interest_score;
    score += features.pain_point_score * weights.pain_point_score;
    score += features.life_event_score * weights.life_event_score;
    score += features.responsiveness_score * weights.responsiveness_score;
    score += features.leadership_score * weights.leadership_score;
    score += features.relationship_score * weights.relationship_score;

    return score;
  }

  private normalizeScore(rawScore: number): number {
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  private classifyBucket(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 80) return 'hot';
    if (score >= 50) return 'warm';
    return 'cold';
  }

  private calculateConfidence(features: FeatureVector): number {
    const featureValues = Object.values(features);
    const nonZeroCount = featureValues.filter(v => v > 0).length;
    const avgValue = featureValues.reduce((a, b) => a + b, 0) / featureValues.length;

    const completeness = nonZeroCount / featureValues.length;
    const strength = avgValue / 100;

    return Math.round((completeness * 0.6 + strength * 0.4) * 100) / 100;
  }

  private identifyTopFeatures(features: FeatureVector, weights: WeightVector): Array<{ feature: string; contribution: number; value: number }> {
    const contributions = Object.entries(features).map(([key, value]) => ({
      feature: key,
      value,
      contribution: value * weights[key as keyof WeightVector],
    }));

    return contributions
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
  }

  private generateExplanationTags(features: FeatureVector, topFeatures: any[]): string[] {
    const tags: string[] = [];

    topFeatures.forEach((f) => {
      if (f.value >= 70) {
        if (f.feature === 'business_interest_score') {
          tags.push('Strong business interest');
        } else if (f.feature === 'pain_point_score') {
          tags.push('Clear pain points identified');
        } else if (f.feature === 'life_event_score') {
          tags.push('Recent life event (opportunity window)');
        } else if (f.feature === 'engagement_score') {
          tags.push('Highly engaged prospect');
        } else if (f.feature === 'leadership_score') {
          tags.push('Strong leadership potential');
        } else if (f.feature === 'responsiveness_score') {
          tags.push('High response likelihood');
        } else if (f.feature === 'relationship_score') {
          tags.push('Good relationship foundation');
        }
      }
    });

    if (features.pain_point_score >= 60 && features.business_interest_score >= 60) {
      tags.push('Problem-aware + business-minded');
    }

    if (features.life_event_score >= 50 && features.responsiveness_score >= 60) {
      tags.push('Prime timing for outreach');
    }

    if (features.leadership_score >= 70) {
      tags.push('Potential team builder');
    }

    return tags.slice(0, 5);
  }

  private async saveFeatureVector(prospectId: string, userId: string, features: FeatureVector): Promise<void> {
    await supabase.from('prospect_feature_vectors').upsert({
      prospect_id: prospectId,
      user_id: userId,
      ...features,
      features: features,
      updated_at: new Date().toISOString(),
    });
  }

  private async saveScore(prospectId: string, userId: string, result: ScoutScoreResult): Promise<void> {
    const { data: existing } = await supabase
      .from('prospect_scores')
      .select('scout_score, bucket')
      .eq('prospect_id', prospectId)
      .eq('user_id', userId)
      .maybeSingle();

    await supabase.from('prospect_scores').upsert({
      prospect_id: prospectId,
      user_id: userId,
      scout_score: result.score,
      bucket: result.bucket,
      explanation_tags: result.explanation_tags,
      feature_vector: result.feature_vector,
      weight_vector: result.weight_vector,
      confidence: result.confidence,
      top_features: result.top_features,
      model_version: 'v2.0',
      recalc_count: (existing ? 1 : 0),
      last_recalc_reason: 'manual_recalculate',
      last_calculated_at: new Date().toISOString(),
    });

    if (existing) {
      await supabase.from('scoring_history').insert({
        prospect_id: prospectId,
        user_id: userId,
        old_score: existing.scout_score,
        new_score: result.score,
        score_delta: result.score - existing.scout_score,
        old_bucket: existing.bucket,
        new_bucket: result.bucket,
        action_trigger: 'manual_recalculate',
        weight_vector_used: result.weight_vector,
        feature_vector_used: result.feature_vector,
      });
    }
  }

  async adjustWeightsFromOutcome(
    userId: string,
    prospectId: string,
    outcome: 'won' | 'lost' | 'positive_reply' | 'no_response'
  ): Promise<void> {
    const { data: profile } = await supabase
      .from('user_scoring_profiles')
      .select('weights, total_wins, total_losses')
      .eq('user_id', userId)
      .single();

    if (!profile) return;

    const { data: featureVector } = await supabase
      .from('prospect_feature_vectors')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!featureVector) return;

    const currentWeights = profile.weights as WeightVector;
    const adjustedWeights = { ...currentWeights };

    const boostRate = outcome === 'won' ? 0.05 : outcome === 'positive_reply' ? 0.02 : 0;
    const penaltyRate = outcome === 'lost' ? 0.03 : outcome === 'no_response' ? 0.01 : 0;

    Object.keys(adjustedWeights).forEach((key) => {
      const featureKey = key as keyof FeatureVector;
      const featureValue = featureVector[featureKey];

      if (featureValue > 70) {
        if (boostRate > 0) {
          adjustedWeights[featureKey] *= (1 + boostRate);
        } else if (penaltyRate > 0) {
          adjustedWeights[featureKey] *= (1 - penaltyRate);
        }
      }
    });

    const totalWeight = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
    Object.keys(adjustedWeights).forEach((key) => {
      adjustedWeights[key as keyof WeightVector] /= totalWeight;
    });

    const newWins = profile.total_wins + (outcome === 'won' ? 1 : 0);
    const newLosses = profile.total_losses + (outcome === 'lost' ? 1 : 0);
    const winRate = newWins / (newWins + newLosses || 1);

    await supabase.from('user_scoring_profiles').update({
      weights: adjustedWeights,
      total_wins: newWins,
      total_losses: newLosses,
      win_rate: winRate,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    await supabase.from('scoring_history').insert({
      prospect_id: prospectId,
      user_id: userId,
      action_trigger: outcome,
      weight_vector_used: adjustedWeights,
      triggered_by: 'reinforcement_learning',
      notes: `Weights adjusted based on ${outcome} outcome`,
    });
  }
}

export const scoutScoringV2 = new ScoutScoringV2Service();
