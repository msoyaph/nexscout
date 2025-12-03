// PURPOSE: Track viral shares, calculate K-factor, optimize viral loops
// INPUT: Share events, referral signups
// OUTPUT: JSON with K-factors, viral triggers, super spreaders
// NOTES: Target K > 1.0 for viral growth, 5 pre-seeded triggers

import { supabase } from '../../lib/supabase';

interface ShareEvent {
  user_id: string;
  trigger_type: string;
  platform: string;
  content_id?: string;
  shared_at: string;
}

interface ViralMetrics {
  user_id: string;
  shares_sent: number;
  referrals_generated: number;
  k_factor: number;
  top_trigger: string;
  is_super_spreader: boolean;
}

class ViralEngine {
  /**
   * Track share event
   */
  async trackShare(
    userId: string,
    triggerType: string,
    platform: string,
    contentId?: string
  ): Promise<{ success: boolean }> {
    try {
      await supabase.from('viral_share_events').insert({
        user_id: userId,
        trigger_type: triggerType,
        platform,
        content_id: contentId,
        shared_at: new Date().toISOString(),
      });

      // Update trigger score
      await this.updateTriggerScore(triggerType);

      return { success: true };
    } catch (error) {
      console.error('Viral tracking error:', error);
      return { success: false };
    }
  }

  /**
   * Calculate K-factor for user
   */
  async calculateKFactor(userId: string): Promise<number> {
    // K-factor = (# of invites sent) × (% conversion rate)
    const { count: sharesSent } = await supabase
      .from('viral_share_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: referralsConverted } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', userId);

    const shares = sharesSent || 0;
    const conversions = referralsConverted || 0;

    const kFactor = shares > 0 ? conversions / shares : 0;

    // Store viral loop score
    await supabase.from('viral_loop_scores').upsert({
      user_id: userId,
      shares_sent: shares,
      referrals_generated: conversions,
      k_factor: kFactor,
      is_super_spreader: kFactor > 5.0,
    });

    return kFactor;
  }

  /**
   * Get super spreaders
   */
  async getSuperSpreaders(limit: number = 20): Promise<ViralMetrics[]> {
    const { data: spreaders } = await supabase
      .from('viral_loop_scores')
      .select('*')
      .gte('k_factor', 5.0)
      .order('k_factor', { ascending: false })
      .limit(limit);

    if (!spreaders) return [];

    return spreaders.map(s => ({
      user_id: s.user_id,
      shares_sent: s.shares_sent,
      referrals_generated: s.referrals_generated,
      k_factor: s.k_factor,
      top_trigger: s.top_trigger || '',
      is_super_spreader: true,
    }));
  }

  /**
   * Get viral trigger performance
   */
  async getTriggerPerformance(): Promise<any[]> {
    const { data: triggers } = await supabase
      .from('viral_trigger_scores')
      .select('*')
      .order('k_factor', { ascending: false });

    return triggers || [];
  }

  /**
   * Update trigger performance score
   */
  private async updateTriggerScore(triggerType: string): Promise<void> {
    const { count: shares } = await supabase
      .from('viral_share_events')
      .select('*', { count: 'exact', head: true })
      .eq('trigger_type', triggerType);

    const { count: conversions } = await supabase
      .from('analytics_events_v2')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', 'referral_signup')
      .eq('properties->>trigger', triggerType);

    const kFactor = shares && shares > 0 ? (conversions || 0) / shares : 0;

    await supabase.from('viral_trigger_scores').upsert({
      trigger_name: triggerType,
      total_shares: shares || 0,
      total_conversions: conversions || 0,
      k_factor: kFactor,
    });
  }

  /**
   * Get overall viral metrics
   */
  async getOverallMetrics(): Promise<any> {
    const { data: allScores } = await supabase
      .from('viral_loop_scores')
      .select('*');

    if (!allScores || allScores.length === 0) {
      return {
        total_users: 0,
        total_shares: 0,
        total_referrals: 0,
        average_k_factor: 0,
        super_spreaders_count: 0,
      };
    }

    const totalShares = allScores.reduce((sum, s) => sum + s.shares_sent, 0);
    const totalReferrals = allScores.reduce((sum, s) => sum + s.referrals_generated, 0);
    const avgKFactor = allScores.reduce((sum, s) => sum + s.k_factor, 0) / allScores.length;
    const superSpreaders = allScores.filter(s => s.is_super_spreader).length;

    return {
      total_users: allScores.length,
      total_shares: totalShares,
      total_referrals: totalReferrals,
      average_k_factor: avgKFactor,
      super_spreaders_count: superSpreaders,
    };
  }
}

export const viralEngine = new ViralEngine();
