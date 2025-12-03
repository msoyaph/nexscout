/**
 * Onboarding Engine
 *
 * Orchestrates Product-Led Onboarding flow
 * - 3-question quick setup
 * - Time-to-value tracking
 * - Activation checklist management
 * - Next action recommendations
 */

import { supabase } from '../../lib/supabase';
import { seedUserFromAdminCompany, fetchAdminSuggestions } from './dataFeederEngine';

interface QuickSetupAnswers {
  industry: string;
  companyInput: string;
  channels: string[];
}

interface OnboardingSession {
  id: string;
  user_id: string;
  session_start: string;
  industry_selected: string;
  company_type: string;
  channels_selected: string[];
  admin_company_id?: string;
  auto_populated: boolean;
  completed: boolean;
}

interface ChecklistProgress {
  total: number;
  completed: number;
  percentage: number;
  items: ChecklistItem[];
}

interface ChecklistItem {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  xp_reward: number;
  estimated_time_seconds: number;
}

/**
 * Initialize onboarding session
 */
export async function initializeOnboarding(
  userId: string,
  industry: string
): Promise<{ success: boolean; session_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('onboarding_sessions')
      .insert({
        user_id: userId,
        industry_selected: industry,
        company_type: 'unknown',
        channels_selected: [],
        auto_populated: false,
        completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize lifecycle progress
    await supabase
      .from('user_lifecycle_progress')
      .insert({
        user_id: userId,
        current_phase: 'quick_win',
        current_day: 0,
      })
      .catch(() => {}); // Ignore if already exists

    // Create activation checklist entries
    const { data: checklistItems } = await supabase
      .from('activation_checklist_items')
      .select('id')
      .eq('is_active', true)
      .order('sort_order');

    if (checklistItems) {
      const checklistEntries = checklistItems.map((item) => ({
        user_id: userId,
        checklist_item_id: item.id,
        completed: false,
      }));

      await supabase
        .from('user_activation_checklist')
        .insert(checklistEntries)
        .catch(() => {}); // Ignore duplicates
    }

    return {
      success: true,
      session_id: data.id,
    };
  } catch (error: any) {
    console.error('Error initializing onboarding:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize onboarding',
    };
  }
}

/**
 * Process quick setup (3-question wizard)
 */
export async function processQuickSetup(
  userId: string,
  answers: QuickSetupAnswers
): Promise<{
  success: boolean;
  auto_populated: boolean;
  company_match?: any;
  products_seeded?: number;
  time_to_value_seconds?: number;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // 1. Search for admin company match
    const suggestions = await fetchAdminSuggestions(
      answers.companyInput,
      answers.industry
    );

    let autoPopulated = false;
    let companyMatch = null;
    let productsSeeded = 0;

    // 2. If we have a good match, auto-populate
    if (suggestions.length > 0 && suggestions[0].match_score > 60) {
      companyMatch = suggestions[0];

      const seedResult = await seedUserFromAdminCompany(userId, companyMatch.id);

      if (seedResult.success) {
        autoPopulated = true;
        productsSeeded = seedResult.products_seeded || 0;
      }
    } else {
      // 3. Manual setup: create basic company profile
      await supabase
        .from('company_profiles')
        .insert({
          user_id: userId,
          company_name: answers.companyInput,
          industry: answers.industry,
          company_description: '',
          data_source: 'user_manual',
          is_overridden: false,
        })
        .catch(() => {}); // Ignore if exists
    }

    // 4. Update onboarding session
    const timeToValue = Math.floor((Date.now() - startTime) / 1000);

    await supabase
      .from('onboarding_sessions')
      .update({
        company_type: answers.companyInput,
        channels_selected: answers.channels,
        admin_company_id: companyMatch?.id || null,
        auto_populated: autoPopulated,
        completed: true,
        time_to_completion_seconds: timeToValue,
      })
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .limit(1);

    // 5. Update user profile onboarding status
    await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 'complete',
      })
      .eq('id', userId);

    // 6. Unlock initial features
    await unlockInitialFeatures(userId);

    return {
      success: true,
      auto_populated: autoPopulated,
      company_match: companyMatch,
      products_seeded: productsSeeded,
      time_to_value_seconds: timeToValue,
    };
  } catch (error: any) {
    console.error('Error processing quick setup:', error);
    return {
      success: false,
      auto_populated: false,
      error: error.message || 'Failed to process setup',
    };
  }
}

/**
 * Get activation checklist progress
 */
export async function getActivationProgress(userId: string): Promise<ChecklistProgress> {
  try {
    const { data: items, error } = await supabase
      .from('user_activation_checklist')
      .select(`
        id,
        completed,
        completed_at,
        xp_awarded,
        activation_checklist_items (
          name,
          description,
          action_type,
          xp_reward,
          estimated_time_seconds
        )
      `)
      .eq('user_id', userId)
      .order('id');

    if (error) throw error;

    const total = items?.length || 0;
    const completed = items?.filter((item) => item.completed).length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const checklistItems: ChecklistItem[] = (items || []).map((item: any) => ({
      id: item.id,
      name: item.activation_checklist_items.name,
      description: item.activation_checklist_items.description,
      completed: item.completed,
      xp_reward: item.activation_checklist_items.xp_reward,
      estimated_time_seconds: item.activation_checklist_items.estimated_time_seconds,
    }));

    return {
      total,
      completed,
      percentage,
      items: checklistItems,
    };
  } catch (error) {
    console.error('Error getting activation progress:', error);
    return {
      total: 0,
      completed: 0,
      percentage: 0,
      items: [],
    };
  }
}

/**
 * Complete checklist item
 */
export async function completeChecklistItem(
  userId: string,
  itemId: string
): Promise<{ success: boolean; xp_awarded?: number; next_action?: any }> {
  try {
    // Get the item details
    const { data: item, error: fetchError } = await supabase
      .from('user_activation_checklist')
      .select(`
        id,
        completed,
        activation_checklist_items (
          name,
          xp_reward
        )
      `)
      .eq('id', itemId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !item || item.completed) {
      return { success: false };
    }

    const xpReward = item.activation_checklist_items.xp_reward;

    // Mark as completed
    const { error: updateError } = await supabase
      .from('user_activation_checklist')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
        xp_awarded: xpReward,
      })
      .eq('id', itemId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Award XP (integrate with existing mission system)
    // This would call your existing XP/coin system

    // Get next recommended action
    const nextAction = await getNextRecommendedAction(userId);

    return {
      success: true,
      xp_awarded: xpReward,
      next_action: nextAction,
    };
  } catch (error) {
    console.error('Error completing checklist item:', error);
    return { success: false };
  }
}

/**
 * Get next recommended action for user
 */
export async function getNextRecommendedAction(userId: string): Promise<any> {
  try {
    // Check what's not yet done
    const { data: progress } = await supabase
      .from('user_activation_checklist')
      .select(`
        id,
        completed,
        activation_checklist_items (
          name,
          description,
          action_type,
          estimated_time_seconds
        )
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .order('id')
      .limit(1)
      .single();

    if (progress) {
      return {
        type: 'checklist_item',
        title: progress.activation_checklist_items.name,
        description: progress.activation_checklist_items.description,
        action: progress.activation_checklist_items.action_type,
        estimated_time: progress.activation_checklist_items.estimated_time_seconds,
      };
    }

    // All checklist done! Check lifecycle
    const { data: lifecycle } = await supabase
      .from('user_lifecycle_progress')
      .select('current_phase, current_day')
      .eq('user_id', userId)
      .single();

    if (lifecycle) {
      // Get next milestone
      const { data: milestone } = await supabase
        .from('lifecycle_milestones')
        .select('*')
        .eq('phase', lifecycle.current_phase)
        .gte('day_target', lifecycle.current_day)
        .order('day_target')
        .limit(1)
        .single();

      if (milestone) {
        return {
          type: 'milestone',
          title: milestone.name,
          description: milestone.nudge_message,
          actions: milestone.recommended_actions,
        };
      }
    }

    // Default recommendation
    return {
      type: 'general',
      title: 'Keep Growing',
      description: 'Check your prospects and follow up on leads',
      action: 'view_prospects',
    };
  } catch (error) {
    console.error('Error getting next action:', error);
    return null;
  }
}

/**
 * Track onboarding analytics event
 */
export async function trackOnboardingEvent(
  userId: string,
  event: string,
  metadata: any = {}
): Promise<void> {
  try {
    // Log to existing analytics system or create new event log
    console.log('Onboarding event:', event, metadata);

    // Could integrate with existing ai_analytics_events table
  } catch (error) {
    console.error('Error tracking onboarding event:', error);
  }
}

/**
 * Unlock initial features for new user
 */
async function unlockInitialFeatures(userId: string): Promise<void> {
  try {
    const initialFeatures = ['chatbot', 'products', 'lead_capture'];

    const unlocks = initialFeatures.map((feature) => ({
      user_id: userId,
      feature_name: feature,
      unlock_method: 'onboarding',
      celebration_shown: false,
    }));

    await supabase
      .from('user_feature_unlocks')
      .insert(unlocks)
      .catch(() => {}); // Ignore duplicates
  } catch (error) {
    console.error('Error unlocking initial features:', error);
  }
}

/**
 * Check if user should see onboarding
 */
export async function shouldShowOnboarding(userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    return !profile?.onboarding_completed;
  } catch (error) {
    return true; // Default to showing onboarding
  }
}
