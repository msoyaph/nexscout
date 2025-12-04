import { useEffect, useState, useCallback } from 'react';
import { useUser } from './useUser';
import { useSubscription } from './useSubscription';
import {
  detectBehavioralFingerprint,
  detectSurgeEvent,
  calculateDynamicPrice,
  trackDynamicOffer,
  trackBehavioralMetric,
  type BehavioralFingerprint,
  type SurgeEvent,
  type DynamicOffer,
} from '../services/dynamicNudgesV4';
import { type EmotionalState } from '../utils/adaptiveNudgeEngine';

export function useDynamicNudges() {
  const { user } = useUser();
  const { tier } = useSubscription();

  const [fingerprint, setFingerprint] = useState<BehavioralFingerprint | null>(null);
  const [activeSurge, setActiveSurge] = useState<SurgeEvent | null>(null);
  const [activeOffer, setActiveOffer] = useState<DynamicOffer | null>(null);
  const [emotionalState, setEmotionalState] = useState<EmotionalState>('curious');

  useEffect(() => {
    if (!user?.id) return;
    loadFingerprint();
  }, [user?.id]);

  const loadFingerprint = async () => {
    if (!user?.id) return;
    const fp = await detectBehavioralFingerprint(user.id);
    setFingerprint(fp);
  };

  const trackMetric = useCallback(async (metricKey: string, metricValue: any, patternType?: string) => {
    if (!user?.id) return;
    await trackBehavioralMetric(user.id, metricKey, metricValue, patternType);
    await loadFingerprint();
  }, [user?.id]);

  const checkSurge = useCallback(async (
    surgeType: 'scans' | 'messages' | 'energy' | 'leads' | 'inbox' | 'closing',
    currentValue: number,
    threshold: number
  ) => {
    if (!user?.id) return null;

    const surge = await detectSurgeEvent(user.id, surgeType, currentValue, threshold);
    if (surge) {
      setActiveSurge(surge);
      await trackMetric('surge_detected', { type: surgeType, value: currentValue }, 'surge');
    }
    return surge;
  }, [user?.id, trackMetric]);

  const generateOffer = useCallback(async (
    basePrice: number,
    targetTier: string,
    context?: {
      hasSurge?: boolean;
      emotionalStateOverride?: EmotionalState;
    }
  ) => {
    if (!user?.id || !fingerprint) return null;

    const offer = await calculateDynamicPrice(
      user.id,
      basePrice,
      targetTier,
      {
        hasSurge: context?.hasSurge ?? !!activeSurge,
        emotionalState: context?.emotionalStateOverride ?? emotionalState,
        behavior: fingerprint,
      }
    );

    setActiveOffer(offer);

    await trackDynamicOffer({
      userId: user.id,
      offerVariant: `${targetTier}_${emotionalState}`,
      emotionState: emotionalState,
      roiEstimate: offer.roi_estimate,
      behaviorPattern: JSON.stringify(fingerprint.patterns),
      discount: offer.discount,
      finalPrice: offer.finalPrice,
      originalPrice: offer.originalPrice,
      surgeTriggered: !!activeSurge,
    });

    return offer;
  }, [user?.id, fingerprint, activeSurge, emotionalState]);

  const updateEmotionalState = useCallback((state: EmotionalState) => {
    setEmotionalState(state);
    trackMetric('emotional_state_change', { state }, 'emotion');
  }, [trackMetric]);

  const clearSurge = useCallback(() => {
    setActiveSurge(null);
  }, []);

  const clearOffer = useCallback(() => {
    setActiveOffer(null);
  }, []);

  return {
    fingerprint,
    activeSurge,
    activeOffer,
    emotionalState,
    trackMetric,
    checkSurge,
    generateOffer,
    updateEmotionalState,
    clearSurge,
    clearOffer,
    isReady: !!fingerprint,
  };
}
