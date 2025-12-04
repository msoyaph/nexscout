import { buildCompanyContext } from '../company/companyPersonalization';
import { getPersonaAdjustments } from './companyLearningEngine';
import { supabase } from '../../lib/supabase';

export interface BuildPromptInput {
  userId: string;
  companyId?: string;
  personaId?: string;
  prospectContext?: any;
  goal: string;
  contentType: string;
}

export interface BuiltPromptResult {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    personaUsed?: string;
    adjustmentsApplied: boolean;
    safetyChecked: boolean;
  };
}

export async function buildCompanyAwarePrompt(input: BuildPromptInput): Promise<BuiltPromptResult> {
  try {
    const companyContext = await buildCompanyContext(input.userId);

    let personaConfig: any = null;
    if (input.personaId) {
      const { data } = await supabase
        .from('company_personas')
        .select('*')
        .eq('id', input.personaId)
        .maybeSingle();
      personaConfig = data;
    }

    let adjustments: any = {};
    if (input.personaId) {
      const adj = await getPersonaAdjustments(input.userId, input.personaId, input.companyId);
      adjustments = adj.adjustments;
    }

    const systemPrompt = buildSystemPrompt(companyContext, personaConfig, adjustments);
    const userPrompt = buildUserPrompt(input);

    return {
      systemPrompt,
      userPrompt,
      metadata: {
        personaUsed: personaConfig?.name,
        adjustmentsApplied: Object.keys(adjustments).length > 0,
        safetyChecked: true,
      },
    };
  } catch (error) {
    console.error('Build company aware prompt error:', error);
    return {
      systemPrompt: 'You are a helpful AI assistant.',
      userPrompt: `Create ${input.contentType} for ${input.goal}`,
      metadata: {
        adjustmentsApplied: false,
        safetyChecked: false,
      },
    };
  }
}

function buildSystemPrompt(companyContext: any, personaConfig: any, adjustments: any): string {
  let prompt = 'You are NexScout AI, a personalized outreach assistant.\n\n';

  if (companyContext) {
    prompt += `COMPANY: ${companyContext.profile.name}\n`;
    prompt += `INDUSTRY: ${companyContext.profile.industry}\n`;
    prompt += `TONE: ${companyContext.toneSettings.tone}\n\n`;
    prompt += `VALUE PROPS:\n${companyContext.valuePropositions}\n\n`;
  }

  if (personaConfig?.tone_settings) {
    prompt += `PERSONA SETTINGS:\n${JSON.stringify(personaConfig.tone_settings, null, 2)}\n\n`;
  }

  if (Object.keys(adjustments).length > 0) {
    prompt += `LEARNED PREFERENCES:\n`;
    if (adjustments.preferShortMessages) prompt += '- Keep messages short and concise\n';
    if (adjustments.preferStoryBased) prompt += '- Use story-based approaches\n';
    if (adjustments.reducedAggression) prompt += '- Use consultative, not aggressive tone\n';
    prompt += '\n';
  }

  prompt += 'Focus on authenticity, value, and building trust. Avoid hype and false promises.';

  return prompt;
}

function buildUserPrompt(input: BuildPromptInput): string {
  let prompt = `Create a ${input.contentType} with goal: ${input.goal}\n\n`;

  if (input.prospectContext) {
    prompt += `PROSPECT INFO:\n${JSON.stringify(input.prospectContext, null, 2)}\n\n`;
  }

  return prompt;
}
