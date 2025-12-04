import { supabase } from '../../lib/supabase';

export type OnboardingPersona =
  | 'mlm_newbie'
  | 'mlm_leader'
  | 'insurance_agent'
  | 'real_estate_agent'
  | 'online_seller'
  | 'service_provider'
  | 'power_user_unknown';

interface PersonaInferenceResult {
  persona: OnboardingPersona;
  confidence: number;
  signals: string[];
}

export async function inferOnboardingPersona(
  userId: string
): Promise<OnboardingPersona> {
  try {
    const result = await inferOnboardingPersonaWithConfidence(userId);
    return result.persona;
  } catch (error) {
    console.error('Error inferring persona:', error);
    return 'power_user_unknown';
  }
}

export async function inferOnboardingPersonaWithConfidence(
  userId: string
): Promise<PersonaInferenceResult> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, industry, company_size, experience_level, profession')
      .eq('id', userId)
      .single();

    if (!profile) {
      return {
        persona: 'power_user_unknown',
        confidence: 0.5,
        signals: ['no_profile_data']
      };
    }

    const signals: string[] = [];
    let persona: OnboardingPersona = 'power_user_unknown';
    let confidence = 0.8;

    const industry = profile.industry?.toLowerCase() || '';
    const role = profile.role?.toLowerCase() || '';
    const profession = profile.profession?.toLowerCase() || '';
    const experienceLevel = profile.experience_level?.toLowerCase() || '';

    if (
      industry.includes('mlm') ||
      industry.includes('network marketing') ||
      profession.includes('network marketing')
    ) {
      signals.push('mlm_industry');

      if (
        experienceLevel === 'newbie' ||
        experienceLevel === 'beginner' ||
        role.includes('distributor') ||
        role.includes('member')
      ) {
        persona = 'mlm_newbie';
        signals.push('newbie_indicators');
        confidence = 0.9;
      } else if (
        experienceLevel === 'leader' ||
        experienceLevel === 'expert' ||
        role.includes('leader') ||
        role.includes('upline') ||
        role.includes('director')
      ) {
        persona = 'mlm_leader';
        signals.push('leader_indicators');
        confidence = 0.95;
      } else {
        persona = 'mlm_newbie';
        signals.push('default_to_newbie');
        confidence = 0.7;
      }
    } else if (
      industry.includes('insurance') ||
      profession.includes('insurance')
    ) {
      persona = 'insurance_agent';
      signals.push('insurance_industry');
      confidence = 0.9;
    } else if (
      industry.includes('real estate') ||
      industry.includes('property') ||
      profession.includes('real estate') ||
      profession.includes('realtor')
    ) {
      persona = 'real_estate_agent';
      signals.push('real_estate_industry');
      confidence = 0.9;
    } else if (
      industry.includes('ecommerce') ||
      industry.includes('e-commerce') ||
      industry.includes('online seller') ||
      profession.includes('seller') ||
      profession.includes('merchant')
    ) {
      persona = 'online_seller';
      signals.push('ecommerce_industry');
      confidence = 0.85;
    } else if (
      industry.includes('service') ||
      industry.includes('consulting') ||
      profession.includes('consultant') ||
      profession.includes('freelance')
    ) {
      persona = 'service_provider';
      signals.push('service_industry');
      confidence = 0.85;
    } else {
      signals.push('no_clear_match');
      confidence = 0.6;
    }

    return { persona, confidence, signals };
  } catch (error) {
    console.error('Error in persona inference:', error);
    return {
      persona: 'power_user_unknown',
      confidence: 0.5,
      signals: ['error_occurred']
    };
  }
}

export async function getPersonaCharacteristics(
  persona: OnboardingPersona
): Promise<{
  name: string;
  description: string;
  idealOnboardingPath: string[];
  keyPainPoints: string[];
  quickWinGoal: string;
}> {
  const characteristics = {
    mlm_newbie: {
      name: 'MLM Newcomer',
      description:
        'New to network marketing, learning the ropes, needs simple guidance',
      idealOnboardingPath: [
        'industry_selected',
        'product_added',
        'chatbot_setup',
        'first_lead_captured',
        'first_followup_sent'
      ],
      keyPainPoints: [
        'Fear of rejection',
        'Not knowing what to say',
        "Don't want to sound salesy",
        'Need scripts and templates'
      ],
      quickWinGoal: 'Get first positive response from AI chatbot conversation'
    },
    mlm_leader: {
      name: 'MLM Leader',
      description:
        'Experienced network marketer, manages a team, needs scale and automation',
      idealOnboardingPath: [
        'industry_selected',
        'product_added',
        'pipeline_setup',
        'team_recruiting_flow_setup',
        'chatbot_setup'
      ],
      keyPainPoints: [
        'Team follow-up overwhelm',
        'Tracking downline activity',
        'Automating recruiting messages',
        'Lead qualification at scale'
      ],
      quickWinGoal:
        'Set up automated recruiting funnel and team tracking system'
    },
    insurance_agent: {
      name: 'Insurance Agent',
      description: 'Sells insurance policies, needs lead generation and nurturing',
      idealOnboardingPath: [
        'industry_selected',
        'product_added',
        'chatbot_setup',
        'pipeline_setup',
        'first_lead_captured'
      ],
      keyPainPoints: [
        'Cold calling fatigue',
        'Policy comparison complexity',
        'Long sales cycles',
        'Lead qualification'
      ],
      quickWinGoal: 'Capture first insurance inquiry through AI chatbot'
    },
    real_estate_agent: {
      name: 'Real Estate Agent',
      description: 'Manages property listings, needs buyer/seller qualification',
      idealOnboardingPath: [
        'industry_selected',
        'product_added',
        'chatbot_setup',
        'property_catalog_setup',
        'first_lead_captured'
      ],
      keyPainPoints: [
        'Unqualified property inquiries',
        'Open house no-shows',
        'Buyer/seller qualification time',
        'Multiple property tracking'
      ],
      quickWinGoal: 'Get first qualified property inquiry through AI'
    },
    online_seller: {
      name: 'Online Seller',
      description: 'Sells products online, needs order management and upsells',
      idealOnboardingPath: [
        'industry_selected',
        'product_catalog_upload',
        'chatbot_setup',
        'scanner_first',
        'first_lead_captured'
      ],
      keyPainPoints: [
        'Customer inquiry overload',
        'Abandoned carts',
        'Product recommendation at scale',
        'Order status questions'
      ],
      quickWinGoal: 'First automated product recommendation and sale'
    },
    service_provider: {
      name: 'Service Provider',
      description: 'Provides professional services, needs booking and consultation',
      idealOnboardingPath: [
        'industry_selected',
        'product_added',
        'chatbot_setup',
        'calendar_integration',
        'first_appointment_booked'
      ],
      keyPainPoints: [
        'Consultation scheduling',
        'Service scope questions',
        'Pricing inquiries',
        'Client qualification'
      ],
      quickWinGoal: 'First consultation booked through AI assistant'
    },
    power_user_unknown: {
      name: 'Professional',
      description: 'Exploring NexScout capabilities, needs flexible onboarding',
      idealOnboardingPath: [
        'industry_selected',
        'product_added',
        'chatbot_setup',
        'first_lead_captured'
      ],
      keyPainPoints: [
        'General sales automation',
        'Lead management',
        'Follow-up efficiency',
        'Time management'
      ],
      quickWinGoal: 'Experience first AI-powered sales automation win'
    }
  };

  return characteristics[persona];
}

export async function updatePersonaIfNeeded(
  userId: string,
  newSignals: Record<string, any>
): Promise<void> {
  try {
    const currentResult = await inferOnboardingPersonaWithConfidence(userId);

    if (currentResult.confidence < 0.7) {
      await supabase
        .from('onboarding_personalization')
        .update({
          persona: currentResult.persona,
          confidence_score: currentResult.confidence,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      console.log(
        `Updated persona for ${userId} to ${currentResult.persona} (confidence: ${currentResult.confidence})`
      );
    }
  } catch (error) {
    console.error('Error updating persona:', error);
  }
}
