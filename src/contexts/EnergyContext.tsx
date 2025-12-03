import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface EnergyContextType {
  currentEnergy: number;
  maxEnergy: number;
  tier: string;
  lastReset: string | null;
  loading: boolean;
  consumeEnergy: (feature: string, amount: number) => Promise<boolean>;
  addEnergy: (amount: number, reason: string) => Promise<boolean>;
  purchaseEnergyWithCoins: (energyAmount: number) => Promise<boolean>;
  refreshEnergy: () => Promise<void>;
  canAfford: (cost: number) => boolean;
}

const EnergyContext = createContext<EnergyContextType | null>(null);

export function EnergyProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [currentEnergy, setCurrentEnergy] = useState(0);
  const [maxEnergy, setMaxEnergy] = useState(5);
  const [tier, setTier] = useState('free');
  const [lastReset, setLastReset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEnergyData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_energy')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading energy:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setCurrentEnergy(data.current_energy);
      setMaxEnergy(data.max_energy);
      setTier(data.tier);
      setLastReset(data.last_reset);
    } else {
      const userTier = profile?.subscription_tier || 'free';
      const tierMaxEnergy = getTierMaxEnergy(userTier);

      const { data: newEnergy } = await supabase
        .from('user_energy')
        .insert({
          user_id: user.id,
          current_energy: tierMaxEnergy,
          max_energy: tierMaxEnergy,
          tier: userTier
        })
        .select()
        .single();

      if (newEnergy) {
        setCurrentEnergy(newEnergy.current_energy);
        setMaxEnergy(newEnergy.max_energy);
        setTier(newEnergy.tier);
        setLastReset(newEnergy.last_reset);
      }
    }

    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    loadEnergyData();
  }, [loadEnergyData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('energy_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_energy',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'current_energy' in payload.new) {
            const newData = payload.new as any;
            setCurrentEnergy(newData.current_energy);
            setMaxEnergy(newData.max_energy);
            setTier(newData.tier);
            setLastReset(newData.last_reset);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const consumeEnergy = async (feature: string, amount: number): Promise<boolean> => {
    if (!user) return false;

    if (tier === 'enterprise') {
      await supabase.from('energy_transactions').insert({
        user_id: user.id,
        event_type: 'action_cost',
        energy_change: 0,
        reason: `${feature} (Enterprise unlimited)`
      });
      return true;
    }

    if (currentEnergy < amount) {
      return false;
    }

    const { data, error } = await supabase
      .from('user_energy')
      .update({
        current_energy: currentEnergy - amount,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error consuming energy:', error);
      return false;
    }

    await supabase.from('energy_transactions').insert({
      user_id: user.id,
      event_type: 'action_cost',
      energy_change: -amount,
      reason: feature,
      metadata: {
        feature,
        timestamp: new Date().toISOString()
      }
    });

    if (data) {
      setCurrentEnergy(data.current_energy);
    }

    return true;
  };

  const addEnergy = async (amount: number, reason: string): Promise<boolean> => {
    if (!user) return false;

    const newEnergy = Math.min(currentEnergy + amount, maxEnergy);

    const { data, error } = await supabase
      .from('user_energy')
      .update({
        current_energy: newEnergy,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error adding energy:', error);
      return false;
    }

    await supabase.from('energy_transactions').insert({
      user_id: user.id,
      event_type: 'refill',
      energy_change: amount,
      reason,
      metadata: {
        reason,
        timestamp: new Date().toISOString()
      }
    });

    if (data) {
      setCurrentEnergy(data.current_energy);
    }

    return true;
  };

  const purchaseEnergyWithCoins = async (energyAmount: number): Promise<boolean> => {
    try {
      if (!user) {
        console.error('[ENERGY] No user found');
        alert('❌ No user found');
        return false;
      }

      console.log('[ENERGY] Starting conversion:', { userId: user.id, energyAmount });

      const conversionRate = 10;
      const coinsNeeded = energyAmount * conversionRate;

      console.log('[ENERGY] Fetching profile...');
      const { data: freshProfile, error: profileError } = await supabase
        .from('profiles')
        .select('coin_balance')
        .eq('id', user.id)
        .single();

      console.log('[ENERGY] Profile fetch result:', { freshProfile, profileError });

      if (profileError) {
        console.error('[ENERGY] Profile error:', JSON.stringify(profileError));
        alert(`❌ Profile error: ${profileError.message}`);
        return false;
      }

      if (!freshProfile) {
        console.error('[ENERGY] No profile found');
        alert('❌ No profile found');
        return false;
      }

      if (freshProfile.coin_balance < coinsNeeded) {
        const msg = `Insufficient coins: need ${coinsNeeded}, have ${freshProfile.coin_balance}`;
        console.error(`[ENERGY] ${msg}`);
        alert(`❌ ${msg}`);
        return false;
      }

      console.log('[ENERGY] Fetching energy data...');

      let { data: freshEnergy, error: energyFetchError } = await supabase
        .from('user_energy')
        .select('current_energy, max_energy')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('[ENERGY] Energy fetch result:', { freshEnergy, energyFetchError });

      if (energyFetchError) {
        console.error('[ENERGY] Energy fetch error:', JSON.stringify(energyFetchError));
        alert(`❌ Energy fetch error: ${energyFetchError.message}`);
        return false;
      }

      if (!freshEnergy) {
        console.log('[ENERGY] No energy record found, creating one...');
        const { data: newEnergyRecord, error: createError } = await supabase
          .from('user_energy')
          .insert({
            user_id: user.id,
            current_energy: 0,
            max_energy: maxEnergy
          })
          .select()
          .single();

        console.log('[ENERGY] Create result:', { newEnergyRecord, createError });

        if (createError) {
          console.error('[ENERGY] Create error:', JSON.stringify(createError));
          alert(`❌ Failed to create energy record: ${createError.message}`);
          return false;
        }

        if (!newEnergyRecord) {
          console.error('[ENERGY] No record returned after insert');
          alert('❌ No record returned after insert');
          return false;
        }

        freshEnergy = newEnergyRecord;
        console.log('[ENERGY] ✅ Created energy record successfully');
      }

      if (freshEnergy.current_energy >= freshEnergy.max_energy) {
        const msg = `Energy already at max: ${freshEnergy.current_energy}/${freshEnergy.max_energy}`;
        console.error(`[ENERGY] ${msg}`);
        alert(`❌ ${msg}`);
        return false;
      }

      console.log('[ENERGY] Deducting coins...');

      const { error: coinError } = await supabase
        .from('profiles')
        .update({
          coin_balance: freshProfile.coin_balance - coinsNeeded
        })
        .eq('id', user.id);

      if (coinError) {
        console.error('[ENERGY] Coin deduction error:', JSON.stringify(coinError));
        alert(`❌ Coin deduction failed: ${coinError.message}`);
        return false;
      }

      console.log('[ENERGY] ✅ Coins deducted successfully');

      const newEnergy = Math.min(freshEnergy.current_energy + energyAmount, freshEnergy.max_energy);

      console.log('[ENERGY] Updating energy:', { from: freshEnergy.current_energy, to: newEnergy });

      const { data, error } = await supabase
        .from('user_energy')
        .update({
          current_energy: newEnergy,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      console.log('[ENERGY] Energy update result:', { data, error });

      if (error) {
        console.error('[ENERGY] Energy update error:', JSON.stringify(error));
        console.log('[ENERGY] Rolling back coin deduction...');
        await supabase
          .from('profiles')
          .update({
            coin_balance: freshProfile.coin_balance
          })
          .eq('id', user.id);
        alert(`❌ Energy update failed: ${error.message}\nCoins have been refunded.`);
        return false;
      }

      console.log('[ENERGY] Logging transactions...');

      const { error: purchaseError } = await supabase.from('energy_purchases').insert({
        user_id: user.id,
        coins_spent: coinsNeeded,
        energy_granted: energyAmount,
        source: 'coins'
      });

      if (purchaseError) {
        console.warn('[ENERGY] Error logging purchase (non-critical):', purchaseError);
      }

      const { error: energyTxError } = await supabase.from('energy_transactions').insert({
        user_id: user.id,
        event_type: 'purchase',
        energy_change: energyAmount,
        reason: 'Purchased with coins',
        metadata: {
          coins_spent: coinsNeeded,
          energy_granted: energyAmount
        }
      });

      if (energyTxError) {
        console.warn('[ENERGY] Error logging energy transaction (non-critical):', energyTxError);
      }

      const { error: coinTxError } = await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -coinsNeeded,
        transaction_type: 'purchase',
        description: `Converted ${coinsNeeded} coins to ${energyAmount} energy`,
        metadata: {
          type: 'energy_purchase',
          energy_granted: energyAmount
        }
      });

      if (coinTxError) {
        console.warn('[ENERGY] Error logging coin transaction (non-critical):', coinTxError);
      }

      if (data) {
        setCurrentEnergy(data.current_energy);
      }

      console.log('[ENERGY] ✅ Conversion completed successfully!');
      return true;

    } catch (error: any) {
      console.error('[ENERGY] ❌ CRITICAL ERROR:', error);
      alert(`❌ Critical error: ${error?.message || 'Unknown error'}\n\nPlease refresh and try again.`);
      return false;
    }
  };

  const refreshEnergy = async () => {
    await loadEnergyData();
  };

  const canAfford = (cost: number): boolean => {
    if (tier === 'enterprise') return true;
    return currentEnergy >= cost;
  };

  return (
    <EnergyContext.Provider
      value={{
        currentEnergy,
        maxEnergy,
        tier,
        lastReset,
        loading,
        consumeEnergy,
        addEnergy,
        purchaseEnergyWithCoins,
        refreshEnergy,
        canAfford
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergy() {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within EnergyProvider');
  }
  return context;
}

function getTierMaxEnergy(tier: string): number {
  const tierLimits: Record<string, number> = {
    free: 5,
    pro: 25,
    elite: 99,
    team: 150,
    enterprise: 999
  };
  return tierLimits[tier] || 5;
}
