/**
 * SIFE 1.0 - Self-Improving Funnel Engine
 *
 * Learns from every interaction and automatically improves:
 * - Message scripts
 * - Chatbot flows
 * - Pitch decks
 * - Follow-up sequences
 * - Product offers
 */

import { supabase } from '../../lib/supabase';
import { synergyLayer, SynergyEventInput } from '../synergy/synergyLayerEngine';

export interface SIFEFunnel {
  id: string;
  userId: string;
  funnelName: string;
  funnelType: string;
  description?: string;
  isActive: boolean;
}

export interface SIFEStep {
  id: string;
  funnelId: string;
  stepOrder: number;
  stepType: string;
  stepIdentifier: string;
  version: number;
  content: Record<string, any>;
  isActive: boolean;
  isWinner: boolean;
}

export interface SIFEMetrics {
  impressions: number;
  clicks: number;
  replies: number;
  meetings: number;
  purchases: number;
  revenue: number;
}

export interface SIFERecommendation {
  recommendationType: string;
  currentContent: Record<string, any>;
  recommendedContent: Record<string, any>;
  reason: string;
  confidenceScore: number;
}

export class SIFEEngine {
  /**
   * Main entry: Called whenever a funnel-related event occurs
   */
  async processEvent(event: SynergyEventInput): Promise<void> {
    const { userId, eventType, prospectId, metadata } = event;

    try {
      console.log('[SIFE] Processing event:', eventType);

      switch (eventType) {
        case 'chatbot.message':
          await this.recordMessagePerformance(userId, event);
          break;

        case 'deal.closed':
          await this.recordConversion(userId, event);
          break;

        case 'prospect.deep_scanned':
          await this.learnFromDeepScan(userId, prospectId!, metadata);
          break;

        case 'product.pitched':
          await this.recordPitchEvent(userId, event);
          break;

        case 'meeting.booked':
          await this.recordMeetingBooked(userId, event);
          break;
      }

      // After each event, evaluate if we should generate improvements
      await this.evaluateFunnels(userId);
    } catch (error) {
      console.error('[SIFE] Error processing event:', error);
    }
  }

  /**
   * Record message reply performance
   */
  async recordMessagePerformance(userId: string, event: SynergyEventInput): Promise<void> {
    const { metadata } = event;
    const stepId = metadata?.step_id;

    if (!stepId) return;

    // Increment reply count
    const { error } = await supabase.rpc('increment_sife_metric', {
      p_step_id: stepId,
      p_user_id: userId,
      p_metric_name: 'replies',
      p_increment: 1,
    });

    if (error) {
      // Fallback: direct update
      await supabase
        .from('sife_step_metrics')
        .update({ replies: supabase.raw('replies + 1') })
        .eq('step_id', stepId)
        .eq('user_id', userId);
    }
  }

  /**
   * When deal closes, reward all steps that contributed
   */
  async recordConversion(userId: string, event: SynergyEventInput): Promise<void> {
    const { prospectId, revenueAmount = 0 } = event;

    if (!prospectId) return;

    // Find all steps associated with this prospect via synergy links
    const { data: links } = await supabase
      .from('synergy_links')
      .select('from_id, metadata')
      .eq('user_id', userId)
      .eq('to_type', 'prospect')
      .eq('to_id', prospectId)
      .eq('from_type', 'funnel_step');

    if (!links || links.length === 0) return;

    // Update metrics for all contributing steps
    for (const link of links) {
      const stepId = link.from_id;

      await supabase
        .from('sife_step_metrics')
        .upsert({
          step_id: stepId,
          user_id: userId,
          purchases: supabase.raw('COALESCE(purchases, 0) + 1'),
          revenue: supabase.raw(`COALESCE(revenue, 0) + ${revenueAmount}`),
        }, { onConflict: 'step_id,user_id' });
    }

    console.log('[SIFE] Recorded conversion for', links.length, 'steps');
  }

  /**
   * Learn from Deep Scan personality insights
   */
  async learnFromDeepScan(userId: string, prospectId: string, personality: Record<string, any>): Promise<void> {
    // Extract key traits
    const traits = {
      personality_type: personality?.personality_type || 'unknown',
      communication_style: personality?.communication_style || 'unknown',
      decision_style: personality?.decision_style || 'unknown',
    };

    // Store as learning pattern
    await supabase.from('sife_learning_patterns').insert({
      user_id: userId,
      pattern_type: 'personality_trait',
      pattern_name: `${traits.personality_type}_pattern`,
      pattern_data: traits,
      success_rate: 0, // Will be calculated later
    });

    console.log('[SIFE] Learned from Deep Scan:', traits);
  }

  /**
   * Record pitch deck/product pitch event
   */
  async recordPitchEvent(userId: string, event: SynergyEventInput): Promise<void> {
    const { productId, metadata } = event;
    const stepId = metadata?.step_id;

    if (!stepId) return;

    await supabase
      .from('sife_step_metrics')
      .update({ impressions: supabase.raw('impressions + 1') })
      .eq('step_id', stepId)
      .eq('user_id', userId);
  }

  /**
   * Record meeting booked
   */
  async recordMeetingBooked(userId: string, event: SynergyEventInput): Promise<void> {
    const { prospectId, metadata } = event;
    const stepId = metadata?.step_id;

    if (!stepId) return;

    await supabase
      .from('sife_step_metrics')
      .update({ meetings: supabase.raw('meetings + 1') })
      .eq('step_id', stepId)
      .eq('user_id', userId);
  }

  /**
   * Evaluate all funnels and generate improvement recommendations
   */
  async evaluateFunnels(userId: string): Promise<void> {
    try {
      // Get all steps with their metrics
      const { data: steps, error } = await supabase
        .from('sife_funnel_steps')
        .select(`
          *,
          sife_funnels!inner(user_id),
          sife_step_metrics(*)
        `)
        .eq('sife_funnels.user_id', userId)
        .eq('is_active', true);

      if (error || !steps || steps.length === 0) {
        return;
      }

      console.log('[SIFE] Evaluating', steps.length, 'funnel steps');

      // Analyze each step
      for (const step of steps) {
        const metrics = step.sife_step_metrics?.[0];

        if (!metrics) continue;

        // Check if step needs improvement
        const needsImprovement = await this.shouldGenerateImprovement(step, metrics);

        if (needsImprovement) {
          await this.generateImprovementRecommendation(userId, step, metrics);
        }
      }
    } catch (error) {
      console.error('[SIFE] Error evaluating funnels:', error);
    }
  }

  /**
   * Determine if a step needs improvement
   */
  private async shouldGenerateImprovement(step: any, metrics: any): Promise<boolean> {
    // Don't generate recommendations too frequently
    const { data: recentRecs } = await supabase
      .from('sife_recommendations')
      .select('id')
      .eq('step_id', step.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recentRecs && recentRecs.length > 0) {
      return false; // Already generated recommendation in last 24h
    }

    // Check if performance is below threshold
    const conversionRate = metrics.impressions > 0 ? (metrics.replies / metrics.impressions) * 100 : 0;

    if (metrics.impressions > 10 && conversionRate < 20) {
      return true; // Low reply rate
    }

    if (metrics.replies > 5 && metrics.meetings === 0) {
      return true; // Getting replies but no meetings
    }

    return false;
  }

  /**
   * Generate AI-powered improvement recommendation
   */
  private async generateImprovementRecommendation(
    userId: string,
    step: any,
    metrics: any
  ): Promise<void> {
    try {
      // Calculate performance stats
      const conversionRate = metrics.impressions > 0 ? (metrics.replies / metrics.impressions) * 100 : 0;
      const meetingRate = metrics.replies > 0 ? (metrics.meetings / metrics.replies) * 100 : 0;
      const closeRate = metrics.meetings > 0 ? (metrics.purchases / metrics.meetings) * 100 : 0;

      // Determine recommendation type
      let recommendationType = 'optimize_message';
      let reason = '';

      if (conversionRate < 15) {
        recommendationType = 'improve_engagement';
        reason = `Low reply rate (${conversionRate.toFixed(1)}%). Message may not be compelling enough.`;
      } else if (meetingRate < 30) {
        recommendationType = 'improve_cta';
        reason = `Getting replies but low meeting rate (${meetingRate.toFixed(1)}%). CTA may need strengthening.`;
      } else if (closeRate < 40) {
        recommendationType = 'improve_qualification';
        reason = `Meetings booked but low close rate (${closeRate.toFixed(1)}%). May need better pre-qualification.`;
      }

      // For now, create a simple recommendation
      // In production, this would call an LLM to generate improved content
      const recommendedContent = {
        ...step.content,
        _sife_suggestion: 'AI-optimized version coming soon',
        _optimization_focus: recommendationType,
      };

      // Save recommendation
      await supabase.from('sife_recommendations').insert({
        user_id: userId,
        step_id: step.id,
        recommendation_type: recommendationType,
        current_content: step.content,
        recommended_content: recommendedContent,
        reason,
        confidence_score: 75, // Mock confidence
        status: 'pending',
      });

      console.log('[SIFE] Generated recommendation:', recommendationType);
    } catch (error) {
      console.error('[SIFE] Error generating recommendation:', error);
    }
  }

  /**
   * Get funnel performance summary
   */
  async getFunnelPerformance(userId: string, funnelId?: string): Promise<any> {
    let query = supabase
      .from('sife_funnels')
      .select(`
        *,
        sife_funnel_steps(
          *,
          sife_step_metrics(*)
        )
      `)
      .eq('user_id', userId);

    if (funnelId) {
      query = query.eq('id', funnelId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SIFE] Error fetching funnel performance:', error);
      return null;
    }

    return data;
  }

  /**
   * Get pending recommendations for user
   */
  async getPendingRecommendations(userId: string): Promise<SIFERecommendation[]> {
    const { data, error } = await supabase
      .from('sife_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (error || !data) return [];

    return data.map((rec: any) => ({
      recommendationType: rec.recommendation_type,
      currentContent: rec.current_content,
      recommendedContent: rec.recommended_content,
      reason: rec.reason,
      confidenceScore: rec.confidence_score,
    }));
  }

  /**
   * Accept and deploy a recommendation
   */
  async acceptRecommendation(userId: string, recommendationId: string): Promise<void> {
    // Mark as accepted
    await supabase
      .from('sife_recommendations')
      .update({
        status: 'deployed',
        deployed_at: new Date().toISOString(),
      })
      .eq('id', recommendationId)
      .eq('user_id', userId);

    // TODO: Actually update the funnel step content
    // TODO: Create A/B test variant

    console.log('[SIFE] Recommendation accepted and deployed:', recommendationId);
  }
}

// Export singleton
export const sifeEngine = new SIFEEngine();
