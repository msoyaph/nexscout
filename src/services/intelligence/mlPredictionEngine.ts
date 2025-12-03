// PURPOSE: Predict upgrade probability and churn risk using ML features
// INPUT: User ID or batch of users
// OUTPUT: JSON with probability scores, explainability, confidence
// NOTES: 17 features for upgrade, 11 for churn, target 80%+ accuracy

import { supabase } from '../../lib/supabase';

interface UpgradeFeatures {
  sessions_last_7d: number;
  scans_last_7d: number;
  messages_last_7d: number;
  decks_last_7d: number;
  missions_completed: number;
  paywall_views_last_7d: number;
  hit_limits_count: number;
  referrals_sent: number;
  avg_session_duration_seconds: number;
  days_since_signup: number;
  coin_balance: number;
  feature_discovery_score: number;
  pipeline_prospects_count: number;
  engagement_score: number;
  time_to_first_value_hours: number;
  pricing_page_views: number;
  has_completed_onboarding: boolean;
}

interface ChurnFeatures {
  days_since_last_login: number;
  sessions_last_7d: number;
  sessions_last_30d: number;
  feature_usage_decline_percent: number;
  support_tickets_open: number;
  days_on_current_tier: number;
  engagement_trend: number; // -1 to 1
  missions_abandoned: number;
  avg_session_gap_days: number;
  payment_failures: number;
  has_active_prospects: boolean;
}

interface PredictionResult {
  user_id: string;
  prediction_type: 'upgrade' | 'churn';
  probability: number;
  confidence: number;
  top_positive_factors: string[];
  top_negative_factors: string[];
  recommended_action: string;
  optimal_timing: string;
  explanation_text: string;
}

class MLPredictionEngine {
  /**
   * Compute upgrade prediction for single user
   */
  async predictUpgrade(userId: string): Promise<PredictionResult> {
    const features = await this.extractUpgradeFeatures(userId);
    const probability = this.calculateUpgradeProbability(features);
    const confidence = this.calculateConfidence(features, 'upgrade');

    const explanation = this.explainUpgradePrediction(features, probability);

    // Store prediction
    await supabase.from('upgrade_predictions').upsert({
      user_id: userId,
      probability,
      confidence,
      top_positive_factors: explanation.positiveFactors,
      top_negative_factors: explanation.negativeFactors,
      recommended_action: explanation.recommendedAction,
      optimal_timing: explanation.optimalTiming,
      features: features as any,
    });

    return {
      user_id: userId,
      prediction_type: 'upgrade',
      probability,
      confidence,
      top_positive_factors: explanation.positiveFactors,
      top_negative_factors: explanation.negativeFactors,
      recommended_action: explanation.recommendedAction,
      optimal_timing: explanation.optimalTiming,
      explanation_text: explanation.text,
    };
  }

  /**
   * Compute churn prediction for single user
   */
  async predictChurn(userId: string): Promise<PredictionResult> {
    const features = await this.extractChurnFeatures(userId);
    const probability = this.calculateChurnProbability(features);
    const confidence = this.calculateConfidence(features, 'churn');

    const explanation = this.explainChurnPrediction(features, probability);

    // Store prediction
    await supabase.from('churn_predictions').upsert({
      user_id: userId,
      churn_risk: probability,
      confidence,
      risk_level: this.getRiskLevel(probability),
      top_risk_factors: explanation.riskFactors,
      recommended_interventions: explanation.interventions,
      features: features as any,
    });

    return {
      user_id: userId,
      prediction_type: 'churn',
      probability,
      confidence,
      top_positive_factors: explanation.riskFactors,
      top_negative_factors: explanation.protectiveFactors,
      recommended_action: explanation.interventions.join('; '),
      optimal_timing: 'immediate',
      explanation_text: explanation.text,
    };
  }

  /**
   * Get high upgrade potential users
   */
  async getHighUpgradePotentialUsers(limit: number = 50): Promise<PredictionResult[]> {
    const { data: predictions } = await supabase
      .from('upgrade_predictions')
      .select('*')
      .gte('probability', 0.7)
      .gte('confidence', 70)
      .order('probability', { ascending: false })
      .limit(limit);

    if (!predictions) return [];

    return predictions.map(p => ({
      user_id: p.user_id,
      prediction_type: 'upgrade',
      probability: p.probability,
      confidence: p.confidence,
      top_positive_factors: p.top_positive_factors || [],
      top_negative_factors: p.top_negative_factors || [],
      recommended_action: p.recommended_action || '',
      optimal_timing: p.optimal_timing || 'now',
      explanation_text: '',
    }));
  }

  /**
   * Get high churn risk users
   */
  async getHighChurnRiskUsers(limit: number = 50): Promise<PredictionResult[]> {
    const { data: predictions } = await supabase
      .from('churn_predictions')
      .select('*')
      .gte('churn_risk', 0.5)
      .order('churn_risk', { ascending: false })
      .limit(limit);

    if (!predictions) return [];

    return predictions.map(p => ({
      user_id: p.user_id,
      prediction_type: 'churn',
      probability: p.churn_risk,
      confidence: p.confidence,
      top_positive_factors: p.top_risk_factors || [],
      top_negative_factors: [],
      recommended_action: (p.recommended_interventions || []).join('; '),
      optimal_timing: 'immediate',
      explanation_text: '',
    }));
  }

  /**
   * Batch compute predictions for all users
   */
  async batchComputePredictions(): Promise<{ success: boolean; processed: number }> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_tier', 'free'); // Focus on free users for upgrades

      if (!users) return { success: false, processed: 0 };

      for (const user of users) {
        await this.predictUpgrade(user.id);
        await this.predictChurn(user.id);
      }

      return { success: true, processed: users.length };
    } catch (error) {
      console.error('Batch prediction error:', error);
      return { success: false, processed: 0 };
    }
  }

  // ========================================
  // FEATURE EXTRACTION
  // ========================================

  private async extractUpgradeFeatures(userId: string): Promise<UpgradeFeatures> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get events
    const { data: events, count: sessionsCount } = await supabase
      .from('analytics_events_v2')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('timestamp', sevenDaysAgo);

    const scansCount = events?.filter(e => e.event_name === 'prospect_scanned').length || 0;
    const messagesCount = events?.filter(e => e.event_name === 'ai_message_generated').length || 0;
    const decksCount = events?.filter(e => e.event_name === 'ai_deck_generated').length || 0;
    const paywallViews = events?.filter(e => e.event_name === 'paywall_viewed').length || 0;
    const limitHits = events?.filter(e => e.event_name === 'limit_reached').length || 0;
    const pricingViews = events?.filter(e => e.event_name === 'pricing_page_viewed').length || 0;

    // Get profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at, coin_balance, onboarding_completed')
      .eq('id', userId)
      .maybeSingle();

    const daysSinceSignup = profile
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Get missions
    const { count: missionsCompleted } = await supabase
      .from('user_missions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Get prospects
    const { count: pipelineCount } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      sessions_last_7d: sessionsCount || 0,
      scans_last_7d: scansCount,
      messages_last_7d: messagesCount,
      decks_last_7d: decksCount,
      missions_completed: missionsCompleted || 0,
      paywall_views_last_7d: paywallViews,
      hit_limits_count: limitHits,
      referrals_sent: 0, // TODO: implement referral tracking
      avg_session_duration_seconds: 300, // TODO: calculate from sessions
      days_since_signup: daysSinceSignup,
      coin_balance: profile?.coin_balance || 0,
      feature_discovery_score: this.calculateFeatureDiscovery(events || []),
      pipeline_prospects_count: pipelineCount || 0,
      engagement_score: this.calculateEngagement(events || []),
      time_to_first_value_hours: 24, // TODO: calculate
      pricing_page_views: pricingViews,
      has_completed_onboarding: profile?.onboarding_completed || false,
    };
  }

  private async extractChurnFeatures(userId: string): Promise<ChurnFeatures> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_sign_in_at, created_at')
      .eq('id', userId)
      .maybeSingle();

    const daysSinceLastLogin = profile?.last_sign_in_at
      ? Math.floor((Date.now() - new Date(profile.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { count: sessions7d } = await supabase
      .from('analytics_events_v2')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', sevenDaysAgo);

    const { count: sessions30d } = await supabase
      .from('analytics_events_v2')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('timestamp', thirtyDaysAgo);

    const { count: openTickets } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'open');

    const { count: activeProspects } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      days_since_last_login: daysSinceLastLogin,
      sessions_last_7d: sessions7d || 0,
      sessions_last_30d: sessions30d || 0,
      feature_usage_decline_percent: this.calculateDecline(sessions7d || 0, sessions30d || 0),
      support_tickets_open: openTickets || 0,
      days_on_current_tier: 30, // TODO: calculate
      engagement_trend: sessions7d && sessions7d > 0 ? 0.5 : -0.5,
      missions_abandoned: 0, // TODO: calculate
      avg_session_gap_days: daysSinceLastLogin / Math.max(sessions30d || 1, 1),
      payment_failures: 0, // TODO: track
      has_active_prospects: (activeProspects || 0) > 0,
    };
  }

  // ========================================
  // SCORING ALGORITHMS
  // ========================================

  private calculateUpgradeProbability(features: UpgradeFeatures): number {
    let score = 0;

    // Strong positive indicators
    if (features.hit_limits_count >= 3) score += 0.25;
    if (features.paywall_views_last_7d >= 2) score += 0.20;
    if (features.pricing_page_views >= 1) score += 0.15;
    if (features.missions_completed >= 5) score += 0.10;
    if (features.sessions_last_7d >= 5) score += 0.10;
    if (features.scans_last_7d >= 10) score += 0.08;
    if (features.messages_last_7d >= 5) score += 0.07;
    if (features.has_completed_onboarding) score += 0.05;

    return Math.min(score, 1.0);
  }

  private calculateChurnProbability(features: ChurnFeatures): number {
    let score = 0;

    // Strong risk indicators
    if (features.days_since_last_login >= 7) score += 0.30;
    if (features.days_since_last_login >= 14) score += 0.20;
    if (features.sessions_last_7d === 0) score += 0.20;
    if (features.feature_usage_decline_percent > 50) score += 0.15;
    if (features.support_tickets_open >= 1) score += 0.10;
    if (!features.has_active_prospects) score += 0.05;

    return Math.min(score, 1.0);
  }

  private calculateConfidence(features: any, type: 'upgrade' | 'churn'): number {
    // Base confidence on data completeness
    let confidence = 70;

    if (type === 'upgrade') {
      if (features.sessions_last_7d >= 3) confidence += 10;
      if (features.paywall_views_last_7d >= 1) confidence += 10;
      if (features.days_since_signup >= 3) confidence += 10;
    } else {
      if (features.sessions_last_30d >= 5) confidence += 10;
      if (features.days_since_last_login >= 1) confidence += 10;
      if (features.sessions_last_7d >= 0) confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  // ========================================
  // EXPLAINABILITY
  // ========================================

  private explainUpgradePrediction(features: UpgradeFeatures, probability: number): any {
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    if (features.hit_limits_count >= 3) positiveFactors.push('Hit feature limits multiple times');
    if (features.paywall_views_last_7d >= 2) positiveFactors.push('Viewed paywall frequently');
    if (features.pricing_page_views >= 1) positiveFactors.push('Viewed pricing page');
    if (features.missions_completed >= 5) positiveFactors.push('High mission completion rate');
    if (features.sessions_last_7d >= 5) positiveFactors.push('Active user (5+ sessions)');

    if (features.sessions_last_7d < 2) negativeFactors.push('Low recent activity');
    if (features.coin_balance > 1000) negativeFactors.push('High coin balance (less need to upgrade)');
    if (!features.has_completed_onboarding) negativeFactors.push('Onboarding not completed');

    const recommendedAction = probability > 0.7
      ? 'Show targeted upgrade offer with time-limited discount'
      : probability > 0.5
      ? 'Send gentle upgrade reminder via notification'
      : 'Continue nurturing with value demonstrations';

    const optimalTiming = features.hit_limits_count >= 2 ? 'Immediately after next limit hit' : 'Within next 3 days';

    const text = `User has ${Math.round(probability * 100)}% likelihood of upgrading. ${positiveFactors.length > 0 ? 'Key drivers: ' + positiveFactors.join(', ') : 'Limited positive signals.'}`;

    return {
      positiveFactors: positiveFactors.slice(0, 5),
      negativeFactors: negativeFactors.slice(0, 3),
      recommendedAction,
      optimalTiming,
      text,
    };
  }

  private explainChurnPrediction(features: ChurnFeatures, probability: number): any {
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];
    const interventions: string[] = [];

    if (features.days_since_last_login >= 7) riskFactors.push(`Inactive for ${features.days_since_last_login} days`);
    if (features.sessions_last_7d === 0) riskFactors.push('No sessions in past week');
    if (features.feature_usage_decline_percent > 50) riskFactors.push('Usage declined by 50%+');
    if (!features.has_active_prospects) riskFactors.push('No active prospects in pipeline');

    if (features.has_active_prospects) protectiveFactors.push('Has prospects in pipeline');
    if (features.sessions_last_7d > 0) protectiveFactors.push('Still logging in');

    if (probability > 0.7) {
      interventions.push('Send urgent win-back campaign');
      interventions.push('Offer bonus coins or free premium trial');
      interventions.push('Personal outreach from support team');
    } else if (probability > 0.5) {
      interventions.push('Send re-engagement notification');
      interventions.push('Highlight new features or unused tools');
      interventions.push('Easy-win missions to rebuild habit');
    }

    const text = `User has ${Math.round(probability * 100)}% churn risk. Primary concerns: ${riskFactors.slice(0, 2).join(', ')}.`;

    return {
      riskFactors: riskFactors.slice(0, 5),
      protectiveFactors: protectiveFactors.slice(0, 3),
      interventions,
      text,
    };
  }

  // ========================================
  // HELPERS
  // ========================================

  private calculateFeatureDiscovery(events: any[]): number {
    const uniqueFeatures = new Set(events.map(e => e.page || e.event_name));
    return Math.min(uniqueFeatures.size / 10, 1.0);
  }

  private calculateEngagement(events: any[]): number {
    return Math.min(events.length / 50, 1.0);
  }

  private calculateDecline(recent: number, total: number): number {
    if (total === 0) return 0;
    const expected = total / 4; // Expect 25% of 30-day activity in last 7 days
    const actual = recent;
    return Math.max(0, ((expected - actual) / expected) * 100);
  }

  private getRiskLevel(probability: number): string {
    if (probability >= 0.7) return 'high';
    if (probability >= 0.5) return 'medium';
    return 'low';
  }
}

export const mlPredictionEngine = new MLPredictionEngine();
