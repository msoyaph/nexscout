import { useAuth } from '../contexts/AuthContext';
import { useNudge } from '../contexts/NudgeContext';
import { canAccessFeature, type TierId } from '../utils/nudgeEngine';

/**
 * Hook to check feature access and trigger nudges
 */
export function useFeatureAccess() {
  const { profile } = useAuth();
  const { triggerFeatureNudge } = useNudge();

  // Get user tier
  const getUserTier = (): TierId => {
    if (!profile) return 'FREE';
    const tier = profile.subscription_tier?.toUpperCase();
    if (tier === 'PRO' || tier === 'TEAM' || tier === 'ENTERPRISE') {
      return tier as TierId;
    }
    return 'FREE';
  };

  const tier = getUserTier();

  /**
   * Check if user can access a feature
   * If not, triggers appropriate nudge
   */
  const checkFeature = (featureName: string): boolean => {
    const hasAccess = canAccessFeature(featureName, tier);

    if (!hasAccess) {
      triggerFeatureNudge(featureName);
    }

    return hasAccess;
  };

  /**
   * Wrap an action with feature check
   * Only executes if user has access, otherwise shows nudge
   */
  const withFeatureCheck = <T extends any[]>(
    featureName: string,
    action: (...args: T) => void
  ) => {
    return (...args: T) => {
      if (checkFeature(featureName)) {
        action(...args);
      }
    };
  };

  return {
    tier,
    checkFeature,
    withFeatureCheck,
    canAccess: (feature: string) => canAccessFeature(feature, tier),
  };
}
