/**
 * Intelligence Integration Helper
 *
 * Simplifies using merged intelligence across all engines.
 * All AI engines should use this for consistent intelligence merging.
 */

import { intelligenceMergeEngine, IntelligenceContext, MergedIntelligence } from './intelligenceMergeEngine';
import { customInstructionsEngine } from './customInstructionsEngine';

/**
 * Get merged intelligence for any context
 * Use this in: Chatbot, Product Intelligence, Pitch Decks, Messaging, etc.
 */
export async function getMergedIntelligence(
  userId: string,
  context: 'chatbot_response' | 'pitch_generation' | 'message_compose' | 'product_script' | 'follow_up_sequence'
): Promise<MergedIntelligence> {
  return await intelligenceMergeEngine.mergeAllIntelligence({
    userId,
    context,
  });
}

/**
 * Apply merged intelligence to text content
 * Removes forbidden phrases, applies tone adjustments
 */
export function applyIntelligenceToText(text: string, intelligence: MergedIntelligence): string {
  return intelligenceMergeEngine.applyIntelligenceToText(text, intelligence);
}

/**
 * Validate content against custom instructions
 * Returns validation result with issues
 */
export function validateContent(content: string, intelligence: MergedIntelligence): {
  valid: boolean;
  issues: string[];
} {
  return intelligenceMergeEngine.validateContent(content, intelligence);
}

/**
 * Example: Chatbot Integration
 */
export async function generateChatbotReply(
  userId: string,
  userMessage: string,
  prospectContext?: Record<string, any>
): Promise<{ reply: string; intelligence: MergedIntelligence }> {
  // 1. Get merged intelligence
  const intelligence = await getMergedIntelligence(userId, 'chatbot_response');

  // 2. Generate response using your LLM/AI with merged intelligence
  const prompt = `
You are NexScout AI Sales Assistant.

TONE: ${intelligence.tone}
PERSONA: ${intelligence.persona}
STYLE: ${intelligence.sellingStyle}
LANGUAGE: ${intelligence.language}

FORBIDDEN PHRASES (never use): ${intelligence.forbiddenPhrases.join(', ')}
REQUIRED PHRASES (try to include): ${intelligence.requiredPhrases.join(', ')}

BEHAVIOR:
- Aggressiveness: ${intelligence.behavior.aggressiveness}
- Empathy Level: ${intelligence.behavior.empathyLevel}
- Questioning Style: ${intelligence.behavior.questioningStyle}

CHATBOT SETTINGS:
- Greeting Style: ${intelligence.chatbot.greetingStyle}
- Closing Style: ${intelligence.chatbot.closingStyle}
- Objection Handling: ${intelligence.chatbot.objectionHandling}

COMPANY INFO:
${JSON.stringify(intelligence.companyData, null, 2)}

PRODUCT INFO:
${JSON.stringify(intelligence.productData, null, 2)}

User Message: "${userMessage}"

Generate a helpful, persuasive reply that follows all the above rules.
`;

  // For now, return a mock reply (replace with actual LLM call)
  let reply = `Thank you for your message! I'd love to help you with our products.`;

  // 3. Apply intelligence filters
  reply = applyIntelligenceToText(reply, intelligence);

  // 4. Validate
  const validation = validateContent(reply, intelligence);
  if (!validation.valid) {
    console.warn('[Chatbot] Validation issues:', validation.issues);
    // Could regenerate or fix issues here
  }

  return { reply, intelligence };
}

/**
 * Example: Product Script Generation
 */
export async function generateProductScript(
  userId: string,
  productId: string
): Promise<{ script: string; intelligence: MergedIntelligence }> {
  const intelligence = await getMergedIntelligence(userId, 'product_script');

  // Use merged product data (custom overrides auto)
  const productData = intelligence.productData;

  // Generate script with proper tone and persona
  const script = `
[${intelligence.tone.toUpperCase()} TONE]

${intelligence.persona} speaking:

${JSON.stringify(productData, null, 2)}

[Script would be generated here using LLM with above intelligence]
`;

  return { script: applyIntelligenceToText(script, intelligence), intelligence };
}

/**
 * Example: Pitch Deck Generation
 */
export async function generatePitchDeck(
  userId: string,
  productId: string
): Promise<{ deck: any; intelligence: MergedIntelligence }> {
  const intelligence = await getMergedIntelligence(userId, 'pitch_generation');

  // Apply pitch deck overrides if any
  const pitchOverrides = intelligence.pitchScripts;

  const deck = {
    tone: intelligence.tone,
    style: intelligence.sellingStyle,
    companyInfo: intelligence.companyData,
    productInfo: intelligence.productData,
    overrides: pitchOverrides,
    slides: [
      {
        title: 'Company Overview',
        content: intelligence.companyData,
        customContent: pitchOverrides?.slide1 || null,
      },
      // ... more slides
    ],
  };

  return { deck, intelligence };
}

/**
 * Example: Follow-Up Sequence Generation
 */
export async function generateFollowUpSequence(
  userId: string,
  prospectId: string
): Promise<{ sequence: any[]; intelligence: MergedIntelligence }> {
  const intelligence = await getMergedIntelligence(userId, 'follow_up_sequence');

  // ML hints may suggest timing
  const timing = intelligence.mlHints?.suggestedTiming || 'default';

  const sequence = [
    {
      day: 1,
      message: `Initial follow-up in ${intelligence.tone} tone`,
      timing,
    },
    {
      day: 3,
      message: `Second follow-up using ${intelligence.persona} persona`,
      timing,
    },
    // ... more steps
  ];

  return { sequence, intelligence };
}

/**
 * Track performance of custom instructions
 */
export async function trackInstructionPerformance(
  userId: string,
  field: string,
  value: string,
  outcome: 'reply' | 'meeting' | 'close'
): Promise<void> {
  await customInstructionsEngine.trackPerformance(userId, field, value, outcome);
}

/**
 * Check for conflicts between custom and auto intelligence
 */
export async function checkIntelligenceConflicts(
  userId: string,
  intelligence: MergedIntelligence
): Promise<void> {
  // This would check for conflicts and create warnings
  // Implementation would use customInstructionsEngine.checkConflicts
  console.log('[Intelligence] Checking conflicts for user:', userId);
}
