/**
 * MESSAGING ENGINE V4 - COMPLETE ORCHESTRATOR
 *
 * Full integration of all engines:
 * - AI Settings (ranks, funnels, voice defaults)
 * - Intent detection
 * - Language routing
 * - Compensation plan loading
 * - Member rank awareness
 * - Lead temperature scoring
 * - Funnel engine v3
 * - Voice model selection
 * - AI prompt building
 */

import {
  MessagingInput,
  MessagingOutput,
  UserIntent,
  MessagingPersona,
} from '../../shared/types';
import { detectIntent } from './intentRouter';
import { routeLanguage } from './languageRouter';
import { loadUserCompPlan } from '../../services/compensationPlan.service';
import { getMemberRank } from '../../services/mlmMember.service';
import { computeLeadTemperature, LeadSignals } from '../scoring/leadTemperatureModel';
import { nextFunnelStepRankAware } from '../funnel/funnelEngineV3';
import { VoiceModels, VoicePreset } from '../tone/voiceModels';
import { buildCoachOrSalesPrompt } from '../prompts/promptBuilder';
import {
  loadAiSettings,
  determineRankByVolume,
  getDefaultVoiceForScenario,
  getFunnelStages,
  shouldUseRankBasedCoaching,
} from '../../services/aiSettings.service';
import { buildSystemInstruction } from '../../services/ai/systemInstructionBuilder';

/**
 * Messaging Engine V4 - Complete orchestrator
 */
export async function messagingEngineV4(
  input: MessagingInput
): Promise<MessagingOutput> {
  try {
    // 1. Load AI Settings (single source of truth)
    const userId = input.context?.userId as string | undefined;
    const aiSettings = userId ? await loadAiSettings(userId) : null;

    // 2. Detect intent and language
    const intent: UserIntent = detectIntent(input.message);
    const language = routeLanguage(input);

    // 3. Load user context
    const leadId = input.leadId as string | undefined;
    const memberId = input.context?.memberId as string | undefined;

    // 4. Load MLM plan + determine rank
    const compPlan = userId ? await loadUserCompPlan(userId) : null;
    let memberRank = memberId ? await getMemberRank(memberId) : 'Starter';

    // Use AI settings for rank determination if available
    if (aiSettings && input.context?.teamVolume) {
      memberRank = determineRankByVolume(aiSettings, input.context.teamVolume as number);
    }

    // 5. Compute lead temperature
    const leadSignals: LeadSignals = input.context?.leadSignals || {};
    const leadTempResult = computeLeadTemperature(leadSignals);

    // 6. Run funnel engine (rank + temp aware)
    const funnelContext = {
      intent,
      leadTemperature: leadTempResult.temperature as any,
      memberRank,
      compPlan,
      currentStage: input.context?.funnelStage ?? 'awareness',
    };

    const funnelStep = nextFunnelStepRankAware(funnelContext);

    // 7. Voice preset selection (from AI settings or smart defaults)
    let voicePreset: VoicePreset = 'professionalAdvisor';

    if (aiSettings) {
      // Use AI settings for voice selection
      if (funnelStep.stage === 'closing' || intent === 'closingOpportunity') {
        voicePreset = aiSettings.aiBehavior.defaultVoiceForClosing as VoicePreset;
      } else if (funnelStep.stage.includes('revive') || intent === 'leadFollowUp') {
        voicePreset = aiSettings.aiBehavior.defaultVoiceForRevival as VoicePreset;
      } else if (intent === 'mlmTraining' || intent === 'mlmRecruit') {
        voicePreset = aiSettings.aiBehavior.defaultVoiceForTraining as VoicePreset;
      }
    } else {
      // Fallback to smart defaults
      if (intent === 'mlmRecruit' || intent === 'mlmTraining') {
        voicePreset = memberRank === 'Starter' ? 'softNurturer' : 'energeticCoach';
      } else if (intent === 'salesInquiry' || intent === 'closingOpportunity') {
        voicePreset =
          leadTempResult.temperature === 'hot' || leadTempResult.temperature === 'readyToBuy'
            ? 'aggressiveCloser'
            : 'softNurturer';
      } else if (
        intent === 'customerSupport' ||
        intent === 'techSupport' ||
        intent === 'complaint'
      ) {
        voicePreset = 'empathicSupport';
      }
    }

    const voiceProfile = VoiceModels[voicePreset];

    // 8. Build master system instruction from workspace config
    let masterSystemInstruction = '';
    const workspaceId = input.context?.workspaceId as string | undefined;

    if (workspaceId) {
      try {
        const instructionResult = await buildSystemInstruction({
          workspaceId,
          channelType: input.config.channel || 'web',
          prospectName: input.context?.prospectName as string | undefined,
          prospectData: input.context?.prospectData as Record<string, any> | undefined,
          currentFunnelStage: funnelStep.stage,
          memberRank,
          leadTemperature: leadTempResult.temperature,
        });
        masterSystemInstruction = instructionResult.systemInstruction;
      } catch (error) {
        console.error('[MessagingEngineV4] Failed to build workspace instruction:', error);
      }
    }

    // 9. Build legacy prompt (kept for backwards compatibility and augmentation)
    const promptPayload = buildCoachOrSalesPrompt({
      intent,
      language,
      voiceProfile,
      funnelStep,
      compPlan,
      memberRank,
      leadTemperature: leadTempResult,
      userMessage: input.message,
      customInstructionsRaw: input.context?.customInstructions as string | undefined,
    });

    // 10. Combine workspace instruction with legacy prompt if both exist
    const finalSystemPrompt = masterSystemInstruction
      ? `${masterSystemInstruction}\n\n========================================\nADDITIONAL CONTEXT\n========================================\n\n${promptPayload.systemPrompt}`
      : promptPayload.systemPrompt;

    // 11. TODO: Call actual LLM here
    // Example: const llmReply = await callOpenAI(finalSystemPrompt, promptPayload.userPrompt);
    // For now, return structured placeholder
    const llmReply = generatePlaceholderReply(intent, language, funnelStep.stage, memberRank);

    // 12. Return complete response
    return {
      reply: llmReply,
      intent,
      persona: (funnelStep.persona as MessagingPersona) ?? 'default',
      language,
      leadTemperature: leadTempResult.score,
      meta: {
        funnelStep: funnelStep.stage,
        funnelGoal: funnelStep.goal,
        sequenceKey: funnelStep.sequenceKey,
        rank: memberRank,
        voicePreset,
        compensationPlanUsed: !!compPlan,
        aiSettingsUsed: !!aiSettings,
        workspaceInstructionUsed: !!masterSystemInstruction,
        temperatureReason: leadTempResult.reasons[0],
        recommendedActions: funnelStep.recommendedActions,
        systemPrompt: finalSystemPrompt,
        legacySystemPrompt: promptPayload.systemPrompt,
        userPrompt: promptPayload.userPrompt,
        promptMetadata: promptPayload.metadata,
      },
    };
  } catch (error) {
    console.error('[MessagingEngineV4] Error:', error);
    return {
      reply: 'I apologize, but I encountered an error processing your message. Please try again.',
      intent: 'unknown',
      persona: 'default',
      language: 'en',
      leadTemperature: 50,
      meta: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Generate placeholder reply (replace with real LLM call)
 */
function generatePlaceholderReply(
  intent: string,
  language: string,
  stage: string,
  rank: string
): string {
  // This is a placeholder - replace with actual LLM integration
  const templates: Record<string, string> = {
    salesInquiry: `I'd love to share more about this opportunity with you! Based on where we are in the conversation, let me provide you with some details that I think you'll find valuable.`,
    mlmRecruit: `${rank === 'Starter' ? 'I'm excited to share this opportunity with you!' : 'As a leader in our organization, I can help you build something amazing.'} Let's discuss how this could work for you.`,
    productEducation: `Great question! Let me break this down for you in a simple way. This product/service addresses exactly what you mentioned.`,
    customerSupport: `I'm here to help! Let me address your concern right away and make sure we find the best solution for you.`,
    default: `Thank you for reaching out! I'm here to help. Can you tell me more about what you're looking for?`,
  };

  return templates[intent] || templates.default;
}

/**
 * Export as both named and default
 */
export default messagingEngineV4;
