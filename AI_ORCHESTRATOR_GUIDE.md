# AI ORCHESTRATOR - Complete Usage Guide

**Created:** December 3, 2025  
**Status:** ✅ Production Ready  
**Purpose:** Centralize ALL AI operations into a single, powerful orchestrator

---

## 🎯 What This Solves

**BEFORE AIOrchestrator:**
- ❌ 6 different messaging engines
- ❌ Config loaded 40+ times independently
- ❌ Energy checks scattered everywhere  
- ❌ No centralized token tracking
- ❌ Inconsistent error handling
- ❌ No automatic model selection
- ❌ Difficult to add new AI features

**AFTER AIOrchestrator:**
- ✅ Single entry point for all AI calls
- ✅ Config loaded once, cached for 5 minutes
- ✅ Energy integration built-in
- ✅ Full token & cost tracking
- ✅ Retry logic with exponential backoff
- ✅ Auto model selection (GPT-4 → GPT-3.5 if low energy)
- ✅ Provider abstraction (OpenAI, Anthropic, more)
- ✅ Analytics tracking automatic

---

## 📦 Components

### 1. **AIOrchestrator** (`src/services/ai/AIOrchestrator.ts`)
The main orchestrator class that coordinates all AI calls.

### 2. **ConfigService** (`src/services/ai/ConfigService.ts`)
Centralized configuration loader with 5-minute caching.

### 3. **Types** (`src/services/ai/types.ts`)
All TypeScript type definitions for AI system.

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';

// Generate AI response
const result = await aiOrchestrator.generate({
  messages: [
    { role: 'system', content: 'You are a helpful sales assistant.' },
    { role: 'user', content: 'Write a message to my prospect John.' }
  ],
  config: {
    userId: currentUser.id,
    action: 'ai_message',
    prospectId: 'prospect-123',
    workspaceId: 'workspace-abc',
  }
});

if (result.success) {
  console.log('AI Response:', result.content);
  console.log('Tokens used:', result.meta.tokensUsed);
  console.log('Cost:', result.meta.costUSD);
  console.log('Energy consumed:', result.meta.energyConsumed);
} else {
  console.error('Error:', result.error);
}
```

### With Specific Model

```typescript
const result = await aiOrchestrator.generate({
  messages: [
    { role: 'user', content: 'Analyze this prospect data...' }
  ],
  config: {
    userId: currentUser.id,
    action: 'ai_deep_scan',
    model: 'gpt-4-turbo', // Specific model
    temperature: 0.5,
    maxTokens: 2000,
  }
});
```

### Auto Model Selection (Save Energy)

```typescript
// AIOrchestrator will auto-downgrade to GPT-3.5 if user has low energy
const result = await aiOrchestrator.generate({
  messages: messages,
  config: {
    userId: currentUser.id,
    action: 'ai_message',
    autoSelectModel: true, // Enable auto-downgrade
  }
});

// Check if fallback was used
if (result.meta.model === 'gpt-3.5-turbo') {
  console.log('Auto-downgraded to GPT-3.5 to save energy');
}
```

---

## 📚 Complete API Reference

### `aiOrchestrator.generate(request: AIRequest)`

**Parameters:**

```typescript
interface AIRequest {
  messages: AIMessage[];  // Array of conversation messages
  config: AIRequestConfig;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIRequestConfig {
  // Required
  userId: string;           // User making the request
  action: AIAction;         // Type of AI action
  
  // Optional - Model selection
  model?: AIModel;          // Specific model (overrides auto-selection)
  provider?: AIProvider;    // Specific provider
  temperature?: number;     // 0-1, creativity level
  maxTokens?: number;       // Max tokens in response
  autoSelectModel?: boolean; // Auto-downgrade if low energy (default: true)
  
  // Optional - Context
  workspaceId?: string;     // Workspace context
  prospectId?: string;      // Prospect being worked on
  
  // Optional - Retry behavior
  retryAttempts?: number;   // Number of retries (default: 3)
  retryDelay?: number;      // Initial retry delay ms (default: 1000)
  
  // Optional - Fallback
  allowFallback?: boolean;  // Allow fallback to different model
  fallbackModel?: AIModel;  // Specific fallback model
}
```

**Returns:**

```typescript
interface AIResponse {
  success: boolean;
  content?: string;  // The AI-generated content
  error?: string;    // Error message if failed
  
  meta: {
    provider: AIProvider;        // Provider used (e.g., 'openai')
    model: AIModel;              // Model used (e.g., 'gpt-4o')
    tokensUsed: number;          // Total tokens
    tokensPrompt: number;        // Prompt tokens
    tokensCompletion: number;    // Completion tokens
    costUSD: number;             // Cost in USD
    energyConsumed: number;      // Energy points used
    latencyMs: number;           // Time taken in ms
    cached: boolean;             // Was config cached?
    retryCount: number;          // Number of retries performed
    fallbackUsed: boolean;       // Was fallback model used?
    timestamp: string;           // ISO timestamp
  };
}
```

### `aiOrchestrator.getMetrics()`

Get current performance metrics.

```typescript
const metrics = aiOrchestrator.getMetrics();

console.log('Total requests:', metrics.totalRequests);
console.log('Total tokens:', metrics.totalTokens);
console.log('Total cost:', metrics.totalCost);
console.log('Average latency:', metrics.averageLatency, 'ms');
console.log('Error rate:', metrics.errorRate * 100, '%');
console.log('Provider distribution:', metrics.providerDistribution);
```

---

## 🎬 Common Use Cases

### 1. Generate AI Message

```typescript
async function generateMessageForProspect(
  userId: string,
  prospectId: string,
  prospectName: string,
  tone: string
) {
  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: `You are a sales assistant. Generate a ${tone} message for ${prospectName}.`
      },
      {
        role: 'user',
        content: 'Write a friendly first outreach message.'
      }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_message',
    }
  });
  
  return result;
}
```

### 2. Handle Objections

```typescript
async function handleObjection(
  userId: string,
  prospectId: string,
  objection: string
) {
  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: 'You are an expert at handling sales objections with empathy.'
      },
      {
        role: 'user',
        content: `Prospect said: "${objection}". How should I respond?`
      }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_objection_handler',
      temperature: 0.7,
    }
  });
  
  return result.content;
}
```

### 3. Scan & Analyze Prospect

```typescript
async function deepScanProspect(
  userId: string,
  prospectData: any
) {
  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: 'Analyze this prospect data and provide insights.'
      },
      {
        role: 'user',
        content: JSON.stringify(prospectData)
      }
    ],
    config: {
      userId,
      action: 'ai_deep_scan',
      model: 'gpt-4-turbo', // Use more powerful model for analysis
      maxTokens: 2000,
    }
  });
  
  return result;
}
```

### 4. Generate Follow-up Sequence

```typescript
async function generateSequence(
  userId: string,
  prospectId: string,
  sequenceType: string
) {
  const result = await aiOrchestrator.generate({
    messages: [
      {
        role: 'system',
        content: `Generate a ${sequenceType} follow-up sequence (5 messages).`
      },
      {
        role: 'user',
        content: 'Create the sequence'
      }
    ],
    config: {
      userId,
      prospectId,
      action: 'ai_follow_up_sequence',
      temperature: 0.8,
      maxTokens: 3000,
    }
  });
  
  return result;
}
```

### 5. Public Chatbot Response

```typescript
async function chatbotReply(
  userId: string,
  conversationHistory: AIMessage[]
) {
  const result = await aiOrchestrator.generate({
    messages: conversationHistory,
    config: {
      userId,
      action: 'ai_chatbot_response',
      autoSelectModel: true, // Save energy on chatbot
    }
  });
  
  return result.content;
}
```

---

## ⚡ Energy Integration

AIOrchestrator automatically integrates with your Energy System V5:

### How It Works

1. **Before generation:** Checks if user has enough energy
2. **Auto-selection:** Downgrades to cheaper model if energy is low
3. **Consumption:** Deducts energy after successful generation
4. **Tracking:** Logs energy usage for analytics

### Energy Costs (per action)

| Action | GPT-4 Cost | GPT-3.5 Cost |
|--------|-----------|--------------|
| AI Message | 10 | 3 |
| AI Scan | 15 | 5 |
| Follow-up Sequence | 50 | 15 |
| Objection Handler | 10 | 3 |
| Pitch Deck | 100 | 30 |
| Chatbot Response | 10 | 3 |
| Deep Scan | 25 | 8 |
| Company Analysis | 30 | 10 |

### Auto-Downgrade Example

```typescript
// User has 8 energy points
// GPT-4 costs 10, GPT-3.5 costs 3

const result = await aiOrchestrator.generate({
  messages: messages,
  config: {
    userId,
    action: 'ai_message',
    autoSelectModel: true, // Will auto-select GPT-3.5
  }
});

// Result will use GPT-3.5 and consume 3 energy
console.log(result.meta.model); // 'gpt-3.5-turbo'
console.log(result.meta.energyConsumed); // 3
```

---

## 🔁 ConfigService - Caching System

ConfigService loads all user configuration **once** and caches it for 5 minutes.

### What Gets Loaded

```typescript
interface CompleteConfig {
  user: UserProfile;           // Tier, coins, usage limits
  workspace: WorkspaceConfig;  // Company branding, funnels, AI behavior
  company: CompanyData;        // Company name, industry, brand voice
  products: ProductData[];     // User's products
  aiSettings: AISettings;      // AI preferences, custom instructions
}
```

### Manual Cache Control

```typescript
import { configService } from '@/services/ai/ConfigService';

// Load config (will use cache if available)
const config = await configService.loadConfig(userId);

// Force refresh (invalidate cache)
configService.invalidate(userId);

// Clear all cached configs
configService.clearCache();

// Get cache stats
const stats = configService.getCacheStats();
console.log('Cached users:', stats.entries);
```

---

## 📊 Token & Cost Tracking

Every AI call is automatically logged to the database:

### Database Schema

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  workspace_id UUID,
  prospect_id UUID,
  action TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  tokens_total INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Query Usage

```sql
-- Total cost per user this month
SELECT 
  user_id,
  SUM(cost_usd) as total_cost,
  SUM(tokens_total) as total_tokens,
  COUNT(*) as total_requests
FROM ai_usage_logs
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY user_id;

-- Most expensive actions
SELECT 
  action,
  AVG(cost_usd) as avg_cost,
  AVG(tokens_total) as avg_tokens
FROM ai_usage_logs
GROUP BY action
ORDER BY avg_cost DESC;
```

---

## 🔄 Migration from Old Engines

### Before (messagingEngine.ts)

```typescript
import { messagingEngine } from '@/services/ai/messagingEngine';

const result = await messagingEngine.generateMessage({
  userId,
  prospectId,
  prospectName: 'John',
  intent: 'recruit',
  tone: 'friendly',
  industry: 'mlm',
});
```

### After (AIOrchestrator)

```typescript
import { aiOrchestrator } from '@/services/ai/AIOrchestrator';

const result = await aiOrchestrator.generate({
  messages: [
    {
      role: 'system',
      content: 'You are a friendly MLM recruiter.'
    },
    {
      role: 'user',
      content: `Generate a recruitment message for ${prospectName}`
    }
  ],
  config: {
    userId,
    prospectId,
    action: 'ai_message',
  }
});
```

### Migration Checklist

- [ ] Replace `messagingEngine.generateMessage()` → `aiOrchestrator.generate()`
- [ ] Replace `messagingEngineV2.generateObjectionResponse()` → `aiOrchestrator.generate()`
- [ ] Replace `chatbotEngine.generateResponse()` → `aiOrchestrator.generate()`
- [ ] Replace `scanningEngine.analyzeProspect()` → `aiOrchestrator.generate()`
- [ ] Remove direct config loading → Use ConfigService through orchestrator
- [ ] Remove manual energy checks → Built into orchestrator
- [ ] Update analytics tracking → Automatic in orchestrator

---

## 🎯 Best Practices

### 1. Always Use AIOrchestrator

❌ **Don't:**
```typescript
// Direct OpenAI call
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${apiKey}` },
  body: JSON.stringify({ model: 'gpt-4', messages })
});
```

✅ **Do:**
```typescript
const result = await aiOrchestrator.generate({
  messages,
  config: { userId, action: 'ai_message' }
});
```

### 2. Let Auto-Selection Work

❌ **Don't:**
```typescript
// Hardcoding model
config: { model: 'gpt-4', autoSelectModel: false }
```

✅ **Do:**
```typescript
// Let orchestrator choose based on energy
config: { action: 'ai_message', autoSelectModel: true }
```

### 3. Use Appropriate Actions

Each action has different energy costs. Use the right one:

```typescript
// For simple messages
action: 'ai_message'  // 10 energy

// For complex analysis
action: 'ai_deep_scan'  // 25 energy

// For long sequences
action: 'ai_follow_up_sequence'  // 50 energy
```

### 4. Handle Errors Gracefully

```typescript
const result = await aiOrchestrator.generate({ messages, config });

if (!result.success) {
  if (result.error?.includes('Insufficient energy')) {
    // Show upgrade prompt
    showEnergyRefillModal();
  } else {
    // Show generic error
    showToast('AI generation failed. Please try again.');
  }
}
```

---

## 🚨 Error Handling

AIOrchestrator includes comprehensive error handling:

### Error Types

1. **Insufficient Energy**
   ```typescript
   {
     success: false,
     error: "Insufficient energy. Required: 10, Available: 5"
   }
   ```

2. **Rate Limit**
   - Automatic retry with exponential backoff
   - 3 attempts by default
   - Longer wait for rate limit errors

3. **API Errors**
   ```typescript
   {
     success: false,
     error: "OpenAI API error: 500"
   }
   ```

4. **Authentication**
   ```typescript
   {
     success: false,
     error: "User not authenticated"
   }
   ```

---

## 📈 Monitoring & Metrics

### Real-time Metrics

```typescript
const metrics = aiOrchestrator.getMetrics();

console.log('📊 AI System Metrics:');
console.log('Total Requests:', metrics.totalRequests);
console.log('Total Tokens:', metrics.totalTokens);
console.log('Total Cost: $', metrics.totalCost.toFixed(4));
console.log('Avg Latency:', metrics.averageLatency.toFixed(0), 'ms');
console.log('Error Rate:', (metrics.errorRate * 100).toFixed(2), '%');
console.log('Cache Hit Rate:', (metrics.cacheHitRate * 100).toFixed(2), '%');
```

### Provider Distribution

```typescript
console.log('Provider Usage:');
for (const [provider, count] of Object.entries(metrics.providerDistribution)) {
  console.log(`  ${provider}: ${count} requests`);
}
```

---

## 🔮 Future Enhancements

Coming soon to AIOrchestrator:

- [ ] **Streaming Support** - Real-time response streaming
- [ ] **Response Caching** - Cache identical prompts
- [ ] **Anthropic Integration** - Claude models
- [ ] **Prompt Compression** - Reduce token usage automatically
- [ ] **Load Balancing** - Distribute across providers
- [ ] **Cost Limits** - Per-user spending caps
- [ ] **A/B Testing** - Test different prompts
- [ ] **Prompt Templates** - Reusable prompt library

---

## 💡 Tips & Tricks

### 1. Batch Operations

```typescript
// Generate multiple messages in parallel
const results = await Promise.all(
  prospects.map(prospect =>
    aiOrchestrator.generate({
      messages: buildMessages(prospect),
      config: { userId, action: 'ai_message', prospectId: prospect.id }
    })
  )
);
```

### 2. Progressive Enhancement

```typescript
// Try GPT-4, fallback to GPT-3.5
try {
  const result = await aiOrchestrator.generate({
    messages,
    config: { userId, action: 'ai_message', model: 'gpt-4o' }
  });
} catch (error) {
  // Will auto-downgrade if energy insufficient
}
```

### 3. Monitor Your Costs

```typescript
// Check cost before expensive operation
const metrics = aiOrchestrator.getMetrics();
if (metrics.totalCost > 100) {
  console.warn('Monthly AI costs exceeding $100');
  // Send alert to admin
}
```

---

## 📞 Support

If you encounter issues:

1. Check error message in `result.error`
2. Verify user has sufficient energy
3. Check ConfigService cache: `configService.getCacheStats()`
4. Review metrics: `aiOrchestrator.getMetrics()`
5. Check database logs: `SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 10`

---

**End of Guide**  
**Ready to consolidate your AI infrastructure! 🚀**





