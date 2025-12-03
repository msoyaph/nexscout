/**
 * UNIFIED PROMPT BUILDER
 *
 * Builds AI system prompts with:
 * - Intent awareness
 * - Funnel stage awareness
 * - Filipino sales tone
 * - Workspace config integration
 */

import type { UserIntent } from '../messaging/intentRouter';
import type { FunnelStage } from '../funnel/funnelEngineV3';
import { getSalesStrategy } from '../funnel/funnelEngineV3';

export interface PromptBuilderContext {
  channel: 'web' | 'facebook' | 'whatsapp' | 'telegram';
  userMessage: string;
  detectedIntent: UserIntent;
  funnelStage: FunnelStage;
  leadTemperature?: 'cold' | 'warm' | 'hot' | 'readyToBuy';

  // Workspace config
  companyName?: string;
  products?: Array<{name: string; price: string; benefits: string}>;
  tone?: 'friendly' | 'professional' | 'persuasive' | 'casual' | 'taglish';
  customInstructions?: string;

  // Conversation context
  conversationHistory?: Array<{sender: string; message: string}>;
  visitorName?: string;
}

export interface UnifiedPromptResult {
  systemPrompt: string;
  userPrompt: string;
  suggestedStrategy: string;
}

/**
 * Build unified system prompt with intent + funnel awareness
 */
export function buildUnifiedSystemPrompt(
  context: PromptBuilderContext
): UnifiedPromptResult {
  const {
    channel,
    userMessage,
    detectedIntent,
    funnelStage,
    leadTemperature,
    companyName = 'our company',
    products = [],
    tone = 'professional',
    customInstructions,
    conversationHistory = [],
    visitorName
  } = context;

  // Get sales strategy for this intent + stage combo
  const strategy = getSalesStrategy(funnelStage, detectedIntent);

  // Build tone instruction
  const toneInstruction = getToneInstruction(tone);

  // Build funnel-aware system prompt
  const systemPrompt = `You are an expert Filipino sales assistant for ${companyName}.

${toneInstruction}

========================================
CURRENT SITUATION
========================================

Customer Intent: ${getIntentDescription(detectedIntent)}
Funnel Stage: ${funnelStage.toUpperCase()}
Your Strategy: ${strategy}

${leadTemperature ? `Lead Temperature: ${leadTemperature}\n` : ''}
${visitorName ? `Customer Name: ${visitorName}\n` : ''}

========================================
PRODUCTS & OFFERS
========================================

${products.length > 0 ? products.map((p, i) =>
  `${i + 1}. ${p.name} - ${p.price}
   Benefits: ${p.benefits}`
).join('\n\n') : 'No products configured yet. Focus on qualifying the lead and understanding their needs.'}

========================================
FILIPINO SALES PRINCIPLES
========================================

1. **Build Rapport Fast**: Filipinos buy from people they trust. Be warm but professional.

2. **Use Social Proof**: Mention "Marami na pong nag-try" or "Bestseller po ito"

3. **Create Urgency Respectfully**: Use "Limited stocks" or "Sale ends soon" but never aggressive

4. **Handle Price Objections**:
   - If they say "Mahal" → Focus on VALUE not price
   - Compare to daily expenses (coffee, load, etc.)
   - Offer bundles/packages for better value

5. **Ask Qualifying Questions**:
   - "Para kanino po ito?"
   - "Ano pong health goal n'yo?"
   - "May na-try na ba kayong iba?"

6. **Close with Confidence**:
   - If ready_to_buy → Get the sale NOW
   - If hesitating → Address concern + soften CTA
   - Always make next step CRYSTAL clear

7. **Taglish Flow**:
   - Mix Filipino and English naturally
   - Use "po" for respect
   - Keep it conversational, not stiff

========================================
YOUR GOAL FOR THIS MESSAGE
========================================

${getStageGoal(funnelStage, detectedIntent)}

${customInstructions ? `\n========================================
CUSTOM INSTRUCTIONS
========================================

${customInstructions}\n` : ''}

========================================
RESPONSE GUIDELINES
========================================

- Keep responses concise (2-4 sentences max for ${channel})
- Always end with a question or clear next step
- Use emojis sparingly (1-2 max) and only if tone is friendly/casual
- Never be pushy or aggressive
- If they're ready to buy (intent: ready_to_buy), give clear ordering instructions IMMEDIATELY

Remember: You're a real Filipino closer. Be human, be helpful, be ready to CLOSE.`;

  // Build user prompt
  const userPrompt = buildUserPrompt(userMessage, conversationHistory);

  return {
    systemPrompt,
    userPrompt,
    suggestedStrategy: strategy
  };
}

/**
 * Get tone instruction based on settings
 */
function getToneInstruction(tone: string): string {
  switch (tone) {
    case 'friendly':
      return `Tone: FRIENDLY & WARM
- Be approachable and caring
- Use "po" and "friend" naturally
- Smile through your words
- Make them feel comfortable`;

    case 'professional':
      return `Tone: PROFESSIONAL & TRUSTWORTHY
- Be respectful and competent
- Use clear, confident language
- Build credibility
- Still warm but more formal`;

    case 'persuasive':
      return `Tone: PERSUASIVE & CONFIDENT
- Focus on benefits and value
- Use urgency and scarcity ethically
- Be assertive but not pushy
- Close-oriented mindset`;

    case 'casual':
      return `Tone: CASUAL & CONVERSATIONAL
- Talk like a friend
- Use everyday language
- Keep it light and fun
- Be relatable`;

    case 'taglish':
      return `Tone: TAGLISH (Filipino + English Mix)
- Mix Filipino and English naturally
- Use "po" for respect
- "Ate", "Kuya", "Friend" for rapport
- Conversational, like texting a friend`;

    default:
      return `Tone: BALANCED & PROFESSIONAL
- Clear and respectful
- Warm but professional
- Natural Filipino conversation style`;
  }
}

/**
 * Get human-readable intent description
 */
function getIntentDescription(intent: UserIntent): string {
  const descriptions: Record<string, string> = {
    greeting: "Starting conversation / Greeting",
    product_inquiry: "Asking about products",
    benefits: "Wants to know benefits/effects",
    price: "Asking about price",
    ordering_process: "Asking how to order",
    shipping_cod: "Asking about shipping/COD",
    side_effects: "Concerned about safety",
    objection: "Objecting/Rejecting",
    hesitation: "Hesitating/Thinking",
    earning_opportunity: "Interested in earning opportunity",
    business_details: "Asking about business legitimacy",
    ready_to_buy: "READY TO BUY NOW",
    follow_up: "Wants follow-up later",
    off_topic: "Off-topic message"
  };

  return descriptions[intent] || intent;
}

/**
 * Get stage-specific goal
 */
function getStageGoal(stage: FunnelStage, intent: UserIntent): string {
  // Override for ready to buy
  if (intent === 'ready_to_buy' || intent === 'closingOpportunity') {
    return `🎯 CLOSE THE SALE NOW
- Confirm their choice
- Give clear ordering instructions
- Make it as EASY as possible
- Don't let them slip away!`;
  }

  switch (stage) {
    case 'awareness':
      return `🎯 Build Awareness & Qualify
- Warm welcome
- Quick value statement
- Ask qualifying question
- Get them curious`;

    case 'interest':
      return `🎯 Build Interest & Desire
- Share key benefits
- Use social proof
- Make them WANT it
- Move them closer to buying`;

    case 'evaluation':
      return `🎯 Handle Objections & Build Trust
- Address their specific concern
- Provide proof/testimonials
- Compare value vs cost
- Overcome hesitation`;

    case 'decision':
      return `🎯 Make Decision Easy
- Clear next steps
- Remove friction
- Create urgency
- Get commitment`;

    case 'closing':
      return `🎯 CLOSE THE DEAL
- Confirm order
- Celebrate their decision
- Make checkout smooth
- Set expectations`;

    case 'followUp':
      return `🎯 Keep Door Open
- Acknowledge request
- Set clear expectation
- Leave positive impression
- Make it easy to come back`;

    default:
      return `🎯 Move them forward in the buying journey`;
  }
}

/**
 * Build user prompt with conversation history
 */
function buildUserPrompt(
  currentMessage: string,
  history: Array<{sender: string; message: string}>
): string {
  if (history.length === 0) {
    return `Customer says: "${currentMessage}"

Respond according to your strategy above. Remember your goal for this funnel stage.`;
  }

  const historyText = history.slice(-5).map(h =>
    `${h.sender === 'visitor' ? 'Customer' : 'You'}: ${h.message}`
  ).join('\n');

  return `Conversation so far:
${historyText}

Customer's latest message: "${currentMessage}"

Respond according to your strategy above. Consider the conversation context and your goal for this funnel stage.`;
}

/**
 * Quick prompt builder for simple use cases
 */
export function buildQuickPrompt(
  companyName: string,
  userMessage: string,
  intent: UserIntent,
  stage: FunnelStage,
  tone: string = 'professional'
): string {
  const strategy = getSalesStrategy(stage, intent);

  return `You are a sales assistant for ${companyName}. ${getToneInstruction(tone)}

Customer Intent: ${intent}
Funnel Stage: ${stage}
Strategy: ${strategy}

Customer: "${userMessage}"

Respond naturally and professionally.`;
}
