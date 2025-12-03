import { supabase } from '../../lib/supabase';
import { energyEngineV2 } from './energyEngineV2';

/**
 * Energy Engine v3.0
 * Dynamic Token Cost Management
 * LLM token-aware energy system
 */

export interface TokenEstimate {
  estimated_tokens: number;
  energy_cost: number;
  spike_detected: boolean;
  compression_recommended: boolean;
  tier_limit_exceeded: boolean;
}

export interface TokenBudget {
  daily_limit: number;
  tokens_used_today: number;
  tokens_remaining: number;
  tokens_per_energy: number;
}

export interface CostPreview {
  feature: string;
  estimated_tokens: number;
  energy_cost: number;
  surge_multiplier: number;
  final_cost: number;
  warnings: string[];
}

class EnergyEngineV3 {
  /**
   * A. TOKEN ESTIMATOR
   */

  estimateTokens(
    prompt: string,
    attachments?: any[],
    context?: any
  ): number {
    let tokenCount = 0;

    // Base prompt tokens (rough estimate: 1 token ≈ 4 characters)
    tokenCount += Math.ceil(prompt.length / 4);

    // Attachments (images, files)
    if (attachments && attachments.length > 0) {
      attachments.forEach(attachment => {
        if (attachment.type === 'image') {
          tokenCount += 1000; // Images use ~1000 tokens
        } else if (attachment.type === 'document') {
          tokenCount += Math.ceil((attachment.size || 10000) / 4);
        }
      });
    }

    // Context tokens (conversation history, company data, etc.)
    if (context) {
      const contextStr = JSON.stringify(context);
      tokenCount += Math.ceil(contextStr.length / 4);
    }

    // Add safety margin (20%)
    tokenCount = Math.ceil(tokenCount * 1.2);

    return tokenCount;
  }

  async estimateTokensForFeature(
    userId: string,
    feature: string,
    inputData: any
  ): Promise<number> {
    // Get feature-specific estimate from database
    const { data: estimate } = await supabase
      .from('ai_cost_estimates')
      .select('*')
      .eq('feature', feature)
      .maybeSingle();

    if (!estimate) {
      // Fallback to basic estimation
      return this.estimateTokens(JSON.stringify(inputData));
    }

    let totalTokens = estimate.base_tokens;

    // Calculate based on input size
    if (Array.isArray(inputData)) {
      totalTokens += inputData.length * estimate.multiplier_per_item * estimate.avg_output_tokens;
    } else {
      const inputStr = JSON.stringify(inputData);
      totalTokens += Math.ceil(inputStr.length / 4) * estimate.multiplier_per_item;
    }

    // Apply complexity factor
    totalTokens *= estimate.complexity_factor;

    return Math.ceil(totalTokens);
  }

  /**
   * B. TOKEN → ENERGY MAPPING
   */

  async tokenToEnergy(userId: string, tokens: number): Promise<number> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    // Get tokens per energy for tier
    const { data: budget } = await supabase
      .from('token_budgets')
      .select('tokens_per_energy')
      .eq('tier', tier)
      .maybeSingle();

    if (!budget) {
      // Fallback: 1500 tokens = 1 energy
      return Math.ceil(tokens / 1500);
    }

    return Math.ceil(tokens / budget.tokens_per_energy);
  }

  /**
   * C. SPIKE DETECTOR
   */

  detectSpike(tokens: number, tier: string = 'free'): {
    level: 'normal' | 'large' | 'very_large';
    requiresConfirmation: boolean;
    warning: string;
  } {
    if (tokens > 10000) {
      return {
        level: 'very_large',
        requiresConfirmation: true,
        warning: 'This is a very large AI operation that will consume significant energy. Confirm to proceed.'
      };
    } else if (tokens > 5000) {
      return {
        level: 'large',
        requiresConfirmation: tier === 'free',
        warning: 'This is a large AI operation. It will use more energy than usual.'
      };
    }

    return {
      level: 'normal',
      requiresConfirmation: false,
      warning: ''
    };
  }

  /**
   * D. LLM COMPRESSION MODE
   */

  async shouldUseCompression(userId: string, estimatedTokens: number): Promise<boolean> {
    // Get user's current energy and budget
    const { data: energy } = await supabase
      .from('user_energy')
      .select('current_energy, tokens_used_today, daily_token_budget')
      .eq('user_id', userId)
      .maybeSingle();

    if (!energy) return false;

    // Get tier budget
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    const { data: budget } = await supabase
      .from('token_budgets')
      .select('compression_threshold')
      .eq('tier', tier)
      .maybeSingle();

    if (!budget) return false;

    // Use compression if:
    // 1. User is close to token budget
    // 2. Energy is low
    // 3. Estimated tokens are large

    const tokensRemaining = energy.daily_token_budget - energy.tokens_used_today;

    return (
      tokensRemaining < budget.compression_threshold ||
      energy.current_energy < 5 ||
      estimatedTokens > budget.compression_threshold
    );
  }

  applyCompression(prompt: string, targetReduction: number = 0.3): string {
    // Simple compression strategies:
    // 1. Remove extra whitespace
    let compressed = prompt.replace(/\s+/g, ' ').trim();

    // 2. Shorten instructions
    compressed = compressed.replace(
      /Please|Could you|I would like you to/gi,
      ''
    );

    // 3. Remove redundant phrases
    compressed = compressed.replace(
      /As mentioned before|As I said|Additionally|Furthermore/gi,
      ''
    );

    // 4. If still too long, truncate (keep first and last parts)
    const targetLength = Math.ceil(prompt.length * (1 - targetReduction));
    if (compressed.length > targetLength) {
      const keepStart = Math.floor(targetLength * 0.6);
      const keepEnd = Math.floor(targetLength * 0.4);
      compressed =
        compressed.substring(0, keepStart) +
        ' ... ' +
        compressed.substring(compressed.length - keepEnd);
    }

    return compressed;
  }

  /**
   * E. TIER TOKEN BUDGET
   */

  async getUserTokenBudget(userId: string): Promise<TokenBudget | null> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    const { data: budget } = await supabase
      .from('token_budgets')
      .select('*')
      .eq('tier', tier)
      .maybeSingle();

    if (!budget) return null;

    const { data: energy } = await supabase
      .from('user_energy')
      .select('tokens_used_today, daily_token_budget')
      .eq('user_id', userId)
      .maybeSingle();

    if (!energy) return null;

    return {
      daily_limit: budget.daily_token_limit,
      tokens_used_today: energy.tokens_used_today || 0,
      tokens_remaining: budget.daily_token_limit - (energy.tokens_used_today || 0),
      tokens_per_energy: budget.tokens_per_energy
    };
  }

  async checkTokenBudget(userId: string, estimatedTokens: number): Promise<{
    allowed: boolean;
    reason?: string;
    exceeded_by?: number;
  }> {
    const budget = await this.getUserTokenBudget(userId);

    if (!budget) {
      return { allowed: false, reason: 'Unable to fetch token budget' };
    }

    if (budget.tokens_remaining < estimatedTokens) {
      return {
        allowed: false,
        reason: 'Daily token limit exceeded',
        exceeded_by: estimatedTokens - budget.tokens_remaining
      };
    }

    return { allowed: true };
  }

  /**
   * F. TOKEN-AWARE AI WRAPPER
   */

  async runAICostAware(
    userId: string,
    feature: string,
    promptData: any,
    options: {
      allowCompression?: boolean;
      skipBudgetCheck?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    result?: any;
    error?: string;
    tokens_used?: number;
    energy_cost?: number;
  }> {
    try {
      // 1. Estimate tokens
      const estimatedTokens = await this.estimateTokensForFeature(
        userId,
        feature,
        promptData
      );

      // 2. Check token budget
      if (!options.skipBudgetCheck) {
        const budgetCheck = await this.checkTokenBudget(userId, estimatedTokens);
        if (!budgetCheck.allowed) {
          return {
            success: false,
            error: budgetCheck.reason
          };
        }
      }

      // 3. Detect spikes
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      const tier = profile?.subscription_tier || 'free';
      const spike = this.detectSpike(estimatedTokens, tier);

      if (spike.requiresConfirmation) {
        return {
          success: false,
          error: spike.warning
        };
      }

      // 4. Check if compression needed
      const useCompression =
        options.allowCompression &&
        (await this.shouldUseCompression(userId, estimatedTokens));

      // 5. Calculate energy cost
      const energyCost = await this.tokenToEnergy(userId, estimatedTokens);

      // 6. Apply surge pricing from v2
      const finalEnergyCost = await energyEngineV2.applySurgePricing(
        userId,
        feature,
        energyCost
      );

      // 7. Charge energy
      const charged = await energyEngineV2.chargeEnergyV2(
        userId,
        feature,
        finalEnergyCost
      );

      if (!charged) {
        return {
          success: false,
          error: 'Insufficient energy'
        };
      }

      // 8. Update token usage
      await this.recordTokenUsage(userId, feature, estimatedTokens, finalEnergyCost, {
        compression_mode: useCompression,
        spike_detected: spike.level !== 'normal'
      });

      return {
        success: true,
        result: {
          estimated_tokens: estimatedTokens,
          compression_used: useCompression
        },
        tokens_used: estimatedTokens,
        energy_cost: finalEnergyCost
      };
    } catch (error) {
      console.error('Error in runAICostAware:', error);
      return {
        success: false,
        error: 'Internal error'
      };
    }
  }

  /**
   * G. COST PREVIEW
   */

  async getCostPreview(
    userId: string,
    feature: string,
    inputData: any
  ): Promise<CostPreview> {
    const warnings: string[] = [];

    // Estimate tokens
    const estimatedTokens = await this.estimateTokensForFeature(
      userId,
      feature,
      inputData
    );

    // Calculate base energy cost
    const baseEnergyCost = await this.tokenToEnergy(userId, estimatedTokens);

    // Get surge multiplier
    const surgeMultiplier = await energyEngineV2.computeSurgeMultiplier(
      userId,
      feature
    );

    // Calculate final cost
    const finalCost = Math.ceil(baseEnergyCost * surgeMultiplier);

    // Check for warnings
    const budget = await this.getUserTokenBudget(userId);
    if (budget && estimatedTokens > budget.tokens_remaining * 0.5) {
      warnings.push('This will use over 50% of your remaining daily tokens');
    }

    const spike = this.detectSpike(estimatedTokens);
    if (spike.level !== 'normal') {
      warnings.push(spike.warning);
    }

    if (surgeMultiplier > 1.0) {
      warnings.push(
        `Surge pricing active: ${Math.round((surgeMultiplier - 1) * 100)}% increase`
      );
    }

    return {
      feature,
      estimated_tokens: estimatedTokens,
      energy_cost: baseEnergyCost,
      surge_multiplier: surgeMultiplier,
      final_cost: finalCost,
      warnings
    };
  }

  /**
   * HELPER FUNCTIONS
   */

  private async recordTokenUsage(
    userId: string,
    feature: string,
    tokens: number,
    energyCost: number,
    metadata: any = {}
  ): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    // Insert token usage record
    await supabase.from('token_usage').insert({
      user_id: userId,
      feature,
      input_tokens: Math.ceil(tokens * 0.4),
      output_tokens: Math.ceil(tokens * 0.6),
      energy_cost: energyCost,
      tier,
      compression_mode: metadata.compression_mode || false,
      spike_detected: metadata.spike_detected || false,
      estimated_tokens: tokens
    });

    // Update user's daily token usage
    await supabase.rpc('increment_token_usage', {
      p_user_id: userId,
      p_tokens: tokens
    }).catch(() => {
      // Fallback if function doesn't exist
      supabase
        .from('user_energy')
        .update({
          tokens_used_today: supabase.rpc('increment', { x: tokens })
        })
        .eq('user_id', userId);
    });
  }

  /**
   * PUBLIC API
   */

  async getTokenUsageStats(userId: string, days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('token_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (!data) return null;

    const totalTokens = data.reduce((sum, item) => sum + item.total_tokens, 0);
    const totalEnergyCost = data.reduce((sum, item) => sum + item.energy_cost, 0);

    return {
      total_tokens: totalTokens,
      total_energy_cost: totalEnergyCost,
      total_requests: data.length,
      avg_tokens_per_request: Math.ceil(totalTokens / data.length),
      by_feature: this.groupByFeature(data)
    };
  }

  private groupByFeature(data: any[]): any {
    return data.reduce((acc, item) => {
      if (!acc[item.feature]) {
        acc[item.feature] = {
          count: 0,
          tokens: 0,
          energy: 0
        };
      }
      acc[item.feature].count += 1;
      acc[item.feature].tokens += item.total_tokens;
      acc[item.feature].energy += item.energy_cost;
      return acc;
    }, {});
  }
}

export const energyEngineV3 = new EnergyEngineV3();
