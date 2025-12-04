import { supabase } from '../lib/supabase';
import { OperatingMode, ModePreferences, DEFAULT_MODE_PREFERENCES } from '../types/operatingMode';

export class OperatingModeService {
  /**
   * Get user's current operating mode
   */
  static async getUserMode(userId: string): Promise<{ mode: OperatingMode; preferences: ModePreferences } | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('operating_mode, mode_preferences')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        mode: data.operating_mode || 'hybrid',
        preferences: data.mode_preferences || DEFAULT_MODE_PREFERENCES,
      };
    } catch (error) {
      console.error('[Operating Mode] Error fetching user mode:', error);
      return null;
    }
  }

  /**
   * Update user's operating mode
   */
  static async updateMode(userId: string, mode: OperatingMode): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ operating_mode: mode })
        .eq('id', userId);

      if (error) throw error;

      console.log(`[Operating Mode] User ${userId} switched to ${mode} mode`);
      return true;
    } catch (error) {
      console.error('[Operating Mode] Error updating mode:', error);
      return false;
    }
  }

  /**
   * Update mode preferences for a specific mode
   */
  static async updateModePreferences(
    userId: string,
    mode: OperatingMode,
    preferences: Partial<ModePreferences[typeof mode]>
  ): Promise<boolean> {
    try {
      // Fetch current preferences
      const { data: currentData, error: fetchError } = await supabase
        .from('profiles')
        .select('mode_preferences')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentPrefs = currentData?.mode_preferences || DEFAULT_MODE_PREFERENCES;

      // Merge new preferences with existing
      const updatedPrefs = {
        ...currentPrefs,
        [mode]: {
          ...currentPrefs[mode],
          ...preferences,
        },
      };

      const { error } = await supabase
        .from('profiles')
        .update({ mode_preferences: updatedPrefs })
        .eq('id', userId);

      if (error) throw error;

      console.log(`[Operating Mode] Updated ${mode} preferences for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[Operating Mode] Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Check if user should auto-qualify a prospect based on their mode settings
   */
  static shouldAutoQualify(mode: OperatingMode, preferences: ModePreferences, scoutScore: number): boolean {
    if (mode === 'manual') return false;
    if (mode === 'autopilot') return scoutScore >= preferences.autopilot.auto_qualify_threshold;
    if (mode === 'hybrid') return scoutScore >= preferences.hybrid.auto_qualify_threshold;
    return false;
  }

  /**
   * Check if user should auto-close a deal based on their mode settings
   */
  static shouldAutoClose(mode: OperatingMode, preferences: ModePreferences, scoutScore: number): boolean {
    if (mode === 'manual') return false;
    if (mode === 'hybrid') return false; // Hybrid always requires approval for closing
    if (mode === 'autopilot') return scoutScore >= preferences.autopilot.auto_close_threshold;
    return false;
  }

  /**
   * Check if user should auto-nurture prospects
   */
  static shouldAutoNurture(mode: OperatingMode, preferences: ModePreferences): boolean {
    if (mode === 'manual') return false;
    if (mode === 'autopilot') return true;
    if (mode === 'hybrid') return preferences.hybrid.auto_nurture_enabled;
    return false;
  }

  /**
   * Check if pipeline automation is enabled
   */
  static isPipelineAutomationEnabled(mode: OperatingMode, preferences: ModePreferences): boolean {
    if (mode === 'manual') return false;
    if (mode === 'autopilot') return true;
    if (mode === 'hybrid') return preferences.hybrid.enable_pipeline_automation;
    return false;
  }

  /**
   * Check if approval is required before sending messages
   */
  static requiresApprovalForSend(mode: OperatingMode, preferences: ModePreferences): boolean {
    if (mode === 'autopilot') return false;
    if (mode === 'manual') return preferences.manual.require_approval_for_send;
    if (mode === 'hybrid') return false; // Hybrid auto-sends low-risk messages
    return true;
  }

  /**
   * Get daily prospect limit for autopilot mode
   */
  static getDailyProspectLimit(mode: OperatingMode, preferences: ModePreferences): number | null {
    if (mode === 'autopilot') return preferences.autopilot.max_daily_prospects;
    return null; // No limit for manual/hybrid
  }

  /**
   * Check if Facebook Ads automation is enabled
   */
  static isFacebookAdsAutomationEnabled(mode: OperatingMode, preferences: ModePreferences): boolean {
    if (mode === 'autopilot') return preferences.autopilot.enable_fb_ads_automation;
    return false; // Only autopilot has FB ads automation
  }
}
