import { supabase } from '../../lib/supabase';
import { energyEngineV4 } from './energyEngineV4';

/**
 * Energy Engine v5.0
 * Autonomous AI Cost Intelligence
 *
 * Features:
 * - Real-time token governor
 * - Auto prompt compression
 * - Global LLM load balancer
 * - Adaptive per-user pricing
 * - Multi-provider routing
 * - Predictive cost simulation
 * - Token debt detection
 * - Surge protection
 */

export type SystemLoadState = 'idle' | 'normal' | 'high' | 'surge' | 'panic';

export interface ClusterHealth {
  provider: string;
  model: string;
  status: 'healthy' | 'degraded' | 'overloaded' | 'failed';
  latency_ms: number;
  success_rate: number;
  cost_per_1k: number;
}

export interface UserPricingProfile {
  efficiency_rating: number;
  tier: string;
  surge_multiplier: number;
  weekly_usage: number;
  recommended_plan?: string;
  total_tokens_saved: number;
}

export interface CostSimulation {
  predicted_tokens: number;
  predicted_cost_usd: number;
  predicted_energy: number;
  scenario: string;
  confidence: number;
}

class EnergyEngineV5 {
  private readonly MAX_TOKENS_SOFT_LIMIT = 15000;
  private readonly MAX_TOKENS_HARD_LIMIT = 20000;
  private readonly COMPRESSION_THRESHOLD = 1200;

  private currentSystemLoad: SystemLoadState = 'normal';

  /**
   * LAYER 1: AI TOKEN GOVERNOR
   */

  async governTokenRequest(
    userId: string,
    feature: string,
    prompt: string,
    context?: any
  ): Promise<{
    allowed: boolean;
    modified_prompt?: string;
    reason?: string;
    action_taken?: string;
  }> {
    // Estimate tokens
    const estimatedTokens = this.estimateTokens(prompt, context);

    // Hard limit check
    if (estimatedTokens > this.MAX_TOKENS_HARD_LIMIT) {
      return {
        allowed: false,
        reason: `Request would use ${estimatedTokens} tokens (limit: ${this.MAX_TOKENS_HARD_LIMIT}). Please split your input.`,
        action_taken: 'blocked'
      };
    }

    // Soft limit with compression
    if (estimatedTokens > this.MAX_TOKENS_SOFT_LIMIT) {
      const compressed = await this.autoCompressPrompt(prompt, userId);
      return {
        allowed: true,
        modified_prompt: compressed,
        reason: `Large request compressed to save tokens`,
        action_taken: 'compressed'
      };
    }

    // Check user's personal limits
    const profile = await this.getUserPricingProfile(userId);
    if (profile && this.isUserOverBudget(profile, estimatedTokens)) {
      return {
        allowed: false,
        reason: 'Weekly token budget exceeded. Upgrade or wait for reset.',
        action_taken: 'budget_exceeded'
      };
    }

    // Check system load
    if (this.currentSystemLoad === 'surge' || this.currentSystemLoad === 'panic') {
      const compressed = await this.autoCompressPrompt(prompt, userId);
      return {
        allowed: true,
        modified_prompt: compressed,
        reason: 'System under high load - auto-compressed',
        action_taken: 'surge_compressed'
      };
    }

    return {
      allowed: true,
      action_taken: 'approved'
    };
  }

  /**
   * AUTO PROMPT COMPRESSION AI
   */

  async autoCompressPrompt(prompt: string, userId: string): Promise<string> {
    if (prompt.length < this.COMPRESSION_THRESHOLD) {
      return prompt;
    }

    // Check cache first
    const hash = this.hashPrompt(prompt);
    const { data: cached } = await supabase
      .from('prompt_rewrite_cache')
      .select('rewritten_prompt, compression_ratio')
      .eq('original_hash', hash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      // Update hit count
      await supabase
        .from('prompt_rewrite_cache')
        .update({
          hit_count: supabase.rpc('increment', { x: 1 }),
          last_used_at: new Date().toISOString()
        })
        .eq('original_hash', hash);

      return cached.rewritten_prompt;
    }

    // Compress using rule-based approach
    const compressed = this.compressPromptRuleBased(prompt);

    const compressionRatio = compressed.length / prompt.length;
    const tokensSaved = Math.ceil((prompt.length - compressed.length) / 4);

    // Cache the rewrite
    await supabase.from('prompt_rewrite_cache').insert({
      user_id: userId,
      original_hash: hash,
      rewritten_prompt: compressed,
      compression_ratio: compressionRatio,
      tokens_saved: tokensSaved
    });

    // Update user's saved tokens
    await this.updateUserTokensSaved(userId, tokensSaved);

    return compressed;
  }

  private compressPromptRuleBased(prompt: string): string {
    let compressed = prompt;

    // Remove redundant phrases
    compressed = compressed.replace(/Please|Could you|I would like you to|Kindly/gi, '');
    compressed = compressed.replace(/very|really|quite|just|simply|basically/gi, '');
    compressed = compressed.replace(/As mentioned before|As I said|Additionally|Furthermore|Moreover/gi, '');

    // Collapse whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Remove filler words
    compressed = compressed.replace(/\b(um|uh|like|you know|sort of|kind of)\b/gi, '');

    // Shorten common phrases
    compressed = compressed.replace(/in order to/gi, 'to');
    compressed = compressed.replace(/due to the fact that/gi, 'because');
    compressed = compressed.replace(/at this point in time/gi, 'now');

    // If still too long, keep first 60% and last 40%
    if (compressed.length > this.COMPRESSION_THRESHOLD * 1.5) {
      const keepStart = Math.floor(compressed.length * 0.6);
      const keepEnd = Math.floor(compressed.length * 0.4);
      compressed =
        compressed.substring(0, keepStart) +
        ' [content summarized] ' +
        compressed.substring(compressed.length - keepEnd);
    }

    return compressed;
  }

  /**
   * LAYER 2: GLOBAL LLM LOAD BALANCER
   */

  async chooseBestModel(params: {
    feature: string;
    promptLength: number;
    emotionalDepth: number;
    tier: string;
    userId: string;
    requireQuality?: boolean;
  }): Promise<{
    provider: string;
    model: string;
    reason: string;
    cost_per_1k: number;
  }> {
    const { feature, promptLength, emotionalDepth, tier, requireQuality } = params;

    // Get current cluster health
    const { data: clusters } = await supabase
      .from('ai_cluster_status')
      .select('*')
      .in('status', ['healthy', 'degraded'])
      .order('latency_ms', { ascending: true });

    if (!clusters || clusters.length === 0) {
      // Fallback
      return {
        provider: 'openai',
        model: 'gpt-4o-mini',
        reason: 'no_healthy_clusters_fallback',
        cost_per_1k: 0.00015
      };
    }

    // Filter by system load
    let availableClusters = clusters;
    if (this.currentSystemLoad === 'surge' || this.currentSystemLoad === 'panic') {
      // Force cheapest models during surge
      availableClusters = clusters.filter(c => c.cost_per_1k_input < 0.0005);
    }

    // Routing logic

    // Free tier → cheapest only
    if (tier === 'free') {
      const cheapest = availableClusters.reduce((min, c) =>
        c.cost_per_1k_input < min.cost_per_1k_input ? c : min
      );
      return {
        provider: cheapest.provider,
        model: cheapest.model,
        reason: 'free_tier_cheapest',
        cost_per_1k: cheapest.cost_per_1k_input
      };
    }

    // High emotional depth → quality model
    if (emotionalDepth > 0.7 || requireQuality) {
      const qualityModels = availableClusters.filter(c =>
        c.model.includes('4o') || c.model.includes('opus') || c.model.includes('sonnet')
      );
      if (qualityModels.length > 0) {
        const best = qualityModels[0];
        return {
          provider: best.provider,
          model: best.model,
          reason: 'high_quality_required',
          cost_per_1k: best.cost_per_1k_input
        };
      }
    }

    // Complex features → better models
    if (
      feature === 'ai_pitchdeck' ||
      feature === 'ai_coaching' ||
      feature === 'company_crawler'
    ) {
      const goodModels = availableClusters.filter(c =>
        c.model.includes('4o') || c.model.includes('sonnet')
      );
      if (goodModels.length > 0) {
        return {
          provider: goodModels[0].provider,
          model: goodModels[0].model,
          reason: 'complex_feature',
          cost_per_1k: goodModels[0].cost_per_1k_input
        };
      }
    }

    // Groq for speed (if available)
    if (promptLength < 4000) {
      const groqModels = availableClusters.filter(c => c.provider === 'groq');
      if (groqModels.length > 0 && groqModels[0].status === 'healthy') {
        return {
          provider: groqModels[0].provider,
          model: groqModels[0].model,
          reason: 'groq_fast_inference',
          cost_per_1k: groqModels[0].cost_per_1k_input
        };
      }
    }

    // Default: best balance of cost/latency/quality
    const balanced = availableClusters.filter(c =>
      c.cost_per_1k_input < 0.001 &&
      c.latency_ms < 2000 &&
      c.success_rate > 0.9
    );

    if (balanced.length > 0) {
      return {
        provider: balanced[0].provider,
        model: balanced[0].model,
        reason: 'balanced_selection',
        cost_per_1k: balanced[0].cost_per_1k_input
      };
    }

    // Final fallback
    return {
      provider: availableClusters[0].provider,
      model: availableClusters[0].model,
      reason: 'fallback_available',
      cost_per_1k: availableClusters[0].cost_per_1k_input
    };
  }

  /**
   * LAYER 3: ADAPTIVE PER-USER PRICING
   */

  async calculateDynamicEnergyCost(
    userId: string,
    tokens: number,
    model: string
  ): Promise<number> {
    const { data } = await supabase.rpc('calculate_dynamic_energy_cost', {
      p_user_id: userId,
      p_base_tokens: tokens,
      p_model: model
    });

    return data || Math.ceil(tokens / 1500);
  }

  async getUserPricingProfile(userId: string): Promise<UserPricingProfile | null> {
    const { data } = await supabase
      .from('user_ai_pricing_profile')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return null;

    return {
      efficiency_rating: data.efficiency_rating,
      tier: data.tier,
      surge_multiplier: data.surge_multiplier,
      weekly_usage: data.weekly_usage,
      recommended_plan: data.recommended_plan,
      total_tokens_saved: data.total_tokens_saved
    };
  }

  async predictCost(
    userId: string,
    feature: string,
    prompt: string
  ): Promise<CostSimulation> {
    const tokens = this.estimateTokens(prompt);
    const profile = await this.getUserPricingProfile(userId);

    const model = await this.chooseBestModel({
      feature,
      promptLength: prompt.length,
      emotionalDepth: this.estimateEmotionalComplexity(prompt),
      tier: profile?.tier || 'free',
      userId
    });

    const energyCost = await this.calculateDynamicEnergyCost(userId, tokens, model.model);
    const costUSD = (tokens / 1000) * model.cost_per_1k;

    // Calculate confidence based on user history
    const confidence = profile ?
      Math.min(0.95, 0.5 + (profile.efficiency_rating * 0.5)) :
      0.6;

    return {
      predicted_tokens: tokens,
      predicted_cost_usd: costUSD,
      predicted_energy: energyCost,
      scenario: 'normal',
      confidence
    };
  }

  /**
   * SYSTEM HEALTH & MONITORING
   */

  async updateSystemLoad(loadPercent: number): Promise<void> {
    let newState: SystemLoadState = 'normal';

    if (loadPercent < 20) newState = 'idle';
    else if (loadPercent < 60) newState = 'normal';
    else if (loadPercent < 80) newState = 'high';
    else if (loadPercent < 95) newState = 'surge';
    else newState = 'panic';

    if (newState !== this.currentSystemLoad) {
      // Log state change
      await supabase.from('system_load_events').insert({
        load_state: newState,
        system_load_percent: loadPercent,
        actions_taken: {
          previous_state: this.currentSystemLoad,
          timestamp: new Date().toISOString()
        }
      });

      this.currentSystemLoad = newState;
    }
  }

  getSystemLoad(): SystemLoadState {
    return this.currentSystemLoad;
  }

  async updateClusterHealth(
    provider: string,
    model: string,
    latencyMs: number,
    success: boolean
  ): Promise<void> {
    await supabase.rpc('update_cluster_health', {
      p_provider: provider,
      p_model: model,
      p_latency_ms: latencyMs,
      p_success: success
    });
  }

  async getHealthyClusters(): Promise<ClusterHealth[]> {
    const { data } = await supabase
      .from('ai_cluster_status')
      .select('*')
      .in('status', ['healthy', 'degraded'])
      .order('success_rate', { ascending: false });

    if (!data) return [];

    return data.map(c => ({
      provider: c.provider,
      model: c.model,
      status: c.status,
      latency_ms: c.latency_ms,
      success_rate: c.success_rate,
      cost_per_1k: c.cost_per_1k_input
    }));
  }

  /**
   * TOKEN DEBT & BUDGET MANAGEMENT
   */

  async checkTokenDebt(userId: string): Promise<{
    has_debt: boolean;
    debt_tokens?: number;
    debt_cost_usd?: number;
  }> {
    const { data } = await supabase
      .from('token_debt_tracker')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!data || data.debt_tokens <= 0) {
      return { has_debt: false };
    }

    return {
      has_debt: true,
      debt_tokens: data.debt_tokens,
      debt_cost_usd: parseFloat(data.debt_cost_usd)
    };
  }

  async recordTokenDebt(
    userId: string,
    tokens: number,
    costUSD: number,
    reason: string
  ): Promise<void> {
    await supabase.from('token_debt_tracker').insert({
      user_id: userId,
      debt_tokens: tokens,
      debt_cost_usd: costUSD,
      overspend_reason: reason,
      status: 'active'
    });
  }

  private isUserOverBudget(profile: UserPricingProfile, additionalTokens: number): boolean {
    const weeklyLimits: Record<string, number> = {
      free: 10000,
      pro: 500000, // Elite removed, Pro gets unlimited credits
      enterprise: 10000000
    };

    const limit = weeklyLimits[profile.tier] || 10000;
    return (profile.weekly_usage + additionalTokens) > limit;
  }

  /**
   * HELPER FUNCTIONS
   */

  private estimateTokens(prompt: string, context?: any): number {
    let tokens = Math.ceil(prompt.length / 4);

    if (context) {
      const contextStr = JSON.stringify(context);
      tokens += Math.ceil(contextStr.length / 4);
    }

    tokens += 200; // System overhead
    tokens *= 2.5; // Output estimate

    return Math.ceil(tokens);
  }

  private estimateEmotionalComplexity(text: string): number {
    const emotionalWords = [
      'feel', 'emotion', 'heart', 'passion', 'story',
      'journey', 'struggle', 'overcome', 'inspire', 'dream',
      'believe', 'hope', 'fear', 'love', 'trust'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const matches = words.filter(word =>
      emotionalWords.some(ew => word.includes(ew))
    );

    return Math.min(matches.length / 15, 1.0);
  }

  private hashPrompt(prompt: string): string {
    const sample = prompt.substring(0, 200);
    return Buffer.from(sample).toString('base64').substring(0, 32);
  }

  private async updateUserTokensSaved(userId: string, tokens: number): Promise<void> {
    await supabase
      .from('user_ai_pricing_profile')
      .update({
        total_tokens_saved: supabase.rpc('increment', { x: tokens })
      })
      .eq('user_id', userId);
  }

  /**
   * COST SIMULATION & FORECASTING
   */

  async simulateWeeklyCost(
    userId: string
  ): Promise<{
    best_case: CostSimulation;
    normal_case: CostSimulation;
    worst_case: CostSimulation;
  }> {
    const profile = await this.getUserPricingProfile(userId);
    const avgDailyTokens = profile ? Math.ceil(profile.weekly_usage / 7) : 1000;

    // Best case: high efficiency, good compression
    const bestTokens = Math.ceil(avgDailyTokens * 7 * 0.7);
    const bestCost = (bestTokens / 1000) * 0.0002;
    const bestEnergy = Math.ceil(bestTokens / 2000);

    // Normal case
    const normalTokens = avgDailyTokens * 7;
    const normalCost = (normalTokens / 1000) * 0.0003;
    const normalEnergy = Math.ceil(normalTokens / 1500);

    // Worst case: no compression, peak usage
    const worstTokens = Math.ceil(avgDailyTokens * 7 * 1.5);
    const worstCost = (worstTokens / 1000) * 0.0005;
    const worstEnergy = Math.ceil(worstTokens / 1000);

    return {
      best_case: {
        predicted_tokens: bestTokens,
        predicted_cost_usd: bestCost,
        predicted_energy: bestEnergy,
        scenario: 'optimistic',
        confidence: 0.7
      },
      normal_case: {
        predicted_tokens: normalTokens,
        predicted_cost_usd: normalCost,
        predicted_energy: normalEnergy,
        scenario: 'normal',
        confidence: 0.9
      },
      worst_case: {
        predicted_tokens: worstTokens,
        predicted_cost_usd: worstCost,
        predicted_energy: worstEnergy,
        scenario: 'pessimistic',
        confidence: 0.6
      }
    };
  }
}

export const energyEngineV5 = new EnergyEngineV5();
