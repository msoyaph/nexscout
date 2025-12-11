/**
 * Subscription Coin Distribution Service
 * 
 * Handles weekly coin distribution for Pro tier subscribers
 * and daily coin distribution for Free tier users
 */

import { supabase } from '../lib/supabase';
import { TIER_PRICING, SUBSCRIPTION_TIERS } from '../lib/subscriptionTiers';

export const subscriptionCoinService = {
  /**
   * Award weekly coins to Pro tier subscribers
   * Should be called weekly (e.g., via cron job or scheduled function)
   * Starts counting after subscription payment
   */
  async awardWeeklyCoins(userId: string, tier: string): Promise<{ awarded: number; error?: string }> {
    try {
      // Only Pro tier gets weekly coins
      if (tier !== 'pro' && tier !== 'Pro' && tier !== SUBSCRIPTION_TIERS.PRO) {
        return { awarded: 0 };
      }

      const pricing = TIER_PRICING[SUBSCRIPTION_TIERS.PRO];
      if (!pricing || pricing.weeklyCoins <= 0) {
        return { awarded: 0 };
      }

      // Check if user has active subscription
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('status, current_period_start, current_period_end')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('[subscriptionCoinService] Error checking subscription:', subError);
        return { awarded: 0, error: subError.message };
      }

      if (!subscription) {
        return { awarded: 0, error: 'No active subscription found' };
      }

      // Check if subscription is still active
      const now = new Date();
      const periodEnd = new Date(subscription.current_period_end);
      if (now > periodEnd) {
        return { awarded: 0, error: 'Subscription expired' };
      }

      // Check if we've already awarded coins this week
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const { data: recentBonus, error: bonusError } = await supabase
        .from('coin_transactions')
        .select('created_at')
        .eq('user_id', userId)
        .eq('transaction_type', 'bonus')
        .or('description.ilike.%weekly bonus%pro%subscription%,description.ilike.%Pro subscription:%')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bonusError) {
        console.error('[subscriptionCoinService] Error checking recent bonus:', bonusError);
      }

      if (recentBonus) {
        // Already awarded this week
        return { awarded: 0, error: 'Weekly coins already awarded this week' };
      }

      // Award weekly coins
      const { data, error } = await supabase.rpc('record_coin_transaction', {
        p_user_id: userId,
        p_amount: pricing.weeklyCoins,
        p_type: 'bonus',
        p_description: `Weekly bonus: ${pricing.weeklyCoins} coins for Pro subscription`,
      });

      if (error) {
        console.error('[subscriptionCoinService] Error awarding weekly coins:', error);
        return { awarded: 0, error: error.message };
      }

      console.log(`[subscriptionCoinService] ✅ Awarded ${pricing.weeklyCoins} weekly coins to user ${userId}`);
      return { awarded: pricing.weeklyCoins };
    } catch (error: any) {
      console.error('[subscriptionCoinService] Error in awardWeeklyCoins:', error);
      return { awarded: 0, error: error.message };
    }
  },

  /**
   * Award daily coins to Free tier users
   * Should be called daily (e.g., via cron job or on user login)
   * Awards 2 coins per day for Free tier
   */
  async awardDailyCoins(userId: string, tier: string): Promise<{ awarded: number; error?: string }> {
    try {
      // Only Free tier gets daily coins (2 coins/day)
      if (tier !== 'free' && tier !== 'Free' && tier !== SUBSCRIPTION_TIERS.FREE) {
        return { awarded: 0 };
      }

      const dailyCoins = 2; // 2 coins per day for Free tier

      // Check if we've already awarded coins today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: todayBonus, error: bonusError } = await supabase
        .from('coin_transactions')
        .select('created_at')
        .eq('user_id', userId)
        .eq('transaction_type', 'bonus')
        .or('description.ilike.%daily bonus%free tier%,description.ilike.%Daily bonus:%')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bonusError) {
        console.error('[subscriptionCoinService] Error checking today bonus:', bonusError);
      }

      if (todayBonus) {
        // Already awarded today
        return { awarded: 0, error: 'Daily coins already awarded today' };
      }

      // Award daily coins
      const { data, error } = await supabase.rpc('record_coin_transaction', {
        p_user_id: userId,
        p_amount: dailyCoins,
        p_type: 'bonus',
        p_description: `Daily bonus: ${dailyCoins} coins for Free tier`,
      });

      if (error) {
        console.error('[subscriptionCoinService] Error awarding daily coins:', error);
        return { awarded: 0, error: error.message };
      }

      console.log(`[subscriptionCoinService] ✅ Awarded ${dailyCoins} daily coins to user ${userId}`);
      return { awarded: dailyCoins };
    } catch (error: any) {
      console.error('[subscriptionCoinService] Error in awardDailyCoins:', error);
      return { awarded: 0, error: error.message };
    }
  },

  /**
   * Check and award coins if needed (called on app load or login)
   * Awards weekly coins for Pro users and daily coins for Free users
   */
  async checkAndAwardCoins(userId: string, tier: string): Promise<{ weekly?: number; daily?: number; errors?: string[] }> {
    const errors: string[] = [];
    let weeklyAwarded = 0;
    let dailyAwarded = 0;

    // Check weekly coins for Pro users
    if (tier === 'pro' || tier === 'Pro' || tier === SUBSCRIPTION_TIERS.PRO) {
      const weeklyResult = await this.awardWeeklyCoins(userId, tier);
      weeklyAwarded = weeklyResult.awarded;
      if (weeklyResult.error) {
        errors.push(`Weekly: ${weeklyResult.error}`);
      }
    }

    // Check daily coins for Free users
    if (tier === 'free' || tier === 'Free' || tier === SUBSCRIPTION_TIERS.FREE) {
      const dailyResult = await this.awardDailyCoins(userId, tier);
      dailyAwarded = dailyResult.awarded;
      if (dailyResult.error) {
        errors.push(`Daily: ${dailyResult.error}`);
      }
    }

    return {
      weekly: weeklyAwarded,
      daily: dailyAwarded,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
};


