/**
 * The President - Master AI Orchestrator
 * Central command system for all AI engine requests
 */

import { supabase } from '../../lib/supabase';
import type {
  EngineExecutionRequest,
  EngineExecutionResult,
  PresidentialDecision,
  ResourceAllocation,
  SubscriptionTier,
} from '../types/government';
import { PERMISSIONS_MATRICES, GOVERNOR_REGISTRY } from '../config/governmentConfig';
import { energyEngineV5 } from '../../services/energy/energyEngineV5';

export class MasterOrchestrator {
  private static instance: MasterOrchestrator;
  private requestQueue: Map<string, EngineExecutionRequest> = new Map();

  private constructor() {}

  static getInstance(): MasterOrchestrator {
    if (!MasterOrchestrator.instance) {
      MasterOrchestrator.instance = new MasterOrchestrator();
    }
    return MasterOrchestrator.instance;
  }

  /**
   * Main entry point for all AI engine requests
   * Routes through Presidential decision-making process
   */
  async executeRequest(request: EngineExecutionRequest): Promise<EngineExecutionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Make presidential decision
      const decision = await this.makePresidentialDecision(request);

      // Step 2: Log decision
      await this.logDecision(decision);

      // Step 3: If denied, return early
      if (decision.decision_type === 'deny') {
        return {
          request_id: request.request_id,
          engine: request.engine,
          status: 'blocked',
          error: decision.reasoning,
          tokens_used: 0,
          cost_usd: 0,
          energy_consumed: 0,
          execution_time_ms: Date.now() - startTime,
          model_used: 'none',
          violations: [decision.reasoning],
        };
      }

      // Step 4: Check resource allocation
      const resources = await this.checkResourceAllocation(request.user_id);
      if (resources.available_energy < decision.cost_estimate.energy) {
        return {
          request_id: request.request_id,
          engine: request.engine,
          status: 'blocked',
          error: 'Insufficient energy',
          tokens_used: 0,
          cost_usd: 0,
          energy_consumed: 0,
          execution_time_ms: Date.now() - startTime,
          model_used: 'none',
          violations: ['Energy quota exceeded'],
        };
      }

      // Step 5: Execute the approved request
      // NOTE: Actual engine execution would happen here
      // For now, we return a simulated result
      const result: EngineExecutionResult = {
        request_id: request.request_id,
        engine: decision.selected_engine || request.engine,
        status: 'success',
        result: { message: 'Execution approved by President', decision },
        tokens_used: decision.cost_estimate.tokens,
        cost_usd: (decision.cost_estimate.tokens / 1000) * 0.0003,
        energy_consumed: decision.cost_estimate.energy,
        execution_time_ms: Date.now() - startTime,
        model_used: decision.selected_model || 'gpt-4o-mini',
        violations: [],
      };

      // Step 6: Deduct resources
      await this.deductResources(request.user_id, result.energy_consumed, result.cost_usd);

      // Step 7: Update engine health
      await this.updateEngineHealth(result.engine, result.execution_time_ms, result.status === 'success');

      return result;
    } catch (error) {
      console.error('Master Orchestrator error:', error);
      return {
        request_id: request.request_id,
        engine: request.engine,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
        tokens_used: 0,
        cost_usd: 0,
        energy_consumed: 0,
        execution_time_ms: Date.now() - startTime,
        model_used: 'none',
      };
    }
  }

  /**
   * Presidential decision-making logic
   */
  private async makePresidentialDecision(
    request: EngineExecutionRequest
  ): Promise<PresidentialDecision> {
    const startTime = Date.now();

    // Get user tier and permissions
    const permissions = PERMISSIONS_MATRICES[request.user_tier];

    // Check if engine is allowed for this tier
    const engineAccess = permissions.engines[request.engine];
    if (!engineAccess || !engineAccess.enabled) {
      return {
        request_id: request.request_id,
        user_id: request.user_id,
        feature: request.feature,
        decision_type: 'deny',
        reasoning: `Engine ${request.engine} not available for ${request.user_tier} tier`,
        cost_estimate: { energy: 0, tokens: 0 },
        timestamp: new Date(),
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Check feature access
    const featureAccess = permissions.features[request.feature];
    if (featureAccess && !featureAccess.enabled) {
      return {
        request_id: request.request_id,
        user_id: request.user_id,
        feature: request.feature,
        decision_type: 'deny',
        reasoning: featureAccess.upgrade_prompt || `Feature ${request.feature} requires upgrade`,
        cost_estimate: { energy: 0, tokens: 0 },
        timestamp: new Date(),
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Estimate tokens from payload
    const estimatedTokens = this.estimateTokens(request.payload, request.max_tokens);

    // Check token limits
    if (engineAccess.max_tokens_per_request && estimatedTokens > engineAccess.max_tokens_per_request) {
      return {
        request_id: request.request_id,
        user_id: request.user_id,
        feature: request.feature,
        decision_type: 'deny',
        reasoning: `Request exceeds token limit for ${request.user_tier} tier (${estimatedTokens} > ${engineAccess.max_tokens_per_request})`,
        cost_estimate: { energy: 0, tokens: estimatedTokens },
        timestamp: new Date(),
        execution_time_ms: Date.now() - startTime,
      };
    }

    // Select best model using Energy Engine V5
    let selectedModel = 'gpt-4o-mini';
    try {
      const modelChoice = await energyEngineV5.chooseBestModel({
        feature: request.feature,
        promptLength: JSON.stringify(request.payload).length,
        emotionalDepth: 0.5,
        tier: request.user_tier,
        userId: request.user_id,
        requireQuality: request.require_quality,
      });
      selectedModel = modelChoice.model;
    } catch (error) {
      console.warn('Model selection failed, using default:', error);
    }

    // Calculate energy cost
    const energyCost = Math.ceil(estimatedTokens / 1500);

    // Approve the request
    return {
      request_id: request.request_id,
      user_id: request.user_id,
      feature: request.feature,
      decision_type: 'approve',
      selected_engine: request.engine,
      selected_model: selectedModel,
      reasoning: `Approved for ${request.user_tier} tier with ${engineAccess.quality_tier} quality`,
      cost_estimate: {
        energy: energyCost,
        tokens: estimatedTokens,
      },
      timestamp: new Date(),
      execution_time_ms: Date.now() - startTime,
    };
  }

  /**
   * Log presidential decision to database
   */
  private async logDecision(decision: PresidentialDecision): Promise<void> {
    try {
      await supabase.from('government_decisions').insert({
        request_id: decision.request_id,
        user_id: decision.user_id,
        feature: decision.feature,
        decision_type: decision.decision_type,
        selected_engine: decision.selected_engine,
        selected_model: decision.selected_model,
        reasoning: decision.reasoning,
        cost_estimate: decision.cost_estimate,
        execution_time_ms: decision.execution_time_ms,
        timestamp: decision.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to log decision:', error);
    }
  }

  /**
   * Check user's resource allocation
   */
  private async checkResourceAllocation(userId: string): Promise<ResourceAllocation> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      const { data: energy } = await supabase
        .from('user_energy')
        .select('current_energy')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: wallet } = await supabase
        .from('user_wallet')
        .select('coin_balance')
        .eq('user_id', userId)
        .maybeSingle();

      const tier = (profile?.subscription_tier || 'free') as SubscriptionTier;

      return {
        user_id: userId,
        available_energy: energy?.current_energy || 0,
        available_coins: wallet?.coin_balance || 0,
        weekly_token_quota: this.getWeeklyTokenQuota(tier),
        tokens_used_this_week: 0, // TODO: Calculate from logs
        tier,
        surge_multiplier: 1.0,
      };
    } catch (error) {
      console.error('Failed to check resources:', error);
      return {
        user_id: userId,
        available_energy: 0,
        available_coins: 0,
        weekly_token_quota: 10000,
        tokens_used_this_week: 0,
        tier: 'free',
        surge_multiplier: 1.0,
      };
    }
  }

  /**
   * Deduct resources after execution
   */
  private async deductResources(userId: string, energy: number, costUsd: number): Promise<void> {
    try {
      // Deduct energy
      await supabase.rpc('deduct_energy', {
        p_user_id: userId,
        p_amount: energy,
      });

      // Log energy transaction
      await supabase.from('energy_transactions').insert({
        user_id: userId,
        transaction_type: 'deduction',
        amount: energy,
        reason: 'AI engine execution',
        balance_after: 0, // Will be updated by trigger
      });
    } catch (error) {
      console.error('Failed to deduct resources:', error);
    }
  }

  /**
   * Update engine health metrics
   */
  private async updateEngineHealth(
    engineId: string,
    responseTimeMs: number,
    success: boolean
  ): Promise<void> {
    try {
      const { data: current } = await supabase
        .from('government_engine_health')
        .select('*')
        .eq('engine_id', engineId)
        .maybeSingle();

      if (current) {
        // Update metrics (simplified rolling average)
        const newAvgResponseTime =
          (current.avg_response_time_ms * 0.9 + responseTimeMs * 0.1);
        const newSuccessRate = success
          ? Math.min(1.0, current.success_rate * 0.95 + 0.05)
          : current.success_rate * 0.95;

        await supabase
          .from('government_engine_health')
          .update({
            avg_response_time_ms: newAvgResponseTime,
            success_rate: newSuccessRate,
            last_execution: new Date().toISOString(),
            last_health_check: new Date().toISOString(),
            status: newSuccessRate > 0.9 ? 'healthy' : newSuccessRate > 0.7 ? 'degraded' : 'failed',
          })
          .eq('engine_id', engineId);
      }
    } catch (error) {
      console.error('Failed to update engine health:', error);
    }
  }

  /**
   * Estimate tokens from payload
   */
  private estimateTokens(payload: any, maxTokens?: number): number {
    const payloadStr = JSON.stringify(payload);
    let estimated = Math.ceil(payloadStr.length / 4);

    // Add overhead
    estimated += 200; // System prompt overhead
    estimated *= 2.5; // Output estimation

    // Apply max limit if specified
    if (maxTokens && estimated > maxTokens) {
      estimated = maxTokens;
    }

    return Math.ceil(estimated);
  }

  /**
   * Get weekly token quota by tier
   */
  private getWeeklyTokenQuota(tier: SubscriptionTier): number {
    const quotas: Record<SubscriptionTier, number> = {
      free: 10000,
      pro: 100000,
      elite: 500000,
      enterprise: 10000000,
    };
    return quotas[tier];
  }

  /**
   * Resolve conflict between engines
   */
  async resolveConflict(
    engine1: string,
    engine2: string,
    conflictType: string,
    description: string
  ): Promise<string> {
    const conflictId = `conflict_${Date.now()}`;

    try {
      // Log the conflict
      await supabase.from('government_conflicts').insert({
        conflict_id: conflictId,
        conflict_type: conflictType,
        involved_parties: [engine1, engine2],
        description,
        resolved_by: 'president',
        resolution: `Presidential arbitration: Priority given to ${engine1}`,
        timestamp: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      });

      return `Conflict ${conflictId} resolved: ${engine1} takes precedence`;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return 'Conflict resolution failed';
    }
  }

  /**
   * Issue emergency order
   */
  async issueEmergencyOrder(
    orderType: 'shutdown' | 'rollback' | 'surge_protection' | 'maintenance_mode',
    reason: string,
    affectedComponents: string[],
    durationMinutes?: number
  ): Promise<void> {
    const actionId = `emergency_${Date.now()}`;

    try {
      await supabase.from('government_emergency_events').insert({
        action_id: actionId,
        action_type: orderType,
        triggered_by: 'president',
        reason,
        affected_components: affectedComponents,
        duration_minutes: durationMinutes,
        timestamp: new Date().toISOString(),
      });

      console.log(`Emergency order issued: ${orderType} - ${reason}`);
    } catch (error) {
      console.error('Failed to issue emergency order:', error);
    }
  }

  /**
   * Get system health overview
   */
  async getSystemHealth(): Promise<any> {
    try {
      const { data: engines } = await supabase
        .from('government_engine_health')
        .select('status, department');

      const { data: violations } = await supabase
        .from('government_violations')
        .select('resolved')
        .eq('resolved', false);

      const { data: emergencies } = await supabase
        .from('government_emergency_events')
        .select('*')
        .is('ended_at', null);

      const enginesByStatus = engines?.reduce(
        (acc, e) => {
          acc[e.status] = (acc[e.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

      return {
        overall_health_score: this.calculateOverallHealth(enginesByStatus),
        total_engines: engines?.length || 0,
        healthy_engines: enginesByStatus.healthy || 0,
        degraded_engines: enginesByStatus.degraded || 0,
        failed_engines: enginesByStatus.failed || 0,
        active_violations: violations?.length || 0,
        active_emergencies: emergencies?.length || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
    }
  }

  private calculateOverallHealth(enginesByStatus: Record<string, number>): number {
    const total = Object.values(enginesByStatus).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 100;

    const healthy = enginesByStatus.healthy || 0;
    const degraded = enginesByStatus.degraded || 0;

    return Math.round(((healthy + degraded * 0.5) / total) * 100);
  }
}

// Export singleton instance
export const masterOrchestrator = MasterOrchestrator.getInstance();
