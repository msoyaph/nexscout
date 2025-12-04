import { useEffect, useRef } from 'react';
import { analyticsEngineV2 as analyticsEngine } from '../services/intelligence/analyticsEngineV2';
import { funnelAnalytics } from '../services/funnelAnalytics';
import { useAuth } from '../contexts/AuthContext';

// ============================================================
// ANALYTICS HOOK
// ============================================================

export const useAnalytics = () => {
  const { user } = useAuth();
  const hasTrackedPageView = useRef(false);

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      const pageName = window.location.pathname.split('/').pop() || 'home';
      analyticsEngine.trackPageView(pageName, window.location.pathname);
      hasTrackedPageView.current = true;
    }

    return () => {
      hasTrackedPageView.current = false;
    };
  }, []);

  // ============================================================
  // EVENT TRACKING METHODS
  // ============================================================

  const trackEvent = async (
    eventName: string,
    properties?: Record<string, any>
  ) => {
    if (!user) return;

    await analyticsEngine.trackEvent(
      user.id,
      {
        event_name: eventName,
        properties,
      }
    );
  };

  const trackButtonClick = async (buttonName: string, page?: string) => {
    await trackEvent('button_clicked', {
      button_name: buttonName,
      page: page || window.location.pathname,
    });
  };

  const trackFormSubmit = async (formName: string, success: boolean) => {
    await trackEvent('form_submitted', {
      form_name: formName,
      success,
    });
  };

  const trackError = async (errorMessage: string, errorCode?: string) => {
    await trackEvent('error_occurred', {
      error_message: errorMessage,
      error_code: errorCode,
      page: window.location.pathname,
    });
  };

  // ============================================================
  // FEATURE-SPECIFIC TRACKING
  // ============================================================

  const trackProspectScan = async (prospectId: string, scanType: 'quick' | 'deep') => {
    await analyticsEngine.trackProspectAction('scan', {
      prospect_id: prospectId,
      scan_type: scanType,
    });

    if (user) {
      await funnelAnalytics.trackActivationFunnel(user.id, 'prospect_scanned');
    }
  };

  const trackAIGeneration = async (
    type: 'message' | 'sequence' | 'deck' | 'objection',
    success: boolean
  ) => {
    await analyticsEngine.trackAIGeneration(type, {
      success,
      timestamp: new Date().toISOString(),
    });

    if (user && success) {
      const eventMap = {
        message: 'ai_message_generated',
        sequence: 'ai_sequence_generated',
        deck: 'ai_deck_generated',
        objection: 'ai_objection_generated',
      };
      await funnelAnalytics.trackActivationFunnel(user.id, eventMap[type]);

      if (type === 'deck') {
        await funnelAnalytics.trackViralFunnel(user.id, 'ai_deck_generated');
      }
    }
  };

  const trackProspectSwipe = async (direction: 'left' | 'right', prospectId: string) => {
    await analyticsEngine.trackProspectAction('swipe', {
      direction,
      prospect_id: prospectId,
    });
  };

  const trackProspectUnlock = async (prospectId: string, costCoins: number) => {
    await analyticsEngine.trackProspectAction('unlock', {
      prospect_id: prospectId,
      cost_coins: costCoins,
    });
  };

  const trackPipelineChange = async (
    prospectId: string,
    fromStage: string,
    toStage: string
  ) => {
    await analyticsEngine.trackProspectAction('pipeline', {
      prospect_id: prospectId,
      from_stage: fromStage,
      to_stage: toStage,
    });

    if (user && toStage === 'discover') {
      await funnelAnalytics.trackActivationFunnel(user.id, 'prospect_added_pipeline');
    }
  };

  // ============================================================
  // MONETIZATION TRACKING
  // ============================================================

  const trackPaywallView = async (trigger: string) => {
    await analyticsEngine.trackMonetization('paywall', {
      trigger,
      timestamp: new Date().toISOString(),
    });

    if (user) {
      await funnelAnalytics.trackConversionFunnel(user.id, 'paywall_viewed');
    }
  };

  const trackUpgradeClick = async (tier: string, source: string) => {
    await trackEvent('upgrade_clicked', {
      target_tier: tier,
      source,
    });

    if (user) {
      await funnelAnalytics.trackConversionFunnel(user.id, 'upgrade_clicked');
    }
  };

  const trackSubscriptionUpgrade = async (
    fromTier: string,
    toTier: string,
    amount: number
  ) => {
    await analyticsEngine.trackMonetization('upgrade', {
      from_tier: fromTier,
      to_tier: toTier,
      amount_php: amount,
    });

    if (user) {
      await funnelAnalytics.trackConversionFunnel(user.id, 'subscription_upgraded');
    }
  };

  const trackCoinPurchase = async (packageName: string, amount: number, coins: number) => {
    await analyticsEngine.trackMonetization('coins', {
      package_name: packageName,
      amount_php: amount,
      coins_purchased: coins,
    });
  };

  const trackLimitReached = async (limitType: 'scan' | 'message' | 'deck') => {
    await trackEvent('ai_limit_reached', {
      limit_type: limitType,
    });

    if (user) {
      await funnelAnalytics.trackConversionFunnel(user.id, 'ai_limit_reached');
    }
  };

  // ============================================================
  // GAMIFICATION TRACKING
  // ============================================================

  const trackMissionOpen = async (missionId: string, missionName: string) => {
    await analyticsEngine.trackMission('opened', missionId);
  };

  const trackMissionComplete = async (
    missionId: string,
    missionName: string,
    coinsEarned: number
  ) => {
    await analyticsEngine.trackMission('completed', missionId);
  };

  const trackStreakClaimed = async (streakDays: number, coinsEarned: number) => {
    await trackEvent('streak_claimed', {
      streak_days: streakDays,
      coins_earned: coinsEarned,
    });
  };

  const trackCoinSpent = async (action: string, amount: number) => {
    await trackEvent('coin_spent', {
      action,
      amount,
    });
  };

  // ============================================================
  // SOCIAL/VIRAL TRACKING
  // ============================================================

  const trackShare = async (platform: string, content: string) => {
    await analyticsEngine.trackShare(platform);

    if (user) {
      await funnelAnalytics.trackViralFunnel(user.id, 'app_shared');
    }
  };

  const trackReferralLinkCopy = async () => {
    await trackEvent('referral_link_copied', {
      timestamp: new Date().toISOString(),
    });
  };

  const trackReferralSignup = async (referredBy: string) => {
    await trackEvent('referral_signup', {
      referred_by: referredBy,
    });

    if (user) {
      await funnelAnalytics.trackViralFunnel(user.id, 'user_signed_up');
    }
  };

  // ============================================================
  // AUTH & ONBOARDING TRACKING
  // ============================================================

  const trackSignup = async (method: string) => {
    await analyticsEngine.trackAuth('signup');

    if (user) {
      await funnelAnalytics.trackActivationFunnel(user.id, 'user_signed_up');
    }
  };

  const trackLogin = async (method: string) => {
    await analyticsEngine.trackAuth('login');
  };

  const trackOnboardingStep = async (step: number, stepName: string) => {
    await analyticsEngine.trackOnboarding(step, false);
  };

  const trackOnboardingComplete = async () => {
    await analyticsEngine.trackOnboarding(3, true);

    if (user) {
      await funnelAnalytics.trackActivationFunnel(user.id, 'onboarding_completed');
    }
  };

  // ============================================================
  // TRAINING & LEARNING TRACKING
  // ============================================================

  const trackTrainingOpen = async (moduleName: string) => {
    await trackEvent('training_opened', {
      module_name: moduleName,
    });
  };

  const trackTrainingComplete = async (moduleName: string, timeSpent: number) => {
    await trackEvent('training_completed', {
      module_name: moduleName,
      time_spent_seconds: timeSpent,
    });
  };

  // ============================================================
  // RETURN METHODS
  // ============================================================

  return {
    trackEvent,
    trackButtonClick,
    trackFormSubmit,
    trackError,
    trackProspectScan,
    trackAIGeneration,
    trackProspectSwipe,
    trackProspectUnlock,
    trackPipelineChange,
    trackPaywallView,
    trackUpgradeClick,
    trackSubscriptionUpgrade,
    trackCoinPurchase,
    trackLimitReached,
    trackMissionOpen,
    trackMissionComplete,
    trackStreakClaimed,
    trackCoinSpent,
    trackShare,
    trackReferralLinkCopy,
    trackReferralSignup,
    trackSignup,
    trackLogin,
    trackOnboardingStep,
    trackOnboardingComplete,
    trackTrainingOpen,
    trackTrainingComplete,
  };
};
