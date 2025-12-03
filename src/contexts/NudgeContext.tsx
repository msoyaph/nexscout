import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  shouldTriggerNudge,
  getNudgeConfig,
  type NudgeTrigger,
  type NudgeContext as NudgeContextData,
  type NudgeConfig,
  type TierId,
} from '../utils/nudgeEngine';

interface NudgeState {
  activeTrigger: NudgeTrigger | null;
  config: NudgeConfig | null;
  isVisible: boolean;
}

interface NudgeContextType {
  nudgeState: NudgeState;
  checkNudge: (context: Partial<NudgeContextData>) => void;
  dismissNudge: () => void;
  triggerFeatureNudge: (featureName: string) => void;
  goToUpgrade: () => void;
}

const NudgeContext = createContext<NudgeContextType | undefined>(undefined);

export function NudgeProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [nudgeState, setNudgeState] = useState<NudgeState>({
    activeTrigger: null,
    config: null,
    isVisible: false,
  });

  const [lastDismissed, setLastDismissed] = useState<Record<string, number>>({});

  // Get user tier
  const getUserTier = (): TierId => {
    if (!profile) return 'FREE';
    const tier = profile.subscription_tier?.toUpperCase();
    if (tier === 'PRO' || tier === 'TEAM' || tier === 'ENTERPRISE') {
      return tier as TierId;
    }
    return 'FREE';
  };

  // Check if nudge was recently dismissed
  const wasRecentlyDismissed = (trigger: NudgeTrigger): boolean => {
    const dismissTime = lastDismissed[trigger];
    if (!dismissTime) return false;

    const timeSince = Date.now() - dismissTime;
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes

    return timeSince < cooldownPeriod;
  };

  // Check for nudge trigger
  const checkNudge = useCallback((contextData: Partial<NudgeContextData>) => {
    if (!user) return;

    const tier = getUserTier();

    const fullContext: NudgeContextData = {
      tier,
      scansToday: contextData.scansToday,
      messagesToday: contextData.messagesToday,
      pitchDecksThisWeek: contextData.pitchDecksThisWeek,
      energy: contextData.energy || profile?.energy_balance || 0,
      coins: contextData.coins || profile?.coin_balance || 0,
      activeConversations: contextData.activeConversations,
      pipelineCount: contextData.pipelineCount,
      prospectCount: contextData.prospectCount,
      featureAttempted: contextData.featureAttempted,
      pipelineStages: contextData.pipelineStages,
    };

    const trigger = shouldTriggerNudge(fullContext);

    if (trigger && !wasRecentlyDismissed(trigger)) {
      const config = getNudgeConfig(trigger);

      setNudgeState({
        activeTrigger: trigger,
        config,
        isVisible: true,
      });
    }
  }, [user, profile]);

  // Dismiss current nudge
  const dismissNudge = useCallback(() => {
    if (nudgeState.activeTrigger) {
      setLastDismissed(prev => ({
        ...prev,
        [nudgeState.activeTrigger!]: Date.now(),
      }));
    }

    setNudgeState({
      activeTrigger: null,
      config: null,
      isVisible: false,
    });
  }, [nudgeState.activeTrigger]);

  // Trigger feature-specific nudge
  const triggerFeatureNudge = useCallback((featureName: string) => {
    checkNudge({ featureAttempted: featureName });
  }, [checkNudge]);

  // Navigate to upgrade page
  const goToUpgrade = useCallback(() => {
    // TODO: Implement navigation to pricing/subscription page
    // For now, we'll just log and dismiss
    console.log('Navigate to upgrade page');
    dismissNudge();

    // You can trigger a navigation event or use a router here
    window.dispatchEvent(new CustomEvent('navigate-to-upgrade', {
      detail: { targetTier: nudgeState.config?.targetTier },
    }));
  }, [nudgeState.config, dismissNudge]);

  // Auto-check nudges on profile changes
  useEffect(() => {
    if (profile) {
      checkNudge({
        energy: profile.energy_balance,
        coins: profile.coin_balance,
      });
    }
  }, [profile?.energy_balance, profile?.coin_balance]);

  const value: NudgeContextType = {
    nudgeState,
    checkNudge,
    dismissNudge,
    triggerFeatureNudge,
    goToUpgrade,
  };

  return (
    <NudgeContext.Provider value={value}>
      {children}
    </NudgeContext.Provider>
  );
}

export function useNudge() {
  const context = useContext(NudgeContext);
  if (!context) {
    throw new Error('useNudge must be used within NudgeProvider');
  }
  return context;
}
