/**
 * Database Helpers for Master Orchestrator
 * Handles all database operations for the orchestration system
 */

import { supabase } from '../../lib/supabase';
import type { SubscriptionTier } from '../types/government';

// ============================================================================
// USER PROFILE
// ============================================================================

export interface UserProfile {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  energyBalance: number;
  coinBalance: number;
  createdAt: string;
}

/**
 * Get user profile with subscription and balances
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return null;

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    const { data: energy } = await supabase
      .from('user_energy')
      .select('current_energy')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: wallet } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('user_id', userId)
      .maybeSingle();

    return {
      id: profile.id,
      email: profile.email,
      subscriptionTier: (subscription?.tier || 'free') as SubscriptionTier,
      energyBalance: energy?.current_energy || 0,
      coinBalance: wallet?.coin_balance || 0,
      createdAt: profile.created_at,
    };
  } catch (error) {
    console.error('[OrchestratorDB] getUserProfile error:', error);
    return null;
  }
}

// ============================================================================
// ORCHESTRATOR EVENT LOGGING
// ============================================================================

export interface OrchestratorEvent {
  id: string;
  user_id: string;
  job_type: string;
  sub_type?: string;
  source?: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  engine_used?: string;
  model_used?: string;
  duration_ms?: number;
  energy_cost?: number;
  coin_cost?: number;
  error_message?: string;
  metadata?: any;
  created_at: Date;
}

/**
 * Save orchestrator event to database
 */
export async function saveOrchestratorEvent(
  event: Partial<OrchestratorEvent>
): Promise<void> {
  try {
    await supabase.from('orchestrator_events').insert({
      id: event.id,
      user_id: event.user_id,
      job_type: event.job_type,
      sub_type: event.sub_type,
      source: event.source,
      status: event.status,
      engine_used: event.engine_used,
      model_used: event.model_used,
      duration_ms: event.duration_ms,
      energy_cost: event.energy_cost,
      coin_cost: event.coin_cost,
      error_message: event.error_message,
      metadata: event.metadata,
    });
  } catch (error) {
    console.error('[OrchestratorDB] saveOrchestratorEvent error:', error);
  }
}

/**
 * Update orchestrator event status
 */
export async function updateOrchestratorEvent(
  jobId: string,
  updates: Partial<OrchestratorEvent>
): Promise<void> {
  try {
    await supabase
      .from('orchestrator_events')
      .update(updates)
      .eq('id', jobId);
  } catch (error) {
    console.error('[OrchestratorDB] updateOrchestratorEvent error:', error);
  }
}

// ============================================================================
// ENERGY OPERATIONS
// ============================================================================

/**
 * Check if user has enough energy
 */
export async function hasEnergy(userId: string, amount: number): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_energy')
      .select('current_energy')
      .eq('user_id', userId)
      .maybeSingle();

    return (data?.current_energy || 0) >= amount;
  } catch (error) {
    console.error('[OrchestratorDB] hasEnergy error:', error);
    return false;
  }
}

/**
 * Consume energy from user
 */
export async function consumeEnergy(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  try {
    const { data: current } = await supabase
      .from('user_energy')
      .select('current_energy')
      .eq('user_id', userId)
      .maybeSingle();

    const newBalance = (current?.current_energy || 0) - amount;

    await supabase
      .from('user_energy')
      .update({ current_energy: newBalance })
      .eq('user_id', userId);

    await supabase.from('energy_transactions').insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'consume',
      reason,
    });
  } catch (error) {
    console.error('[OrchestratorDB] consumeEnergy error:', error);
  }
}

// ============================================================================
// COIN OPERATIONS
// ============================================================================

/**
 * Check if user has enough coins
 */
export async function hasCoins(userId: string, amount: number): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('user_id', userId)
      .maybeSingle();

    return (data?.coin_balance || 0) >= amount;
  } catch (error) {
    console.error('[OrchestratorDB] hasCoins error:', error);
    return false;
  }
}

/**
 * Consume coins from user
 */
export async function consumeCoins(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  try {
    const { data: current } = await supabase
      .from('user_wallets')
      .select('coin_balance')
      .eq('user_id', userId)
      .maybeSingle();

    const newBalance = (current?.coin_balance || 0) - amount;

    await supabase
      .from('user_wallets')
      .update({ coin_balance: newBalance })
      .eq('user_id', userId);

    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'spend',
      reason,
    });
  } catch (error) {
    console.error('[OrchestratorDB] consumeCoins error:', error);
  }
}
