import { supabase } from '../../lib/supabase';

export interface UserEnergy {
  user_id: string;
  current_energy: number;
  max_energy: number;
  last_reset: string;
  tier: string;
  created_at: string;
  updated_at: string;
}

export interface EnergyCost {
  feature: string;
  energy_cost: number;
  description: string;
}

const TIER_ENERGY_CAPS: Record<string, number> = {
  free: 10, // Increased from 5 - more generous trial
  pro: 100, // Increased from 99 - truly unlimited feel
  team: 500, // Increased from 150 - 5 users × 100
  enterprise: 999999
};

const TIER_DAILY_LIMITS: Record<string, number> = {
  free: 30, // 10 energy × ~3 actions each
  pro: 1000, // 100 energy × 10 actions (very generous)
  team: 5000, // Team capacity
  enterprise: 999999
};

/**
 * Get user's current energy status
 */
export async function getUserEnergy(userId: string): Promise<UserEnergy | null> {
  // Check if energy needs regeneration
  await checkAndRegenerateEnergy(userId);

  const { data, error } = await supabase
    .from('user_energy')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error getting user energy:', error);
    return null;
  }

  // Create energy record if doesn't exist
  if (!data) {
    return await initializeUserEnergy(userId);
  }

  return data;
}

/**
 * Initialize energy for new user
 */
async function initializeUserEnergy(userId: string): Promise<UserEnergy | null> {
  // Get user tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle();

  const tier = profile?.subscription_tier || 'free';
  const maxEnergy = TIER_ENERGY_CAPS[tier] || 5;

  const { data, error } = await supabase
    .from('user_energy')
    .insert({
      user_id: userId,
      current_energy: maxEnergy,
      max_energy: maxEnergy,
      tier,
      last_reset: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error initializing user energy:', error);
    return null;
  }

  return data;
}

/**
 * Check if energy needs regeneration (24h cycle)
 */
async function checkAndRegenerateEnergy(userId: string): Promise<void> {
  const { data: userEnergy } = await supabase
    .from('user_energy')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!userEnergy) return;

  const lastReset = new Date(userEnergy.last_reset);
  const now = new Date();
  const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

  // Reset if more than 24 hours
  if (hoursSinceReset >= 24) {
    await regenerateDailyEnergy(userId);
  }
}

/**
 * Regenerate daily energy to max
 */
export async function regenerateDailyEnergy(userId: string): Promise<void> {
  const { data: userEnergy } = await supabase
    .from('user_energy')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!userEnergy) return;

  const energyToAdd = userEnergy.max_energy - userEnergy.current_energy;

  // Update energy
  await supabase
    .from('user_energy')
    .update({
      current_energy: userEnergy.max_energy,
      last_reset: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Log transaction
  if (energyToAdd > 0) {
    await supabase
      .from('energy_transactions')
      .insert({
        user_id: userId,
        event_type: 'regeneration',
        energy_change: energyToAdd,
        reason: 'Daily energy regeneration'
      });
  }
}

/**
 * Get energy cost for a specific feature
 */
export async function getEnergyCost(feature: string): Promise<number> {
  const { data, error } = await supabase
    .from('energy_costs')
    .select('energy_cost')
    .eq('feature', feature)
    .maybeSingle();

  if (error || !data) {
    console.error('Error getting energy cost:', error);
    return 1; // Default cost
  }

  return data.energy_cost;
}

/**
 * Consume energy for an AI action
 */
export async function consumeEnergy(
  userId: string,
  feature: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; currentEnergy: number; error?: string }> {

  const userEnergy = await getUserEnergy(userId);
  if (!userEnergy) {
    return { success: false, currentEnergy: 0, error: 'User energy not found' };
  }

  const cost = await getEnergyCost(feature);

  // Check if user has enough energy
  if (userEnergy.current_energy < cost) {
    return {
      success: false,
      currentEnergy: userEnergy.current_energy,
      error: 'Insufficient energy'
    };
  }

  // Check daily limit
  const dailyUsage = await getDailyUsage(userId);
  const dailyLimit = TIER_DAILY_LIMITS[userEnergy.tier] || 15;

  if (dailyUsage >= dailyLimit) {
    return {
      success: false,
      currentEnergy: userEnergy.current_energy,
      error: 'Daily limit reached'
    };
  }

  // Deduct energy
  const newEnergy = userEnergy.current_energy - cost;

  const { error } = await supabase
    .from('user_energy')
    .update({
      current_energy: newEnergy,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating energy:', error);
    return { success: false, currentEnergy: userEnergy.current_energy, error: error.message };
  }

  // Log transaction
  await supabase
    .from('energy_transactions')
    .insert({
      user_id: userId,
      event_type: 'action_cost',
      energy_change: -cost,
      reason: `Used ${feature}`,
      metadata: metadata || {}
    });

  return { success: true, currentEnergy: newEnergy };
}

/**
 * Try to consume energy or throw error
 */
export async function tryConsumeEnergyOrThrow(
  userId: string,
  feature: string,
  metadata?: Record<string, any>
): Promise<void> {
  const result = await consumeEnergy(userId, feature, metadata);

  if (!result.success) {
    throw new Error(result.error || 'Failed to consume energy');
  }
}

/**
 * Add energy to user (purchase, reward, admin)
 */
export async function addEnergy(
  userId: string,
  amount: number,
  source: 'regeneration' | 'purchase' | 'mission_reward' | 'refill' | 'admin_adjust',
  reason?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; currentEnergy: number }> {

  const userEnergy = await getUserEnergy(userId);
  if (!userEnergy) {
    return { success: false, currentEnergy: 0 };
  }

  // Calculate new energy (cap at max)
  const newEnergy = Math.min(
    userEnergy.current_energy + amount,
    userEnergy.max_energy
  );

  const actualGain = newEnergy - userEnergy.current_energy;

  // Update energy
  const { error } = await supabase
    .from('user_energy')
    .update({
      current_energy: newEnergy,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error adding energy:', error);
    return { success: false, currentEnergy: userEnergy.current_energy };
  }

  // Log transaction
  if (actualGain > 0) {
    await supabase
      .from('energy_transactions')
      .insert({
        user_id: userId,
        event_type: source,
        energy_change: actualGain,
        reason: reason || `Added ${actualGain} energy`,
        metadata: metadata || {}
      });
  }

  return { success: true, currentEnergy: newEnergy };
}

/**
 * Purchase energy with coins
 */
export async function purchaseEnergyWithCoins(
  userId: string,
  coinsSpent: number,
  energyAmount: number
): Promise<{ success: boolean; error?: string }> {

  // Check coin balance
  const { data: wallet } = await supabase
    .from('coin_wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (!wallet || wallet.balance < coinsSpent) {
    return { success: false, error: 'Insufficient coins' };
  }

  // Deduct coins
  const { error: walletError } = await supabase
    .from('coin_wallets')
    .update({
      balance: wallet.balance - coinsSpent,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (walletError) {
    return { success: false, error: 'Failed to deduct coins' };
  }

  // Add energy
  const result = await addEnergy(
    userId,
    energyAmount,
    'purchase',
    `Purchased ${energyAmount} energy for ${coinsSpent} coins`
  );

  if (!result.success) {
    // Rollback coins if energy add failed
    await supabase
      .from('coin_wallets')
      .update({
        balance: wallet.balance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return { success: false, error: 'Failed to add energy' };
  }

  // Log purchase
  await supabase
    .from('energy_purchases')
    .insert({
      user_id: userId,
      coins_spent: coinsSpent,
      energy_granted: energyAmount,
      source: 'coins'
    });

  // Log coin transaction
  await supabase
    .from('coin_transactions')
    .insert({
      user_id: userId,
      amount: -coinsSpent,
      transaction_type: 'spend',
      description: `Purchased ${energyAmount} energy`,
      metadata: { energy_amount: energyAmount }
    });

  return { success: true };
}

/**
 * Update tier and adjust max energy
 */
export async function setTierEnergyCap(userId: string, tier: string): Promise<void> {
  const maxEnergy = TIER_ENERGY_CAPS[tier] || 5;

  await supabase
    .from('user_energy')
    .update({
      tier,
      max_energy: maxEnergy,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}

/**
 * Get daily usage count
 */
async function getDailyUsage(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('energy_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'action_cost')
    .gte('created_at', today.toISOString());

  return count || 0;
}

/**
 * Check if user can perform action
 */
export async function canPerformAction(
  userId: string,
  feature: string
): Promise<{ canPerform: boolean; reason?: string; currentEnergy: number; requiredEnergy: number }> {

  const userEnergy = await getUserEnergy(userId);
  if (!userEnergy) {
    return {
      canPerform: false,
      reason: 'User energy not found',
      currentEnergy: 0,
      requiredEnergy: 0
    };
  }

  const cost = await getEnergyCost(feature);

  if (userEnergy.current_energy < cost) {
    return {
      canPerform: false,
      reason: 'Insufficient energy',
      currentEnergy: userEnergy.current_energy,
      requiredEnergy: cost
    };
  }

  const dailyUsage = await getDailyUsage(userId);
  const dailyLimit = TIER_DAILY_LIMITS[userEnergy.tier] || 15;

  if (dailyUsage >= dailyLimit) {
    return {
      canPerform: false,
      reason: 'Daily limit reached',
      currentEnergy: userEnergy.current_energy,
      requiredEnergy: cost
    };
  }

  return {
    canPerform: true,
    currentEnergy: userEnergy.current_energy,
    requiredEnergy: cost
  };
}

/**
 * Get energy statistics
 */
export async function getEnergyStats(userId: string) {
  const userEnergy = await getUserEnergy(userId);
  const dailyUsage = await getDailyUsage(userId);

  const { data: transactions } = await supabase
    .from('energy_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    current: userEnergy?.current_energy || 0,
    max: userEnergy?.max_energy || 5,
    tier: userEnergy?.tier || 'free',
    dailyUsage,
    dailyLimit: TIER_DAILY_LIMITS[userEnergy?.tier || 'free'],
    lastReset: userEnergy?.last_reset,
    recentTransactions: transactions || []
  };
}

export const energyEngine = {
  getUserEnergy,
  consumeEnergy,
  tryConsumeEnergyOrThrow,
  regenerateDailyEnergy,
  addEnergy,
  getEnergyCost,
  setTierEnergyCap,
  purchaseEnergyWithCoins,
  canPerformAction,
  getEnergyStats
};
