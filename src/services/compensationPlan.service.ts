/**
 * COMPENSATION PLAN SERVICE
 *
 * Complete service layer for compensation plan management
 * - Save/load plans
 * - Sync to commission rules
 * - Calculate commissions
 * - Load for AI engines
 */

import { supabase } from '../lib/supabase';

// ========================================
// TYPES
// ========================================

export interface CompensationPlanConfig {
  planName: string;
  planType: 'unilevel' | 'binary' | 'matrix' | 'hybrid';
  maxLevels: number;
  levels: Array<{
    level: number;
    percentage: number;
    rankRequired?: string;
  }>;
  rankRules: Array<{
    rank: string;
    minVolume: number;
  }>;
}

export interface CompensationPlan {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: string;
  config: CompensationPlanConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ========================================
// COMPENSATION PLAN SERVICE
// ========================================

export class CompensationPlanService {
  /**
   * Save compensation plan (creates or updates)
   */
  async savePlan(
    planName: string,
    planType: string,
    config: CompensationPlanConfig
  ): Promise<{ success: boolean; plan?: any; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('comp-plan-save', {
        body: {
          planName,
          planType,
          config,
        },
      });

      if (error) {
        console.error('Save plan error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, plan: data.plan };
    } catch (error: any) {
      console.error('Save plan exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load compensation plan
   */
  async loadPlan(planName: string = 'Default Unilevel'): Promise<{
    success: boolean;
    exists: boolean;
    plan?: CompensationPlanConfig;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, exists: false, error: 'Not authenticated' };
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('comp-plan-load', {
        method: 'GET',
      });

      if (error) {
        console.error('Load plan error:', error);
        return { success: false, exists: false, error: error.message };
      }

      return {
        success: true,
        exists: data.exists,
        plan: data.exists ? data.plan : data.defaultPlan,
      };
    } catch (error: any) {
      console.error('Load plan exception:', error);
      return { success: false, exists: false, error: error.message };
    }
  }

  /**
   * Load plan directly from database (for AI engines)
   */
  async loadPlanForAI(userId: string): Promise<CompensationPlanConfig | null> {
    try {
      const { data, error } = await supabase
        .from('mlm_compensation_plans')
        .select('config')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.config as CompensationPlanConfig;
    } catch (error) {
      console.error('Load plan for AI error:', error);
      return null;
    }
  }

  /**
   * Get all plans for user
   */
  async getAllPlans(): Promise<CompensationPlan[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('mlm_compensation_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get all plans error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get all plans exception:', error);
      return [];
    }
  }

  /**
   * Delete plan
   */
  async deletePlan(planId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('mlm_compensation_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      return !error;
    } catch (error) {
      console.error('Delete plan error:', error);
      return false;
    }
  }

  /**
   * Calculate commissions for a sale
   */
  async calculateCommissions(saleId: string): Promise<{
    success: boolean;
    commissions?: any[];
    summary?: any;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('calculate-commissions', {
        body: { saleId },
      });

      if (error) {
        console.error('Calculate commissions error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        commissions: data.commissions,
        summary: data.summary,
      };
    } catch (error: any) {
      console.error('Calculate commissions exception:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get commission summary for user
   */
  async getCommissionSummary(
    startDate: string,
    endDate: string
  ): Promise<{
    totalEarned: number;
    totalPaid: number;
    totalUnpaid: number;
    commissionCount: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { totalEarned: 0, totalPaid: 0, totalUnpaid: 0, commissionCount: 0 };
      }

      const { data, error } = await supabase
        .from('mlm_commissions')
        .select('commission_amount, paid_out')
        .eq('user_id', user.id)
        .gte('calculated_at', startDate)
        .lte('calculated_at', endDate);

      if (error || !data) {
        return { totalEarned: 0, totalPaid: 0, totalUnpaid: 0, commissionCount: 0 };
      }

      const totalEarned = data.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
      const totalPaid = data
        .filter(c => c.paid_out)
        .reduce((sum, c) => sum + (c.commission_amount || 0), 0);
      const totalUnpaid = totalEarned - totalPaid;

      return {
        totalEarned,
        totalPaid,
        totalUnpaid,
        commissionCount: data.length,
      };
    } catch (error) {
      console.error('Get commission summary error:', error);
      return { totalEarned: 0, totalPaid: 0, totalUnpaid: 0, commissionCount: 0 };
    }
  }

  /**
   * Sync plan to commission rules (called automatically by save, but can be called manually)
   */
  async syncPlanToRules(
    planName: string,
    config: CompensationPlanConfig
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase.rpc('sync_plan_to_commission_rules', {
        user_id_param: user.id,
        plan_name_param: planName,
        config_param: config,
      });

      return !error;
    } catch (error) {
      console.error('Sync plan to rules error:', error);
      return false;
    }
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

export const compensationPlanService = new CompensationPlanService();

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Load user's compensation plan config (for AI engines)
 */
export async function loadUserCompPlan(userId: string): Promise<CompensationPlanConfig | null> {
  return await compensationPlanService.loadPlanForAI(userId);
}

/**
 * Calculate commissions for a sale
 */
export async function runCommissionCalculation(saleId: string) {
  return await compensationPlanService.calculateCommissions(saleId);
}

/**
 * Get plan summary string (for AI prompts)
 */
export function getPlanSummary(config: CompensationPlanConfig): string {
  const levelSummary = config.levels
    .map(l => `L${l.level}: ${l.percentage}%`)
    .join(', ');

  const rankSummary = config.rankRules
    .map(r => `${r.rank}: ${r.minVolume.toLocaleString()} PHP`)
    .join(', ');

  return `Plan: ${config.planName} (${config.planType})\nLevels: ${levelSummary}\nRanks: ${rankSummary}`;
}
