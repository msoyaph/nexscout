/**
 * Admin ROI Engine
 * Provides comprehensive financial overview for business owners
 */

import { supabase } from '../../lib/supabase';

export interface AdminRoiOverview {
  mrrTotal: number;
  mrrNew: number;
  mrrChurn: number;
  mrrExpansion: number;
  grossMargin: number;
  ruleOf40: number;
  tokenCost: number;
  apiCost: number;
  serverCost: number;
  energyRevenue: number;
  coinRevenue: number;
  subscriptionRevenue: number;
  charts: {
    mrrOverTime: Array<{ date: string; free: number; pro: number; team: number; enterprise: number }>;
    newVsChurnVsExpansion: Array<{ month: string; new: number; churn: number; expansion: number }>;
    tokenVsRevenue: Array<{ date: string; tokenCost: number; revenue: number }>;
  };
  tierProfitability: Array<{
    tier: string;
    activeUsers: number;
    mrr: number;
    cogs: number;
    grossMargin: number;
    ltv: number;
    cac: number;
    ltvCacRatio: number;
  }>;
}

/**
 * Get comprehensive ROI overview for admins
 */
export async function getAdminRoiOverview(
  periodDays: number = 30
): Promise<AdminRoiOverview> {
  try {
    const latest = await getLatestProfitSnapshot();
    const tierProf = await getTierProfitability(periodDays);
    const charts = await getProfitabilityCharts(periodDays);

    return {
      mrrTotal: latest?.mrr_total || 0,
      mrrNew: latest?.mrr_new || 0,
      mrrChurn: latest?.mrr_churn || 0,
      mrrExpansion: latest?.mrr_expansion || 0,
      grossMargin: latest?.gross_margin || 0,
      ruleOf40: latest?.rule_of_40 || 0,
      tokenCost: latest?.token_cost || 0,
      apiCost: latest?.api_cost || 0,
      serverCost: latest?.server_cost || 0,
      energyRevenue: latest?.energy_revenue || 0,
      coinRevenue: latest?.coin_revenue || 0,
      subscriptionRevenue: latest?.subscription_revenue || 0,
      charts,
      tierProfitability: tierProf,
    };
  } catch (error) {
    console.error('[AdminROI] Error getting overview:', error);
    throw error;
  }
}

/**
 * Get latest profit snapshot
 */
async function getLatestProfitSnapshot() {
  const { data } = await supabase
    .from('profit_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Get tier profitability metrics
 */
export async function getTierProfitability(periodDays: number = 30) {
  try {
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data } = await supabase
      .from('tier_profitability_v2')
      .select('*')
      .gte('period_start', periodStart)
      .order('tier');

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((t) => ({
      tier: t.tier,
      activeUsers: t.active_users,
      mrr: t.mrr,
      cogs: t.cogs,
      grossMargin: t.gross_margin,
      ltv: t.ltv,
      cac: t.cac,
      ltvCacRatio: t.ltv_cac_ratio,
    }));
  } catch (error) {
    console.error('[AdminROI] Error getting tier profitability:', error);
    return [];
  }
}

/**
 * Get profitability charts data
 */
async function getProfitabilityCharts(periodDays: number) {
  try {
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const { data: snapshots } = await supabase
      .from('profit_snapshots')
      .select('*')
      .gte('snapshot_date', periodStart)
      .order('snapshot_date');

    const mrrOverTime = snapshots?.map((s) => ({
      date: s.snapshot_date,
      free: 0,
      pro: s.subscription_revenue * 0.3,
      team: s.subscription_revenue * 0.5,
      enterprise: s.subscription_revenue * 0.2,
    })) || [];

    const newVsChurnVsExpansion = snapshots?.map((s) => ({
      month: s.snapshot_date,
      new: s.mrr_new,
      churn: s.mrr_churn,
      expansion: s.mrr_expansion,
    })) || [];

    const tokenVsRevenue = snapshots?.map((s) => ({
      date: s.snapshot_date,
      tokenCost: s.token_cost,
      revenue: s.mrr_total,
    })) || [];

    return {
      mrrOverTime,
      newVsChurnVsExpansion,
      tokenVsRevenue,
    };
  } catch (error) {
    console.error('[AdminROI] Error getting charts:', error);
    return {
      mrrOverTime: [],
      newVsChurnVsExpansion: [],
      tokenVsRevenue: [],
    };
  }
}

/**
 * Create daily profit snapshot
 */
export async function createDailyProfitSnapshot() {
  try {
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier, price, status');

    const activeSubs = subscriptions?.filter((s) => s.status === 'active') || [];

    const mrrTotal = activeSubs.reduce((sum, s) => sum + (s.price || 0), 0);

    const { data: costs } = await supabase
      .from('user_costs')
      .select('total_cogs, llm_token_cost, api_cost, server_cost')
      .gte('cost_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const tokenCost = costs?.reduce((sum, c) => sum + (c.llm_token_cost || 0), 0) || 0;
    const apiCost = costs?.reduce((sum, c) => sum + (c.api_cost || 0), 0) || 0;
    const serverCost = costs?.reduce((sum, c) => sum + (c.server_cost || 0), 0) || 0;
    const totalCogs = costs?.reduce((sum, c) => sum + (c.total_cogs || 0), 0) || 0;

    const { data: energyPurchases } = await supabase
      .from('coin_transactions')
      .select('amount_php')
      .eq('transaction_type', 'purchase')
      .eq('currency_type', 'energy')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const energyRevenue = energyPurchases?.reduce((sum, p) => sum + (p.amount_php || 0), 0) || 0;

    const { data: coinPurchases } = await supabase
      .from('coin_transactions')
      .select('amount_php')
      .eq('transaction_type', 'purchase')
      .eq('currency_type', 'coins')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const coinRevenue = coinPurchases?.reduce((sum, p) => sum + (p.amount_php || 0), 0) || 0;

    const grossMargin = mrrTotal > 0 ? ((mrrTotal - totalCogs) / mrrTotal) * 100 : 0;

    await supabase.from('profit_snapshots').upsert({
      snapshot_date: new Date().toISOString().split('T')[0],
      mrr_total: mrrTotal,
      mrr_new: 0,
      mrr_churn: 0,
      mrr_expansion: 0,
      gross_margin: grossMargin,
      rule_of_40: 0,
      token_cost: tokenCost,
      api_cost: apiCost,
      server_cost: serverCost,
      energy_revenue: energyRevenue,
      coin_revenue: coinRevenue,
      subscription_revenue: mrrTotal,
    });

    console.log('[AdminROI] Daily profit snapshot created');
  } catch (error) {
    console.error('[AdminROI] Error creating snapshot:', error);
  }
}

/**
 * Get top profitable users
 */
export async function getTopProfitableUsers(limit: number = 10) {
  try {
    const { data } = await supabase
      .from('agent_profitability')
      .select('user_id, total_revenue, total_cogs, contribution_margin, profitability_score')
      .order('contribution_margin', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('[AdminROI] Error getting top profitable users:', error);
    return [];
  }
}

/**
 * Get most expensive users (high COGS)
 */
export async function getMostExpensiveUsers(limit: number = 10) {
  try {
    const { data } = await supabase
      .from('user_costs')
      .select('user_id, total_cogs, llm_token_cost')
      .order('total_cogs', { ascending: false })
      .limit(limit);

    return data || [];
  } catch (error) {
    console.error('[AdminROI] Error getting expensive users:', error);
    return [];
  }
}
