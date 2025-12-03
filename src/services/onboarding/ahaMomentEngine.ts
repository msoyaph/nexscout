/**
 * Aha Moment Engine
 *
 * Detects and celebrates key milestone achievements
 * Triggers confetti, awards XP/Energy, tracks timing
 */

import { supabase } from '../../lib/supabase';

export type AhaMomentType =
  | 'chatbot_test'
  | 'lead_captured'
  | 'deepscan_complete'
  | 'auto_followup'
  | 'appointment_booked'
  | 'offline_activity';

interface AhaMomentResult {
  triggered: boolean;
  moment_id?: string;
  celebration_type?: string;
  xp_awarded?: number;
  energy_awarded?: number;
  message?: string;
}

/**
 * Check if event should trigger an aha moment
 */
export async function checkForAhaMoment(
  userId: string,
  eventType: AhaMomentType,
  context: any = {}
): Promise<AhaMomentResult> {
  try {
    // 1. Get aha moment definition
    const { data: ahaMoment, error: momentError } = await supabase
      .from('aha_moments')
      .select('*')
      .eq('trigger_event', eventType)
      .eq('is_active', true)
      .single();

    if (momentError || !ahaMoment) {
      return { triggered: false };
    }

    // 2. Check if user has already achieved this
    const { data: existing } = await supabase
      .from('user_aha_moments')
      .select('id')
      .eq('user_id', userId)
      .eq('aha_moment_id', ahaMoment.id)
      .single();

    if (existing) {
      return { triggered: false, message: 'Already achieved' };
    }

    // 3. Check conditions (if any)
    const conditions = ahaMoment.trigger_conditions || {};
    if (!evaluateConditions(conditions, context)) {
      return { triggered: false, message: 'Conditions not met' };
    }

    // 4. Calculate time from signup
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', userId)
      .single();

    const timeFromSignup = profile?.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 60000)
      : 0;

    // 5. Record the aha moment
    const { error: recordError } = await supabase
      .from('user_aha_moments')
      .insert({
        user_id: userId,
        aha_moment_id: ahaMoment.id,
        time_from_signup_minutes: timeFromSignup,
        xp_awarded: ahaMoment.xp_reward,
        energy_awarded: ahaMoment.energy_reward,
        celebration_shown: false,
        context: context,
      });

    if (recordError) throw recordError;

    // 6. Award XP and Energy
    await awardRewards(userId, ahaMoment.xp_reward, ahaMoment.energy_reward);

    return {
      triggered: true,
      moment_id: ahaMoment.id,
      celebration_type: ahaMoment.celebration_type,
      xp_awarded: ahaMoment.xp_reward,
      energy_awarded: ahaMoment.energy_reward,
      message: ahaMoment.description,
    };
  } catch (error) {
    console.error('Error checking for aha moment:', error);
    return { triggered: false };
  }
}

/**
 * Mark celebration as shown
 */
export async function markCelebrationShown(userId: string, momentId: string): Promise<void> {
  try {
    await supabase
      .from('user_aha_moments')
      .update({ celebration_shown: true })
      .eq('user_id', userId)
      .eq('aha_moment_id', momentId);
  } catch (error) {
    console.error('Error marking celebration shown:', error);
  }
}

/**
 * Get user's aha moment timeline
 */
export async function getAhaMomentHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_aha_moments')
      .select(`
        id,
        triggered_at,
        time_from_signup_minutes,
        xp_awarded,
        energy_awarded,
        celebration_shown,
        context,
        aha_moments (
          name,
          description,
          celebration_type
        )
      `)
      .eq('user_id', userId)
      .order('triggered_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting aha moment history:', error);
    return [];
  }
}

/**
 * Get pending celebrations (not yet shown to user)
 */
export async function getPendingCelebrations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_aha_moments')
      .select(`
        id,
        triggered_at,
        xp_awarded,
        energy_awarded,
        aha_moments (
          id,
          name,
          description,
          celebration_type
        )
      `)
      .eq('user_id', userId)
      .eq('celebration_shown', false)
      .order('triggered_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error getting pending celebrations:', error);
    return [];
  }
}

/**
 * Evaluate conditions for aha moment
 */
function evaluateConditions(conditions: any, context: any): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions = always pass
  }

  // Simple condition evaluation
  for (const [key, value] of Object.entries(conditions)) {
    if (context[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Award XP and Energy to user
 */
async function awardRewards(userId: string, xp: number, energy: number): Promise<void> {
  try {
    // Update energy balance
    if (energy > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('energy_balance')
        .eq('id', userId)
        .single();

      const currentEnergy = profile?.energy_balance || 0;

      await supabase
        .from('profiles')
        .update({ energy_balance: currentEnergy + energy })
        .eq('id', userId);

      // Log energy transaction
      await supabase
        .from('energy_transactions')
        .insert({
          user_id: userId,
          amount: energy,
          transaction_type: 'earned',
          source: 'aha_moment',
          description: 'Aha moment reward',
        })
        .catch(() => {}); // Ignore if table doesn't exist yet
    }

    // XP would integrate with existing mission/gamification system
    // For now, just log it
    console.log(`Awarded ${xp} XP and ${energy} Energy to user ${userId}`);
  } catch (error) {
    console.error('Error awarding rewards:', error);
  }
}

/**
 * Get analytics for aha moments (SuperAdmin)
 */
export async function getAhaMomentAnalytics(startDate?: Date, endDate?: Date) {
  try {
    let query = supabase
      .from('user_aha_moments')
      .select(`
        aha_moment_id,
        time_from_signup_minutes,
        triggered_at,
        aha_moments (
          name,
          target_time_minutes
        )
      `);

    if (startDate) {
      query = query.gte('triggered_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('triggered_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate metrics
    const byMoment: any = {};

    (data || []).forEach((record: any) => {
      const momentName = record.aha_moments.name;

      if (!byMoment[momentName]) {
        byMoment[momentName] = {
          name: momentName,
          count: 0,
          avg_time_minutes: 0,
          target_time_minutes: record.aha_moments.target_time_minutes,
          times: [],
        };
      }

      byMoment[momentName].count++;
      byMoment[momentName].times.push(record.time_from_signup_minutes);
    });

    // Calculate averages
    Object.values(byMoment).forEach((moment: any) => {
      moment.avg_time_minutes = Math.round(
        moment.times.reduce((sum: number, t: number) => sum + t, 0) / moment.times.length
      );
      delete moment.times;
    });

    return Object.values(byMoment);
  } catch (error) {
    console.error('Error getting aha moment analytics:', error);
    return [];
  }
}

/**
 * Trigger manual aha moment (for testing or special cases)
 */
export async function triggerManualAhaMoment(
  userId: string,
  momentType: AhaMomentType,
  context: any = {}
): Promise<AhaMomentResult> {
  return checkForAhaMoment(userId, momentType, context);
}

/**
 * Helper functions for common aha moment triggers
 */
export const ahaMomentTriggers = {
  // Trigger when chatbot is tested
  onChatbotTest: (userId: string) =>
    checkForAhaMoment(userId, 'chatbot_test', { test_success: true }),

  // Trigger when first lead is captured
  onFirstLead: (userId: string, leadId: string) =>
    checkForAhaMoment(userId, 'lead_captured', { lead_id: leadId }),

  // Trigger when DeepScan completes
  onDeepScanComplete: (userId: string, score: number) =>
    checkForAhaMoment(userId, 'deepscan_complete', { score }),

  // Trigger when auto follow-up is sent
  onAutoFollowUp: (userId: string, prospectId: string) =>
    checkForAhaMoment(userId, 'auto_followup', { prospect_id: prospectId }),

  // Trigger when appointment is booked
  onAppointmentBooked: (userId: string, appointmentId: string) =>
    checkForAhaMoment(userId, 'appointment_booked', { appointment_id: appointmentId }),

  // Trigger when offline activity is detected
  onOfflineActivity: (userId: string, activityType: string) =>
    checkForAhaMoment(userId, 'offline_activity', { activity_type: activityType }),
};
