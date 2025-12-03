import { supabase } from '../../lib/supabase';

export type PersonaCode =
  | 'mlm'
  | 'insurance'
  | 'real_estate'
  | 'online_seller'
  | 'coach';

export interface PersonaDetectionInput {
  userId: string;
  signupRole?: string;
  companyType?: string | null;
  selfDeclaredPersona?: PersonaCode | null;
  behaviorSignals?: {
    visitedPages?: string[];
    toolsUsed?: string[];
  };
}

export interface PersonaDecision {
  primaryPersona: PersonaCode;
  secondaryPersona?: PersonaCode;
  confidence: number;
  detectionSource: string;
  detectionSignals?: Record<string, any>;
}

const PERSONA_PRIORITIES: PersonaCode[] = [
  'mlm',
  'insurance',
  'real_estate',
  'online_seller',
  'coach'
];

const PERSONA_KEYWORDS: Record<PersonaCode, string[]> = {
  mlm: ['mlm', 'network', 'direct selling', 'downline', 'recruiting', 'team building'],
  insurance: ['insurance', 'policy', 'financial', 'advisor', 'agent', 'coverage'],
  real_estate: ['real estate', 'property', 'listing', 'realtor', 'broker', 'house'],
  online_seller: ['seller', 'ecommerce', 'shop', 'store', 'product', 'dropship'],
  coach: ['coach', 'trainer', 'mentor', 'session', 'program', 'consulting']
};

export const onboardingPersonaEngineV2 = {
  async detectAndSavePersona(
    input: PersonaDetectionInput
  ): Promise<PersonaDecision> {
    const decision = this.inferPersona(input);

    try {
      await supabase.rpc('assign_user_persona', {
        p_user_id: input.userId,
        p_persona_code: decision.primaryPersona,
        p_confidence: decision.confidence,
        p_detection_source: decision.detectionSource
      });

      if (decision.secondaryPersona) {
        await supabase
          .from('user_persona_profiles')
          .update({
            secondary_persona_code: decision.secondaryPersona,
            detection_signals: decision.detectionSignals || {},
            updated_at: new Date().toISOString()
          })
          .eq('user_id', input.userId);
      }
    } catch (error) {
      console.error('Error saving persona:', error);
    }

    return decision;
  },

  inferPersona(input: PersonaDetectionInput): PersonaDecision {
    if (input.selfDeclaredPersona) {
      return {
        primaryPersona: input.selfDeclaredPersona,
        confidence: 0.95,
        detectionSource: 'manual',
        detectionSignals: { method: 'self_declared' }
      };
    }

    const role = (input.signupRole || '').toLowerCase();

    if (role) {
      for (const [persona, keywords] of Object.entries(PERSONA_KEYWORDS)) {
        if (keywords.some(keyword => role.includes(keyword))) {
          return {
            primaryPersona: persona as PersonaCode,
            confidence: 0.9,
            detectionSource: 'signup_role',
            detectionSignals: { role, matched_keywords: keywords }
          };
        }
      }
    }

    const companyType = (input.companyType || '').toLowerCase();
    if (companyType) {
      for (const [persona, keywords] of Object.entries(PERSONA_KEYWORDS)) {
        if (keywords.some(keyword => companyType.includes(keyword))) {
          return {
            primaryPersona: persona as PersonaCode,
            confidence: 0.8,
            detectionSource: 'company_data',
            detectionSignals: { companyType, matched_keywords: keywords }
          };
        }
      }
    }

    const behavior = input.behaviorSignals ?? {};
    const visited = (behavior.visitedPages || []).join(' ').toLowerCase();
    const tools = (behavior.toolsUsed || []).join(' ').toLowerCase();
    const behaviorText = `${visited} ${tools}`;

    const scores: Record<PersonaCode, number> = {
      mlm: 0,
      insurance: 0,
      real_estate: 0,
      online_seller: 0,
      coach: 0
    };

    for (const [persona, keywords] of Object.entries(PERSONA_KEYWORDS)) {
      for (const keyword of keywords) {
        if (behaviorText.includes(keyword)) {
          scores[persona as PersonaCode] += 1;
        }
      }
    }

    const ranked = PERSONA_PRIORITIES.map(p => ({
      persona: p,
      score: scores[p]
    })).sort((a, b) => b.score - a.score);

    const primary = ranked[0];
    const secondary = ranked[1];

    if (!primary || primary.score === 0) {
      return {
        primaryPersona: 'mlm',
        confidence: 0.5,
        detectionSource: 'fallback_default',
        detectionSignals: { reason: 'no_signals' }
      };
    }

    return {
      primaryPersona: primary.persona,
      secondaryPersona:
        secondary && secondary.score > 0 ? secondary.persona : undefined,
      confidence: Math.min(0.5 + primary.score * 0.1, 0.85),
      detectionSource: 'behavior_mix',
      detectionSignals: {
        scores,
        behaviorText: behaviorText.substring(0, 100)
      }
    };
  },

  async pickOnboardingSequence(userId: string): Promise<string> {
    try {
      const { data: profile } = await supabase
        .from('user_persona_profiles')
        .select('primary_persona_code')
        .eq('user_id', userId)
        .maybeSingle();

      const personaCode: PersonaCode = profile?.primary_persona_code || 'mlm';

      const { data: sequences } = await supabase
        .from('onboarding_sequences')
        .select('id, sequence_key')
        .eq('persona_code', personaCode)
        .eq('is_persona_specific', true)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1);

      if (sequences && sequences.length > 0) {
        return sequences[0].sequence_key;
      }

      const { data: generic } = await supabase
        .from('onboarding_sequences')
        .select('id, sequence_key')
        .is('persona_code', null)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1);

      if (generic && generic.length > 0) {
        return generic[0].sequence_key;
      }

      return 'onboarding_v1_ethics';
    } catch (error) {
      console.error('Error picking sequence:', error);
      return 'onboarding_v1_ethics';
    }
  },

  async getUserPersona(userId: string): Promise<PersonaDecision | null> {
    try {
      const { data } = await supabase
        .from('user_persona_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!data) return null;

      return {
        primaryPersona: data.primary_persona_code,
        secondaryPersona: data.secondary_persona_code || undefined,
        confidence: data.confidence,
        detectionSource: data.detection_source,
        detectionSignals: data.detection_signals || {}
      };
    } catch (error) {
      console.error('Error getting user persona:', error);
      return null;
    }
  },

  async getAllPersonas(): Promise<Array<{
    code: PersonaCode;
    label: string;
    description: string;
    icon: string;
    color: string;
  }>> {
    try {
      const { data } = await supabase
        .from('personas')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      return (data || []).map(p => ({
        code: p.code as PersonaCode,
        label: p.label,
        description: p.description || '',
        icon: p.icon || '👤',
        color: p.color || '#6B7280'
      }));
    } catch (error) {
      console.error('Error fetching personas:', error);
      return [];
    }
  },

  async getPersonaPerformance(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('persona_onboarding_performance')
        .select('*');

      return data || [];
    } catch (error) {
      console.error('Error fetching persona performance:', error);
      return [];
    }
  }
};
