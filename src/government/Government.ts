/**
 * NexScout Government - Main Interface
 * Coordinates all three branches: President, Congress, Supreme Court
 */

import { masterOrchestrator } from './president/MasterOrchestrator';
import { congress } from './congress/Congress';
import { supremeCourt } from './supremeCourt/AuditEngine';
import type {
  GovernmentRequest,
  GovernmentResponse,
  EngineExecutionRequest,
  SubscriptionTier,
  SystemHealth,
} from './types/government';

export class Government {
  private static instance: Government;

  private constructor() {}

  static getInstance(): Government {
    if (!Government.instance) {
      Government.instance = new Government();
    }
    return Government.instance;
  }

  /**
   * Main entry point for all feature requests
   * Routes through government approval process
   */
  async executeRequest(request: GovernmentRequest): Promise<GovernmentResponse> {
    const startTime = Date.now();

    try {
      const tier = (request.context?.tier || 'free') as SubscriptionTier;

      const executionRequest: EngineExecutionRequest = {
        request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: request.user_id,
        user_tier: tier,
        feature: request.feature,
        engine: this.selectEngineForFeature(request.feature),
        payload: request.payload,
        priority: 'normal',
        require_quality: tier === 'elite' || tier === 'enterprise',
      };

      const result = await masterOrchestrator.executeRequest(executionRequest);

      const auditReport = await supremeCourt.auditExecution(result);

      if (supremeCourt.shouldBlockExecution(auditReport)) {
        return {
          approved: false,
          error: 'Request blocked by Supreme Court due to constitutional violations',
          violations: auditReport.violations.map(v => v.description),
          cost: {
            energy: 0,
            tokens: 0,
          },
          metadata: {
            decision_time_ms: Date.now() - startTime,
            audited: true,
            branch_approvals: ['supreme_court'],
          },
        };
      }

      return {
        approved: result.status === 'success',
        engine: result.engine,
        model: result.model_used,
        result: result.result,
        error: result.error,
        violations: result.violations,
        cost: {
          energy: result.energy_consumed,
          tokens: result.tokens_used,
        },
        metadata: {
          decision_time_ms: Date.now() - startTime,
          audited: true,
          branch_approvals: ['president', 'congress', 'supreme_court'],
        },
      };
    } catch (error) {
      console.error('Government execution error:', error);
      return {
        approved: false,
        error: error instanceof Error ? error.message : 'Government execution failed',
        cost: {
          energy: 0,
          tokens: 0,
        },
        metadata: {
          decision_time_ms: Date.now() - startTime,
          audited: false,
          branch_approvals: [],
        },
      };
    }
  }

  /**
   * Check if user can access a feature
   */
  async checkFeatureAccess(
    userId: string,
    feature: string
  ): Promise<{ allowed: boolean; reason?: string; upgrade_prompt?: string }> {
    return await congress.checkFeaturePermission(userId, feature);
  }

  /**
   * Check if user can use an engine
   */
  async checkEngineAccess(userId: string, engineId: string) {
    return await congress.checkEnginePermission(userId, engineId);
  }

  /**
   * Award coins to user
   */
  async awardCoins(userId: string, action: string, amount?: number): Promise<boolean> {
    return await congress.awardCoins(userId, action, amount);
  }

  /**
   * Deduct coins from user
   */
  async deductCoins(userId: string, action: string, amount?: number): Promise<boolean> {
    return await congress.deductCoins(userId, action, amount);
  }

  /**
   * Get coin cost for action
   */
  getCoinCost(action: string): number {
    return congress.getCoinCost(action);
  }

  /**
   * Get coin earnings for action
   */
  getCoinEarnings(action: string): number {
    return congress.getCoinEarnings(action);
  }

  /**
   * Check rate limits
   */
  async checkRateLimit(
    userId: string,
    limitType: 'api_requests' | 'ai_generations' | 'scans' | 'messages' | 'prospect_actions'
  ) {
    return await congress.checkRateLimit(userId, limitType);
  }

  /**
   * Run system audit
   */
  async runSystemAudit() {
    return await supremeCourt.runSystemAudit();
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth | null> {
    try {
      const presidentHealth = await masterOrchestrator.getSystemHealth();
      const complianceScore = await supremeCourt.getComplianceScore();

      if (!presidentHealth) return null;

      return {
        overall_health_score: Math.round(
          (presidentHealth.overall_health_score + complianceScore) / 2
        ),
        branch_health: {
          president: presidentHealth.overall_health_score,
          congress: 100,
          supreme_court: complianceScore,
        },
        department_health: {
          engineering: 100,
          uiux: 100,
          database: 100,
          security: complianceScore,
          optimization: 100,
          user_experience: 100,
          communication: 100,
          knowledge: 100,
        },
        active_governors: presidentHealth.total_engines,
        total_governors: presidentHealth.total_engines,
        active_violations: presidentHealth.active_violations,
        active_emergencies: presidentHealth.active_emergencies,
        system_load: 50,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
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
  ) {
    return await masterOrchestrator.issueEmergencyOrder(
      orderType,
      reason,
      affectedComponents,
      durationMinutes
    );
  }

  /**
   * Resolve conflict between engines
   */
  async resolveConflict(
    engine1: string,
    engine2: string,
    conflictType: string,
    description: string
  ) {
    return await masterOrchestrator.resolveConflict(engine1, engine2, conflictType, description);
  }

  /**
   * Select appropriate engine for a feature
   */
  private selectEngineForFeature(feature: string): string {
    const engineMap: Record<string, string> = {
      scanning: 'smart_scanner_v3',
      ai_messages: 'messaging_engine_v2',
      ai_pitch_deck: 'pitch_deck_generator',
      elite_coaching: 'coaching_engine',
      company_intelligence: 'company_intelligence_v4',
      deep_scan: 'scout_scoring_v5',
      chatbot: 'chatbot_engine',
      calendar: 'ai_calendar_engine',
      todos: 'ai_todo_engine',
      reminders: 'ai_reminder_engine',
      pipeline: 'conversion_pattern_mapper',
    };

    return engineMap[feature] || 'messaging_engine_v2';
  }

  /**
   * Get compliance score
   */
  async getComplianceScore(): Promise<number> {
    return await supremeCourt.getComplianceScore();
  }
}

export const government = Government.getInstance();
