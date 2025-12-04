/**
 * AI SETTINGS SERVICE
 *
 * Service layer for loading and saving AI settings
 * Used by all AI engines for consistent configuration
 */

import { supabase } from '../lib/supabase';
import {
  AiSettings,
  defaultAiSettings,
  defaultRanks,
  defaultFunnels,
  defaultBehavior,
} from '../types/AiSettings';

/**
 * Load AI settings for a user
 * Returns default settings if none exist
 */
export async function loadAiSettings(userId: string): Promise<AiSettings> {
  if (!userId) {
    console.warn('[aiSettings] No userId provided, returning defaults');
    return defaultAiSettings('unknown');
  }

  try {
    const { data, error } = await supabase
      .from('mlm_ai_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[aiSettings] Error loading settings:', error);
      return defaultAiSettings(userId);
    }

    if (!data) {
      console.log('[aiSettings] No settings found, returning defaults');
      return defaultAiSettings(userId);
    }

    return {
      userId,
      ranks: data.ranks ?? defaultRanks(),
      funnels: data.funnels ?? defaultFunnels(),
      aiBehavior: {
        defaultVoiceForClosing: data.default_voice_for_closing ?? 'aggressiveCloser',
        defaultVoiceForRevival: data.default_voice_for_revival ?? 'softNurturer',
        defaultVoiceForTraining: data.default_voice_for_training ?? 'professionalAdvisor',
        allowAutoFollowups: data.allow_auto_followups ?? true,
        useRankBasedCoaching: data.use_rank_based_coaching ?? true,
      },
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('[aiSettings] Exception loading settings:', err);
    return defaultAiSettings(userId);
  }
}

/**
 * Save AI settings for a user
 */
export async function saveAiSettings(settings: AiSettings): Promise<{ success: boolean; error?: string }> {
  if (!settings.userId) {
    return { success: false, error: 'Missing userId' };
  }

  try {
    const { error } = await supabase
      .from('mlm_ai_settings')
      .upsert({
        user_id: settings.userId,
        ranks: settings.ranks,
        funnels: settings.funnels,
        default_voice_for_closing: settings.aiBehavior.defaultVoiceForClosing,
        default_voice_for_revival: settings.aiBehavior.defaultVoiceForRevival,
        default_voice_for_training: settings.aiBehavior.defaultVoiceForTraining,
        allow_auto_followups: settings.aiBehavior.allowAutoFollowups,
        use_rank_based_coaching: settings.aiBehavior.useRankBasedCoaching,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[aiSettings] Error saving settings:', error);
      return { success: false, error: error.message };
    }

    console.log('[aiSettings] Settings saved successfully');
    return { success: true };
  } catch (err) {
    console.error('[aiSettings] Exception saving settings:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Get rank by name from settings
 */
export function getRankByName(settings: AiSettings, rankName: string) {
  return settings.ranks.find((r) => r.name.toLowerCase() === rankName.toLowerCase());
}

/**
 * Get funnel stages for a specific funnel
 */
export function getFunnelStages(settings: AiSettings, funnelName: string): string[] {
  return settings.funnels[funnelName]?.stages ?? [];
}

/**
 * Get funnel stage label
 */
export function getFunnelStageLabel(
  settings: AiSettings,
  funnelName: string,
  stage: string
): string {
  return settings.funnels[funnelName]?.labels?.[stage] ?? stage;
}

/**
 * Get default voice model for a scenario
 */
export function getDefaultVoiceForScenario(
  settings: AiSettings,
  scenario: 'closing' | 'revival' | 'training'
): string {
  switch (scenario) {
    case 'closing':
      return settings.aiBehavior.defaultVoiceForClosing;
    case 'revival':
      return settings.aiBehavior.defaultVoiceForRevival;
    case 'training':
      return settings.aiBehavior.defaultVoiceForTraining;
    default:
      return 'professionalAdvisor';
  }
}

/**
 * Check if auto-followups are enabled
 */
export function canAutoFollowup(settings: AiSettings): boolean {
  return settings.aiBehavior.allowAutoFollowups;
}

/**
 * Check if rank-based coaching is enabled
 */
export function shouldUseRankBasedCoaching(settings: AiSettings): boolean {
  return settings.aiBehavior.useRankBasedCoaching;
}

/**
 * Determine current rank based on volume
 */
export function determineRankByVolume(settings: AiSettings, volume: number): string {
  // Sort ranks by minVolume descending
  const sortedRanks = [...settings.ranks].sort((a, b) => b.minVolume - a.minVolume);

  // Find first rank where volume >= minVolume
  for (const rank of sortedRanks) {
    if (volume >= rank.minVolume) {
      return rank.name;
    }
  }

  // Default to first rank if none match
  return settings.ranks[0]?.name ?? 'Starter';
}

/**
 * Get next rank in progression
 */
export function getNextRank(settings: AiSettings, currentRank: string): string | null {
  // Sort ranks by minVolume ascending
  const sortedRanks = [...settings.ranks].sort((a, b) => a.minVolume - b.minVolume);

  const currentIndex = sortedRanks.findIndex((r) => r.name === currentRank);

  if (currentIndex === -1 || currentIndex === sortedRanks.length - 1) {
    return null; // Already at highest rank or not found
  }

  return sortedRanks[currentIndex + 1].name;
}

/**
 * Calculate volume needed for next rank
 */
export function volumeNeededForNextRank(
  settings: AiSettings,
  currentVolume: number,
  currentRank: string
): number | null {
  const nextRank = getNextRank(settings, currentRank);

  if (!nextRank) {
    return null; // Already at highest rank
  }

  const nextRankData = getRankByName(settings, nextRank);

  if (!nextRankData) {
    return null;
  }

  const needed = nextRankData.minVolume - currentVolume;
  return needed > 0 ? needed : 0;
}
