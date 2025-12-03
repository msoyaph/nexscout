/**
 * Agent Profitability Engine
 * Tracks per-agent economics and performance
 */

import { supabase } from '../../lib/supabase';

export interface AgentLeaderboardEntry {
  userId: string;
  userName: string;
  tier: string;
  totalRevenue: number;
  totalCogs: number;
  contributionMargin: number;
  profitabilityScore: number;
  dealsClosedCount: number;
  dealRevenue: number;
  referralRevenue: number;
  tokenCost: number;
  energyUsed: number;
}

export interface AgentProfitDetail {
  userId: string;
  userName: string;
  tier: string;
  kpis: {
    profit: number;
    deals: number;
    tokenCost: number;
    energyUsed: number;
  };
  charts: {
    costVsRevenueOverTime: Array<{ date: string; cost: number; revenue: number }>;
    featureCostBreakdown: Array<{ feature: string; cost: number }>;
  };
  coachingInsights: string[];
}

/**
 * Get agent leaderboard
 */
export async function getAgentLeaderboard(
  periodDays: number = 30,
  filters?: { tier?: string; minScore?: number }
): Promise<AgentLeaderboardEntry[]> {
  try {
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    let query = supabase
      .from('agent_profitability')
      .select(`
        user_id,
        tier,
        total_revenue,
        total_cogs,
        contribution_margin,
        profitability_score,
        deal_revenue,
        referral_revenue,
        token_cost,
        energy_used
      `)
      .gte('period_start', periodStart)
      .order('profitability_score', { ascending: false });

    if (filters?.tier) {
      query = query.eq('tier', filters.tier);
    }

    if (filters?.minScore) {
      query = query.gte('profitability_score', filters.minScore);
    }

    const { data } = await query;

    if (!data) return [];

    const leaderboard: AgentLeaderboardEntry[] = await Promise.all(
      data.map(async (agent) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', agent.user_id)
          .maybeSingle();

        return {
          userId: agent.user_id,
          userName: profile?.full_name || 'Unknown',
          tier: agent.tier,
          totalRevenue: agent.total_revenue,
          totalCogs: agent.total_cogs,
          contributionMargin: agent.contribution_margin,
          profitabilityScore: agent.profitability_score,
          dealsClosedCount: 0,
          dealRevenue: agent.deal_revenue,
          referralRevenue: agent.referral_revenue,
          tokenCost: agent.token_cost,
          energyUsed: agent.energy_used,
        };
      })
    );

    return leaderboard;
  } catch (error) {
    console.error('[AgentProfit] Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get detailed profitability for specific agent
 */
export async function getAgentProfitDetail(
  userId: string,
  periodDays: number = 30
): Promise<AgentProfitDetail | null> {
  try {
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: agent } = await supabase
      .from('agent_profitability')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', periodStart)
      .maybeSingle();

    if (!agent) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    const { data: costs } = await supabase
      .from('user_costs')
      .select('cost_date, total_cogs, llm_token_cost')
      .eq('user_id', userId)
      .gte('cost_date', periodStart)
      .order('cost_date');

    const costVsRevenueOverTime = costs?.map((c) => ({
      date: c.cost_date,
      cost: c.total_cogs,
      revenue: agent.total_revenue / (costs?.length || 1),
    })) || [];

    const { data: llmLogs } = await supabase
      .from('llm_usage_logs')
      .select('engine_id, actual_cost')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString());

    const featureCostBreakdown = Object.entries(
      llmLogs?.reduce((acc: Record<string, number>, log) => {
        acc[log.engine_id] = (acc[log.engine_id] || 0) + log.actual_cost;
        return acc;
      }, {}) || {}
    ).map(([feature, cost]) => ({
      feature,
      cost: cost as number,
    }));

    const coachingInsights = generateCoachingInsights(agent, featureCostBreakdown);

    return {
      userId: agent.user_id,
      userName: profile?.full_name || 'Unknown',
      tier: agent.tier,
      kpis: {
        profit: agent.contribution_margin,
        deals: 0,
        tokenCost: agent.token_cost,
        energyUsed: agent.energy_used,
      },
      charts: {
        costVsRevenueOverTime,
        featureCostBreakdown,
      },
      coachingInsights,
    };
  } catch (error) {
    console.error('[AgentProfit] Error getting agent detail:', error);
    return null;
  }
}

/**
 * Generate AI coaching insights
 */
function generateCoachingInsights(
  agent: any,
  featureBreakdown: Array<{ feature: string; cost: number }>
): string[] {
  const insights: string[] = [];

  if (agent.contribution_margin < 0) {
    insights.push('⚠️ Agent is unprofitable. Consider limiting expensive features.');
  }

  if (agent.token_cost > agent.total_revenue * 0.3) {
    insights.push('💡 Token costs are high (>30% of revenue). Suggest using energy-efficient features.');
  }

  const highestCostFeature = featureBreakdown.sort((a, b) => b.cost - a.cost)[0];
  if (highestCostFeature && highestCostFeature.cost > agent.token_cost * 0.5) {
    insights.push(
      `📊 ${highestCostFeature.feature} accounts for ${Math.round((highestCostFeature.cost / agent.token_cost) * 100)}% of token costs.`
    );
  }

  if (agent.referral_revenue > 0) {
    insights.push(
      `🎯 Referral revenue: ₱${agent.referral_revenue}. Great network effect!`
    );
  }

  if (agent.profitability_score > 80) {
    insights.push('⭐ Top performer! This agent is highly profitable.');
  }

  return insights;
}

/**
 * Calculate and update agent profitability for all users
 */
export async function updateAllAgentProfitability(periodDays: number = 30) {
  try {
    const { data: users } = await supabase
      .from('user_subscriptions')
      .select('user_id, tier, price')
      .eq('status', 'active');

    if (!users) return;

    for (const user of users) {
      await updateAgentProfitability(user.user_id, periodDays);
    }

    console.log('[AgentProfit] Updated profitability for all agents');
  } catch (error) {
    console.error('[AgentProfit] Error updating all agents:', error);
  }
}

/**
 * Update profitability for a single agent
 */
async function updateAgentProfitability(userId: string, periodDays: number) {
  try {
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const periodEnd = new Date().toISOString().split('T')[0];

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier, price')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const subscriptionRevenue = subscription?.price || 0;

    const { data: costs } = await supabase
      .from('user_costs')
      .select('total_cogs, llm_token_cost, api_cost')
      .eq('user_id', userId)
      .gte('cost_date', periodStart);

    const totalCogs = costs?.reduce((sum, c) => sum + (c.total_cogs || 0), 0) || 0;
    const tokenCost = costs?.reduce((sum, c) => sum + (c.llm_token_cost || 0), 0) || 0;
    const apiCost = costs?.reduce((sum, c) => sum + (c.api_cost || 0), 0) || 0;

    const { data: energy } = await supabase
      .from('user_energy')
      .select('energy_used')
      .eq('user_id', userId)
      .maybeSingle();

    const contributionMargin = subscriptionRevenue - totalCogs;
    const profitabilityScore = Math.max(
      0,
      Math.min(100, (contributionMargin / (subscriptionRevenue || 1)) * 100)
    );

    await supabase.from('agent_profitability').upsert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      tier: subscription?.tier || 'free',
      token_cost: tokenCost,
      api_cost: apiCost,
      energy_used: energy?.energy_used || 0,
      subscription_revenue: subscriptionRevenue,
      total_revenue: subscriptionRevenue,
      total_cogs: totalCogs,
      contribution_margin: contributionMargin,
      profitability_score: profitabilityScore,
    });
  } catch (error) {
    console.error(`[AgentProfit] Error updating agent ${userId}:`, error);
  }
}
