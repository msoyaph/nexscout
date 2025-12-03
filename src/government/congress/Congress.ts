/**
 * Congress - Rules, Economy, and Permissions Engine
 * Legislative branch of NexScout Government
 */

import { supabase } from '../../lib/supabase';
import type {
  CongressionalLaw,
  EconomyPolicy,
  PermissionsMatrix,
  SubscriptionTier,
  FeatureAccess,
  EngineAccess,
} from '../types/government';
import {
  ECONOMY_POLICY,
  PERMISSIONS_MATRICES,
} from '../config/governmentConfig';

export class Congress {
  private static instance: Congress;
  private cachedLaws: Map<string, CongressionalLaw> = new Map();
  private economyPolicy: EconomyPolicy = ECONOMY_POLICY;

  private constructor() {
    this.loadActiveLaws();
  }

  static getInstance(): Congress {
    if (!Congress.instance) {
      Congress.instance = new Congress();
    }
    return Congress.instance;
  }

  /**
   * Check if user has permission to access a feature
   */
  async checkFeaturePermission(
    userId: string,
    feature: string
  ): Promise<{ allowed: boolean; reason?: string; upgrade_prompt?: string }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      const tier = (profile?.subscription_tier || 'free') as SubscriptionTier;
      const permissions = PERMISSIONS_MATRICES[tier];
      const featureAccess = permissions.features[feature];

      if (!featureAccess) {
        return { allowed: true }; // No restrictions if not defined
      }

      if (!featureAccess.enabled) {
        return {
          allowed: false,
          reason: `Feature '${feature}' not available for ${tier} tier`,
          upgrade_prompt: featureAccess.upgrade_prompt,
        };
      }

      // Check daily limits if applicable
      if (featureAccess.daily_limit) {
        const usageToday = await this.getFeatureUsageToday(userId, feature);
        if (usageToday >= featureAccess.daily_limit) {
          return {
            allowed: false,
            reason: `Daily limit reached for ${feature} (${featureAccess.daily_limit}/day)`,
            upgrade_prompt: featureAccess.upgrade_prompt || 'Upgrade for unlimited access',
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Failed to check feature permission:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Check if user can access an engine
   */
  async checkEnginePermission(
    userId: string,
    engineId: string
  ): Promise<{ allowed: boolean; reason?: string; engine_access?: EngineAccess }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      const tier = (profile?.subscription_tier || 'free') as SubscriptionTier;
      const permissions = PERMISSIONS_MATRICES[tier];
      const engineAccess = permissions.engines[engineId];

      if (!engineAccess) {
        return { allowed: false, reason: `Engine '${engineId}' not defined in permissions matrix` };
      }

      if (!engineAccess.enabled) {
        return {
          allowed: false,
          reason: `Engine '${engineId}' not available for ${tier} tier`,
        };
      }

      return { allowed: true, engine_access: engineAccess };
    } catch (error) {
      console.error('Failed to check engine permission:', error);
      return { allowed: false, reason: 'Permission check failed' };
    }
  }

  /**
   * Check rate limits for user
   */
  async checkRateLimit(
    userId: string,
    limitType: 'api_requests' | 'ai_generations' | 'scans' | 'messages' | 'prospect_actions'
  ): Promise<{ allowed: boolean; limit: number; used: number; reset_in_seconds: number }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .maybeSingle();

      const tier = (profile?.subscription_tier || 'free') as SubscriptionTier;
      const rateLimits = PERMISSIONS_MATRICES[tier].rate_limits;

      let limit = 0;
      let timeWindow = 'hour';
      let used = 0;

      switch (limitType) {
        case 'api_requests':
          limit = rateLimits.api_requests_per_minute;
          timeWindow = 'minute';
          used = await this.getUsageInWindow(userId, limitType, 60);
          break;
        case 'ai_generations':
          limit = rateLimits.ai_generations_per_hour;
          used = await this.getUsageInWindow(userId, limitType, 3600);
          break;
        case 'scans':
          limit = rateLimits.scans_per_day;
          timeWindow = 'day';
          used = await this.getUsageInWindow(userId, limitType, 86400);
          break;
        case 'messages':
          limit = rateLimits.messages_per_day;
          timeWindow = 'day';
          used = await this.getUsageInWindow(userId, limitType, 86400);
          break;
        case 'prospect_actions':
          limit = rateLimits.prospect_actions_per_day;
          timeWindow = 'day';
          used = await this.getUsageInWindow(userId, limitType, 86400);
          break;
      }

      const resetSeconds = timeWindow === 'minute' ? 60 : timeWindow === 'hour' ? 3600 : 86400;

      return {
        allowed: used < limit,
        limit,
        used,
        reset_in_seconds: resetSeconds,
      };
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return { allowed: false, limit: 0, used: 0, reset_in_seconds: 0 };
    }
  }

  /**
   * Calculate coin cost for an action
   */
  getCoinCost(action: string): number {
    return this.economyPolicy.coin_spending_costs[action] || 0;
  }

  /**
   * Calculate coin earnings for an action
   */
  getCoinEarnings(action: string): number {
    return this.economyPolicy.coin_earning_rates[action] || 0;
  }

  /**
   * Get energy regeneration rate
   */
  getEnergyRegenerationRate(): number {
    return this.economyPolicy.energy_regeneration_rate;
  }

  /**
   * Get max energy capacity for tier
   */
  getMaxEnergyCapacity(tier: SubscriptionTier): number {
    return this.economyPolicy.energy_max_capacity[tier];
  }

  /**
   * Check if system is in surge pricing
   */
  async isSurgePricing(): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('government_performance_metrics')
        .select('metric_value')
        .eq('metric_name', 'system_load_percent')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      const systemLoad = data?.metric_value || 0;
      return systemLoad >= this.economyPolicy.surge_pricing_threshold;
    } catch (error) {
      console.error('Failed to check surge pricing:', error);
      return false;
    }
  }

  /**
   * Get surge multiplier
   */
  getSurgeMultiplier(): number {
    return this.economyPolicy.surge_multiplier;
  }

  /**
   * Enact a new law
   */
  async enactLaw(law: Omit<CongressionalLaw, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('government_laws')
        .insert({
          law_type: law.law_type,
          title: law.title,
          description: law.description,
          committee: law.committee,
          version: law.version,
          effective_date: law.effective_date.toISOString(),
          expires_date: law.expires_date?.toISOString(),
          created_by: law.created_by,
          status: law.status,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Insert rules
      if (law.rules && law.rules.length > 0) {
        const rules = law.rules.map(rule => ({
          law_id: data.id,
          rule_id: rule.rule_id,
          condition: rule.condition,
          action: rule.action,
          parameters: rule.parameters,
          priority: rule.priority,
        }));

        await supabase.from('government_law_rules').insert(rules);
      }

      // Reload laws
      await this.loadActiveLaws();

      return data.id;
    } catch (error) {
      console.error('Failed to enact law:', error);
      return null;
    }
  }

  /**
   * Repeal a law
   */
  async repealLaw(lawId: string, reason: string): Promise<boolean> {
    try {
      await supabase
        .from('government_laws')
        .update({ status: 'repealed' })
        .eq('id', lawId);

      await this.loadActiveLaws();
      return true;
    } catch (error) {
      console.error('Failed to repeal law:', error);
      return false;
    }
  }

  /**
   * Load active laws from database
   */
  private async loadActiveLaws(): Promise<void> {
    try {
      const { data: laws } = await supabase
        .from('government_laws')
        .select('*, government_law_rules(*)')
        .eq('status', 'active');

      if (laws) {
        this.cachedLaws.clear();
        for (const law of laws) {
          this.cachedLaws.set(law.id, {
            id: law.id,
            law_type: law.law_type,
            title: law.title,
            description: law.description,
            committee: law.committee,
            rules: law.government_law_rules || [],
            version: law.version,
            effective_date: new Date(law.effective_date),
            expires_date: law.expires_date ? new Date(law.expires_date) : undefined,
            created_by: law.created_by,
            status: law.status,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load laws:', error);
    }
  }

  /**
   * Get feature usage today
   */
  private async getFeatureUsageToday(userId: string, feature: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('government_decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', feature)
        .eq('decision_type', 'approve')
        .gte('timestamp', today.toISOString());

      return count || 0;
    } catch (error) {
      console.error('Failed to get feature usage:', error);
      return 0;
    }
  }

  /**
   * Get usage in time window (seconds)
   */
  private async getUsageInWindow(
    userId: string,
    limitType: string,
    windowSeconds: number
  ): Promise<number> {
    try {
      const windowStart = new Date(Date.now() - windowSeconds * 1000);

      const { count } = await supabase
        .from('government_decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('timestamp', windowStart.toISOString());

      return count || 0;
    } catch (error) {
      console.error('Failed to get usage:', error);
      return 0;
    }
  }

  /**
   * Award coins to user
   */
  async awardCoins(userId: string, action: string, amount?: number): Promise<boolean> {
    try {
      const coins = amount || this.getCoinEarnings(action);
      if (coins <= 0) return false;

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        transaction_type: 'earn',
        amount: coins,
        source: action,
        description: `Earned from ${action}`,
      });

      // Update wallet
      await supabase.rpc('add_coins', {
        p_user_id: userId,
        p_amount: coins,
      });

      return true;
    } catch (error) {
      console.error('Failed to award coins:', error);
      return false;
    }
  }

  /**
   * Deduct coins from user
   */
  async deductCoins(userId: string, action: string, amount?: number): Promise<boolean> {
    try {
      const coins = amount || this.getCoinCost(action);
      if (coins <= 0) return false;

      // Check if user has enough coins
      const { data: wallet } = await supabase
        .from('user_wallet')
        .select('coin_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (!wallet || wallet.coin_balance < coins) {
        return false;
      }

      await supabase.from('coin_transactions').insert({
        user_id: userId,
        transaction_type: 'spend',
        amount: -coins,
        source: action,
        description: `Spent on ${action}`,
      });

      // Update wallet
      await supabase.rpc('deduct_coins', {
        p_user_id: userId,
        p_amount: coins,
      });

      return true;
    } catch (error) {
      console.error('Failed to deduct coins:', error);
      return false;
    }
  }

  /**
   * Check if user can run an orchestrator job
   * Used by Master Orchestrator
   */
  async canUserRunJob(
    jobType: string,
    tier: SubscriptionTier
  ): Promise<{ allowed: boolean; reason?: string }> {
    const permissions = PERMISSIONS_MATRICES[tier];

    const jobFeatureMap: Record<string, string> = {
      'SCAN': 'scanning',
      'MESSAGE': 'ai_messaging',
      'PITCH_DECK': 'pitch_decks',
      'CHATBOT': 'ai_chatbot',
      'FOLLOW_UP': 'follow_ups',
      'COMPANY_INTELLIGENCE': 'company_intel',
      'PUBLIC_CHATBOT': 'public_chatbot',
      'ANALYTICS_QUERY': 'analytics',
    };

    const feature = jobFeatureMap[jobType] || jobType.toLowerCase();
    const featureAccess = permissions.features[feature];

    if (!featureAccess || !featureAccess.enabled) {
      return {
        allowed: false,
        reason: `Feature not available for ${tier} tier`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get job costs for orchestrator
   * Returns energy cost, coin cost, and rate limits
   */
  async getJobCosts(
    jobType: string,
    tier: SubscriptionTier,
    payloadSize?: number
  ): Promise<{
    energyCost: number;
    coinCost: number;
    rateLimitPerHour: number;
    rateLimitPerDay: number;
  } | null> {
    try {
      const { data } = await supabase
        .from('orchestrator_job_costs')
        .select('*')
        .eq('job_type', jobType)
        .eq('tier', tier)
        .eq('is_active', true)
        .maybeSingle();

      if (!data) return null;

      return {
        energyCost: data.energy_cost_base,
        coinCost: data.coin_cost_base,
        rateLimitPerHour: data.rate_limit_per_hour,
        rateLimitPerDay: data.rate_limit_per_day,
      };
    } catch (error) {
      console.error('Failed to get job costs:', error);
      return null;
    }
  }

  /**
   * Get rate limits for a specific job type
   */
  async getRateLimits(
    jobType: string,
    tier: SubscriptionTier
  ): Promise<{ perHour: number; perDay: number }> {
    try {
      const { data } = await supabase
        .from('orchestrator_job_costs')
        .select('rate_limit_per_hour, rate_limit_per_day')
        .eq('job_type', jobType)
        .eq('tier', tier)
        .eq('is_active', true)
        .maybeSingle();

      return {
        perHour: data?.rate_limit_per_hour || 10,
        perDay: data?.rate_limit_per_day || 50,
      };
    } catch (error) {
      console.error('Failed to get rate limits:', error);
      return { perHour: 10, perDay: 50 };
    }
  }
}

// Export singleton instance
export const congress = Congress.getInstance();
