import { supabase } from '../../lib/supabase';

export interface EnergyCost {
  feature: string;
  energy_cost: number;
  description: string;
}

export interface EnergyCheckResult {
  canProceed: boolean;
  currentEnergy: number;
  requiredEnergy: number;
  message?: string;
}

class AIEnergyIntegration {
  private energyCosts: Map<string, number> = new Map();
  private lastFetch: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000;

  async loadEnergyCosts(): Promise<void> {
    if (Date.now() - this.lastFetch < this.CACHE_DURATION && this.energyCosts.size > 0) {
      return;
    }

    const { data, error } = await supabase
      .from('energy_costs')
      .select('*');

    if (error) {
      console.error('Error loading energy costs:', error);
      this.setDefaultCosts();
      return;
    }

    if (data) {
      this.energyCosts.clear();
      data.forEach((cost: any) => {
        this.energyCosts.set(cost.feature, cost.energy_cost);
      });
      this.lastFetch = Date.now();
    } else {
      this.setDefaultCosts();
    }
  }

  private setDefaultCosts(): void {
    this.energyCosts.set('ai_message', 1);
    this.energyCosts.set('ai_objection', 1);
    this.energyCosts.set('ai_sequence', 3);
    this.energyCosts.set('ai_pitchdeck', 5);
    this.energyCosts.set('ai_deepscan', 3);
    this.energyCosts.set('ai_prospect_analysis', 2);
    this.energyCosts.set('ai_team_coaching', 3);
    this.energyCosts.set('ai_emotional_response', 1);
    this.energyCosts.set('ai_chatbot_response', 1);
    this.energyCosts.set('company_crawler', 5);
    this.energyCosts.set('ai_scan', 2);
  }

  getEnergyCost(feature: string): number {
    return this.energyCosts.get(feature) || 1;
  }

  async checkEnergy(userId: string, feature: string): Promise<EnergyCheckResult> {
    await this.loadEnergyCosts();

    const requiredEnergy = this.getEnergyCost(feature);

    const { data: userEnergy, error } = await supabase
      .from('user_energy')
      .select('current_energy, max_energy, tier')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !userEnergy) {
      return {
        canProceed: false,
        currentEnergy: 0,
        requiredEnergy,
        message: 'Unable to check energy balance'
      };
    }

    if (userEnergy.tier === 'enterprise') {
      return {
        canProceed: true,
        currentEnergy: userEnergy.current_energy,
        requiredEnergy: 0,
        message: 'Enterprise tier has unlimited energy'
      };
    }

    if (userEnergy.current_energy < requiredEnergy) {
      return {
        canProceed: false,
        currentEnergy: userEnergy.current_energy,
        requiredEnergy,
        message: `Not enough energy. You need ${requiredEnergy} but have ${userEnergy.current_energy}`
      };
    }

    return {
      canProceed: true,
      currentEnergy: userEnergy.current_energy,
      requiredEnergy
    };
  }

  async consumeEnergy(userId: string, feature: string): Promise<boolean> {
    const check = await this.checkEnergy(userId, feature);

    if (!check.canProceed) {
      console.warn(`Energy check failed for ${feature}:`, check.message);
      return false;
    }

    const { data: userEnergy } = await supabase
      .from('user_energy')
      .select('current_energy, tier')
      .eq('user_id', userId)
      .single();

    if (!userEnergy) return false;

    if (userEnergy.tier === 'enterprise') {
      await supabase.from('energy_transactions').insert({
        user_id: userId,
        event_type: 'action_cost',
        energy_change: 0,
        reason: `${feature} (Enterprise unlimited)`,
        metadata: { feature }
      });
      return true;
    }

    const { error } = await supabase
      .from('user_energy')
      .update({
        current_energy: userEnergy.current_energy - check.requiredEnergy,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error consuming energy:', error);
      return false;
    }

    await supabase.from('energy_transactions').insert({
      user_id: userId,
      event_type: 'action_cost',
      energy_change: -check.requiredEnergy,
      reason: feature,
      metadata: {
        feature,
        timestamp: new Date().toISOString()
      }
    });

    return true;
  }

  async wrapAICall<T>(
    userId: string,
    feature: string,
    aiFunction: () => Promise<T>
  ): Promise<T> {
    const check = await this.checkEnergy(userId, feature);

    if (!check.canProceed) {
      throw new Error(check.message || 'Insufficient energy');
    }

    const consumed = await this.consumeEnergy(userId, feature);

    if (!consumed) {
      throw new Error('Failed to consume energy');
    }

    try {
      const result = await aiFunction();
      return result;
    } catch (error) {
      console.error('AI call failed:', error);
      await this.refundEnergy(userId, feature);
      throw error;
    }
  }

  async refundEnergy(userId: string, feature: string): Promise<void> {
    const cost = this.getEnergyCost(feature);

    const { data: userEnergy } = await supabase
      .from('user_energy')
      .select('current_energy, max_energy')
      .eq('user_id', userId)
      .single();

    if (!userEnergy) return;

    const newEnergy = Math.min(userEnergy.current_energy + cost, userEnergy.max_energy);

    await supabase
      .from('user_energy')
      .update({
        current_energy: newEnergy,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    await supabase.from('energy_transactions').insert({
      user_id: userId,
      event_type: 'refill',
      energy_change: cost,
      reason: `Refund for failed ${feature}`,
      metadata: {
        feature,
        refund: true,
        timestamp: new Date().toISOString()
      }
    });
  }

  async getEnergyStats(userId: string): Promise<{
    current: number;
    max: number;
    tier: string;
    todayUsed: number;
    weeklyUsed: number;
  } | null> {
    const { data: userEnergy } = await supabase
      .from('user_energy')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!userEnergy) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: todayTransactions } = await supabase
      .from('energy_transactions')
      .select('energy_change')
      .eq('user_id', userId)
      .eq('event_type', 'action_cost')
      .gte('created_at', today.toISOString());

    const { data: weeklyTransactions } = await supabase
      .from('energy_transactions')
      .select('energy_change')
      .eq('user_id', userId)
      .eq('event_type', 'action_cost')
      .gte('created_at', weekAgo.toISOString());

    const todayUsed = Math.abs(
      todayTransactions?.reduce((sum, t) => sum + t.energy_change, 0) || 0
    );

    const weeklyUsed = Math.abs(
      weeklyTransactions?.reduce((sum, t) => sum + t.energy_change, 0) || 0
    );

    return {
      current: userEnergy.current_energy,
      max: userEnergy.max_energy,
      tier: userEnergy.tier,
      todayUsed,
      weeklyUsed
    };
  }

  getAllFeatureCosts(): Map<string, number> {
    return new Map(this.energyCosts);
  }
}

export const aiEnergyIntegration = new AIEnergyIntegration();
