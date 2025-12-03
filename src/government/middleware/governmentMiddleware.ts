/**
 * Government Middleware
 * Enforces checks and balances across all system operations
 */

import { government } from '../Government';
import type { GovernmentRequest, GovernmentResponse } from '../types/government';

/**
 * Government-aware AI execution wrapper
 * Routes all AI requests through government approval
 */
export async function executeWithGovernance(
  userId: string,
  feature: string,
  action: string,
  payload: any,
  context?: any
): Promise<GovernmentResponse> {
  const request: GovernmentRequest = {
    user_id: userId,
    feature,
    action,
    payload,
    context,
  };

  return await government.executeRequest(request);
}

/**
 * Feature access guard
 * Checks if user can access a feature before proceeding
 */
export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<{ allowed: boolean; reason?: string; upgrade_prompt?: string }> {
  return await government.checkFeatureAccess(userId, feature);
}

/**
 * Engine access guard
 * Checks if user can use a specific engine
 */
export async function checkEngineAccess(userId: string, engineId: string) {
  return await government.checkEngineAccess(userId, engineId);
}

/**
 * Rate limit guard
 * Checks if user has exceeded rate limits
 */
export async function checkRateLimit(
  userId: string,
  limitType: 'api_requests' | 'ai_generations' | 'scans' | 'messages' | 'prospect_actions'
) {
  return await government.checkRateLimit(userId, limitType);
}

/**
 * Coin transaction wrapper
 * Awards coins through government
 */
export async function awardCoins(
  userId: string,
  action: string,
  amount?: number
): Promise<boolean> {
  return await government.awardCoins(userId, action, amount);
}

/**
 * Coin deduction wrapper
 * Deducts coins through government
 */
export async function deductCoins(
  userId: string,
  action: string,
  amount?: number
): Promise<boolean> {
  return await government.deductCoins(userId, action, amount);
}

/**
 * Get coin cost for action
 */
export function getCoinCost(action: string): number {
  return government.getCoinCost(action);
}

/**
 * Get coin earnings for action
 */
export function getCoinEarnings(action: string): number {
  return government.getCoinEarnings(action);
}

/**
 * AI request interceptor
 * Wraps all AI calls with government oversight
 */
export async function governedAIRequest(
  userId: string,
  feature: string,
  prompt: string,
  options?: {
    maxTokens?: number;
    requireQuality?: boolean;
    context?: any;
  }
): Promise<GovernmentResponse> {
  const featureCheck = await checkFeatureAccess(userId, feature);
  if (!featureCheck.allowed) {
    return {
      approved: false,
      error: featureCheck.reason || 'Feature not available',
      violations: [featureCheck.upgrade_prompt || 'Access denied'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  const rateLimitCheck = await checkRateLimit(userId, 'ai_generations');
  if (!rateLimitCheck.allowed) {
    return {
      approved: false,
      error: `Rate limit exceeded (${rateLimitCheck.used}/${rateLimitCheck.limit})`,
      violations: ['Rate limit exceeded'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  return await executeWithGovernance(userId, feature, 'generate', { prompt }, options?.context);
}

/**
 * Scanning request interceptor
 * Governs all scanning operations
 */
export async function governedScanRequest(
  userId: string,
  scanType: string,
  data: any,
  context?: any
): Promise<GovernmentResponse> {
  const featureCheck = await checkFeatureAccess(userId, 'scanning');
  if (!featureCheck.allowed) {
    return {
      approved: false,
      error: featureCheck.reason || 'Scanning not available',
      violations: [featureCheck.upgrade_prompt || 'Access denied'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  const rateLimitCheck = await checkRateLimit(userId, 'scans');
  if (!rateLimitCheck.allowed) {
    return {
      approved: false,
      error: `Daily scan limit reached (${rateLimitCheck.used}/${rateLimitCheck.limit})`,
      violations: ['Rate limit exceeded'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  return await executeWithGovernance(userId, 'scanning', scanType, data, context);
}

/**
 * Messaging request interceptor
 * Governs all message generation
 */
export async function governedMessageRequest(
  userId: string,
  messageType: string,
  prospectData: any,
  context?: any
): Promise<GovernmentResponse> {
  const featureCheck = await checkFeatureAccess(userId, 'ai_messages');
  if (!featureCheck.allowed) {
    return {
      approved: false,
      error: featureCheck.reason || 'Message generation not available',
      violations: [featureCheck.upgrade_prompt || 'Access denied'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  const rateLimitCheck = await checkRateLimit(userId, 'messages');
  if (!rateLimitCheck.allowed) {
    return {
      approved: false,
      error: `Daily message limit reached (${rateLimitCheck.used}/${rateLimitCheck.limit})`,
      violations: ['Rate limit exceeded'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  return await executeWithGovernance(userId, 'ai_messages', messageType, prospectData, context);
}

/**
 * Company intelligence request interceptor
 */
export async function governedCompanyIntelligenceRequest(
  userId: string,
  companyUrl: string,
  context?: any
): Promise<GovernmentResponse> {
  const featureCheck = await checkFeatureAccess(userId, 'company_intelligence');
  if (!featureCheck.allowed) {
    return {
      approved: false,
      error: featureCheck.reason || 'Company intelligence not available',
      violations: [featureCheck.upgrade_prompt || 'Access denied'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  return await executeWithGovernance(
    userId,
    'company_intelligence',
    'analyze',
    { url: companyUrl },
    context
  );
}

/**
 * Chatbot request interceptor
 */
export async function governedChatbotRequest(
  userId: string,
  message: string,
  conversationId: string,
  context?: any
): Promise<GovernmentResponse> {
  const featureCheck = await checkFeatureAccess(userId, 'chatbot');
  if (!featureCheck.allowed) {
    return {
      approved: false,
      error: featureCheck.reason || 'Chatbot not available',
      violations: [featureCheck.upgrade_prompt || 'Access denied'],
      cost: {
        energy: 0,
        tokens: 0,
      },
      metadata: {
        decision_time_ms: 0,
        audited: false,
        branch_approvals: ['congress'],
      },
    };
  }

  return await executeWithGovernance(
    userId,
    'chatbot',
    'respond',
    { message, conversation_id: conversationId },
    context
  );
}

/**
 * Get system health for monitoring
 */
export async function getSystemHealth() {
  return await government.getSystemHealth();
}

/**
 * Get compliance score
 */
export async function getComplianceScore() {
  return await government.getComplianceScore();
}

/**
 * Run system audit
 */
export async function runSystemAudit() {
  return await government.runSystemAudit();
}
