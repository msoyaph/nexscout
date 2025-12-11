/**
 * AI ORCHESTRATOR - TYPE DEFINITIONS
 * 
 * Centralized types for AI system
 */

export type AIProvider = 'openai' | 'anthropic' | 'fallback';

export type AIModel = 
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

export type AIAction = 
  | 'ai_message'
  | 'ai_scan'
  | 'ai_follow_up_sequence'
  | 'ai_objection_handler'
  | 'ai_pitch_deck'
  | 'ai_chatbot_response'
  | 'ai_deep_scan'
  | 'ai_company_analysis';

export interface AIRequestConfig {
  // Core settings
  model?: AIModel;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  
  // Streaming
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  
  // Context
  workspaceId?: string;
  userId: string;
  prospectId?: string;
  
  // Energy & Billing
  action: AIAction;
  autoSelectModel?: boolean; // Auto-downgrade if low energy
  skipCoinCheck?: boolean; // Skip coin checking in edge function (coins already deducted or will be deducted separately)
  coinCost?: number; // Coin cost if already deducted (0 = no deduction needed)
  transactionId?: string; // Optional transaction ID for deduplication (prevents multiple deductions for same batch)
  
  // Retry behavior
  retryAttempts?: number;
  retryDelay?: number;
  
  // Fallback
  allowFallback?: boolean;
  fallbackModel?: AIModel;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  config: AIRequestConfig;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  
  // Metadata
  meta: {
    provider: AIProvider;
    model: AIModel;
    tokensUsed: number;
    tokensPrompt: number;
    tokensCompletion: number;
    costUSD: number;
    energyConsumed: number;
    latencyMs: number;
    cached: boolean;
    retryCount: number;
    fallbackUsed: boolean;
    timestamp: string;
  };
}

export interface AIStreamResponse {
  success: boolean;
  stream?: ReadableStream<string>;
  error?: string;
  meta: Omit<AIResponse['meta'], 'tokensUsed' | 'tokensPrompt' | 'tokensCompletion'>;
}

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface CachedConfig {
  workspaceId: string;
  config: any;
  cachedAt: number;
  expiresAt: number;
}

export interface ProviderStatus {
  provider: AIProvider;
  model: AIModel;
  healthy: boolean;
  latency: number;
  errorRate: number;
  lastChecked: string;
}

export interface AIMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageLatency: number;
  errorRate: number;
  cacheHitRate: number;
  providerDistribution: Record<AIProvider, number>;
  modelDistribution: Record<AIModel, number>;
}





