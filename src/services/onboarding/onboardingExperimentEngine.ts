import { supabase } from '../../lib/supabase';
import { OnboardingPersona } from './onboardingPersonaEngine';

export type OnboardingVariant =
  | 'fast_track_90s'
  | 'guided_step_by_step'
  | 'chatbot_first'
  | 'scanner_first'
  | 'pipeline_first';

interface VariantPerformance {
  variant: OnboardingVariant;
  activationRate: number;
  avgTtv: number;
  retention7d: number;
  retention30d: number;
  usersAssigned: number;
}

export async function pickBestVariantForPersona(
  persona: OnboardingPersona
): Promise<OnboardingVariant> {
  try {
    const { data: stats, error } = await supabase
      .from('onboarding_variant_stats')
      .select('*')
      .eq('persona', persona)
      .order('activation_rate', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (stats && stats.length > 0 && stats[0].users_assigned > 5) {
      return stats[0].variant as OnboardingVariant;
    }

    return getDefaultVariantForPersona(persona);
  } catch (error) {
    console.error('Error picking variant:', error);
    return getDefaultVariantForPersona(persona);
  }
}

export function getDefaultVariantForPersona(
  persona: OnboardingPersona
): OnboardingVariant {
  const defaults: Record<OnboardingPersona, OnboardingVariant> = {
    mlm_newbie: 'chatbot_first',
    mlm_leader: 'pipeline_first',
    insurance_agent: 'guided_step_by_step',
    real_estate_agent: 'chatbot_first',
    online_seller: 'fast_track_90s',
    service_provider: 'guided_step_by_step',
    power_user_unknown: 'fast_track_90s'
  };

  return defaults[persona];
}

export async function assignVariantToUser(
  userId: string,
  persona: OnboardingPersona,
  variant: OnboardingVariant
): Promise<void> {
  try {
    await supabase
      .from('onboarding_personalization')
      .upsert({
        user_id: userId,
        persona,
        chosen_variant: variant
      });

    await incrementVariantAssignment(persona, variant);
  } catch (error) {
    console.error('Error assigning variant:', error);
  }
}

async function incrementVariantAssignment(
  persona: OnboardingPersona,
  variant: OnboardingVariant
): Promise<void> {
  try {
    const { data: current } = await supabase
      .from('onboarding_variant_stats')
      .select('users_assigned')
      .eq('persona', persona)
      .eq('variant', variant)
      .single();

    if (current) {
      await supabase
        .from('onboarding_variant_stats')
        .update({
          users_assigned: current.users_assigned + 1
        })
        .eq('persona', persona)
        .eq('variant', variant);
    } else {
      await supabase.from('onboarding_variant_stats').insert({
        persona,
        variant,
        users_assigned: 1,
        users_activated: 0,
        activation_rate: 0
      });
    }
  } catch (error) {
    console.error('Error incrementing variant assignment:', error);
  }
}

export async function recordVariantActivation(
  userId: string
): Promise<void> {
  try {
    const { data: personalization } = await supabase
      .from('onboarding_personalization')
      .select('persona, chosen_variant')
      .eq('user_id', userId)
      .single();

    if (!personalization) return;

    const { persona, chosen_variant } = personalization;

    const { data: current } = await supabase
      .from('onboarding_variant_stats')
      .select('users_assigned, users_activated')
      .eq('persona', persona)
      .eq('variant', chosen_variant)
      .single();

    if (current) {
      const newActivated = current.users_activated + 1;
      const newActivationRate =
        current.users_assigned > 0
          ? newActivated / current.users_assigned
          : 0;

      await supabase
        .from('onboarding_variant_stats')
        .update({
          users_activated: newActivated,
          activation_rate: newActivationRate,
          last_calculated: new Date().toISOString()
        })
        .eq('persona', persona)
        .eq('variant', chosen_variant);
    }
  } catch (error) {
    console.error('Error recording variant activation:', error);
  }
}

export async function getAllVariantPerformance(
  persona?: OnboardingPersona
): Promise<VariantPerformance[]> {
  try {
    let query = supabase
      .from('onboarding_variant_stats')
      .select('*')
      .order('activation_rate', { ascending: false });

    if (persona) {
      query = query.eq('persona', persona);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((stat) => ({
      variant: stat.variant as OnboardingVariant,
      activationRate: stat.activation_rate || 0,
      avgTtv: stat.avg_ttv_seconds || 0,
      retention7d: stat.retention_7d || 0,
      retention30d: stat.retention_30d || 0,
      usersAssigned: stat.users_assigned || 0
    }));
  } catch (error) {
    console.error('Error getting variant performance:', error);
    return [];
  }
}

export async function getVariantRecommendation(
  persona: OnboardingPersona,
  userContext?: Record<string, any>
): Promise<{
  variant: OnboardingVariant;
  reason: string;
  confidence: number;
}> {
  try {
    const performance = await getAllVariantPerformance(persona);

    if (performance.length === 0 || performance[0].usersAssigned < 5) {
      const defaultVariant = getDefaultVariantForPersona(persona);
      return {
        variant: defaultVariant,
        reason: 'Using default variant (insufficient data)',
        confidence: 0.7
      };
    }

    const topPerformer = performance[0];

    return {
      variant: topPerformer.variant,
      reason: `Best performing variant (${(topPerformer.activationRate * 100).toFixed(1)}% activation)`,
      confidence: Math.min(0.95, 0.5 + topPerformer.usersAssigned / 100)
    };
  } catch (error) {
    console.error('Error getting variant recommendation:', error);
    return {
      variant: 'fast_track_90s',
      reason: 'Fallback due to error',
      confidence: 0.5
    };
  }
}

export function getVariantCharacteristics(variant: OnboardingVariant): {
  name: string;
  description: string;
  estimatedTime: string;
  focusArea: string;
  stepCount: number;
} {
  const characteristics = {
    fast_track_90s: {
      name: 'Fast Track (90 Seconds)',
      description:
        'Minimal questions, maximum automation. Get selling in under 90 seconds.',
      estimatedTime: '< 90 seconds',
      focusArea: 'Speed',
      stepCount: 4
    },
    guided_step_by_step: {
      name: 'Guided Step-by-Step',
      description:
        'Detailed walkthrough with explanations at each step. Perfect for beginners.',
      estimatedTime: '5-7 minutes',
      focusArea: 'Learning',
      stepCount: 8
    },
    chatbot_first: {
      name: 'Chatbot-First',
      description:
        'Launch your AI chatbot immediately, then configure everything else.',
      estimatedTime: '2-3 minutes',
      focusArea: 'Lead Generation',
      stepCount: 5
    },
    scanner_first: {
      name: 'Scanner-First',
      description:
        'Start by scanning your existing contacts for instant insights.',
      estimatedTime: '3-4 minutes',
      focusArea: 'Contact Intelligence',
      stepCount: 6
    },
    pipeline_first: {
      name: 'Pipeline-First',
      description:
        'Set up your sales pipeline and team structure before anything else.',
      estimatedTime: '4-5 minutes',
      focusArea: 'Organization',
      stepCount: 7
    }
  };

  return characteristics[variant];
}
