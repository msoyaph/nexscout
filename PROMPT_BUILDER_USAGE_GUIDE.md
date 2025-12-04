# Prompt Builder V2 Usage Guide

## Overview

The centralized `buildCoachOrSalesPrompt` function in `/src/engines/prompts/promptBuilder.ts` is the single source of truth for all AI prompt generation in NexScout OS v4.0.

This builder combines:
- Rank coach persona
- Funnel step context
- Compensation plan summary
- Voice model instructions
- Language preferences
- Lead temperature data
- Custom instructions (optional)

## Basic Usage

```typescript
import { buildCoachOrSalesPrompt } from '@/engines/prompts/promptBuilder';
import { getVoiceProfile } from '@/engines/tone/voiceModels';
import { FunnelEngineV3 } from '@/engines/funnel/funnelEngineV3';

// Example: Generate a prompt for an MLM recruit conversation
const promptPayload = buildCoachOrSalesPrompt({
  intent: 'mlmRecruit',
  language: 'fil', // Filipino/Taglish
  voiceProfile: getVoiceProfile('energeticCoach'),
  funnelStep: {
    stage: 'interest',
    sequenceKey: 'mlm_recruit_seq_v2',
    persona: 'mlmLeader',
    goal: 'Build trust and explain income opportunity',
    recommendedActions: [
      'Share success story',
      'Ask about their goals',
      'Explain rank system'
    ]
  },
  compPlan: {
    planName: 'Team Builder Pro',
    planType: 'unilevel',
    levels: [
      { level: 1, percentage: 10 },
      { level: 2, percentage: 5 },
      { level: 3, percentage: 3 }
    ],
    rankRules: [
      { rank: 'Silver', minVolume: 1000 },
      { rank: 'Gold', minVolume: 5000 }
    ]
  },
  memberRank: 'Silver',
  leadTemperature: {
    temperature: 'warm',
    score: 65,
    reasons: ['Replied twice', 'Asked about compensation'],
    recommendedNextStep: 'Explain rank advancement path'
  },
  userMessage: 'Paano ba kumita dito? May training ba kayo?',
  customInstructionsRaw: 'Always emphasize work-life balance. Never oversell.'
});

// Now send to your LLM
const { systemPrompt, userPrompt, metadata } = promptPayload;

// Example with OpenAI
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 300
  })
});
```

## Output Structure

The function returns:

```typescript
{
  systemPrompt: string,      // Complete system instructions
  userPrompt: string,         // User message with context
  metadata: {
    rank: string,             // Member rank
    language: string,         // Selected language
    intent: UserIntent,       // Detected intent
    funnelStage: string,      // Current funnel stage
    sequenceKey: string,      // Sequence identifier
    persona: string,          // Persona type
    temperature: string,      // Lead temperature
    voiceProfileName: string  // Voice model used
  }
}
```

## Integration Examples

### Example 1: Messaging Engine V4

```typescript
import { buildCoachOrSalesPrompt } from '@/engines/prompts/promptBuilder';
import { messagingEngineV4 } from '@/engines/messaging/messagingEngineV4';

async function handleUserMessage(userId: string, message: string) {
  // Step 1: Run messaging engine v4 to get context
  const engineResult = await messagingEngineV4.processMessage({
    userId,
    userMessage: message,
    config: { language: 'auto', channel: 'web' }
  });

  // Step 2: Build complete prompt
  const promptPayload = buildCoachOrSalesPrompt({
    intent: engineResult.intent,
    language: engineResult.language,
    voiceProfile: engineResult.voiceProfile,
    funnelStep: engineResult.funnelStep,
    compPlan: engineResult.compPlan,
    memberRank: engineResult.memberRank,
    leadTemperature: engineResult.leadTemperature,
    userMessage: message,
    customInstructionsRaw: engineResult.customInstructions
  });

  // Step 3: Send to LLM (your preferred model)
  const aiResponse = await callYourLLM(
    promptPayload.systemPrompt,
    promptPayload.userPrompt
  );

  return {
    reply: aiResponse,
    metadata: promptPayload.metadata
  };
}
```

### Example 2: Public Chatbot

```typescript
import { buildCoachOrSalesPrompt } from '@/engines/prompts/promptBuilder';

async function handlePublicChat(chatbotId: string, visitorMessage: string) {
  // Load chatbot config and company intelligence
  const chatbot = await loadChatbotConfig(chatbotId);
  const companyData = await loadCompanyIntelligence(chatbot.company_id);

  const promptPayload = buildCoachOrSalesPrompt({
    intent: 'salesInquiry',
    language: 'en',
    voiceProfile: getVoiceProfile('professionalAdvisor'),
    funnelStep: {
      stage: 'awareness',
      sequenceKey: 'public_inquiry_v1',
      persona: 'sales',
      goal: 'Answer questions and qualify interest',
      recommendedActions: ['Understand their needs', 'Suggest relevant products']
    },
    compPlan: null, // Not applicable for public visitors
    memberRank: 'Visitor',
    leadTemperature: {
      temperature: 'cold',
      score: 30,
      reasons: ['First message'],
      recommendedNextStep: 'Build rapport and understand needs'
    },
    userMessage: visitorMessage,
    customInstructionsRaw: chatbot.custom_instructions
  });

  return await callLLM(promptPayload);
}
```

### Example 3: MLM Coaching Session

```typescript
import { buildCoachOrSalesPrompt } from '@/engines/prompts/promptBuilder';

async function coachMember(memberId: string, question: string) {
  const member = await loadMemberData(memberId);
  const compPlan = await loadCompensationPlan(member.company_id);

  const promptPayload = buildCoachOrSalesPrompt({
    intent: 'mlmTraining',
    language: 'fil',
    voiceProfile: getVoiceProfile('energeticCoach'),
    funnelStep: {
      stage: 'evaluation',
      sequenceKey: 'coach_training_v3',
      persona: 'mlmLeader',
      goal: 'Help member advance to next rank',
      recommendedActions: [
        'Review current performance',
        'Set specific goals',
        'Create action plan'
      ]
    },
    compPlan,
    memberRank: member.current_rank,
    leadTemperature: {
      temperature: 'hot',
      score: 85,
      reasons: ['Active member', 'Asking strategic questions'],
      recommendedNextStep: 'Guide them on rank advancement'
    },
    userMessage: question,
    customInstructionsRaw: 'Focus on practical, actionable advice. Use Filipino slang.'
  });

  return await callLLM(promptPayload);
}
```

## Admin Control Panel

Access the admin control panel at `/admin-control-panel` to manage:

1. **Rank Manager**: Define rank names and minimum volume requirements
2. **Funnel Editor**: Customize funnel stages and labels for different use cases
3. **AI Behavior Settings**: Control default voice models and AI behavior rules

### Navigation Example

```typescript
// In your admin navigation
<Link to="/admin-control-panel">
  <Settings className="w-4 h-4" />
  AI Control Panel
</Link>

// Or programmatically
navigate('admin-control-panel');
```

## Best Practices

1. **Always use the centralized builder** - Don't create ad-hoc prompts
2. **Pass custom instructions when available** - Respects company-specific rules
3. **Log metadata for analytics** - Track which voice models and funnels perform best
4. **Handle language detection** - Use messaging engine v4 to auto-detect language
5. **Respect priority stack** - Custom instructions > Company data > Comp plan > Funnel logic

## Priority Stack Explained

The prompt builder enforces this priority order:

1. **User Custom Instructions** (highest) - Company-specific rules, but must be safe
2. **Company & Product Intelligence** - Facts about the company and products
3. **Compensation Plan Rules** - MLM commission structure and rank rules
4. **Funnel Logic** - Current stage, sequence, and progression goals
5. **Rank-based Coaching** - Persona and advice tailored to member rank
6. **Voice Model** - Tone, urgency, formality, emoji rules
7. **Global Safety Rules** - No false promises, no jargon, ethical guidelines

## Testing

```typescript
// Test different scenarios
const scenarios = [
  {
    name: 'Cold Lead - Product Inquiry',
    intent: 'productInterest',
    temperature: 'cold',
    voice: 'softNurturer'
  },
  {
    name: 'Hot Lead - Closing',
    intent: 'closingOpportunity',
    temperature: 'hot',
    voice: 'aggressiveCloser'
  },
  {
    name: 'MLM Training - Gold Rank',
    intent: 'mlmTraining',
    temperature: 'warm',
    voice: 'energeticCoach'
  }
];

for (const scenario of scenarios) {
  const payload = buildCoachOrSalesPrompt({
    intent: scenario.intent,
    language: 'en',
    voiceProfile: getVoiceProfile(scenario.voice),
    // ... other params
  });

  console.log(`[${scenario.name}] System prompt length:`, payload.systemPrompt.length);
  console.log(`[${scenario.name}] Metadata:`, payload.metadata);
}
```

## Backwards Compatibility

The legacy `buildCoachOrSalesPromptLegacy` function is maintained for existing code that uses the old `PromptContext` interface. Migrate to the new function when possible.

## Related Files

- `/src/engines/prompts/promptBuilder.ts` - Main prompt builder
- `/src/engines/prompts/coachPersonaPrompts.ts` - Rank-specific coaching prompts
- `/src/engines/tone/voiceModels.ts` - Voice model profiles
- `/src/engines/funnel/funnelEngineV3.ts` - Funnel stage logic
- `/src/engines/messaging/messagingEngineV4.ts` - Complete orchestrator
- `/src/pages/admin/AdminControlPanel.tsx` - Admin UI for managing settings
