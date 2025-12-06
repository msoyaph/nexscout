import React from 'react';
import { useNudge } from '../../contexts/NudgeContext';
import { useAuth } from '../../contexts/AuthContext';
import { UpgradeBanner } from './UpgradeBanner';
import { UpgradeModal } from './UpgradeModal';

/**
 * Global nudge renderer - automatically shows the right nudge type
 * based on the current nudge state
 */
export function NudgeRenderer() {
  const { nudgeState, dismissNudge, goToUpgrade } = useNudge();
  const { profile } = useAuth();

  const { isVisible, config } = nudgeState;

  if (!isVisible || !config) return null;

  // Banner type nudges
  if (config.type === 'banner') {
    return (
      <UpgradeBanner
        message={config.message}
        ctaText={config.ctaText}
        onUpgrade={goToUpgrade}
        onDismiss={config.dismissible ? dismissNudge : undefined}
        autoDismiss={config.dismissible}
        autoDismissDelay={8000}
        coins={profile?.coin_balance}
      />
    );
  }

  // Modal type nudges
  if (config.type === 'modal') {
    return (
      <UpgradeModal
        isOpen={isVisible}
        title={config.title}
        message={config.message}
        benefits={config.benefits}
        ctaText={config.ctaText}
        targetTier={config.targetTier}
        onClose={dismissNudge}
        onUpgrade={goToUpgrade}
        dismissible={config.dismissible}
      />
    );
  }

  // Paywall and inline types are rendered by specific components
  // This renderer only handles global banner and modal nudges

  return null;
}
