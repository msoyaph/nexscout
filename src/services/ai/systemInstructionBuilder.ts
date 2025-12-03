/**
 * SYSTEM INSTRUCTION BUILDER
 *
 * Builds the master AI system instruction using workspace config
 * Prevents cross-brand contamination by isolating each workspace
 * Dynamically fills template with company-specific data
 */

import { WorkspaceConfig } from '../../types/WorkspaceConfig';
import { loadWorkspaceConfig } from '../workspaceConfig.service';

export interface SystemInstructionContext {
  workspaceId: string;
  channelType?: 'web' | 'facebook' | 'whatsapp' | 'sms' | 'email';
  prospectName?: string;
  prospectData?: Record<string, any>;
  conversationHistory?: string;
  currentFunnelStage?: string;
  memberRank?: string;
  leadTemperature?: string;
}

export interface SystemInstructionOutput {
  systemInstruction: string;
  metadata: {
    workspaceId: string;
    companyName: string;
    channelType: string;
    generatedAt: string;
    configVersion: string;
  };
}

/**
 * Build complete system instruction from workspace config
 */
export async function buildSystemInstruction(
  context: SystemInstructionContext
): Promise<SystemInstructionOutput> {
  const config = await loadWorkspaceConfig(context.workspaceId);

  const systemInstruction = buildMasterPrompt(config, context);

  return {
    systemInstruction,
    metadata: {
      workspaceId: context.workspaceId,
      companyName: config.company.name,
      channelType: context.channelType || 'web',
      generatedAt: new Date().toISOString(),
      configVersion: config.updatedAt,
    },
  };
}

/**
 * Build the master prompt with all dynamic variables filled
 */
function buildMasterPrompt(
  config: WorkspaceConfig,
  context: SystemInstructionContext
): string {
  const sections: string[] = [];

  // 1. IDENTITY & ROLE
  sections.push(buildIdentitySection(config, context));

  // 2. CUSTOM INSTRUCTIONS (HIGHEST PRIORITY)
  if (config.customInstructions.globalInstructions) {
    sections.push(buildCustomInstructionsSection(config));
  }

  // 3. COMPANY & BRAND CONTEXT
  sections.push(buildCompanySection(config));

  // 4. PRODUCTS & SERVICES
  if (config.products.products.length > 0) {
    sections.push(buildProductsSection(config));
  }

  // 5. TONE & VOICE
  sections.push(buildToneSection(config));

  // 6. COMMUNICATION RULES
  sections.push(buildCommunicationRulesSection(config, context));

  // 7. BUSINESS OPPORTUNITY (if applicable)
  if (config.businessOpportunity.earningModel !== 'direct_sales' ||
      config.businessOpportunity.startAmount > 0) {
    sections.push(buildBusinessOpportunitySection(config));
  }

  // 8. COMPENSATION PLAN (if applicable)
  if (config.compensation.levels.length > 0) {
    sections.push(buildCompensationSection(config));
  }

  // 9. FUNNEL & PIPELINE RULES
  sections.push(buildFunnelSection(config, context));

  // 10. CHANNEL-SPECIFIC RULES
  if (context.channelType) {
    sections.push(buildChannelRulesSection(config, context.channelType));
  }

  // 11. SAFETY & COMPLIANCE
  sections.push(buildSafetySection());

  return sections.join('\n\n');
}

/**
 * Build identity section
 */
function buildIdentitySection(
  config: WorkspaceConfig,
  context: SystemInstructionContext
): string {
  const agentName = config.aiBehavior.agentName;
  const brandName = config.company.brandName;

  return `========================================
IDENTITY & ROLE
========================================

You are ${agentName}, an AI assistant representing ${brandName}.

Your mission: ${config.company.mission}

You serve the ${config.company.audience} in the ${config.company.industry} industry.

Your primary goal is to help prospects understand our offerings, answer questions, and guide them through our ${config.funnels.funnels.recruiting?.stages?.length || 5}-stage process.`;
}

/**
 * Build custom instructions section
 */
function buildCustomInstructionsSection(config: WorkspaceConfig): string {
  return `========================================
CUSTOM INSTRUCTIONS (HIGHEST PRIORITY)
========================================

Priority: ${config.customInstructions.priority}/10

${config.customInstructions.globalInstructions}

IMPORTANT: These custom instructions have the highest priority. Follow them carefully while maintaining safety and funnel logic.`;
}

/**
 * Build company section
 */
function buildCompanySection(config: WorkspaceConfig): string {
  let section = `========================================
COMPANY & BRAND CONTEXT
========================================

Company Name: ${config.company.name}
Brand Name: ${config.company.brandName}
Industry: ${config.company.industry}
Target Audience: ${config.company.audience}

About Us:
${config.company.description}`;

  if (config.company.website) {
    section += `\n\nWebsite: ${config.company.website}`;
  }

  return section;
}

/**
 * Build products section
 */
function buildProductsSection(config: WorkspaceConfig): string {
  let section = `========================================
PRODUCTS & SERVICES
========================================

We offer ${config.products.products.length} product${config.products.products.length > 1 ? 's' : ''}:

`;

  config.products.products.forEach((product, index) => {
    section += `${index + 1}. ${product.name}
   Category: ${product.category}
   Price: ${product.pricing.amount.toLocaleString()} ${product.pricing.currency}
   Description: ${product.description}
   Key Benefits: ${product.benefits.slice(0, 3).join(', ')}
`;

    if (product.pricing.discounts && product.pricing.discounts.length > 0) {
      section += `   Special Offers: ${product.pricing.discounts.map(d => `${d.type} ${d.value}${d.type.includes('percent') ? '%' : ''} off`).join(', ')}\n`;
    }

    section += '\n';
  });

  return section.trim();
}

/**
 * Build tone section
 */
function buildToneSection(config: WorkspaceConfig): string {
  const tone = config.toneProfile;

  return `========================================
TONE & VOICE PROFILE
========================================

Brand Voice: ${tone.brandVoice}
Language: ${tone.languageMix}
Emoji Usage: ${tone.emojiUsage}
Formality: ${tone.formality}
Sentence Length: ${tone.sentenceLength}
Pacing: ${tone.pacing}
Personality Traits: ${tone.personality.join(', ')}

TONE INSTRUCTIONS:
${getToneInstructions(tone)}`;
}

/**
 * Get tone instructions based on profile
 */
function getToneInstructions(tone: any): string {
  const instructions: string[] = [];

  // Brand voice
  if (tone.brandVoice === 'warm') {
    instructions.push('- Be warm, friendly, and welcoming. Make people feel comfortable.');
  } else if (tone.brandVoice === 'corporate') {
    instructions.push('- Be professional, structured, and business-focused.');
  } else if (tone.brandVoice === 'energetic') {
    instructions.push('- Be enthusiastic, motivating, and high-energy.');
  } else if (tone.brandVoice === 'spiritual') {
    instructions.push('- Be uplifting, compassionate, and values-driven.');
  }

  // Language mix
  if (tone.languageMix === 'taglish') {
    instructions.push('- Use a natural mix of English and Filipino (Taglish) as appropriate.');
  } else if (tone.languageMix === 'filipino') {
    instructions.push('- Respond primarily in Filipino with English terms when needed.');
  } else if (tone.languageMix === 'cebuano') {
    instructions.push('- Respond primarily in Cebuano/Bisaya with English terms when needed.');
  }

  // Emoji usage
  if (tone.emojiUsage === 'none') {
    instructions.push('- NO EMOJIS. Keep communication text-only and professional.');
  } else if (tone.emojiUsage === 'minimal') {
    instructions.push('- Use emojis sparingly (1-2 max per message) for emphasis only.');
  } else if (tone.emojiUsage === 'moderate') {
    instructions.push('- Use emojis moderately (3-4 per message) to add warmth and personality.');
  } else if (tone.emojiUsage === 'frequent') {
    instructions.push('- Use emojis frequently to be friendly and approachable.');
  }

  // Sentence length
  if (tone.sentenceLength === 'short') {
    instructions.push('- Keep sentences SHORT (max 15 words). Be direct and concise.');
  } else if (tone.sentenceLength === 'medium') {
    instructions.push('- Use MEDIUM-length sentences. Balance clarity and detail.');
  } else {
    instructions.push('- Use LONGER sentences when needed. Explain thoroughly.');
  }

  // Formality
  if (tone.formality === 'casual') {
    instructions.push('- Be casual, conversational, and friendly. Use everyday language.');
  } else if (tone.formality === 'neutral') {
    instructions.push('- Be neutral and balanced. Friendly but professional.');
  } else {
    instructions.push('- Be formal and professional. Use proper grammar and polite address.');
  }

  return instructions.join('\n');
}

/**
 * Build communication rules section
 */
function buildCommunicationRulesSection(
  config: WorkspaceConfig,
  context: SystemInstructionContext
): string {
  const behaviorFlags = config.aiBehavior.behaviorFlags;

  let section = `========================================
COMMUNICATION RULES
========================================

1. Response Length: Keep replies focused and practical (2-4 sentences max)
2. Questions: Ask at most 1-2 questions at a time to avoid overwhelming
3. Clarity: Use simple, clear language. Avoid jargon unless necessary
4. Action-Oriented: Always include a clear next step or call-to-action
5. Personalization: Address the prospect by name when available`;

  if (context.prospectName) {
    section += ` (Current prospect: ${context.prospectName})`;
  }

  section += `\n\nBehavior Settings:`;
  section += `\n- Auto Follow-ups: ${behaviorFlags.allowAutoFollowups ? 'Enabled' : 'Disabled'}`;
  section += `\n- Rank-based Coaching: ${behaviorFlags.useRankBasedCoaching ? 'Enabled' : 'Disabled'}`;
  section += `\n- Smart Routing: ${behaviorFlags.enableSmartRouting ? 'Enabled' : 'Disabled'}`;

  return section;
}

/**
 * Build business opportunity section
 */
function buildBusinessOpportunitySection(config: WorkspaceConfig): string {
  const opp = config.businessOpportunity;

  let section = `========================================
BUSINESS OPPORTUNITY
========================================

Earning Model: ${opp.earningModel.replace('_', ' ').toUpperCase()}
Starting Investment: ${opp.startAmount.toLocaleString()} ${opp.currency}

Simple Explanation:
${opp.simpleExplanation}

Commission Structure:
- Direct Sales: ${opp.commissions.direct}`;

  if (opp.commissions.rebates) {
    section += `\n- Rebates: ${opp.commissions.rebates}`;
  }
  if (opp.commissions.referralBonus) {
    section += `\n- Referral Bonus: ${opp.commissions.referralBonus}`;
  }

  if (opp.detailedSteps.length > 0) {
    section += `\n\nGetting Started Steps:\n`;
    opp.detailedSteps.forEach((step, i) => {
      section += `${i + 1}. ${step}\n`;
    });
  }

  return section.trim();
}

/**
 * Build compensation section
 */
function buildCompensationSection(config: WorkspaceConfig): string {
  const comp = config.compensation;

  let section = `========================================
COMPENSATION PLAN
========================================

Plan Type: ${comp.planType.toUpperCase()}

Commission Levels:`;

  comp.levels.forEach(level => {
    section += `\n- Level ${level.level}: ${level.percentage}%`;
  });

  if (comp.bonuses && comp.bonuses.length > 0) {
    section += `\n\nBonus Opportunities:`;
    comp.bonuses.forEach(bonus => {
      section += `\n- ${bonus.type}: ${bonus.amount.toLocaleString()} (${bonus.criteria})`;
    });
  }

  section += `\n\nIMPORTANT: Never promise guaranteed income. Always present income as potential earnings based on effort and results.`;

  return section;
}

/**
 * Build funnel section
 */
function buildFunnelSection(
  config: WorkspaceConfig,
  context: SystemInstructionContext
): string {
  const recruitingFunnel = config.funnels.funnels.recruiting;

  if (!recruitingFunnel) {
    return '';
  }

  let section = `========================================
FUNNEL & PIPELINE RULES
========================================

Pipeline Stages: ${config.pipeline.stages.join(' → ')}

Current Stage: ${context.currentFunnelStage || 'Unknown'}

Funnel Process:`;

  recruitingFunnel.stages.forEach((stage, i) => {
    const label = recruitingFunnel.labels[stage] || stage;
    section += `\n${i + 1}. ${label}`;
  });

  if (recruitingFunnel.automationRules) {
    section += `\n\nAutomation Rules:`;
    if (recruitingFunnel.automationRules.autoMoveToNextStage) {
      section += `\n- Auto-advance to next stage when criteria met`;
    }
    if (recruitingFunnel.automationRules.autoTagHotLead) {
      section += `\n- Auto-tag hot leads based on engagement`;
    }
    if (recruitingFunnel.automationRules.revivalAfterDays) {
      section += `\n- Revival messages after ${recruitingFunnel.automationRules.revivalAfterDays} days of inactivity`;
    }
  }

  section += `\n\nYour goal: Guide prospects smoothly through each stage. Don't skip stages or rush the process.`;

  return section;
}

/**
 * Build channel-specific rules section
 */
function buildChannelRulesSection(
  config: WorkspaceConfig,
  channelType: string
): string {
  let section = `========================================
CHANNEL-SPECIFIC RULES (${channelType.toUpperCase()})
========================================\n\n`;

  const channelInstructions = config.customInstructions.channelSpecific;

  if (channelInstructions?.[channelType as keyof typeof channelInstructions]) {
    section += `Custom Instructions for ${channelType}:\n`;
    section += channelInstructions[channelType as keyof typeof channelInstructions];
    section += '\n\n';
  }

  // Add channel-specific defaults
  if (channelType === 'facebook' || channelType === 'whatsapp') {
    section += `- Keep messages SHORT and conversational\n`;
    section += `- Use emojis appropriately for the platform\n`;
    section += `- Respond quickly to maintain engagement\n`;
  } else if (channelType === 'email') {
    section += `- Use proper email formatting with greeting and signature\n`;
    section += `- Can be longer and more detailed than chat messages\n`;
    section += `- Include clear subject lines when relevant\n`;
  } else if (channelType === 'sms') {
    section += `- Keep messages VERY SHORT (under 160 characters ideal)\n`;
    section += `- NO EMOJIS unless specifically allowed\n`;
    section += `- Be extremely concise and direct\n`;
  } else {
    section += `- Follow standard web chat best practices\n`;
    section += `- Balance professionalism with friendliness\n`;
  }

  return section.trim();
}

/**
 * Build safety section
 */
function buildSafetySection(): string {
  return `========================================
SAFETY & COMPLIANCE
========================================

YOU MUST NEVER:
- Promise guaranteed income or specific earnings
- Make false claims about products or services
- Share sensitive user data or financial information
- Engage in illegal activities or advice
- Be disrespectful, discriminatory, or offensive
- Impersonate real people or provide medical/legal advice

YOU MUST ALWAYS:
- Be honest and transparent
- Respect user privacy and data protection
- Follow all applicable laws and regulations
- Escalate to human support when appropriate
- Maintain professional boundaries
- Provide accurate information or admit when unsure

If you encounter a request outside your scope or expertise, politely explain and offer to connect them with the appropriate human representative.`;
}

/**
 * Quick helper: build instruction for a specific prospect
 */
export async function buildProspectSystemInstruction(
  workspaceId: string,
  prospectName: string,
  channelType: 'web' | 'facebook' | 'whatsapp' | 'sms' | 'email',
  prospectData?: Record<string, any>
): Promise<string> {
  const result = await buildSystemInstruction({
    workspaceId,
    channelType,
    prospectName,
    prospectData,
  });

  return result.systemInstruction;
}

/**
 * Quick helper: build instruction for chatbot
 */
export async function buildChatbotSystemInstruction(
  workspaceId: string,
  channelType?: 'web' | 'facebook' | 'whatsapp'
): Promise<string> {
  const result = await buildSystemInstruction({
    workspaceId,
    channelType: channelType || 'web',
  });

  return result.systemInstruction;
}
