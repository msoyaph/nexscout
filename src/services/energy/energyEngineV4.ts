import { supabase } from '../../lib/supabase';
import { energyEngineV2 } from './energyEngineV2';
import { energyEngineV3 } from './energyEngineV3';
import crypto from 'crypto';

/**
 * Energy Engine v4.0
 * Intelligent Model Switching + Load Balancing + Predictive Costing
 * Personalized Efficiency Learning
 */

export interface ModelSelection {
  model: string;
  reason: string;
  estimated_cost: number;
  estimated_tokens: number;
  mode: 'auto' | 'fast' | 'pro' | 'expert' | 'panic';
}

export interface CostPrediction {
  predicted_tokens: number;
  predicted_cost_usd: number;
  predicted_energy: number;
  recommended_model: string;
  warnings: string[];
  allow_proceed: boolean;
}

export interface EfficiencyProfile {
  rating: number;
  preferred_mode: string;
  avg_tokens: number;
  total_saved: number;
  cache_hit_rate: number;
}

class EnergyEngineV4 {
  private readonly MAX_TOKENS_THRESHOLD = 20000;
  private readonly PANIC_MODE_THRESHOLD = 15000;

  /**
   * A. MODEL ROUTER - Smart LLM Selection
   */

  async chooseModel(params: {
    feature: string;
    promptLength: number;
    emotionalComplexity: number;
    tier: string;
    userId: string;
    mode?: string;
  }): Promise<ModelSelection> {
    const { feature, promptLength, emotionalComplexity, tier, userId, mode } = params;

    // Get user's efficiency profile
    const profile = await this.getEfficiencyProfile(userId);
    const userMode = mode || profile?.preferred_mode || 'auto';

    // Panic mode check (system overload)
    if (this.isSystemOverloaded()) {
      return this.selectCheapestModel('panic_mode');
    }

    // Manual mode selection (Elite users)
    if (userMode === 'expert' && (tier === 'pro' || tier === 'enterprise')) {
      return this.selectModel('gpt-4o', 'user_selected_expert_mode');
    }

    if (userMode === 'fast') {
      return this.selectModel('gpt-4o-mini', 'user_selected_fast_mode');
    }

    // Auto routing logic
    const estimatedTokens = promptLength * 1.3;

    // Simple messages → small model
    if (promptLength < 400 && emotionalComplexity < 0.5) {
      return this.selectModel('gpt-4o-mini', 'simple_short_prompt');
    }

    // Emotional content → medium model
    if (
      feature === 'ai_objection' ||
      feature === 'ai_emotional' ||
      (emotionalComplexity > 0.7 && feature === 'ai_message')
    ) {
      return this.selectModel('gpt-4o-mini-high', 'emotional_complexity');
    }

    // Pitch decks, coaching → large model
    if (
      feature === 'ai_pitchdeck' ||
      feature === 'ai_coaching' ||
      feature === 'company_crawler'
    ) {
      if (tier === 'free') {
        return this.selectModel('gpt-4o-mini-high', 'tier_limited');
      }
      return this.selectModel('gpt-4o', 'complex_generation');
    }

    // Deep analysis → large model
    if (feature === 'ai_deepscan' && estimatedTokens > 5000) {
      return this.selectModel('gpt-4o', 'deep_analysis');
    }

    // Chatbot → small/medium based on context
    if (feature === 'ai_chatbot') {
      if (promptLength < 600) {
        return this.selectModel('gpt-4o-mini', 'simple_chat');
      }
      return this.selectModel('gpt-4o-mini-high', 'complex_chat');
    }

    // Default: medium model
    return this.selectModel('gpt-4o-mini-high', 'default_balanced');
  }

  private async selectModel(
    modelName: string,
    reason: string
  ): Promise<ModelSelection> {
    const { data: model } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('model_name', modelName)
      .eq('is_active', true)
      .maybeSingle();

    if (!model) {
      return this.selectCheapestModel('fallback');
    }

    return {
      model: model.model_name,
      reason,
      estimated_cost: model.cost_per_1k_input,
      estimated_tokens: 0,
      mode: 'auto'
    };
  }

  private async selectCheapestModel(reason: string): Promise<ModelSelection> {
    const { data: model } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('is_active', true)
      .order('cost_per_1k_input', { ascending: true })
      .limit(1)
      .maybeSingle();

    return {
      model: model?.model_name || 'gpt-4o-mini',
      reason,
      estimated_cost: model?.cost_per_1k_input || 0.00015,
      estimated_tokens: 0,
      mode: 'panic'
    };
  }

  /**
   * B. PREDICTIVE TOKEN COST SIMULATION
   */

  predictTokenCost(prompt: string, context?: any): number {
    let tokenCount = 0;

    // Base prompt (1 token ≈ 4 chars)
    tokenCount += Math.ceil(prompt.length / 4);

    // Context
    if (context) {
      const contextStr = JSON.stringify(context);
      tokenCount += Math.ceil(contextStr.length / 4);
    }

    // System instructions overhead
    tokenCount += 200;

    // Output tokens estimate (assume 2x input for generation)
    tokenCount *= 2.5;

    return Math.ceil(tokenCount);
  }

  async simulateCost(
    userId: string,
    feature: string,
    prompt: string,
    context?: any
  ): Promise<CostPrediction> {
    const warnings: string[] = [];

    // Predict tokens
    const predictedTokens = this.predictTokenCost(prompt, context);

    // Get user tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    // Choose model
    const modelSelection = await this.chooseModel({
      feature,
      promptLength: prompt.length,
      emotionalComplexity: this.estimateEmotionalComplexity(prompt),
      tier,
      userId
    });

    // Get model cost
    const { data: model } = await supabase
      .from('ai_model_configs')
      .select('*')
      .eq('model_name', modelSelection.model)
      .maybeSingle();

    if (!model) {
      return {
        predicted_tokens: predictedTokens,
        predicted_cost_usd: 0,
        predicted_energy: 0,
        recommended_model: 'gpt-4o-mini',
        warnings: ['Model not found, using default'],
        allow_proceed: false
      };
    }

    // Calculate cost
    const inputTokens = Math.ceil(predictedTokens * 0.4);
    const outputTokens = Math.ceil(predictedTokens * 0.6);
    const costUSD =
      (inputTokens / 1000) * model.cost_per_1k_input +
      (outputTokens / 1000) * model.cost_per_1k_output;

    // Calculate energy cost
    const energyCost = await energyEngineV3.tokenToEnergy(userId, predictedTokens);

    // Check thresholds
    let allowProceed = true;

    if (predictedTokens > this.MAX_TOKENS_THRESHOLD) {
      warnings.push(
        `Very high token usage (${predictedTokens}). Consider splitting your input.`
      );
      allowProceed = false;
    }

    if (predictedTokens > this.PANIC_MODE_THRESHOLD) {
      warnings.push('This is a large operation. Energy cost will be significant.');
    }

    // Check user's current energy
    const energyStatus = await energyEngineV2.getEnergyStatus(userId);
    if (energyStatus && energyStatus.current < energyCost) {
      warnings.push('Insufficient energy for this operation.');
      allowProceed = false;
    }

    return {
      predicted_tokens: predictedTokens,
      predicted_cost_usd: costUSD,
      predicted_energy: energyCost,
      recommended_model: model.model_name,
      warnings,
      allow_proceed: allowProceed
    };
  }

  /**
   * C. PRE-ACTION COST FIREWALL
   */

  async checkCostFirewall(
    userId: string,
    feature: string,
    prompt: string
  ): Promise<{ allowed: boolean; reason?: string; suggestion?: string }> {
    const prediction = await this.simulateCost(userId, feature, prompt);

    if (!prediction.allow_proceed) {
      return {
        allowed: false,
        reason: prediction.warnings.join(' '),
        suggestion: 'Try splitting your input into smaller parts or use compression mode.'
      };
    }

    // Check token budget (v3)
    const budgetCheck = await energyEngineV3.checkTokenBudget(
      userId,
      prediction.predicted_tokens
    );

    if (!budgetCheck.allowed) {
      return {
        allowed: false,
        reason: budgetCheck.reason,
        suggestion: 'Upgrade your plan or wait for daily reset.'
      };
    }

    return { allowed: true };
  }

  /**
   * D. DYNAMIC ENERGY CHARGE
   */

  async chargeEnergyV4(
    userId: string,
    feature: string,
    prompt: string,
    context?: any
  ): Promise<{
    success: boolean;
    model: string;
    predicted_tokens: number;
    energy_cost: number;
    error?: string;
  }> {
    // Run firewall
    const firewallCheck = await this.checkCostFirewall(userId, feature, prompt);

    if (!firewallCheck.allowed) {
      return {
        success: false,
        model: '',
        predicted_tokens: 0,
        energy_cost: 0,
        error: firewallCheck.reason
      };
    }

    // Get prediction
    const prediction = await this.simulateCost(userId, feature, prompt, context);

    // Apply surge pricing from v2
    const finalEnergyCost = await energyEngineV2.applySurgePricing(
      userId,
      feature,
      prediction.predicted_energy
    );

    // Charge energy
    const charged = await energyEngineV2.chargeEnergyV2(userId, feature, finalEnergyCost);

    if (!charged) {
      return {
        success: false,
        model: prediction.recommended_model,
        predicted_tokens: prediction.predicted_tokens,
        energy_cost: finalEnergyCost,
        error: 'Insufficient energy'
      };
    }

    // Save prediction
    await supabase.from('ai_cost_predictions').insert({
      user_id: userId,
      feature,
      predicted_tokens: prediction.predicted_tokens,
      predicted_cost_usd: prediction.predicted_cost_usd,
      predicted_energy: finalEnergyCost,
      recommended_model: prediction.recommended_model,
      approved: true
    });

    return {
      success: true,
      model: prediction.recommended_model,
      predicted_tokens: prediction.predicted_tokens,
      energy_cost: finalEnergyCost
    };
  }

  /**
   * E. OUTPUT SHAPING ENGINE
   */

  applyOutputShaping(tier: string, efficiencyRating: number): {
    max_length: number;
    verbosity: string;
    style: string;
  } {
    const shapes: Record<string, any> = {
      free: {
        max_length: 500,
        verbosity: 'concise',
        style: 'brief'
      },
      pro: {
        max_length: 1500,
        verbosity: 'balanced',
        style: 'professional'
      },
      pro: {
        max_length: 3000, // Pro now gets elite-level features
        verbosity: 'detailed',
        style: 'comprehensive'
      },
      enterprise: {
        max_length: 5000,
        verbosity: 'complete',
        style: 'executive'
      }
    };

    const shape = shapes[tier] || shapes.free;

    // Adjust based on efficiency
    if (efficiencyRating < 0.7) {
      shape.max_length = Math.floor(shape.max_length * 0.8);
      shape.verbosity = 'concise';
    }

    return shape;
  }

  /**
   * F. PERSONALIZED EFFICIENCY LEARNING
   */

  async updateEfficiencyMetrics(
    userId: string,
    actualTokens: number,
    modelUsed: string,
    feature: string
  ): Promise<void> {
    // Get prediction
    const { data: prediction } = await supabase
      .from('ai_cost_predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('feature', feature)
      .is('actual_tokens', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prediction) {
      // Update prediction with actual
      const accuracy =
        1.0 - Math.abs(actualTokens - prediction.predicted_tokens) / prediction.predicted_tokens;

      await supabase
        .from('ai_cost_predictions')
        .update({
          actual_tokens: actualTokens,
          prediction_accuracy: accuracy
        })
        .eq('id', prediction.id);

      // Update user efficiency rating
      await supabase.rpc('update_efficiency_rating', {
        p_user_id: userId,
        p_tokens_used: actualTokens,
        p_tokens_predicted: prediction.predicted_tokens
      });
    }

    // Update profile stats
    await supabase
      .from('user_efficiency_profiles')
      .update({
        total_requests: supabase.rpc('increment', { x: 1 }),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
  }

  /**
   * G. CACHED RESPONSE ACCELERATOR
   */

  async checkCache(
    userId: string,
    feature: string,
    prompt: string
  ): Promise<{ cached: boolean; response?: string; tokens_saved?: number }> {
    const promptHash = this.hashPrompt(prompt);

    const { data: cached } = await supabase
      .from('cached_ai_responses')
      .select('*')
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('prompt_hash', promptHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      // Update hit count
      await supabase
        .from('cached_ai_responses')
        .update({
          hit_count: cached.hit_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', cached.id);

      return {
        cached: true,
        response: cached.response_text,
        tokens_saved: cached.tokens_saved
      };
    }

    return { cached: false };
  }

  async saveToCache(
    userId: string,
    feature: string,
    prompt: string,
    response: string,
    tokensSaved: number
  ): Promise<void> {
    const promptHash = this.hashPrompt(prompt);

    await supabase.from('cached_ai_responses').insert({
      user_id: userId,
      feature,
      prompt_hash: promptHash,
      response_text: response,
      tokens_saved: tokensSaved
    });
  }

  private hashPrompt(prompt: string): string {
    // Simple hash for demo - in production use proper hashing
    return Buffer.from(prompt.substring(0, 100)).toString('base64');
  }

  /**
   * HELPER FUNCTIONS
   */

  private estimateEmotionalComplexity(text: string): number {
    const emotionalKeywords = [
      'feel',
      'emotion',
      'heart',
      'passion',
      'story',
      'journey',
      'struggle',
      'overcome',
      'inspire',
      'dream'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const emotionalWords = words.filter(word =>
      emotionalKeywords.some(kw => word.includes(kw))
    );

    return Math.min(emotionalWords.length / 10, 1.0);
  }

  private isSystemOverloaded(): boolean {
    // TODO: Implement real system load checking
    // For now, return false
    return false;
  }

  /**
   * PUBLIC API
   */

  async getEfficiencyProfile(userId: string): Promise<EfficiencyProfile | null> {
    const { data } = await supabase
      .from('user_efficiency_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return null;

    return {
      rating: data.efficiency_rating,
      preferred_mode: data.preferred_mode,
      avg_tokens: data.avg_token_per_request,
      total_saved: data.total_tokens_saved,
      cache_hit_rate: data.cache_hit_rate
    };
  }

  async setPreferredMode(
    userId: string,
    mode: 'auto' | 'fast' | 'pro' | 'expert'
  ): Promise<void> {
    await supabase
      .from('user_efficiency_profiles')
      .update({ preferred_mode: mode })
      .eq('user_id', userId);

    await supabase.from('user_energy').update({ model_mode: mode }).eq('user_id', userId);
  }

  async getModelUsageStats(
    userId: string,
    days: number = 7
  ): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('ai_model_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (!data) return null;

    const totalCost = data.reduce((sum, item) => sum + parseFloat(item.cost_usd), 0);
    const totalTokens = data.reduce((sum, item) => sum + item.total_tokens, 0);

    return {
      total_requests: data.length,
      total_tokens: totalTokens,
      total_cost_usd: totalCost.toFixed(4),
      by_model: this.groupByModel(data),
      by_feature: this.groupByFeature(data)
    };
  }

  private groupByModel(data: any[]): any {
    return data.reduce((acc, item) => {
      if (!acc[item.model_used]) {
        acc[item.model_used] = { count: 0, tokens: 0, cost: 0 };
      }
      acc[item.model_used].count += 1;
      acc[item.model_used].tokens += item.total_tokens;
      acc[item.model_used].cost += parseFloat(item.cost_usd);
      return acc;
    }, {});
  }

  private groupByFeature(data: any[]): any {
    return data.reduce((acc, item) => {
      if (!acc[item.feature]) {
        acc[item.feature] = { count: 0, tokens: 0, cost: 0 };
      }
      acc[item.feature].count += 1;
      acc[item.feature].tokens += item.total_tokens;
      acc[item.feature].cost += parseFloat(item.cost_usd);
      return acc;
    }, {});
  }
}

export const energyEngineV4 = new EnergyEngineV4();
