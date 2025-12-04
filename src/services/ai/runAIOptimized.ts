import { supabase } from '../../lib/supabase';
import { energyEngineV4 } from '../energy/energyEngineV4';

/**
 * Global AI Wrapper - runAIOptimized
 *
 * This is the ONLY function that should be used for AI generation across NexScout.
 * It handles:
 * - Cost estimation
 * - Model selection
 * - Energy charging
 * - Compression
 * - Caching
 * - Efficiency tracking
 * - Error handling
 * - Fallback routing
 */

export interface AIRequest {
  userId: string;
  feature: string;
  prompt: string;
  goal?: string;
  attachments?: any[];
  tone?: string;
  context?: any;
  options?: {
    allowCache?: boolean;
    forceModel?: string;
    skipEnergyCharge?: boolean;
    maxTokens?: number;
  };
}

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
  metadata: {
    model_used: string;
    tokens_used: number;
    energy_cost: number;
    from_cache: boolean;
    compression_applied: boolean;
    cost_usd: number;
    execution_time_ms: number;
  };
}

/**
 * Main AI execution function
 */
export async function runAIOptimized(request: AIRequest): Promise<AIResponse> {
  const startTime = Date.now();
  const { userId, feature, prompt, context, options = {} } = request;

  try {
    // Step 1: Check cache first
    if (options.allowCache !== false) {
      const cacheCheck = await energyEngineV4.checkCache(userId, feature, prompt);
      if (cacheCheck.cached && cacheCheck.response) {
        return {
          success: true,
          result: cacheCheck.response,
          metadata: {
            model_used: 'cached',
            tokens_used: 0,
            energy_cost: 0,
            from_cache: true,
            compression_applied: false,
            cost_usd: 0,
            execution_time_ms: Date.now() - startTime
          }
        };
      }
    }

    // Step 2: Simulate cost and run firewall
    const costSim = await energyEngineV4.simulateCost(userId, feature, prompt, context);

    if (!costSim.allow_proceed) {
      return {
        success: false,
        error: costSim.warnings.join(' '),
        metadata: {
          model_used: '',
          tokens_used: 0,
          energy_cost: 0,
          from_cache: false,
          compression_applied: false,
          cost_usd: 0,
          execution_time_ms: Date.now() - startTime
        }
      };
    }

    // Step 3: Get user tier and efficiency
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    const efficiencyProfile = await energyEngineV4.getEfficiencyProfile(userId);
    const efficiencyRating = efficiencyProfile?.rating || 1.0;

    // Step 4: Choose optimal model
    const modelSelection = await energyEngineV4.chooseModel({
      feature,
      promptLength: prompt.length,
      emotionalComplexity: estimateEmotionalComplexity(prompt),
      tier,
      userId,
      mode: options.forceModel
    });

    // Step 5: Check if compression needed
    const compressionNeeded = await shouldCompress(
      userId,
      costSim.predicted_tokens,
      tier
    );

    let finalPrompt = prompt;
    if (compressionNeeded) {
      finalPrompt = compressPrompt(prompt);
    }

    // Step 6: Apply output shaping
    const outputShape = energyEngineV4.applyOutputShaping(tier, efficiencyRating);

    // Step 7: Charge energy (unless skipped)
    if (!options.skipEnergyCharge) {
      const charge = await energyEngineV4.chargeEnergyV4(userId, feature, finalPrompt, context);

      if (!charge.success) {
        return {
          success: false,
          error: charge.error || 'Failed to charge energy',
          metadata: {
            model_used: charge.model,
            tokens_used: charge.predicted_tokens,
            energy_cost: charge.energy_cost,
            from_cache: false,
            compression_applied: compressionNeeded,
            cost_usd: 0,
            execution_time_ms: Date.now() - startTime
          }
        };
      }
    }

    // Step 8: Execute AI generation
    const aiResult = await executeAIGeneration({
      model: modelSelection.model,
      prompt: finalPrompt,
      context,
      maxTokens: outputShape.max_length,
      style: outputShape.style
    });

    if (!aiResult.success) {
      // Step 9: Fallback to cheaper model
      const fallbackResult = await executeFallback({
        prompt: finalPrompt,
        context
      });

      if (!fallbackResult.success) {
        return {
          success: false,
          error: 'AI generation failed',
          metadata: {
            model_used: modelSelection.model,
            tokens_used: 0,
            energy_cost: 0,
            from_cache: false,
            compression_applied: compressionNeeded,
            cost_usd: 0,
            execution_time_ms: Date.now() - startTime
          }
        };
      }

      return fallbackResult;
    }

    // Step 10: Save token usage
    await saveModelUsage({
      userId,
      feature,
      model: modelSelection.model,
      inputTokens: aiResult.input_tokens,
      outputTokens: aiResult.output_tokens,
      costUSD: aiResult.cost_usd,
      compressionApplied: compressionNeeded
    });

    // Step 11: Update efficiency metrics
    await energyEngineV4.updateEfficiencyMetrics(
      userId,
      aiResult.input_tokens + aiResult.output_tokens,
      modelSelection.model,
      feature
    );

    // Step 12: Cache response if beneficial
    if (shouldCacheResponse(feature, aiResult.output_tokens)) {
      await energyEngineV4.saveToCache(
        userId,
        feature,
        prompt,
        aiResult.result,
        aiResult.output_tokens
      );
    }

    return {
      success: true,
      result: aiResult.result,
      metadata: {
        model_used: modelSelection.model,
        tokens_used: aiResult.input_tokens + aiResult.output_tokens,
        energy_cost: costSim.predicted_energy,
        from_cache: false,
        compression_applied: compressionNeeded,
        cost_usd: aiResult.cost_usd,
        execution_time_ms: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('runAIOptimized error:', error);

    return {
      success: false,
      error: 'Internal AI processing error',
      metadata: {
        model_used: '',
        tokens_used: 0,
        energy_cost: 0,
        from_cache: false,
        compression_applied: false,
        cost_usd: 0,
        execution_time_ms: Date.now() - startTime
      }
    };
  }
}

/**
 * Helper: Execute AI generation (mock - integrate with real LLM)
 */
async function executeAIGeneration(params: {
  model: string;
  prompt: string;
  context?: any;
  maxTokens?: number;
  style?: string;
}): Promise<{
  success: boolean;
  result: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}> {
  // TODO: Integrate with real LLM API
  // For now, return mock response

  const inputTokens = Math.ceil(params.prompt.length / 4);
  const outputTokens = Math.ceil(inputTokens * 1.5);

  return {
    success: true,
    result: `Generated response using ${params.model}`,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: 0.01
  };
}

/**
 * Helper: Fallback execution
 */
async function executeFallback(params: {
  prompt: string;
  context?: any;
}): Promise<AIResponse> {
  // Try cheapest model as fallback
  const result = await executeAIGeneration({
    model: 'gpt-4o-mini',
    prompt: params.prompt,
    context: params.context
  });

  return {
    success: result.success,
    result: result.result,
    metadata: {
      model_used: 'gpt-4o-mini (fallback)',
      tokens_used: result.input_tokens + result.output_tokens,
      energy_cost: 1,
      from_cache: false,
      compression_applied: true,
      cost_usd: result.cost_usd,
      execution_time_ms: 0
    }
  };
}

/**
 * Helper: Check if compression needed
 */
async function shouldCompress(
  userId: string,
  estimatedTokens: number,
  tier: string
): Promise<boolean> {
  if (tier === 'enterprise') return false;

  const { data: energy } = await supabase
    .from('user_energy')
    .select('current_energy, compression_mode_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (!energy) return false;

  return (
    energy.compression_mode_enabled ||
    energy.current_energy < 5 ||
    estimatedTokens > 10000
  );
}

/**
 * Helper: Compress prompt
 */
function compressPrompt(prompt: string): string {
  let compressed = prompt;

  // Remove extra whitespace
  compressed = compressed.replace(/\s+/g, ' ').trim();

  // Remove polite phrases
  compressed = compressed.replace(
    /Please|Could you|I would like you to|Kindly/gi,
    ''
  );

  // Remove redundant words
  compressed = compressed.replace(/very|really|quite|just|simply/gi, '');

  // Shorten if still too long
  if (compressed.length > 2000) {
    compressed = compressed.substring(0, 2000) + '...';
  }

  return compressed;
}

/**
 * Helper: Estimate emotional complexity
 */
function estimateEmotionalComplexity(text: string): number {
  const emotionalWords = [
    'feel',
    'emotion',
    'heart',
    'passion',
    'story',
    'journey',
    'inspire'
  ];

  const words = text.toLowerCase().split(/\s+/);
  const matches = words.filter(word =>
    emotionalWords.some(ew => word.includes(ew))
  );

  return Math.min(matches.length / 10, 1.0);
}

/**
 * Helper: Check if response should be cached
 */
function shouldCacheResponse(feature: string, tokens: number): boolean {
  // Cache small responses for quick features
  const cacheableFeatures = ['ai_message', 'ai_objection', 'ai_chatbot'];

  return cacheableFeatures.includes(feature) && tokens < 1000;
}

/**
 * Helper: Save model usage to database
 */
async function saveModelUsage(params: {
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  compressionApplied: boolean;
}): Promise<void> {
  await supabase.from('ai_model_usage').insert({
    user_id: params.userId,
    feature: params.feature,
    model_used: params.model,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    cost_usd: params.costUSD,
    compression_applied: params.compressionApplied
  });
}

/**
 * Batch AI execution (for heavy workloads)
 */
export async function runAIBatch(
  requests: AIRequest[]
): Promise<AIResponse[]> {
  const results: AIResponse[] = [];

  // Execute in parallel with rate limiting
  const batchSize = 5;
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(req => runAIOptimized(req)));
    results.push(...batchResults);
  }

  return results;
}
