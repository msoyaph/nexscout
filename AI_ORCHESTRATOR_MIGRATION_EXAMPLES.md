# AI ORCHESTRATOR - Migration Examples

**Purpose:** Step-by-step examples showing how to migrate from old engines to AIOrchestrator

---

## 📋 Table of Contents

1. [Messaging Engine Migration](#1-messaging-engine-migration)
2. [Chatbot Engine Migration](#2-chatbot-engine-migration)
3. [Scanning Engine Migration](#3-scanning-engine-migration)
4. [Objection Handler Migration](#4-objection-handler-migration)
5. [Sequence Generator Migration](#5-sequence-generator-migration)
6. [Pitch Deck Generator Migration](#6-pitch-deck-generator-migration)

---

## 1. Messaging Engine Migration

### OLD: messagingEngine.ts

```typescript
// OLD CODE - Don't use anymore
import { messagingEngine } from '@/services/ai/messagingEngine';

async function generateMessage(userId: string, prospectId: string) {
  const result = await messagingEngine.generateMessage({
    userId,
    prospectId,
    prospectName: 'John Doe',
    intent: 'recruit',
    tone: 'friendly',
    productName: 'My Product',
    industry: 'mlm',
  });

  if (result.success) {
    console.log(result.message);
  } else {
    console.error(result.error);
  }
}
```

### NEW: AIOrchestrator

```typescript
// NEW CODE - Use this instead
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { configService } from '@/services/ai/ConfigService';

async function generateMessage(userId: string, prospectId: string) {
  // Load config once (cached)
  const config = await configService.loadConfig(userId);
  
  // Build system prompt from workspace config
  const systemPrompt = `You are a ${config.workspace.toneProfile.personality} sales assistant for ${config.company.name}.
  
Company: ${config.company.description}
Products: ${config.products.map(p => p.name).join(', ')}
Brand Voice: ${config.company.brandVoice}
Target Audience: ${config.company.targetAudience}

Generate a friendly recruitment message.`;

  // Generate with orchestrator
  const result = await aiOrchestrator.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Generate a message for prospect John Doe.' }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_message',
      workspaceId: config.workspace.workspaceId,
    }
  });

  if (result.success) {
    console.log(result.content);
    console.log('Tokens:', result.meta.tokensUsed);
    console.log('Cost:', result.meta.costUSD);
  } else {
    console.error(result.error);
  }
}
```

### Key Changes

✅ Single `aiOrchestrator.generate()` call  
✅ Config loaded once through `configService`  
✅ Energy automatically checked & consumed  
✅ Token & cost tracking automatic  
✅ Retry logic built-in  

---

## 2. Chatbot Engine Migration

### OLD: chatbotEngine.ts

```typescript
// OLD CODE
import { chatbotEngine } from '@/services/ai/chatbotEngine';

async function handleChatMessage(
  userId: string,
  message: string,
  conversationHistory: any[]
) {
  const result = await chatbotEngine.generateResponse({
    userId,
    userMessage: message,
    conversationHistory,
    intent: 'sales_inquiry',
    detectIntent: true,
  });

  return result.response;
}
```

### NEW: AIOrchestrator

```typescript
// NEW CODE
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { configService } from '@/services/ai/ConfigService';
import { AIMessage } from '@/services/ai/types';

async function handleChatMessage(
  userId: string,
  message: string,
  conversationHistory: AIMessage[]
) {
  // Load config (cached)
  const config = await configService.loadConfig(userId);
  
  // Build chatbot system instruction
  const systemPrompt = `You are an AI sales assistant for ${config.company.name}.

${config.workspace.customInstructions.globalInstructions || ''}

Company: ${config.company.name}
Industry: ${config.company.industry}
Products: ${config.products.map(p => `- ${p.name}: ${p.description}`).join('\n')}

Be helpful, professional, and guide the conversation towards a sale.`;

  // Build messages array
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message }
  ];

  // Generate response
  const result = await aiOrchestrator.generate({
    messages,
    config: {
      userId,
      action: 'ai_chatbot_response',
      workspaceId: config.workspace.workspaceId,
      autoSelectModel: true, // Auto-downgrade if low energy
      temperature: 0.7,
    }
  });

  return result.content;
}
```

---

## 3. Scanning Engine Migration

### OLD: scanningEngine.ts

```typescript
// OLD CODE
import { scanningEngine } from '@/services/ai/scanningEngine';

async function analyzeProspect(userId: string, prospectData: any) {
  const result = await scanningEngine.deepAnalyze({
    userId,
    prospectId: prospectData.id,
    rawText: prospectData.text,
    detectedNames: prospectData.names,
  });

  return {
    scoutScore: result.scoutScore,
    insights: result.insights,
    painPoints: result.painPoints,
  };
}
```

### NEW: AIOrchestrator

```typescript
// NEW CODE
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';

async function analyzeProspect(userId: string, prospectData: any) {
  const analysisPrompt = `Analyze this prospect data and provide:
1. ScoutScore (0-100) - likelihood to convert
2. Key insights
3. Pain points
4. Recommended approach

Prospect Data:
${JSON.stringify(prospectData, null, 2)}`;

  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing sales prospects and predicting conversion likelihood.'
      },
      {
        role: 'user',
        content: analysisPrompt
      }
    ],
    config: {
      userId,
      prospectId: prospectData.id,
      action: 'ai_deep_scan',
      model: 'gpt-4-turbo', // Use powerful model for analysis
      maxTokens: 2000,
    }
  });

  if (result.success) {
    // Parse AI response (assuming JSON output)
    const analysis = JSON.parse(result.content || '{}');
    
    return {
      scoutScore: analysis.scoutScore,
      insights: analysis.insights,
      painPoints: analysis.painPoints,
      meta: {
        tokensUsed: result.meta.tokensUsed,
        cost: result.meta.costUSD,
      }
    };
  }

  return null;
}
```

---

## 4. Objection Handler Migration

### OLD: messagingEngineV2.ts

```typescript
// OLD CODE
import { messagingEngineV2 } from '@/services/ai/messagingEngineV2';

async function handleObjection(
  userId: string,
  prospectId: string,
  objectionType: string
) {
  const result = await messagingEngineV2.generateObjectionResponse({
    userId,
    prospectId,
    objectionType: 'no_time',
    industry: 'mlm',
    tone: 'friendly',
  });

  return {
    response: result.response,
    reinforcementPoints: result.reinforcementPoints,
    coachingTip: result.coachingTip,
  };
}
```

### NEW: AIOrchestrator

```typescript
// NEW CODE
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { configService } from '@/services/ai/ConfigService';

async function handleObjection(
  userId: string,
  prospectId: string,
  objectionType: string
) {
  const config = await configService.loadConfig(userId);
  
  // Objection handling prompts (can be stored in database)
  const objectionPrompts = {
    no_time: `Prospect said: "I don't have time for this."
    
Generate an empathetic response that:
1. Validates their concern
2. Reframes time as an investment
3. Offers a low-commitment next step
4. Includes 3 reinforcement points
5. Provides a coaching tip

Industry: ${config.company.industry}
Tone: friendly, empathetic`,
    
    no_money: `Prospect said: "I can't afford this."
    
Generate a response that positions this as an investment, not an expense.`,
    
    // Add more objection types...
  };

  const prompt = objectionPrompts[objectionType as keyof typeof objectionPrompts];

  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: `You are an expert objection handler for ${config.company.name}. Use Filipino sales psychology principles.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_objection_handler',
      temperature: 0.7,
    }
  });

  if (result.success) {
    // Parse structured response
    const parsed = JSON.parse(result.content || '{}');
    
    return {
      response: parsed.response,
      reinforcementPoints: parsed.reinforcementPoints,
      coachingTip: parsed.coachingTip,
      meta: result.meta,
    };
  }

  return null;
}
```

---

## 5. Sequence Generator Migration

### OLD: messagingEngine.ts

```typescript
// OLD CODE
import { messagingEngine } from '@/services/ai/messagingEngine';

async function generateSequence(
  userId: string,
  prospectId: string,
  sequenceType: string
) {
  const result = await messagingEngine.generateSequence({
    userId,
    prospectId,
    prospectName: 'John',
    tone: 'professional',
    sequenceType: 'follow_up',
    totalSteps: 5,
  });

  if (result.success) {
    return result.sequence?.steps;
  }

  return null;
}
```

### NEW: AIOrchestrator

```typescript
// NEW CODE
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { configService } from '@/services/ai/ConfigService';

async function generateSequence(
  userId: string,
  prospectId: string,
  sequenceType: string,
  totalSteps: number = 5
) {
  const config = await configService.loadConfig(userId);
  
  const sequencePrompt = `Generate a ${totalSteps}-step ${sequenceType} sequence for a prospect.

Company: ${config.company.name}
Products: ${config.products.map(p => p.name).join(', ')}
Tone: ${config.workspace.toneProfile.personality}

For each step, provide:
- Day number (when to send)
- Subject line
- Message content
- Goal of the step

Output as JSON array.`;

  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: `You are a follow-up sequence expert for ${config.company.name}.`
      },
      {
        role: 'user',
        content: sequencePrompt
      }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_follow_up_sequence',
      temperature: 0.8, // More creative for sequences
      maxTokens: 3000, // Longer output needed
    }
  });

  if (result.success) {
    const sequence = JSON.parse(result.content || '[]');
    
    return {
      steps: sequence,
      meta: {
        tokensUsed: result.meta.tokensUsed,
        cost: result.meta.costUSD,
        energyConsumed: result.meta.energyConsumed,
      }
    };
  }

  return null;
}
```

---

## 6. Pitch Deck Generator Migration

### OLD: pitchDeckGenerator.ts

```typescript
// OLD CODE
import { pitchDeckGenerator } from '@/services/ai/pitchDeckGenerator';

async function generateDeck(
  userId: string,
  prospectId: string,
  productName: string
) {
  const result = await pitchDeckGenerator.generateDeck({
    userId,
    prospectId,
    productName,
    companyName: 'My Company',
    version: 'elite',
  });

  return result.deck;
}
```

### NEW: AIOrchestrator

```typescript
// NEW CODE
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';
import { configService } from '@/services/ai/ConfigService';

async function generateDeck(
  userId: string,
  prospectId: string,
  productName: string
) {
  const config = await configService.loadConfig(userId);
  
  const product = config.products.find(p => p.name === productName);
  
  const deckPrompt = `Generate a professional pitch deck (10 slides) for:

Product: ${product?.name}
Description: ${product?.description}
Company: ${config.company.name}
Industry: ${config.company.industry}

Include slides for:
1. Hook/Problem
2. Solution
3. How it works
4. Benefits
5. Proof/testimonials
6. Investment/pricing
7. ROI breakdown
8. Next steps
9. FAQ
10. Close

Output as JSON array of slides with: title, content, speakerNotes.`;

  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: `You are a pitch deck expert. Create compelling, conversion-focused presentations.`
      },
      {
        role: 'user',
        content: deckPrompt
      }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_pitch_deck',
      model: 'gpt-4-turbo', // Use best model for decks
      temperature: 0.8,
      maxTokens: 4000, // Long output
    }
  });

  if (result.success) {
    const slides = JSON.parse(result.content || '[]');
    
    return {
      slides,
      generatedAt: new Date(),
      meta: result.meta,
    };
  }

  return null;
}
```

---

## 🔧 Helper Functions

### Reusable System Prompt Builder

```typescript
// helpers/aiPromptBuilder.ts
import { configService } from '@/services/ai/ConfigService';

export async function buildSystemPrompt(
  userId: string,
  scenario: 'messaging' | 'chatbot' | 'analysis' | 'objection'
): Promise<string> {
  const config = await configService.loadConfig(userId);
  
  const basePrompt = `You are an AI assistant for ${config.company.name}.

Company: ${config.company.description}
Industry: ${config.company.industry}
Brand Voice: ${config.company.brandVoice}
Target Audience: ${config.company.targetAudience}

Products:
${config.products.map(p => `- ${p.name}: ${p.description}`).join('\n')}

${config.workspace.customInstructions.globalInstructions || ''}
`;

  const scenarioAddons = {
    messaging: `\nYour goal is to craft compelling sales messages that convert.`,
    chatbot: `\nYou are interacting with a website visitor. Be helpful and guide them towards a sale.`,
    analysis: `\nAnalyze prospects deeply and provide actionable insights.`,
    objection: `\nHandle objections with empathy and reframe concerns as opportunities.`,
  };

  return basePrompt + scenarioAddons[scenario];
}

// Usage:
const systemPrompt = await buildSystemPrompt(userId, 'messaging');
```

### Energy Check Before Expensive Operations

```typescript
// helpers/energyCheck.ts
import { energyEngineV5 } from '@/services/energy/energyEngineV5';

export async function checkEnergyForAction(
  userId: string,
  action: string
): Promise<{ canProceed: boolean; reason?: string }> {
  const energyCosts = {
    ai_message: 10,
    ai_scan: 15,
    ai_sequence: 50,
    ai_pitch_deck: 100,
  };

  const cost = energyCosts[action as keyof typeof energyCosts] || 10;
  const status = await energyEngineV5.getEnergyStatus(userId);

  if (!status || status.current < cost) {
    return {
      canProceed: false,
      reason: `Not enough energy. Need ${cost}, have ${status?.current || 0}`,
    };
  }

  return { canProceed: true };
}

// Usage:
const check = await checkEnergyForAction(userId, 'ai_pitch_deck');
if (!check.canProceed) {
  showUpgradeModal(check.reason);
  return;
}
```

---

## 📊 Batch Migration Script

Use this to migrate all old engine calls in one go:

```typescript
// scripts/migrateToOrchestrator.ts

/**
 * Migration script: Old engines → AIOrchestrator
 * Run once to update all usages
 */

import { glob } from 'glob';
import fs from 'fs';

const replacements = [
  // Messaging Engine
  {
    old: /import.*messagingEngine.*from.*messagingEngine/g,
    new: "import { aiOrchestrator } from '@/services/ai/AIOrchestrator';",
  },
  {
    old: /messagingEngine\.generateMessage\(/g,
    new: 'aiOrchestrator.generate(',
  },
  
  // Chatbot Engine
  {
    old: /import.*chatbotEngine.*from.*chatbotEngine/g,
    new: "import { aiOrchestrator } from '@/services/ai/AIOrchestrator';",
  },
  
  // Add more replacements...
];

async function migrate() {
  const files = await glob('src/**/*.{ts,tsx}');
  
  let totalReplacements = 0;
  
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let fileChanged = false;
    
    for (const { old, new: replacement } of replacements) {
      if (old.test(content)) {
        content = content.replace(old, replacement);
        fileChanged = true;
        totalReplacements++;
      }
    }
    
    if (fileChanged) {
      fs.writeFileSync(file, content);
      console.log(`✅ Updated: ${file}`);
    }
  }
  
  console.log(`\n🎉 Migration complete! ${totalReplacements} replacements made.`);
}

migrate();
```

---

## ✅ Migration Checklist

Use this checklist to track your migration progress:

### Phase 1: Setup (Day 1)
- [ ] Install AIOrchestrator files
  - [ ] `types.ts`
  - [ ] `ConfigService.ts`
  - [ ] `AIOrchestrator.ts`
- [ ] Create database table: `ai_usage_logs`
- [ ] Test basic generation with `aiOrchestrator.generate()`

### Phase 2: Core Services (Day 2-3)
- [ ] Migrate messaging engine calls
- [ ] Migrate chatbot engine calls  
- [ ] Migrate scanning engine calls
- [ ] Migrate objection handler calls
- [ ] Migrate sequence generator calls
- [ ] Migrate pitch deck generator calls

### Phase 3: Edge Functions (Day 4)
- [ ] Update `generate-ai-content` edge function
- [ ] Update `public-chatbot-chat` edge function
- [ ] Update `scan-processor-v2` edge function

### Phase 4: Testing (Day 5)
- [ ] Test message generation
- [ ] Test chatbot responses
- [ ] Test prospect scanning
- [ ] Test energy integration
- [ ] Test cost tracking
- [ ] Test auto model selection
- [ ] Test retry logic

### Phase 5: Cleanup (Day 6)
- [ ] Delete old engine files:
  - [ ] `messagingEngine.OLD.ts`
  - [ ] `messagingEngine.ts` (old version)
  - [ ] `messagingEngineV2.ts`
  - [ ] `chatbotEngine.ts` (if duplicated)
  - [ ] `advancedMessagingEngines.ts`
- [ ] Remove unused imports across codebase
- [ ] Update documentation

### Phase 6: Monitoring (Ongoing)
- [ ] Monitor metrics dashboard
- [ ] Track costs via `ai_usage_logs`
- [ ] Monitor error rates
- [ ] Optimize prompts based on token usage

---

## 🚨 Common Issues & Solutions

### Issue 1: "User not authenticated"

**Cause:** Supabase session expired

**Solution:**
```typescript
// Add session check before calling orchestrator
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login or refresh session
  await supabase.auth.refreshSession();
}
```

### Issue 2: "Insufficient energy"

**Cause:** User ran out of energy

**Solution:**
```typescript
// Show upgrade modal
const result = await aiOrchestrator.generate({ messages, config });
if (!result.success && result.error?.includes('Insufficient energy')) {
  showEnergyRefillModal();
}
```

### Issue 3: ConfigService returns default values

**Cause:** User hasn't completed onboarding

**Solution:**
```typescript
const config = await configService.loadConfig(userId);
if (!config.company.description) {
  // Show onboarding prompt
  redirectToOnboarding();
}
```

---

## 📈 Performance Impact

Expected improvements after migration:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Config Loading** | 40+ calls/request | 1 call (cached) | -97% |
| **Code Duplication** | 6 engines, ~2000 lines | 1 orchestrator, 500 lines | -75% |
| **Energy Checks** | Manual, inconsistent | Automatic, always | 100% coverage |
| **Token Tracking** | Partial | Complete | 100% coverage |
| **Error Handling** | Scattered | Centralized | 100% consistent |
| **Retry Logic** | None | 3 attempts + backoff | ∞ more reliable |

---

**End of Migration Guide**  
**Questions? Check the main guide: AI_ORCHESTRATOR_GUIDE.md**





