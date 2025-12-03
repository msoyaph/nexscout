/**
 * AI SETTINGS TYPES
 *
 * Unified configuration shape for all AI engines
 * Single source of truth for ranks, funnels, and AI behavior
 */

export interface RankSetting {
  name: string;
  minVolume: number;
}

export interface FunnelStages {
  [funnelName: string]: {
    stages: string[];
    labels?: Record<string, string>;
  };
}

export interface AiBehaviorSetting {
  defaultVoiceForClosing: string;
  defaultVoiceForRevival: string;
  defaultVoiceForTraining: string;
  allowAutoFollowups: boolean;
  useRankBasedCoaching: boolean;
}

export interface AiSettings {
  userId: string;
  ranks: RankSetting[];
  funnels: FunnelStages;
  aiBehavior: AiBehaviorSetting;
  updatedAt: string;
}

/**
 * Default settings factory functions
 */
export function defaultRanks(): RankSetting[] {
  return [
    { name: 'Starter', minVolume: 0 },
    { name: 'Silver', minVolume: 1000 },
    { name: 'Gold', minVolume: 5000 },
    { name: 'Platinum', minVolume: 15000 },
    { name: 'Diamond', minVolume: 50000 },
  ];
}

export function defaultFunnels(): FunnelStages {
  return {
    recruiting: {
      stages: ['awareness', 'interest', 'evaluation', 'decision', 'closing'],
      labels: {
        awareness: 'Building Awareness',
        interest: 'Generating Interest',
        evaluation: 'Evaluating Fit',
        decision: 'Making Decision',
        closing: 'Closing the Deal',
      },
    },
    customerOnboarding: {
      stages: ['discovery', 'education', 'trial', 'conversion', 'retention'],
      labels: {
        discovery: 'Discovery Phase',
        education: 'Product Education',
        trial: 'Trial Period',
        conversion: 'Conversion',
        retention: 'Retention & Upsell',
      },
    },
    revival: {
      stages: ['revive1', 'revive2', 'revive3', 'closing'],
      labels: {
        revive1: 'First Touch',
        revive2: 'Second Touch',
        revive3: 'Final Touch',
        closing: 'Last Chance Close',
      },
    },
  };
}

export function defaultBehavior(): AiBehaviorSetting {
  return {
    defaultVoiceForClosing: 'aggressiveCloser',
    defaultVoiceForRevival: 'softNurturer',
    defaultVoiceForTraining: 'professionalAdvisor',
    allowAutoFollowups: true,
    useRankBasedCoaching: true,
  };
}

export function defaultAiSettings(userId: string): AiSettings {
  return {
    userId,
    ranks: defaultRanks(),
    funnels: defaultFunnels(),
    aiBehavior: defaultBehavior(),
    updatedAt: new Date().toISOString(),
  };
}
