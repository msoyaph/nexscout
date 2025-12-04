/**
 * MLM MEMBER SERVICE
 *
 * Service for managing MLM member data, ranks, and statistics
 */

import { supabase } from '../lib/supabase';

export interface MLMMemberStats {
  rank: string;
  personalVolume: number;
  teamVolume: number;
  activeFrontlineCount: number;
  totalDownlineCount: number;
}

/**
 * Get member rank
 */
export async function getMemberRank(memberId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('mlm_members')
      .select('current_rank')
      .eq('id', memberId)
      .maybeSingle();

    if (error || !data) {
      return 'Starter';
    }

    return data.current_rank || 'Starter';
  } catch (error) {
    console.error('Get member rank error:', error);
    return 'Starter';
  }
}

/**
 * Get member statistics
 */
export async function getMemberStats(memberId: string): Promise<MLMMemberStats> {
  try {
    const { data: member } = await supabase
      .from('mlm_members')
      .select('current_rank')
      .eq('id', memberId)
      .maybeSingle();

    // Calculate team volume (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: teamVolume } = await supabase.rpc('calculate_team_volume', {
      member_id_param: memberId,
      start_date: thirtyDaysAgo.toISOString(),
      end_date: new Date().toISOString(),
    });

    // Get personal sales volume
    const { data: personalSales } = await supabase
      .from('mlm_sales')
      .select('amount')
      .eq('member_id', memberId)
      .gte('sale_date', thirtyDaysAgo.toISOString())
      .eq('status', 'completed');

    const personalVolume = personalSales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

    // Get downline counts
    const { data: relationships } = await supabase
      .from('mlm_relationships')
      .select('level, downline_id')
      .eq('sponsor_id', memberId);

    const activeFrontlineCount = relationships?.filter(r => r.level === 1).length || 0;
    const totalDownlineCount = relationships?.length || 0;

    return {
      rank: member?.current_rank || 'Starter',
      personalVolume,
      teamVolume: teamVolume || 0,
      activeFrontlineCount,
      totalDownlineCount,
    };
  } catch (error) {
    console.error('Get member stats error:', error);
    return {
      rank: 'Starter',
      personalVolume: 0,
      teamVolume: 0,
      activeFrontlineCount: 0,
      totalDownlineCount: 0,
    };
  }
}
