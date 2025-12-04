/**
 * PROMPT BUILDER V2
 *
 * Centralized prompt builder combining:
 * - Rank coach persona
 * - Funnel step
 * - Compensation plan summary
 * - Voice model
 * - Language
 * - Lead temperature
 * - Custom instructions (optional)
 */

import { UserIntent } from '../../shared/types';
import { VoiceProfile } from '../tone/voiceModels';
import { FunnelStepResult } from '../funnel/funnelEngineV3';
import { getCoachPromptForRank } from './coachPersonaPrompts';

export interface LeadTemperatureResult {
  temperature: 'cold' | 'warm' | 'hot' | 'readyToBuy';
  score: number;
  reasons: string[];
  recommendedNextStep: string;
}

export interface PromptContext {
  intent: string;
  language: string;
  voiceProfile: VoiceProfile;
  funnelStep: FunnelStepResult;
  compPlan: any | null;
  memberRank: string;
  leadTemperature: {
    temperature: string;
    score: number;
    reasons: string[];
    recommendedNextStep: string;
  };
  userMessage: string;
}

export interface PromptPayload {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface BuildPromptInput {
  intent: UserIntent;
  language: 'en' | 'fil' | 'ceb' | 'es';
  voiceProfile: VoiceProfile;
  funnelStep: FunnelStepResult;
  compPlan?: any | null;
  memberRank: string;
  leadTemperature: LeadTemperatureResult;
  userMessage: string;
  customInstructionsRaw?: string; // user-defined CI text if you pass it
}

interface BuildPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    rank: string;
    language: string;
    intent: UserIntent;
    funnelStage: string;
    sequenceKey: string;
    persona: string;
    temperature: string;
    voiceProfileName: string;
  };
}

/**
 * Summarize compensation plan in a compact way for the LLM.
 */
function summarizeCompPlan(compPlan: any | null | undefined): string {
  if (!compPlan) return 'No detailed compensation plan provided.';

  const { planName, planType, levels, rankRules } = compPlan;

  const levelSummary =
    levels && Array.isArray(levels)
      ? levels
          .map((l: any) => `L${l.level}: ${l.percentage}%`)
          .join(', ')
      : 'No level data.';

  const rankSummary =
    rankRules && Array.isArray(rankRules)
      ? rankRules
          .map(
            (r: any) =>
              `${r.rank}: min volume ${typeof r.minVolume === 'number' ? r.minVolume : 'N/A'}`
          )
          .join('; ')
      : 'No rank rules.';

  return `
Plan name: ${planName ?? 'Unknown'}
Plan type: ${planType ?? 'unilevel'}
Level commissions: ${levelSummary}
Rank rules: ${rankSummary}
`.trim();
}

/**
 * Basic language instructions.
 */
function languageInstruction(lang: 'en' | 'fil' | 'ceb' | 'es'): string {
  switch (lang) {
    case 'fil':
      return 'Reply primarily in Filipino/Taglish, friendly but clear.';
    case 'ceb':
      return 'Reply primarily in Cebuano, casual and conversational.';
    case 'es':
      return 'Reply primarily in Spanish, polite and clear.';
    default:
      return 'Reply in clear, simple English.';
  }
}

/**
 * Custom instructions block (if any).
 */
function customInstructionBlock(ci?: string): string {
  if (!ci) return 'No user custom instructions provided.';
  return `User Custom Instructions (highest priority, but must not break funnels or logic):
${ci}`;
}

/**
 * Main builder: all AI messaging & coaching should use this.
 */
export function buildCoachOrSalesPrompt(
  input: BuildPromptInput
): BuildPromptOutput {
  const {
    intent,
    language,
    voiceProfile,
    funnelStep,
    compPlan,
    memberRank,
    leadTemperature,
    userMessage,
    customInstructionsRaw,
  } = input;

  const isCoachingIntent =
    intent === 'mlmTraining' ||
    intent === 'mlmRecruit' ||
    intent === 'productEducation';

  const rankCoachPrompt = getCoachPromptForRank(memberRank);
  const compSummary = summarizeCompPlan(compPlan);
  const langInstr = languageInstruction(language);
  const ciBlock = customInstructionBlock(customInstructionsRaw);

  const systemPrompt = `
You are NEXSCOUT AI, a unified engine for MLM, direct selling, and sales teams.

You ALWAYS respect this priority stack:
1) User Custom Instructions (if safe and not breaking funnels)
2) Company & Product Intelligence
3) Compensation Plan Rules
4) Funnel Logic (stage + sequence)
5) Rank-based coaching logic
6) Voice model (tone/urgency/emoji rules)
7) Global safety and clarity rules

======== RANK COACH PERSONA ========
${rankCoachPrompt}

======== COMPENSATION PLAN SUMMARY ========
${compSummary}

======== FUNNEL CONTEXT ========
Current funnel stage: ${funnelStep.stage}
Sequence key: ${funnelStep.sequenceKey}
Funnel goal: ${funnelStep.goal}
Funnel persona type: ${funnelStep.persona}

======== LEAD TEMPERATURE ========
Temperature: ${leadTemperature.temperature}
Score: ${leadTemperature.score}
Recommended next step: ${leadTemperature.recommendedNextStep}

======== VOICE MODEL ========
Name: ${voiceProfile.name}
Description: ${voiceProfile.description}
Sentence length: ${voiceProfile.sentenceLength}
Emoji usage: ${voiceProfile.emojiUsage}
Urgency level: ${voiceProfile.urgencyLevel}
Formality: ${voiceProfile.formality}
Default language mix: ${voiceProfile.defaultLanguageMix}

======== LANGUAGE INSTRUCTIONS ========
${langInstr}

======== CUSTOM INSTRUCTIONS (USER) ========
${ciBlock}

======== RESPONSE RULES ========
- Always keep replies focused and practical.
- Ask at most 1–2 questions at a time.
- Use the funnel goal to move the user forward, not sideways.
- If coaching, give clear action steps.
- If selling, include a simple, natural call-to-action.
- Do NOT promise guaranteed income.
- Do NOT contradict the compensation plan.
- Do NOT use overly complex jargon.

If there is a conflict between user custom instructions and funnel/plan logic:
- Keep the funnel and plan logic stable.
- Gently adjust style, not strategy.
`.trim();

  const userPrompt = `
User intent: ${intent}
User rank: ${memberRank}
Lead temperature: ${leadTemperature.temperature} (score ${leadTemperature.score})
User message:
"${userMessage}"
`.trim();

  return {
    systemPrompt,
    userPrompt,
    metadata: {
      rank: memberRank,
      language,
      intent,
      funnelStage: funnelStep.stage,
      sequenceKey: funnelStep.sequenceKey,
      persona: funnelStep.persona,
      temperature: leadTemperature.temperature,
      voiceProfileName: voiceProfile.name,
    },
  };
}

/**
 * Legacy function - maintained for backwards compatibility
 */
export function buildCoachOrSalesPromptLegacy(context: PromptContext): PromptPayload {
  const systemPrompt = buildSystemPrompt(context);
  const userPrompt = buildUserPromptLegacy(context);

  // Temperature based on lead temperature
  let temperature = 0.7;
  if (context.leadTemperature.temperature === 'readyToBuy') {
    temperature = 0.5; // More consistent for closing
  } else if (context.leadTemperature.temperature === 'cold') {
    temperature = 0.8; // More creative for cold leads
  }

  return {
    systemPrompt,
    userPrompt,
    temperature,
    maxTokens: 300,
  };
}

/**
 * Build system prompt
 */
function buildSystemPrompt(context: PromptContext): string {
  const { voiceProfile, funnelStep, memberRank, language } = context;

  let prompt = `You are an AI sales assistant for NexScout.

VOICE & TONE:
${voiceProfile.description}
- Sentence length: ${voiceProfile.sentenceLength}
- Emoji usage: ${voiceProfile.emojiUsage}
- Urgency level: ${voiceProfile.urgencyLevel}
- Formality: ${voiceProfile.formality}
- Personality: ${voiceProfile.personality_traits.join(', ')}

CURRENT FUNNEL STAGE: ${funnelStep.stage}
GOAL: ${funnelStep.goal}

`;

  // Add rank-specific coaching if member is Silver or above
  if (['Silver', 'Gold', 'Platinum', 'Diamond'].includes(memberRank)) {
    prompt += `\n${getCoachPromptForRank(memberRank)}\n`;
  }

  // Add compensation plan context if available
  if (context.compPlan) {
    const levelSummary = context.compPlan.levels
      .map((l: any) => `L${l.level}: ${l.percentage}%`)
      .slice(0, 3)
      .join(', ');

    prompt += `\nCOMPENSATION PLAN: ${context.compPlan.planName}
- Type: ${context.compPlan.planType}
- Commission levels: ${levelSummary}${context.compPlan.levels.length > 3 ? '...' : ''}
`;
  }

  // Add language instruction
  if (language === 'fil' || language === 'ceb') {
    prompt += `\nLANGUAGE: Respond in ${language === 'fil' ? 'Filipino/Taglish' : 'Cebuano/Bisaya'}.
Use natural, conversational ${language === 'fil' ? 'Filipino' : 'Bisaya'} with English terms when appropriate.
`;
  } else if (language === 'es') {
    prompt += `\nLANGUAGE: Respond in Spanish. Use polite, professional Spanish.
`;
  } else {
    prompt += `\nLANGUAGE: Respond in English. Clear and professional.
`;
  }

  // Add recommended actions
  if (funnelStep.recommendedActions.length > 0) {
    prompt += `\nRECOMMENDED ACTIONS:
${funnelStep.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;
  }

  prompt += `\nIMPORTANT:
- Keep response SHORT (2-3 sentences max)
- Be SPECIFIC and ACTIONABLE
- Match the ${voiceProfile.name} style
- NO generic advice
- Include ONE clear next step`;

  return prompt;
}

/**
 * Build user prompt (legacy)
 */
function buildUserPromptLegacy(context: PromptContext): string {
  const { leadTemperature, userMessage, intent } = context;

  let prompt = `Lead temperature: ${leadTemperature.temperature} (score: ${leadTemperature.score}/100)
`;

  if (leadTemperature.reasons.length > 0) {
    prompt += `Signals: ${leadTemperature.reasons.slice(0, 2).join(', ')}
`;
  }

  prompt += `Intent detected: ${intent}

User message: "${userMessage}"

Respond now:`;

  return prompt;
}

/**
 * Build prompt specifically for MLM coaching
 */
export function buildMLMCoachingPrompt(
  rank: string,
  compPlan: any | null,
  stats: {
    personalVolume: number;
    teamVolume: number;
    teamSize: number;
  },
  question: string
): PromptPayload {
  const systemPrompt = getCoachPromptForRank(rank);

  let userPrompt = `Current stats:
- Rank: ${rank}
- Personal volume: ${stats.personalVolume.toLocaleString()} PHP
- Team volume: ${stats.teamVolume.toLocaleString()} PHP
- Team size: ${stats.teamSize} members
`;

  if (compPlan) {
    userPrompt += `- Compensation plan: ${compPlan.planName}
`;
  }

  userPrompt += `\nQuestion: "${question}"

Provide coaching advice:`;

  return {
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 250,
  };
}
