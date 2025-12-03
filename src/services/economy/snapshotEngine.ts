/**
 * Snapshot Engine
 * Creates daily/monthly profitability snapshots
 */

import { supabase } from '../../lib/supabase';
import { calculateTierProfitability, calculateRuleOf40 } from './profitabilityEngine';

/**
 * Create daily profitability snapshot
 */
export async function createDailySnapshot() {
  try {
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('tier, status')
      .eq('status', 'active');

    const activeUsers = subscriptions?.length || 0;
    const payingUsers =
      subscriptions?.filter((s) => s.tier !== 'free').length || 0;

    let totalMRR = 0;
    const tierCounts: Record<string, number> = {
      free: 0,
      pro: 0,
      team: 0,
      enterprise: 0,
    };

    subscriptions?.forEach((sub) => {
      tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;
    });

    totalMRR =
      tierCounts.pro * 1299 +
      tierCounts.team * 4990 +
      tierCounts.enterprise * 30000;

    const { data: costs } = await supabase
      .from('user_costs')
      .select('total_cogs')
      .gte(
        'cost_date',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );

    const totalCOGS = costs?.reduce((sum, c) => sum + (c.total_cogs || 0), 0) || 0;

    const totalOPEX = 300000;

    const grossMargin =
      totalMRR > 0 ? ((totalMRR - totalCOGS) / totalMRR) * 100 : 0;
    const netMargin =
      totalMRR > 0 ? ((totalMRR - totalCOGS - totalOPEX) / totalMRR) * 100 : 0;

    const arpu = activeUsers > 0 ? totalMRR / activeUsers : 0;

    const ruleOf40 = await calculateRuleOf40();

    await supabase.from('profitability_snapshots').insert({
      snapshot_date: new Date().toISOString().split('T')[0],
      snapshot_type: 'daily',
      total_mrr: totalMRR,
      total_cogs: totalCOGS,
      total_opex: totalOPEX,
      gross_margin: grossMargin,
      net_margin: netMargin,
      active_users: activeUsers,
      paying_users: payingUsers,
      arpu,
      rule_of_40: ruleOf40,
    });

    console.log('[Snapshot] Daily snapshot created successfully');
  } catch (error) {
    console.error('[Snapshot] Error creating daily snapshot:', error);
  }
}

/**
 * Get latest profitability snapshot
 */
export async function getLatestSnapshot() {
  try {
    const { data } = await supabase
      .from('profitability_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  } catch (error) {
    console.error('[Snapshot] Error getting latest snapshot:', error);
    return null;
  }
}

/**
 * Get snapshot history
 */
export async function getSnapshotHistory(days: number = 30) {
  try {
    const { data } = await supabase
      .from('profitability_snapshots')
      .select('*')
      .gte(
        'snapshot_date',
        new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      )
      .order('snapshot_date', { ascending: true });

    return data || [];
  } catch (error) {
    console.error('[Snapshot] Error getting snapshot history:', error);
    return [];
  }
}
