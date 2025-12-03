/**
 * Profitability Engine
 * Tracks unit economics, calculates LTV, CAC, Rule of 40, and profitability metrics
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TOKEN COST CONSTANTS
// ============================================================================

const TOKEN_COSTS = {
  'gpt-4o': {
    input: 0.000005,
    output: 0.000015,
  },
  'gpt-4o-mini': {
    input: 0.00000015,
    output: 0.0000006,
  },
  'gpt-3.5-turbo': {
    input: 0.0000005,
    output: 0.0000015,
  },
};

const TIER_PRICING_PHP = {
  free: 0,
  pro: 1299,
  team: 4990,
  enterprise: 30000,
};

const EXPECTED_RETENTION_MONTHS = {
  free: 0,
  pro: 12,
  team: 18,
  enterprise: 30,
};

// ============================================================================
// USER-LEVEL CALCULATIONS
// ============================================================================

/**
 * Calculate user's token costs for a period
 */
export async function calculateUserTokenCost(
  userId: string,
  days: number = 30
): Promise<number> {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data: logs } = await supabase
      .from('llm_usage_logs')
      .select('actual_cost')
      .eq('user_id', userId)
      .gte('created_at', since);

    return logs?.reduce((sum, log) => sum + (log.actual_cost || 0), 0) || 0;
  } catch (error) {
    console.error('[Profitability] Error calculating token cost:', error);
    return 0;
  }
}

/**
 * Calculate total COGS for a user
 */
export async function calculateUserCOGS(
  userId: string,
  days: number = 30
): Promise<number> {
  try {
    const tokenCost = await calculateUserTokenCost(userId, days);

    const { data: apiCosts } = await supabase
      .from('api_calls_cost')
      .select('total_cost')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    const apiCost = apiCosts?.reduce((sum, c) => sum + (c.total_cost || 0), 0) || 0;

    const serverCost = 2;
    const storageCost = 1;

    const totalCOGS = tokenCost + apiCost + serverCost + storageCost;

    await supabase.from('user_costs').upsert({
      user_id: userId,
      cost_date: new Date().toISOString().split('T')[0],
      llm_token_cost: tokenCost,
      api_cost: apiCost,
      server_cost: serverCost,
      storage_cost: storageCost,
      total_cogs: totalCOGS,
    });

    return totalCOGS;
  } catch (error) {
    console.error('[Profitability] Error calculating COGS:', error);
    return 0;
  }
}

/**
 * Calculate user's MRR contribution
 */
export async function calculateUserMRR(userId: string): Promise<number> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) return 0;

    return TIER_PRICING_PHP[subscription.tier as keyof typeof TIER_PRICING_PHP] || 0;
  } catch (error) {
    console.error('[Profitability] Error calculating MRR:', error);
    return 0;
  }
}

/**
 * Calculate user's gross margin
 */
export async function calculateUserGrossMargin(userId: string): Promise<number> {
  try {
    const mrr = await calculateUserMRR(userId);
    const cogs = await calculateUserCOGS(userId, 30);

    if (mrr === 0) return 0;

    return ((mrr - cogs) / mrr) * 100;
  } catch (error) {
    console.error('[Profitability] Error calculating gross margin:', error);
    return 0;
  }
}

/**
 * Calculate user's LTV
 */
export async function calculateUserLTV(userId: string): Promise<number> {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription) return 0;

    const tier = subscription.tier as keyof typeof TIER_PRICING_PHP;
    const mrr = TIER_PRICING_PHP[tier];
    const expectedMonths = EXPECTED_RETENTION_MONTHS[tier];
    const grossMargin = (await calculateUserGrossMargin(userId)) / 100;

    const ltv = mrr * expectedMonths * grossMargin;

    await supabase.from('ltv_logs').insert({
      user_id: userId,
      months_retained: expectedMonths,
      total_revenue: mrr * expectedMonths,
      estimated_ltv: ltv,
    });

    return ltv;
  } catch (error) {
    console.error('[Profitability] Error calculating LTV:', error);
    return 0;
  }
}

/**
 * Get user's CAC
 */
export async function calculateUserCAC(userId: string): Promise<number> {
  try {
    const { data: cacLog } = await supabase
      .from('cac_logs')
      .select('cost')
      .eq('user_id', userId)
      .maybeSingle();

    return cacLog?.cost || 0;
  } catch (error) {
    console.error('[Profitability] Error calculating CAC:', error);
    return 0;
  }
}

/**
 * Calculate user's contribution margin
 */
export async function calculateUserContributionMargin(userId: string): Promise<number> {
  try {
    const mrr = await calculateUserMRR(userId);
    const cogs = await calculateUserCOGS(userId, 30);

    return mrr - cogs;
  } catch (error) {
    console.error('[Profitability] Error calculating contribution margin:', error);
    return 0;
  }
}

// ============================================================================
// TIER-LEVEL CALCULATIONS
// ============================================================================

/**
 * Calculate profitability metrics for a tier
 */
export async function calculateTierProfitability(tier: string) {
  try {
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('tier', tier)
      .eq('status', 'active');

    if (!subscriptions || subscriptions.length === 0) {
      return {
        tier,
        userCount: 0,
        totalRevenue: 0,
        totalCOGS: 0,
        grossMargin: 0,
        avgCOGSPerUser: 0,
        avgRevenuePerUser: 0,
        avgContributionMargin: 0,
      };
    }

    const userCount = subscriptions.length;
    const revenue = TIER_PRICING_PHP[tier as keyof typeof TIER_PRICING_PHP];
    const totalRevenue = revenue * userCount;

    let totalCOGS = 0;
    for (const sub of subscriptions) {
      const cogs = await calculateUserCOGS(sub.user_id, 30);
      totalCOGS += cogs;
    }

    const grossMargin = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;
    const avgCOGSPerUser = userCount > 0 ? totalCOGS / userCount : 0;
    const avgRevenuePerUser = revenue;
    const avgContributionMargin = avgRevenuePerUser - avgCOGSPerUser;

    await supabase.from('tier_profitability').upsert({
      tier,
      period_date: new Date().toISOString().split('T')[0],
      user_count: userCount,
      total_revenue: totalRevenue,
      total_cogs: totalCOGS,
      gross_margin: grossMargin,
      avg_cogs_per_user: avgCOGSPerUser,
      avg_revenue_per_user: avgRevenuePerUser,
      avg_contribution_margin: avgContributionMargin,
    });

    return {
      tier,
      userCount,
      totalRevenue,
      totalCOGS,
      grossMargin,
      avgCOGSPerUser,
      avgRevenuePerUser,
      avgContributionMargin,
    };
  } catch (error) {
    console.error('[Profitability] Error calculating tier profitability:', error);
    return null;
  }
}

// ============================================================================
// PLATFORM-LEVEL CALCULATIONS
// ============================================================================

/**
 * Calculate Rule of 40
 */
export async function calculateRuleOf40(): Promise<number> {
  try {
    const { data: snapshots } = await supabase
      .from('profitability_snapshots')
      .select('total_mrr, net_margin, snapshot_date')
      .order('snapshot_date', { ascending: false })
      .limit(2);

    if (!snapshots || snapshots.length < 2) return 0;

    const currentMRR = snapshots[0].total_mrr;
    const previousMRR = snapshots[1].total_mrr;

    const growthRate = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;
    const netMargin = snapshots[0].net_margin || 0;

    return growthRate + netMargin;
  } catch (error) {
    console.error('[Profitability] Error calculating Rule of 40:', error);
    return 0;
  }
}

/**
 * Calculate break-even point
 */
export async function calculateBreakEvenPoint(fixedCostsMonthly: number = 300000) {
  try {
    const proMetrics = await calculateTierProfitability('pro');

    if (!proMetrics || proMetrics.avgContributionMargin <= 0) {
      return {
        proUsersNeeded: Infinity,
        message: 'Cannot calculate - negative contribution margin',
      };
    }

    const proUsersNeeded = Math.ceil(fixedCostsMonthly / proMetrics.avgContributionMargin);

    return {
      proUsersNeeded,
      currentProUsers: proMetrics.userCount,
      isBreakEven: proMetrics.userCount >= proUsersNeeded,
      message: `Need ${proUsersNeeded} Pro users to break even`,
    };
  } catch (error) {
    console.error('[Profitability] Error calculating break-even:', error);
    return null;
  }
}

/**
 * Suggest pricing adjustments based on data
 */
export async function suggestPricingAdjustments() {
  try {
    const tiers = ['free', 'pro', 'team', 'enterprise'];
    const suggestions = [];

    for (const tier of tiers) {
      const metrics = await calculateTierProfitability(tier);

      if (metrics && metrics.grossMargin < 70) {
        suggestions.push({
          tier,
          issue: 'Low gross margin',
          suggestion: 'Increase price or reduce COGS',
          currentMargin: metrics.grossMargin,
        });
      }

      if (metrics && metrics.avgCOGSPerUser > metrics.avgRevenuePerUser * 0.3) {
        suggestions.push({
          tier,
          issue: 'High COGS ratio',
          suggestion: 'Optimize token usage or implement energy caps',
          cogsRatio: (metrics.avgCOGSPerUser / metrics.avgRevenuePerUser) * 100,
        });
      }
    }

    return suggestions;
  } catch (error) {
    console.error('[Profitability] Error suggesting pricing adjustments:', error);
    return [];
  }
}

/**
 * Flag high-cost users
 */
export async function flagHighCostUsers(threshold: number = 500): Promise<any[]> {
  try {
    const { data: costs } = await supabase
      .from('user_costs')
      .select('user_id, total_cogs')
      .gte('total_cogs', threshold)
      .gte('cost_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    return costs || [];
  } catch (error) {
    console.error('[Profitability] Error flagging high-cost users:', error);
    return [];
  }
}

/**
 * Log LLM token usage
 */
export async function logLLMUsage(params: {
  userId: string;
  engineId: string;
  jobType: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}) {
  try {
    const totalTokens = params.promptTokens + params.completionTokens;
    const modelCosts = TOKEN_COSTS[params.model as keyof typeof TOKEN_COSTS];

    if (!modelCosts) {
      console.warn(`[Profitability] Unknown model: ${params.model}`);
      return;
    }

    const cost =
      params.promptTokens * modelCosts.input +
      params.completionTokens * modelCosts.output;

    await supabase.from('llm_usage_logs').insert({
      user_id: params.userId,
      engine_id: params.engineId,
      job_type: params.jobType,
      model_used: params.model,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: totalTokens,
      estimated_cost: cost,
      actual_cost: cost,
    });
  } catch (error) {
    console.error('[Profitability] Error logging LLM usage:', error);
  }
}
