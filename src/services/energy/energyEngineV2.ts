import { supabase } from '../../lib/supabase';

/**
 * Energy Engine v2.0
 * AI-driven regeneration, surge pricing, behavior tracking
 */

export interface EnergyStatus {
  current: number;
  max: number;
  streak_days: number;
  regen_multiplier: number;
  surge_multiplier: number;
  next_regen_at: string;
  regen_rate_per_hour: number;
  last_activity_at: string;
}

export interface SurgePricingWindow {
  name: string;
  multiplier: number;
  is_active: boolean;
}

export interface RegenerationEvent {
  reason: string;
  amount: number;
  metadata?: any;
}

class EnergyEngineV2 {
  /**
   * A. BEHAVIOR TRACKING
   */

  async updateUserActivity(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_energy')
      .update({
        last_activity_at: new Date().toISOString(),
        inactivity_days: 0
      })
      .eq('user_id', userId);

    if (error) console.error('Error updating activity:', error);
  }

  async computeInactivityDays(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_energy')
      .select('last_activity_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data || !data.last_activity_at) return 0;

    const lastActivity = new Date(data.last_activity_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    // Update inactivity days
    await supabase
      .from('user_energy')
      .update({ inactivity_days: diffDays })
      .eq('user_id', userId);

    return diffDays;
  }

  async incrementStreak(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_energy')
      .select('streak_days, last_activity_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return 0;

    const lastActivity = data.last_activity_at ? new Date(data.last_activity_at) : null;
    const now = new Date();
    let newStreak = data.streak_days || 0;

    if (lastActivity) {
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

      // If activity within 24-48 hours, increment streak
      if (hoursSinceActivity >= 20 && hoursSinceActivity <= 48) {
        newStreak += 1;
      } else if (hoursSinceActivity > 48) {
        // Reset streak if more than 48 hours
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await supabase
      .from('user_energy')
      .update({
        streak_days: newStreak,
        last_activity_at: now.toISOString()
      })
      .eq('user_id', userId);

    return newStreak;
  }

  async resetStreak(userId: string): Promise<void> {
    await supabase
      .from('user_energy')
      .update({ streak_days: 0 })
      .eq('user_id', userId);
  }

  /**
   * B. REGENERATION LOGIC
   */

  async applyDailyReset(userId: string): Promise<void> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';
    const regenAmount = this.getDailyResetAmount(tier);

    await this.addEnergy(userId, regenAmount, 'daily_reset', {
      tier,
      reset_type: 'daily'
    });
  }

  async applyInactivityBonus(userId: string): Promise<void> {
    const inactiveDays = await this.computeInactivityDays(userId);

    if (inactiveDays >= 3 && inactiveDays <= 30) {
      // Welcome back bonus: 1 energy per inactive day (max 10)
      const bonusAmount = Math.min(inactiveDays, 10);

      await this.addEnergy(userId, bonusAmount, 'inactivity_bonus', {
        inactive_days: inactiveDays,
        bonus_amount: bonusAmount
      });
    }
  }

  async applyStreakBonus(userId: string): Promise<void> {
    const streak = await this.incrementStreak(userId);

    if (streak > 0 && streak % 7 === 0) {
      // Weekly streak bonus
      const bonusAmount = Math.floor(streak / 7);

      await this.addEnergy(userId, bonusAmount, 'streak_bonus', {
        streak_days: streak,
        bonus_amount: bonusAmount
      });
    }
  }

  async applyBehavioralRegen(userId: string): Promise<void> {
    // Get user pattern
    const { data: pattern } = await supabase
      .from('user_energy_patterns')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!pattern) return;

    // If user is efficient (high efficiency score), give bonus
    if (pattern.efficiency_score >= 0.75) {
      const bonusAmount = 2;

      await this.addEnergy(userId, bonusAmount, 'behavioral_regen', {
        efficiency_score: pattern.efficiency_score,
        bonus_reason: 'high_efficiency'
      });
    }
  }

  async applyClosingBonus(userId: string): Promise<void> {
    const bonusAmount = 3;

    await this.addEnergy(userId, bonusAmount, 'closing_bonus', {
      bonus_type: 'deal_closed',
      celebration: true
    });
  }

  async applyLowEnergyRescue(userId: string): Promise<void> {
    const { data: energy } = await supabase
      .from('user_energy')
      .select('current_energy, max_energy')
      .eq('user_id', userId)
      .maybeSingle();

    if (!energy) return;

    // If energy < 10% of max, apply rescue
    if (energy.current_energy < energy.max_energy * 0.1) {
      const rescueAmount = Math.ceil(energy.max_energy * 0.2); // 20% of max

      await this.addEnergy(userId, rescueAmount, 'low_energy_rescue', {
        previous_energy: energy.current_energy,
        rescue_amount: rescueAmount
      });
    }
  }

  async applyHappyHourBonus(userId: string): Promise<void> {
    const isHappyHour = await this.isHappyHourActive();

    if (isHappyHour) {
      const bonusAmount = 2;

      await this.addEnergy(userId, bonusAmount, 'happy_hour', {
        time: new Date().toISOString()
      });
    }
  }

  /**
   * C. SURGE PRICING ENGINE
   */

  async computeSurgeMultiplier(userId: string, feature: string): Promise<number> {
    const currentTime = new Date();
    const timeString = currentTime.toTimeString().split(' ')[0];

    // Get active surge windows
    const { data: windows } = await supabase
      .from('surge_pricing_windows')
      .select('*')
      .eq('is_active', true)
      .contains('applies_to', [feature]);

    if (!windows || windows.length === 0) return 1.0;

    // Find matching time window
    for (const window of windows) {
      if (this.isTimeInWindow(timeString, window.start_time, window.end_time)) {
        // Apply tier modifier
        const tierModifier = await this.getTierModifier(userId);
        return window.multiplier * tierModifier;
      }
    }

    return 1.0;
  }

  async applySurgePricing(userId: string, feature: string, baseCost: number): Promise<number> {
    const surgeMultiplier = await this.computeSurgeMultiplier(userId, feature);
    const regenMultiplier = await this.getUserRegenMultiplier(userId);

    const finalCost = Math.ceil(baseCost * surgeMultiplier * regenMultiplier);

    // Update surge multiplier in user_energy
    await supabase
      .from('user_energy')
      .update({ surge_multiplier: surgeMultiplier })
      .eq('user_id', userId);

    return finalCost;
  }

  /**
   * D. MASTER ENERGY CHARGE FUNCTION
   */

  async chargeEnergyV2(userId: string, feature: string, baseCost: number): Promise<boolean> {
    // Update activity
    await this.updateUserActivity(userId);

    // Apply surge pricing
    const finalCost = await this.applySurgePricing(userId, feature, baseCost);

    // Check if user has enough energy
    const { data: energy } = await supabase
      .from('user_energy')
      .select('current_energy')
      .eq('user_id', userId)
      .maybeSingle();

    if (!energy || energy.current_energy < finalCost) {
      return false;
    }

    // Deduct energy
    const { error } = await supabase
      .from('user_energy')
      .update({
        current_energy: energy.current_energy - finalCost
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error deducting energy:', error);
      return false;
    }

    return true;
  }

  /**
   * HELPER FUNCTIONS
   */

  private async addEnergy(
    userId: string,
    amount: number,
    reason: string,
    metadata: any = {}
  ): Promise<void> {
    // Get current energy
    const { data: energy } = await supabase
      .from('user_energy')
      .select('current_energy, max_energy')
      .eq('user_id', userId)
      .maybeSingle();

    if (!energy) return;

    // Calculate new energy (don't exceed max)
    const newEnergy = Math.min(energy.current_energy + amount, energy.max_energy);

    // Update energy
    await supabase
      .from('user_energy')
      .update({
        current_energy: newEnergy,
        last_regen_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Log regeneration event
    await supabase
      .from('energy_regeneration_events')
      .insert({
        user_id: userId,
        reason,
        energy_amount: amount,
        metadata
      });
  }

  private getDailyResetAmount(tier: string): number {
    const resetAmounts: Record<string, number> = {
      free: 5,
      pro: 15,
      pro: 30, // Elite removed, Pro gets max regen
      team: 50,
      enterprise: 100
    };

    return resetAmounts[tier] || 5;
  }

  private async getUserRegenMultiplier(userId: string): Promise<number> {
    const { data } = await supabase
      .from('user_energy')
      .select('regen_multiplier')
      .eq('user_id', userId)
      .maybeSingle();

    return data?.regen_multiplier || 1.0;
  }

  private async getTierModifier(userId: string): Promise<number> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    const tier = profile?.subscription_tier || 'free';

    const modifiers: Record<string, number> = {
      free: 1.1,     // +10% cost
      pro: 0.95,     // -5% cost
      pro: 0.85,   // -15% cost (Elite removed)
      team: 0.80,    // -20% cost
      enterprise: 0.70 // -30% cost
    };

    return modifiers[tier] || 1.0;
  }

  private isTimeInWindow(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (endMinutes < startMinutes) {
      // Window crosses midnight
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async isHappyHourActive(): Promise<boolean> {
    const currentTime = new Date();
    const timeString = currentTime.toTimeString().split(' ')[0];

    const { data: windows } = await supabase
      .from('surge_pricing_windows')
      .select('*')
      .eq('is_active', true)
      .lt('multiplier', 1.0); // Happy hour has multiplier < 1

    if (!windows) return false;

    for (const window of windows) {
      if (this.isTimeInWindow(timeString, window.start_time, window.end_time)) {
        return true;
      }
    }

    return false;
  }

  /**
   * PUBLIC API
   */

  async getEnergyStatus(userId: string): Promise<EnergyStatus | null> {
    const { data, error } = await supabase
      .from('user_energy')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      current: data.current_energy,
      max: data.max_energy,
      streak_days: data.streak_days || 0,
      regen_multiplier: data.regen_multiplier || 1.0,
      surge_multiplier: data.surge_multiplier || 1.0,
      next_regen_at: data.next_regen_at || new Date().toISOString(),
      regen_rate_per_hour: data.regen_rate_per_hour || 1,
      last_activity_at: data.last_activity_at || new Date().toISOString()
    };
  }

  async getCurrentSurgeWindow(): Promise<SurgePricingWindow | null> {
    const currentTime = new Date();
    const timeString = currentTime.toTimeString().split(' ')[0];

    const { data: windows } = await supabase
      .from('surge_pricing_windows')
      .select('*')
      .eq('is_active', true);

    if (!windows) return null;

    for (const window of windows) {
      if (this.isTimeInWindow(timeString, window.start_time, window.end_time)) {
        return {
          name: window.name,
          multiplier: window.multiplier,
          is_active: true
        };
      }
    }

    return null;
  }

  async getRegenerationHistory(userId: string, limit: number = 10): Promise<RegenerationEvent[]> {
    const { data } = await supabase
      .from('energy_regeneration_events')
      .select('reason, energy_amount, metadata, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data) return [];

    return data.map(event => ({
      reason: event.reason,
      amount: event.energy_amount,
      metadata: event.metadata
    }));
  }

  async predictNextRegen(userId: string): Promise<string> {
    const { data } = await supabase
      .from('user_energy')
      .select('last_regen_at, regen_rate_per_hour')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return new Date().toISOString();

    const lastRegen = new Date(data.last_regen_at || Date.now());
    const rate = data.regen_rate_per_hour || 1;
    const nextRegen = new Date(lastRegen.getTime() + (60 * 60 * 1000 / rate));

    return nextRegen.toISOString();
  }
}

export const energyEngineV2 = new EnergyEngineV2();
