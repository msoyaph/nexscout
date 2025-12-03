/**
 * A/B Testing Engine
 *
 * Create, manage, and analyze experiments with variant assignment
 */

import { supabase } from '../../lib/supabase';

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  experiment_type: 'cta_text' | 'layout' | 'flow' | 'feature' | 'pricing';
  target_page?: string;
  target_element?: string;
  goal_metric: 'conversion' | 'engagement' | 'retention' | 'revenue';
  goal_target?: number;
  status: 'draft' | 'running' | 'paused' | 'completed';
  confidence_level: number;
  winner_variant_id?: string;
}

export interface Variant {
  id: string;
  experiment_id: string;
  variant_name: string;
  variant_config: Record<string, any>;
  traffic_allocation: number;
  is_control: boolean;
}

export interface ExperimentResults {
  experiment_id: string;
  variant_id: string;
  variant_name: string;
  users_assigned: number;
  goal_completions: number;
  conversion_rate: number;
  avg_time_to_goal_seconds?: number;
  revenue_generated: number;
  statistical_significance: number;
  is_winner: boolean;
}

class ABTestingEngine {
  /**
   * Create new experiment
   */
  async createExperiment(experiment: Omit<Experiment, 'id' | 'status'>): Promise<string> {
    const { data, error } = await supabase
      .from('experiment_definitions')
      .insert({
        name: experiment.name,
        description: experiment.description,
        hypothesis: experiment.hypothesis,
        experiment_type: experiment.experiment_type,
        target_page: experiment.target_page,
        target_element: experiment.target_element,
        goal_metric: experiment.goal_metric,
        goal_target: experiment.goal_target,
        confidence_level: experiment.confidence_level || 95,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to create experiment: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Add variant to experiment
   */
  async addVariant(
    experimentId: string,
    variantName: string,
    variantConfig: Record<string, any>,
    trafficAllocation: number,
    isControl: boolean = false
  ): Promise<string> {
    const { data, error } = await supabase
      .from('experiment_variants')
      .insert({
        experiment_id: experimentId,
        variant_name: variantName,
        variant_config: variantConfig,
        traffic_allocation: trafficAllocation,
        is_control: isControl,
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Failed to add variant: ${error?.message}`);
    }

    return data.id;
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    await supabase
      .from('experiment_definitions')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .eq('id', experimentId);
  }

  /**
   * Stop experiment
   */
  async stopExperiment(experimentId: string): Promise<void> {
    await supabase
      .from('experiment_definitions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', experimentId);
  }

  /**
   * Assign user to variant
   */
  async assignUserToVariant(experimentId: string, userId: string): Promise<Variant | null> {
    // Check if already assigned
    const { data: existing } = await supabase
      .from('experiment_assignments')
      .select('variant_id, experiment_variants!inner(*)')
      .eq('experiment_id', experimentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return (existing as any).experiment_variants;
    }

    // Get variants
    const { data: variants } = await supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', experimentId);

    if (!variants || variants.length === 0) return null;

    // Assign based on traffic allocation (deterministic hash)
    const variant = this.selectVariant(userId, variants);

    // Record assignment
    await supabase.from('experiment_assignments').insert({
      experiment_id: experimentId,
      variant_id: variant.id,
      user_id: userId,
    });

    return variant;
  }

  /**
   * Track goal completion
   */
  async trackGoalCompletion(
    experimentId: string,
    userId: string,
    revenue?: number
  ): Promise<void> {
    // Get user's variant
    const { data: assignment } = await supabase
      .from('experiment_assignments')
      .select('variant_id')
      .eq('experiment_id', experimentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!assignment) return;

    // Update results
    const { data: existing } = await supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', experimentId)
      .eq('variant_id', assignment.variant_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('experiment_results')
        .update({
          goal_completions: existing.goal_completions + 1,
          revenue_generated: existing.revenue_generated + (revenue || 0),
          conversion_rate: ((existing.goal_completions + 1) / existing.users_assigned) * 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    }
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResults[]> {
    // Get variants
    const { data: variants } = await supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', experimentId);

    if (!variants) return [];

    const results: ExperimentResults[] = [];

    for (const variant of variants) {
      // Get assignments count
      const { count: assignmentsCount } = await supabase
        .from('experiment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experimentId)
        .eq('variant_id', variant.id);

      // Get results
      const { data: result } = await supabase
        .from('experiment_results')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('variant_id', variant.id)
        .maybeSingle();

      const usersAssigned = assignmentsCount || 0;
      const goalCompletions = result?.goal_completions || 0;
      const conversionRate = usersAssigned > 0 ? (goalCompletions / usersAssigned) * 100 : 0;

      results.push({
        experiment_id: experimentId,
        variant_id: variant.id,
        variant_name: variant.variant_name,
        users_assigned: usersAssigned,
        goal_completions: goalCompletions,
        conversion_rate: conversionRate,
        avg_time_to_goal_seconds: result?.avg_time_to_goal_seconds,
        revenue_generated: result?.revenue_generated || 0,
        statistical_significance: result?.statistical_significance || 0,
        is_winner: false,
      });
    }

    // Calculate statistical significance
    if (results.length > 1) {
      const control = results.find(r => variants.find(v => v.id === r.variant_id)?.is_control);
      if (control) {
        results.forEach(result => {
          if (result.variant_id !== control.variant_id) {
            result.statistical_significance = this.calculateSignificance(control, result);
          }
        });
      }
    }

    // Determine winner
    const winner = results.reduce((max, r) =>
      r.conversion_rate > max.conversion_rate ? r : max
    );
    if (winner) winner.is_winner = true;

    return results;
  }

  /**
   * Apply winning variant
   */
  async applyWinner(experimentId: string, winnerVariantId: string): Promise<void> {
    await supabase
      .from('experiment_definitions')
      .update({
        winner_variant_id: winnerVariantId,
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', experimentId);

    // Set winner to 100% traffic
    await supabase
      .from('experiment_variants')
      .update({ traffic_allocation: 100 })
      .eq('id', winnerVariantId);

    await supabase
      .from('experiment_variants')
      .update({ traffic_allocation: 0 })
      .eq('experiment_id', experimentId)
      .neq('id', winnerVariantId);
  }

  /**
   * Auto-generate experiment suggestions based on funnel drops
   */
  async generateExperimentSuggestions(): Promise<any[]> {
    const suggestions = [];

    // This would analyze funnel data and UX recommendations
    // to suggest experiments. Simplified version:

    suggestions.push({
      name: 'Paywall CTA Text Test',
      experiment_type: 'cta_text',
      target_page: 'pricing',
      target_element: 'upgrade-button',
      hypothesis: 'Action-oriented CTA will increase conversions',
      variants: [
        { name: 'Control', config: { button_text: 'Upgrade Now' }, is_control: true },
        { name: 'Variant A', config: { button_text: 'Start Free Trial' } },
        { name: 'Variant B', config: { button_text: 'Unlock All Features' } },
      ],
    });

    return suggestions;
  }

  /**
   * Get active experiments
   */
  async getActiveExperiments(): Promise<Experiment[]> {
    const { data } = await supabase
      .from('experiment_definitions')
      .select('*')
      .eq('status', 'running')
      .order('started_at', { ascending: false });

    return (data || []) as Experiment[];
  }

  /**
   * Select variant based on traffic allocation
   */
  private selectVariant(userId: string, variants: Variant[]): Variant {
    // Deterministic hash of user ID
    const hash = this.hashString(userId);
    const randomValue = (hash % 100) / 100; // 0-1

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.traffic_allocation / 100;
      if (randomValue <= cumulative) {
        return variant;
      }
    }

    return variants[0]; // Fallback
  }

  /**
   * Calculate statistical significance
   */
  private calculateSignificance(control: ExperimentResults, variant: ExperimentResults): number {
    // Simplified z-test for proportions
    const p1 = control.conversion_rate / 100;
    const p2 = variant.conversion_rate / 100;
    const n1 = control.users_assigned;
    const n2 = variant.users_assigned;

    if (n1 === 0 || n2 === 0) return 0;

    const pPool = (control.goal_completions + variant.goal_completions) / (n1 + n2);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));

    if (se === 0) return 0;

    const zScore = Math.abs(p2 - p1) / se;
    const significance = this.normalCDF(zScore);

    return Math.round((1 - significance) * 100);
  }

  /**
   * Normal CDF (cumulative distribution function)
   */
  private normalCDF(z: number): number {
    return (1 + this.erf(z / Math.sqrt(2))) / 2;
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const abTestingEngine = new ABTestingEngine();
