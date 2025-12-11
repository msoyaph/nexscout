/**
 * AI ORCHESTRATOR
 * 
 * Central coordination point for ALL AI operations
 * Consolidates 6 messaging engines, multiple AI calls, scattered config loading
 * 
 * Features:
 * - Single entry point for all AI calls
 * - Automatic model selection based on energy/tier
 * - Provider management (OpenAI + fallbacks)
 * - Token tracking & cost calculation
 * - Retry logic with exponential backoff
 * - Energy system integration
 * - Analytics tracking
 * - Streaming support
 * - Response caching
 * 
 * Usage:
 *   const result = await aiOrchestrator.generate({
 *     messages: [{ role: 'user', content: 'Hello' }],
 *     config: { userId: 'xxx', action: 'ai_message' }
 *   });
 */

import { supabase } from '../../lib/supabase';
import { configService } from './ConfigService';
import { energyEngineV5 } from '../energy/energyEngineV5';
import { analyticsEngineV2 } from '../intelligence/analyticsEngineV2';
import {
  AIRequest,
  AIResponse,
  AIStreamResponse,
  AIProvider,
  AIModel,
  AIMessage,
  AIRequestConfig,
  TokenUsage,
  ProviderStatus,
  AIMetrics,
} from './types';

/**
 * Model pricing (per 1K tokens)
 */
const MODEL_PRICING: Record<AIModel, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 0.03, completion: 0.06 },
  'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
  'gpt-4o': { prompt: 0.005, completion: 0.015 },
  'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
  'claude-3-opus': { prompt: 0.015, completion: 0.075 },
  'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
  'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 },
};

/**
 * Energy costs per action
 */
const ENERGY_COSTS: Record<string, { gpt4: number; gpt35: number }> = {
  ai_message: { gpt4: 10, gpt35: 3 },
  ai_scan: { gpt4: 15, gpt35: 5 },
  ai_follow_up_sequence: { gpt4: 50, gpt35: 15 },
  ai_objection_handler: { gpt4: 10, gpt35: 3 },
  ai_pitch_deck: { gpt4: 100, gpt35: 30 },
  ai_chatbot_response: { gpt4: 10, gpt35: 3 },
  ai_deep_scan: { gpt4: 25, gpt35: 8 },
  ai_company_analysis: { gpt4: 30, gpt35: 10 },
};

/**
 * AIOrchestrator Class - Singleton
 */
class AIOrchestrator {
  private static instance: AIOrchestrator;
  
  // Provider health tracking
  private providerHealth: Map<string, ProviderStatus> = new Map();
  
  // Metrics
  private metrics: AIMetrics = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    averageLatency: 0,
    errorRate: 0,
    cacheHitRate: 0,
    providerDistribution: {} as Record<AIProvider, number>,
    modelDistribution: {} as Record<AIModel, number>,
  };
  
  private constructor() {
    // Private constructor for singleton
  }
  
  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }
  
  /**
   * MAIN ENTRY POINT: Generate AI response
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const { messages, config } = request;
    
    try {
      // 1. Load user configuration (cached)
      const userConfig = await configService.loadConfig(config.userId);
      
      // 2. Check energy and select model
      const { model, provider } = await this.selectModelAndProvider(config, userConfig);
      
      // 3. Check if user has enough energy (skip for instructions transformation if energy system not available)
      const energyCost = this.calculateEnergyCost(config.action, model);
      let energyCheck = { canPerform: true, available: 1000, required: energyCost };
      
      try {
        energyCheck = await energyEngineV5.canPerformAction(config.userId, energyCost);
        
        if (!energyCheck.canPerform) {
          return this.createErrorResponse(
            `Insufficient energy. Required: ${energyCost}, Available: ${energyCheck.available}`,
            provider,
            model,
            startTime
          );
        }
      } catch (energyError) {
        // Energy system may not be fully configured - log but continue
        console.warn('[AIOrchestrator] Energy check failed, proceeding anyway:', energyError);
      }
      
      // 4. Consume energy (gracefully handle failures)
      try {
        await energyEngineV5.consumeEnergy(config.userId, energyCost, config.action);
      } catch (energyError) {
        // Energy consumption failed - log but continue (don't block AI generation)
        console.warn('[AIOrchestrator] Energy consumption failed, proceeding anyway:', energyError);
      }
      
      // 5. Make AI API call with retry logic
      const result = await this.callAI(messages, model, provider, config);
      
      // 6. Track usage and costs
      const cost = this.calculateCost(result.usage, model);
      await this.trackUsage(config, result.usage, cost, model, provider);
      
      // 7. Track analytics
      await analyticsEngineV2.trackEvent('ai_generation_completed', {
        action: config.action,
        model,
        provider,
        tokensUsed: result.usage.total,
        cost,
      });
      
      // 8. Update metrics
      this.updateMetrics(result.usage.total, cost, Date.now() - startTime, provider, model, false);
      
      // 9. Return response
      return {
        success: true,
        content: result.content,
        meta: {
          provider,
          model,
          tokensUsed: result.usage.total,
          tokensPrompt: result.usage.prompt,
          tokensCompletion: result.usage.completion,
          costUSD: cost,
          energyConsumed: energyCost,
          latencyMs: Date.now() - startTime,
          cached: userConfig.cached,
          retryCount: 0,
          fallbackUsed: false,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('[AIOrchestrator] Generation error:', error);
      
      this.updateMetrics(0, 0, Date.now() - startTime, 'openai', 'gpt-4o', true);
      
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error',
        'openai',
        config.model || 'gpt-4o',
        startTime
      );
    }
  }
  
  /**
   * STREAMING: Generate AI response with streaming
   */
  async generateStream(request: AIRequest): Promise<AIStreamResponse> {
    // TODO: Implement streaming
    throw new Error('Streaming not yet implemented');
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get provider health status
   */
  getProviderHealth(): ProviderStatus[] {
    return Array.from(this.providerHealth.values());
  }
  
  // ========================================
  // PRIVATE METHODS
  // ========================================
  
  /**
   * Select the best model and provider based on:
   * - User's energy level
   * - User's tier
   * - Requested model (if specified)
   * - Auto-select cheaper model if low energy
   */
  private async selectModelAndProvider(
    config: AIRequestConfig,
    userConfig: any
  ): Promise<{ model: AIModel; provider: AIProvider }> {
    // If model explicitly requested, use it
    if (config.model) {
      const provider = this.getProviderForModel(config.model);
      return { model: config.model, provider };
    }
    
    // Check user's tier
    const tier = userConfig.user.subscription_tier || 'free';
    
    // Free tier: always use GPT-3.5
    if (tier === 'free') {
      return { model: 'gpt-3.5-turbo', provider: 'openai' };
    }
    
    // Auto-select based on energy
    if (config.autoSelectModel !== false) {
      const currentEnergy = await this.getCurrentEnergy(config.userId);
      const gpt4Cost = ENERGY_COSTS[config.action]?.gpt4 || 10;
      const gpt35Cost = ENERGY_COSTS[config.action]?.gpt35 || 3;
      
      // If not enough energy for GPT-4, downgrade to GPT-3.5
      if (currentEnergy < gpt4Cost && currentEnergy >= gpt35Cost) {
        console.log('[AIOrchestrator] Auto-downgrading to GPT-3.5 due to low energy');
        return { model: 'gpt-3.5-turbo', provider: 'openai' };
      }
    }
    
    // Default: Use configured model or GPT-4o
    const defaultModel = userConfig.aiSettings?.defaultModel || 'gpt-4o';
    return {
      model: defaultModel as AIModel,
      provider: this.getProviderForModel(defaultModel as AIModel),
    };
  }
  
  private getProviderForModel(model: AIModel): AIProvider {
    if (model.startsWith('gpt')) return 'openai';
    if (model.startsWith('claude')) return 'anthropic';
    return 'openai';
  }
  
  private async getCurrentEnergy(userId: string): Promise<number> {
    const status = await energyEngineV5.getEnergyStatus(userId);
    return status?.current || 0;
  }
  
  private calculateEnergyCost(action: string, model: AIModel): number {
    const costs = ENERGY_COSTS[action] || { gpt4: 10, gpt35: 3 };
    
    // Cheaper models use less energy
    if (model === 'gpt-3.5-turbo' || model === 'claude-3-haiku') {
      return costs.gpt35;
    }
    
    return costs.gpt4;
  }
  
  /**
   * Make actual API call to AI provider
   */
  private async callAI(
    messages: AIMessage[],
    model: AIModel,
    provider: AIProvider,
    config: AIRequestConfig
  ): Promise<{ content: string; usage: TokenUsage }> {
    const maxRetries = config.retryAttempts || 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff
          const delay = (config.retryDelay || 1000) * Math.pow(2, attempt);
          await this.sleep(delay);
        }
        
        const result = await this.makeProviderCall(messages, model, provider, config);
        return result;
      } catch (error) {
        lastError = error as Error;
        console.error(`[AIOrchestrator] Attempt ${attempt + 1} failed:`, error);
        
        // If it's a rate limit error, wait longer
        if (error instanceof Error && error.message.includes('rate_limit')) {
          await this.sleep(5000);
        }
      }
    }
    
    // All retries failed
    throw lastError || new Error('AI call failed after retries');
  }
  
  /**
   * Make actual provider-specific API call
   */
  private async makeProviderCall(
    messages: AIMessage[],
    model: AIModel,
    provider: AIProvider,
    config: AIRequestConfig
  ): Promise<{ content: string; usage: TokenUsage }> {
    if (provider === 'openai') {
      return await this.callOpenAI(messages, model, config);
    } else if (provider === 'anthropic') {
      return await this.callAnthropic(messages, model, config);
    }
    
    throw new Error(`Provider ${provider} not supported`);
  }
  
  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    messages: AIMessage[],
    model: AIModel,
    config: AIRequestConfig
  ): Promise<{ content: string; usage: TokenUsage }> {
    // Get OpenAI API key from environment or edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    // Call through edge function (which has the API key)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL is not configured');
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/generate-ai-content`;
    
    let response: Response;
    try {
      response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          messages,
          model,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 1000,
          workspaceId: config.workspaceId || null,
          prospectId: config.prospectId || null, // Optional - not required for instructions transformation
          generationType: config.action,
          // For instructions transformation, indicate this is not prospect-specific
          skipProspectValidation: config.action === 'ai_chatbot_response' && !config.prospectId,
          // CRITICAL: Skip coin check if coins were already deducted or will be deducted separately
          // This prevents the edge function from deducting coins per AI call
          skipCoinCheck: config.skipCoinCheck || false,
          coinCost: config.coinCost || 0, // Tell edge function coins already deducted (0 = no deduction)
          transactionId: config.transactionId || null, // Transaction ID for deduplication
        }),
      });
    } catch (fetchError) {
      // Network error - edge function may not be deployed or accessible
      console.error('[AIOrchestrator] Fetch error:', fetchError);
      throw new Error(
        `Failed to connect to AI service. The edge function "generate-ai-content" may not be deployed or accessible. ` +
        `Please ensure: 1) The edge function is deployed, 2) VITE_SUPABASE_URL is configured correctly, 3) You have internet connectivity.`
      );
    }
    
    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        
        // Handle coin-related errors
        if (response.status === 402 || errorMessage.toLowerCase().includes('insufficient coins') || errorMessage.toLowerCase().includes('payment required')) {
          if (config.skipCoinCheck) {
            // If we set skipCoinCheck but still got coin error, the edge function might not support it
            console.warn('[AIOrchestrator] Edge function returned coin error despite skipCoinCheck flag. Edge function may need to be updated to support skipCoinCheck.');
            errorMessage = 'The AI service encountered a coin check error. If coins were already deducted, please contact support. Otherwise, ensure you have sufficient coins.';
          } else {
            errorMessage = 'Insufficient coins. Please purchase more coins to continue.';
          }
        }
        
        // Handle "Prospect not found" error for instructions transformation
        if (errorMessage.includes('Prospect not found') && !config.prospectId) {
          errorMessage = 'The AI service requires a prospect context, but this operation is for general AI System Instructions. Please use this feature from a prospect-specific context, or contact support to enable instructions transformation without prospect context.';
        }
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
    const result = await response.json();
    
    return {
      content: result.output?.message || result.message || result.content || '',
      usage: {
        prompt: result.usage?.prompt_tokens || 0,
        completion: result.usage?.completion_tokens || 0,
        total: result.usage?.total_tokens || 0,
      },
    };
  }
  
  /**
   * Call Anthropic API (Claude)
   */
  private async callAnthropic(
    messages: AIMessage[],
    model: AIModel,
    config: AIRequestConfig
  ): Promise<{ content: string; usage: TokenUsage }> {
    // TODO: Implement Anthropic API call
    throw new Error('Anthropic provider not yet implemented');
  }
  
  /**
   * Calculate USD cost based on tokens and model
   */
  private calculateCost(usage: TokenUsage, model: AIModel): number {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o'];
    
    const promptCost = (usage.prompt / 1000) * pricing.prompt;
    const completionCost = (usage.completion / 1000) * pricing.completion;
    
    return promptCost + completionCost;
  }
  
  /**
   * Track usage in database
   */
  private async trackUsage(
    config: AIRequestConfig,
    usage: TokenUsage,
    cost: number,
    model: AIModel,
    provider: AIProvider
  ): Promise<void> {
    try {
      await supabase.from('ai_usage_logs').insert({
        user_id: config.userId,
        workspace_id: config.workspaceId,
        prospect_id: config.prospectId,
        action: config.action,
        provider,
        model,
        tokens_prompt: usage.prompt,
        tokens_completion: usage.completion,
        tokens_total: usage.total,
        cost_usd: cost,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[AIOrchestrator] Error tracking usage:', error);
      // Don't throw - usage tracking failure shouldn't break the flow
    }
  }
  
  /**
   * Update internal metrics
   */
  private updateMetrics(
    tokens: number,
    cost: number,
    latency: number,
    provider: AIProvider,
    model: AIModel,
    isError: boolean
  ): void {
    this.metrics.totalRequests++;
    this.metrics.totalTokens += tokens;
    this.metrics.totalCost += cost;
    
    // Update average latency (running average)
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) + latency) /
      this.metrics.totalRequests;
    
    // Update error rate
    if (isError) {
      this.metrics.errorRate =
        (this.metrics.errorRate * (this.metrics.totalRequests - 1) + 1) /
        this.metrics.totalRequests;
    }
    
    // Update provider distribution
    this.metrics.providerDistribution[provider] =
      (this.metrics.providerDistribution[provider] || 0) + 1;
    
    // Update model distribution
    this.metrics.modelDistribution[model] =
      (this.metrics.modelDistribution[model] || 0) + 1;
  }
  
  /**
   * Create error response
   */
  private createErrorResponse(
    error: string,
    provider: AIProvider,
    model: AIModel,
    startTime: number
  ): AIResponse {
    return {
      success: false,
      error,
      meta: {
        provider,
        model,
        tokensUsed: 0,
        tokensPrompt: 0,
        tokensCompletion: 0,
        costUSD: 0,
        energyConsumed: 0,
        latencyMs: Date.now() - startTime,
        cached: false,
        retryCount: 0,
        fallbackUsed: false,
        timestamp: new Date().toISOString(),
      },
    };
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const aiOrchestrator = AIOrchestrator.getInstance();





