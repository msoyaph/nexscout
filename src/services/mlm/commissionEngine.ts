/**
 * MLM COMMISSION ENGINE
 *
 * Handles commission calculations for MLM compensation plans
 * Supports:
 * - Uni-level
 * - Binary
 * - Matrix
 * - Hybrid plans
 */

import { supabase } from '../../lib/supabase';

// ========================================
// TYPES
// ========================================

export interface CommissionRule {
  id: string;
  plan_name: string;
  plan_type: 'unilevel' | 'binary' | 'matrix' | 'hybrid';
  level: number;
  commission_rate: number;
  rank_required?: string;
  volume_required?: number;
}

export interface MLMMember {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  current_rank?: string;
  status: string;
}

export interface MLMSale {
  id: string;
  user_id: string;
  member_id: string;
  amount: number;
  currency: string;
  product_name?: string;
  sale_date: string;
  status: string;
}

export interface UplineMember {
  member_id: string;
  level: number;
  full_name: string;
  current_rank?: string;
}

export interface CommissionCalculation {
  sale_id: string;
  earner_id: string;
  level: number;
  commission_amount: number;
  commission_rate: number;
}

// ========================================
// MLM COMMISSION ENGINE
// ========================================

export class MLMCommissionEngine {
  /**
   * Calculate commissions for a sale (uni-level)
   */
  async calculateCommissionsForSale(saleId: string): Promise<CommissionCalculation[]> {
    // Get sale details
    const { data: sale, error: saleError } = await supabase
      .from('mlm_sales')
      .select('*')
      .eq('id', saleId)
      .maybeSingle();

    if (saleError || !sale) {
      console.error('Error fetching sale:', saleError);
      return [];
    }

    // Get buyer member
    const { data: buyerMember } = await supabase
      .from('mlm_members')
      .select('*')
      .eq('id', sale.member_id)
      .maybeSingle();

    if (!buyerMember) {
      console.error('Buyer member not found');
      return [];
    }

    // Get upline chain
    const uplineChain = await this.getUplineChain(buyerMember.id);

    // Get commission rules
    const { data: rules } = await supabase
      .from('mlm_commission_rules')
      .select('*')
      .eq('user_id', sale.user_id)
      .eq('is_active', true)
      .order('level', { ascending: true });

    if (!rules || rules.length === 0) {
      console.error('No commission rules found');
      return [];
    }

    // Calculate commissions
    const commissions: CommissionCalculation[] = [];

    for (const uplineMember of uplineChain) {
      // Find matching rule for this level
      const rule = rules.find(r => r.level === uplineMember.level);
      if (!rule) continue;

      // Check rank requirement
      if (rule.rank_required && uplineMember.current_rank !== rule.rank_required) {
        // Skip if rank doesn't match
        const rankOrder = await this.getRankOrder(sale.user_id, uplineMember.current_rank || '');
        const requiredRankOrder = await this.getRankOrder(sale.user_id, rule.rank_required);

        if (rankOrder < requiredRankOrder) {
          continue; // Rank not high enough
        }
      }

      // Calculate commission amount
      const commissionAmount = (sale.amount * rule.commission_rate) / 100;

      commissions.push({
        sale_id: sale.id,
        earner_id: uplineMember.member_id,
        level: uplineMember.level,
        commission_amount: commissionAmount,
        commission_rate: rule.commission_rate
      });
    }

    // Insert commissions into database
    if (commissions.length > 0) {
      await this.insertCommissions(sale.user_id, commissions);
    }

    return commissions;
  }

  /**
   * Get upline chain for a member
   */
  async getUplineChain(memberId: string, maxLevels: number = 10): Promise<UplineMember[]> {
    const { data, error } = await supabase.rpc('get_upline_chain', {
      member_id_param: memberId,
      max_levels: maxLevels
    });

    if (error) {
      console.error('Error getting upline chain:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Insert commissions into database
   */
  private async insertCommissions(userId: string, commissions: CommissionCalculation[]): Promise<void> {
    const records = commissions.map(c => ({
      user_id: userId,
      sale_id: c.sale_id,
      earner_id: c.earner_id,
      level: c.level,
      commission_amount: c.commission_amount,
      commission_rate: c.commission_rate,
      calculated_at: new Date().toISOString(),
      paid_out: false
    }));

    const { error } = await supabase
      .from('mlm_commissions')
      .insert(records);

    if (error) {
      console.error('Error inserting commissions:', error);
    }
  }

  /**
   * Get rank order (for comparison)
   */
  private async getRankOrder(userId: string, rankName: string): Promise<number> {
    const { data } = await supabase
      .from('mlm_ranks')
      .select('rank_order')
      .eq('user_id', userId)
      .eq('rank_name', rankName)
      .maybeSingle();

    return data?.rank_order || 0;
  }

  /**
   * Calculate team volume for a member
   */
  async calculateTeamVolume(
    memberId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_team_volume', {
      member_id_param: memberId,
      start_date: startDate,
      end_date: endDate
    });

    if (error) {
      console.error('Error calculating team volume:', error);
      return 0;
    }

    return data || 0;
  }

  /**
   * Get unpaid commissions for a member
   */
  async getUnpaidCommissions(userId: string, memberId: string): Promise<{
    total: number;
    commissions: any[];
  }> {
    const { data, error } = await supabase
      .from('mlm_commissions')
      .select('*, mlm_sales(amount, product_name, sale_date)')
      .eq('user_id', userId)
      .eq('earner_id', memberId)
      .eq('paid_out', false)
      .order('calculated_at', { ascending: false });

    if (error || !data) {
      return { total: 0, commissions: [] };
    }

    const total = data.reduce((sum, c) => sum + (c.commission_amount || 0), 0);

    return { total, commissions: data };
  }

  /**
   * Mark commissions as paid
   */
  async markCommissionsAsPaid(
    userId: string,
    commissionIds: string[],
    paymentReference: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('mlm_commissions')
      .update({
        paid_out: true,
        paid_at: new Date().toISOString(),
        payment_reference: paymentReference
      })
      .eq('user_id', userId)
      .in('id', commissionIds);

    return !error;
  }

  /**
   * Get commission summary by period
   */
  async getCommissionSummary(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalEarned: number;
    totalPaid: number;
    totalUnpaid: number;
    countByLevel: Record<number, { count: number; amount: number }>;
  }> {
    const { data, error } = await supabase
      .from('mlm_commissions')
      .select('*')
      .eq('user_id', userId)
      .gte('calculated_at', startDate)
      .lte('calculated_at', endDate);

    if (error || !data) {
      return {
        totalEarned: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        countByLevel: {}
      };
    }

    const totalEarned = data.reduce((sum, c) => sum + c.commission_amount, 0);
    const totalPaid = data.filter(c => c.paid_out).reduce((sum, c) => sum + c.commission_amount, 0);
    const totalUnpaid = totalEarned - totalPaid;

    const countByLevel: Record<number, { count: number; amount: number }> = {};
    for (const comm of data) {
      if (!countByLevel[comm.level]) {
        countByLevel[comm.level] = { count: 0, amount: 0 };
      }
      countByLevel[comm.level].count++;
      countByLevel[comm.level].amount += comm.commission_amount;
    }

    return {
      totalEarned,
      totalPaid,
      totalUnpaid,
      countByLevel
    };
  }

  /**
   * Get genealogy tree
   */
  async getGenealogy(userId: string, memberId: string, maxDepth: number = 5): Promise<any> {
    const { data: relationships, error } = await supabase
      .from('mlm_relationships')
      .select(`
        *,
        downline:mlm_members!mlm_relationships_downline_id_fkey(
          id,
          full_name,
          email,
          current_rank,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('sponsor_id', memberId)
      .lte('level', maxDepth)
      .order('level', { ascending: true });

    if (error || !relationships) {
      return { member_id: memberId, downlines: [] };
    }

    // Build tree structure
    const tree: any = {
      member_id: memberId,
      downlines: []
    };

    const level1 = relationships.filter(r => r.level === 1);
    for (const rel of level1) {
      const downlineNode = {
        member_id: rel.downline_id,
        member: rel.downline,
        level: rel.level,
        downlines: await this.getGenealogy(userId, rel.downline_id, maxDepth - 1)
      };
      tree.downlines.push(downlineNode);
    }

    return tree;
  }

  /**
   * Batch calculate commissions for all sales in a period
   */
  async batchCalculateCommissions(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{ processed: number; totalCommissions: number }> {
    const { data: sales, error } = await supabase
      .from('mlm_sales')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('sale_date', startDate)
      .lte('sale_date', endDate);

    if (error || !sales) {
      return { processed: 0, totalCommissions: 0 };
    }

    let totalCommissions = 0;
    for (const sale of sales) {
      const commissions = await this.calculateCommissionsForSale(sale.id);
      totalCommissions += commissions.length;
    }

    return {
      processed: sales.length,
      totalCommissions
    };
  }
}

// Export singleton instance
export const mlmCommissionEngine = new MLMCommissionEngine();
