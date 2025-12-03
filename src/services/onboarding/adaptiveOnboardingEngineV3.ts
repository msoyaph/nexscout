import { supabase } from '../../lib/supabase';
import { onboardingEngine } from './onboardingEngine';
import { checkForAhaMoment } from './ahaMomentEngine';
import { sendOnboardingNudgeV4 } from '../nudges/nudgeEngineV4';
import {
  inferOnboardingPersona,
  OnboardingPersona,
  updatePersonaIfNeeded
} from './onboardingPersonaEngine';
import {
  pickBestVariantForPersona,
  assignVariantToUser,
  recordVariantActivation,
  OnboardingVariant
} from './onboardingExperimentEngine';
import { autoSetupChatbot, autoSetupPipeline, autoGenerateMissions } from './autoSetupHelpers';
import { selfLearningOnboardingEngineV4 } from './selfLearningOnboardingEngineV4';

interface InitResult {
  success: boolean;
  persona: OnboardingPersona;
  variant: OnboardingVariant;
  flowId?: string | null;
  sessionId?: string;
}

interface NextStep {
  id: string;
  label: string;
  description?: string;
  ahaTriggered?: string | null;
  priority?: number;
}

export const adaptiveOnboardingEngineV3 = {
  async initForUser(userId: string): Promise<InitResult> {
    try {
      const { data: existing } = await supabase
        .from('onboarding_personalization')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        return {
          success: true,
          persona: existing.persona as OnboardingPersona,
          variant: existing.chosen_variant as OnboardingVariant,
          flowId: existing.flow_id
        };
      }

      const persona = await inferOnboardingPersona(userId);

      const flowAssignment = await selfLearningOnboardingEngineV4.assignFlowForUser(
        userId,
        persona
      );

      const variant = flowAssignment.variant || (await pickBestVariantForPersona(persona));

      await supabase.from('onboarding_personalization').upsert({
        user_id: userId,
        persona,
        chosen_variant: variant,
        flow_id: flowAssignment.flow_id,
        created_at: new Date().toISOString()
      });

      await supabase.from('onboarding_journey_state').upsert({
        user_id: userId,
        completed_steps: [],
        current_step: 'welcome',
        last_event: 'init',
        step_order: flowAssignment.steps || [],
        last_updated: new Date().toISOString()
      });

      await onboardingEngine.startOnboarding(userId);

      await this.logEvent(userId, 'onboarding_init', {
        persona,
        variant,
        flowId: flowAssignment.flow_id,
        mode: flowAssignment.mode
      });

      return { success: true, persona, variant, flowId: flowAssignment.flow_id };
    } catch (error) {
      console.error('Error initializing adaptive onboarding:', error);
      return {
        success: false,
        persona: 'power_user_unknown',
        variant: 'fast_track_90s',
        flowId: null
      };
    }
  },

  async handleEvent(
    userId: string,
    eventType: string,
    payload: any = {}
  ): Promise<{ success: boolean; next?: NextStep }> {
    try {
      await this.logEvent(userId, eventType, payload);

      await onboardingEngine.processStep(userId, eventType, payload);

      await this.updateJourneyState(userId, eventType);

      const next = await this.decideNextStep(userId, eventType);

      await sendOnboardingNudgeV4(userId, {
        eventType,
        nextStep: next?.id || null,
        payload
      });

      if (next?.ahaTriggered) {
        await checkForAhaMoment(userId, next.ahaTriggered as any, payload);
      }

      if (this.isActivationEvent(eventType)) {
        await recordVariantActivation(userId);
        await selfLearningOnboardingEngineV4.recordOutcome(userId, 'activated');
      }

      await updatePersonaIfNeeded(userId, payload);

      return { success: true, next };
    } catch (error) {
      console.error('Error handling onboarding event:', error);
      return { success: false };
    }
  },

  async decideNextStep(
    userId: string,
    lastEvent: string
  ): Promise<NextStep | null> {
    try {
      const { data: personalization } = await supabase
        .from('onboarding_personalization')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: journey } = await supabase
        .from('onboarding_journey_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!personalization || !journey) {
        return null;
      }

      const persona: OnboardingPersona = personalization.persona;
      const variant: OnboardingVariant = personalization.chosen_variant;
      const completedSteps: string[] = journey.completed_steps || [];

      const hasIndustry = completedSteps.includes('industry_selected');
      const hasProduct = completedSteps.includes('product_added');
      const hasCompany = completedSteps.includes('company_added');
      const hasChatbot = completedSteps.includes('chatbot_setup');
      const hasPipeline = completedSteps.includes('pipeline_setup');
      const hasLead = completedSteps.includes('first_lead_captured');
      const hasFollowup = completedSteps.includes('first_followup_sent');

      if (!hasIndustry) {
        return {
          id: 'industry_selected',
          label: 'Choose your industry',
          description: 'Help us personalize your experience',
          priority: 10
        };
      }

      if (variant === 'fast_track_90s') {
        return this.decideFastTrackNextStep(completedSteps, persona);
      } else if (variant === 'chatbot_first') {
        return this.decideChatbotFirstNextStep(completedSteps, persona);
      } else if (variant === 'pipeline_first') {
        return this.decidePipelineFirstNextStep(completedSteps, persona);
      } else if (variant === 'scanner_first') {
        return this.decideScannerFirstNextStep(completedSteps, persona);
      } else {
        return this.decideGuidedNextStep(completedSteps, persona);
      }
    } catch (error) {
      console.error('Error deciding next step:', error);
      return null;
    }
  },

  decideFastTrackNextStep(
    completed: string[],
    persona: OnboardingPersona
  ): NextStep | null {
    if (!completed.includes('product_added')) {
      return {
        id: 'product_added',
        label: 'Tell us what you sell',
        description: 'One sentence is enough',
        ahaTriggered: 'product_profile_auto_generated',
        priority: 9
      };
    }

    if (!completed.includes('chatbot_setup')) {
      return {
        id: 'chatbot_setup',
        label: 'Launch your AI chatbot',
        ahaTriggered: 'chatbot_deployed',
        priority: 8
      };
    }

    if (!completed.includes('first_lead_captured')) {
      return {
        id: 'first_lead_captured',
        label: 'Test your chatbot',
        description: 'Try a conversation to see how it works',
        ahaTriggered: 'first_lead_captured',
        priority: 7
      };
    }

    return {
      id: 'enable_daily_missions',
      label: 'Explore daily missions',
      description: 'Stay consistent with AI-powered tasks',
      priority: 5
    };
  },

  decideChatbotFirstNextStep(
    completed: string[],
    persona: OnboardingPersona
  ): NextStep | null {
    if (!completed.includes('chatbot_setup')) {
      return {
        id: 'chatbot_setup',
        label: 'Launch your AI chatbot now',
        ahaTriggered: 'chatbot_deployed',
        priority: 10
      };
    }

    if (!completed.includes('product_added')) {
      return {
        id: 'product_added',
        label: 'Add your product',
        description: 'So your chatbot knows what to sell',
        ahaTriggered: 'product_profile_auto_generated',
        priority: 9
      };
    }

    if (!completed.includes('first_lead_captured')) {
      return {
        id: 'first_lead_captured',
        label: 'Get your first lead',
        ahaTriggered: 'first_lead_captured',
        priority: 8
      };
    }

    return {
      id: 'pipeline_setup',
      label: 'Set up your sales pipeline',
      priority: 6
    };
  },

  decidePipelineFirstNextStep(
    completed: string[],
    persona: OnboardingPersona
  ): NextStep | null {
    if (!completed.includes('pipeline_setup')) {
      return {
        id: 'pipeline_setup',
        label: 'Set up your pipeline stages',
        description: 'Organize your sales process',
        priority: 10
      };
    }

    if (persona === 'mlm_leader' && !completed.includes('team_recruiting_flow_setup')) {
      return {
        id: 'team_recruiting_flow_setup',
        label: 'Set up team recruiting flow',
        description: 'Automate your team building',
        priority: 9
      };
    }

    if (!completed.includes('product_added')) {
      return {
        id: 'product_added',
        label: 'Add your main product',
        ahaTriggered: 'product_profile_auto_generated',
        priority: 8
      };
    }

    if (!completed.includes('chatbot_setup')) {
      return {
        id: 'chatbot_setup',
        label: 'Launch AI chatbot',
        ahaTriggered: 'chatbot_deployed',
        priority: 7
      };
    }

    return {
      id: 'first_lead_captured',
      label: 'Capture your first lead',
      priority: 6
    };
  },

  decideScannerFirstNextStep(
    completed: string[],
    persona: OnboardingPersona
  ): NextStep | null {
    if (!completed.includes('first_scan_started')) {
      return {
        id: 'first_scan_started',
        label: 'Scan your first contact',
        description: 'Upload a contact list or connect social media',
        priority: 10
      };
    }

    if (!completed.includes('product_added')) {
      return {
        id: 'product_added',
        label: 'Add your product',
        ahaTriggered: 'product_profile_auto_generated',
        priority: 9
      };
    }

    if (!completed.includes('chatbot_setup')) {
      return {
        id: 'chatbot_setup',
        label: 'Set up AI chatbot',
        ahaTriggered: 'chatbot_deployed',
        priority: 8
      };
    }

    return {
      id: 'enable_daily_missions',
      label: 'Start daily missions',
      priority: 5
    };
  },

  decideGuidedNextStep(
    completed: string[],
    persona: OnboardingPersona
  ): NextStep | null {
    const guidedSteps = [
      {
        id: 'company_added',
        label: 'Tell us about your business',
        ahaTriggered: 'company_profile_auto_generated',
        priority: 9
      },
      {
        id: 'product_added',
        label: 'Add your main product or service',
        ahaTriggered: 'product_profile_auto_generated',
        priority: 8
      },
      {
        id: 'chatbot_setup',
        label: 'Set up your AI assistant',
        ahaTriggered: 'chatbot_deployed',
        priority: 7
      },
      {
        id: 'pipeline_setup',
        label: 'Configure your sales pipeline',
        priority: 6
      },
      {
        id: 'first_lead_captured',
        label: 'Test with your first lead',
        ahaTriggered: 'first_lead_captured',
        priority: 5
      }
    ];

    for (const step of guidedSteps) {
      if (!completed.includes(step.id)) {
        return step;
      }
    }

    return {
      id: 'enable_daily_missions',
      label: 'Start your daily routine',
      priority: 3
    };
  },

  async logEvent(
    userId: string,
    eventType: string,
    payload: any = {}
  ): Promise<void> {
    try {
      await supabase.from('onboarding_events').insert({
        user_id: userId,
        event_type: eventType,
        payload,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging onboarding event:', error);
    }
  },

  async updateJourneyState(userId: string, eventType: string): Promise<void> {
    try {
      const { data: journey } = await supabase
        .from('onboarding_journey_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!journey) return;

      const completedSteps = journey.completed_steps || [];

      if (!completedSteps.includes(eventType)) {
        completedSteps.push(eventType);
      }

      await supabase
        .from('onboarding_journey_state')
        .update({
          completed_steps: completedSteps,
          current_step: eventType,
          last_event: eventType,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error updating journey state:', error);
    }
  },

  isActivationEvent(eventType: string): boolean {
    const activationEvents = [
      'first_lead_captured',
      'chatbot_setup',
      'first_followup_sent',
      'first_appointment_booked'
    ];
    return activationEvents.includes(eventType);
  },

  async getJourneyProgress(userId: string): Promise<{
    persona: string;
    variant: string;
    completedSteps: string[];
    nextStep: NextStep | null;
    progressPercent: number;
  } | null> {
    try {
      const { data: personalization } = await supabase
        .from('onboarding_personalization')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data: journey } = await supabase
        .from('onboarding_journey_state')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!personalization || !journey) {
        return null;
      }

      const nextStep = await this.decideNextStep(
        userId,
        journey.last_event || 'init'
      );

      const totalExpectedSteps = 5;
      const completedSteps = journey.completed_steps || [];
      const progressPercent = Math.min(
        100,
        (completedSteps.length / totalExpectedSteps) * 100
      );

      return {
        persona: personalization.persona,
        variant: personalization.chosen_variant,
        completedSteps,
        nextStep,
        progressPercent
      };
    } catch (error) {
      console.error('Error getting journey progress:', error);
      return null;
    }
  }
};
