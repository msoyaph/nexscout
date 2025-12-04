import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getTierLimits, hasReachedLimit, SUBSCRIPTION_TIERS } from '../lib/subscriptionTiers';

export interface UsageStats {
  dailyScansUsed: number;
  dailyMessagesUsed: number;
  weeklyPresentationsUsed: number;
  dailyAdsWatched: number;
}

export function useSubscription() {
  const { profile } = useAuth();
  const [usage, setUsage] = useState<UsageStats>({
    dailyScansUsed: 0,
    dailyMessagesUsed: 0,
    weeklyPresentationsUsed: 0,
    dailyAdsWatched: 0
  });

  useEffect(() => {
    if (profile) {
      setUsage({
        dailyScansUsed: profile.daily_scans_used || 0,
        dailyMessagesUsed: profile.daily_messages_used || 0,
        weeklyPresentationsUsed: profile.weekly_presentations_used || 0,
        dailyAdsWatched: profile.daily_ads_watched || 0
      });
    }
  }, [profile]);

  const tier = profile?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  const limits = getTierLimits(tier);

  const canScan = !hasReachedLimit(tier, 'dailyScans', usage.dailyScansUsed);
  const canMessage = !hasReachedLimit(tier, 'dailyMessages', usage.dailyMessagesUsed);
  const canPresent = !hasReachedLimit(tier, 'weeklyPresentations', usage.weeklyPresentationsUsed);
  const canWatchAd = usage.dailyAdsWatched < limits.maxAdsPerDay;

  const incrementUsage = async (type: 'scan' | 'message' | 'presentation' | 'ad') => {
    if (!profile?.id) return false;

    const fieldMap = {
      scan: 'daily_scans_used',
      message: 'daily_messages_used',
      presentation: 'weekly_presentations_used',
      ad: 'daily_ads_watched'
    };

    const field = fieldMap[type];
    const currentValue = usage[`${type === 'ad' ? 'dailyAdsWatched' : type === 'scan' ? 'dailyScansUsed' : type === 'message' ? 'dailyMessagesUsed' : 'weeklyPresentationsUsed'}`];

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: currentValue + 1 })
      .eq('id', profile.id);

    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }

    setUsage(prev => ({
      ...prev,
      [type === 'ad' ? 'dailyAdsWatched' : type === 'scan' ? 'dailyScansUsed' : type === 'message' ? 'dailyMessagesUsed' : 'weeklyPresentationsUsed']: currentValue + 1
    }));

    return true;
  };

  const trackUsage = async (actionType: string) => {
    if (!profile?.id) return;

    await supabase
      .from('usage_tracking')
      .upsert({
        user_id: profile.id,
        action_type: actionType,
        action_count: 1,
        date: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'user_id,action_type,date',
        ignoreDuplicates: false
      });
  };

  const recordCoinTransaction = async (
    amount: number,
    type: 'earn' | 'spend' | 'bonus' | 'purchase' | 'ad_reward',
    description: string
  ) => {
    if (!profile?.id) return false;

    const { error } = await supabase.rpc('record_coin_transaction', {
      p_user_id: profile.id,
      p_amount: amount,
      p_type: type,
      p_description: description
    });

    if (error) {
      console.error('Error recording coin transaction:', error);
      return false;
    }

    return true;
  };

  const watchAd = async () => {
    if (!canWatchAd) return false;

    const success = await incrementUsage('ad');
    if (success) {
      await recordCoinTransaction(
        limits.coinsPerAd,
        'ad_reward',
        'Watched advertisement'
      );
      return true;
    }

    return false;
  };

  return {
    tier,
    limits,
    usage,
    canScan,
    canMessage,
    canPresent,
    canWatchAd,
    incrementUsage,
    trackUsage,
    recordCoinTransaction,
    watchAd
  };
}
