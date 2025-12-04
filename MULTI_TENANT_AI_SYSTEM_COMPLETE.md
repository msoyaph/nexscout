# Multi-Tenant AI System - Complete Implementation

## Overview

The Multi-Tenant AI System provides complete workspace-level isolation for AI configuration, preventing cross-brand contamination and enabling each company to have fully customized AI behavior, tone, products, and messaging.

## Architecture

### Core Components

1. **Workspace Config Types** (`src/types/WorkspaceConfig.ts`)
   - 13 different configuration sections
   - Company, products, tone profile, funnels, AI behavior, compensation, etc.
   - Type-safe interface with defaults

2. **Workspace Config Service** (`src/services/workspaceConfig.service.ts`)
   - Load/save complete workspace configuration
   - Update specific sections
   - Section-specific getters for convenience
   - Clone configuration from template

3. **System Instruction Builder** (`src/services/ai/systemInstructionBuilder.ts`)
   - Master prompt template with dynamic variables
   - Builds complete AI system instruction from workspace config
   - Channel-specific rules (web, Facebook, WhatsApp, SMS, email)
   - Priority-based instruction stack

4. **Database Schema** (Migration: `create_workspace_configs_system`)
   - `workspace_configs` table with JSONB columns
   - RLS policies for workspace isolation
   - Optimized indexes for performance

### Integration Points

1. **Messaging Engine V4** (`src/engines/messaging/messagingEngineV4.ts`)
   - Integrated workspace system instruction builder
   - Combines workspace instruction with legacy prompt
   - Passes `workspaceId` in context for multi-tenant support

2. **Public Chatbot Engine** (`src/services/chatbot/publicChatbotEngine.ts`)
   - Uses workspace-based system instruction
   - Fallback to basic instruction if config not available
   - Channel-aware instruction building

## Workspace Config Structure

```typescript
interface WorkspaceConfig {
  workspaceId: string;
  company: CompanyConfig;           // Name, brand, industry, mission
  products: ProductConfig;          // Product catalog with pricing
  toneProfile: ToneProfileConfig;   // Brand voice, language, emoji usage
  funnels: FunnelConfig;            // Multi-funnel definitions
  aiBehavior: AIBehaviorConfig;     // Agent name, personas, voice presets
  customInstructions: CustomInstructionsConfig; // Global & channel-specific
  aiPitchDeck: AIPitchDeckConfig;   // Presentation slides
  aiMessages: AIMessagesConfig;     // Templates & scripts
  pipeline: PipelineConfig;         // Stage definitions & automation
  aiSequences: AISequencesConfig;   // Message sequences
  aiSellingPersonas: AISellingPersonasConfig; // Persona library
  businessOpportunity: BusinessOpportunityConfig; // Earning model
  compensation: CompensationConfig; // Commission structure
  recruitingFlow: RecruitingFlowConfig; // Materials & automated messages
  createdAt: string;
  updatedAt: string;
}
```

## System Instruction Priority Stack

The system instruction builder follows this priority order:

1. **Custom Instructions** (Highest Priority)
   - User-defined global instructions
   - Channel-specific overrides
   - Priority score 1-10

2. **Company & Brand Context**
   - Company name, industry, mission
   - Target audience
   - About description

3. **Products & Services**
   - Full product catalog
   - Pricing and benefits
   - Special offers

4. **Tone & Voice Profile**
   - Brand voice (warm, corporate, energetic, spiritual, professional)
   - Language mix (English, Filipino, Taglish, Cebuano, Spanish)
   - Emoji usage, formality, sentence length, pacing

5. **Communication Rules**
   - Response length guidelines
   - Question frequency
   - Personalization requirements

6. **Business Opportunity** (if applicable)
   - Earning model (MLM, affiliate, reseller, direct sales)
   - Commission structure
   - Getting started steps

7. **Compensation Plan** (if applicable)
   - Plan type (unilevel, binary, matrix)
   - Level percentages
   - Bonus opportunities

8. **Funnel & Pipeline Rules**
   - Stage definitions
   - Automation rules
   - Current stage context

9. **Channel-Specific Rules**
   - Facebook/WhatsApp: Short, conversational, emoji-friendly
   - Email: Longer, detailed, formal structure
   - SMS: Very short, direct, no emojis
   - Web: Balanced professionalism and friendliness

10. **Safety & Compliance** (Always Applied)
    - Never promise guaranteed income
    - Honest and transparent
    - Privacy and data protection
    - Professional boundaries

## Usage Examples

### Load Workspace Config

```typescript
import { loadWorkspaceConfig } from './services/workspaceConfig.service';

const config = await loadWorkspaceConfig(userId);
console.log(config.company.name);
console.log(config.toneProfile.brandVoice);
```

### Save Workspace Config

```typescript
import { saveWorkspaceConfig } from './services/workspaceConfig.service';

const config = await loadWorkspaceConfig(userId);
config.company.name = 'New Company Name';
config.toneProfile.brandVoice = 'energetic';

await saveWorkspaceConfig(config);
```

### Update Specific Section

```typescript
import { updateWorkspaceConfigSection } from './services/workspaceConfig.service';

await updateWorkspaceConfigSection(
  userId,
  'toneProfile',
  {
    brandVoice: 'warm',
    languageMix: 'taglish',
    emojiUsage: 'moderate',
    formality: 'casual',
    personality: ['friendly', 'helpful', 'energetic'],
    sentenceLength: 'short',
    pacing: 'fast'
  }
);
```

### Build System Instruction

```typescript
import { buildSystemInstruction } from './services/ai/systemInstructionBuilder';

const result = await buildSystemInstruction({
  workspaceId: userId,
  channelType: 'facebook',
  prospectName: 'Juan dela Cruz',
  currentFunnelStage: 'interest',
  memberRank: 'Silver',
  leadTemperature: 'warm'
});

console.log(result.systemInstruction);
```

### Build Chatbot Instruction

```typescript
import { buildChatbotSystemInstruction } from './services/ai/systemInstructionBuilder';

const instruction = await buildChatbotSystemInstruction(
  userId,
  'web' // or 'facebook', 'whatsapp'
);

// Use with OpenAI or other LLM
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: instruction },
    { role: 'user', content: userMessage }
  ]
});
```

### Use in Messaging Engine

```typescript
import { messagingEngineV4 } from './engines/messaging/messagingEngineV4';

const result = await messagingEngineV4({
  userId: '123',
  message: 'Tell me about your products',
  context: {
    workspaceId: userId, // Critical for multi-tenant support
    prospectName: 'Maria Santos',
    prospectData: { industry: 'retail' },
    funnelStage: 'awareness'
  },
  config: {
    channel: 'facebook',
    language: 'fil'
  }
});

console.log(result.reply);
console.log(result.meta.workspaceInstructionUsed); // true if workspace config was used
```

## Default Configuration

The system provides smart defaults when no configuration exists:

- **Company**: Generic company profile
- **Tone**: Warm, neutral, medium length, minimal emojis
- **Funnel**: Standard 5-stage recruiting funnel
- **AI Behavior**: Professional advisor with rank-based coaching
- **Messages**: Basic welcome and follow-up templates

Users can progressively enhance their configuration by:
1. Setting up company profile
2. Adding products
3. Customizing tone and voice
4. Defining funnels and sequences
5. Adding custom instructions

## Database Schema

### workspace_configs Table

```sql
CREATE TABLE workspace_configs (
  workspace_id TEXT PRIMARY KEY,
  company JSONB NOT NULL DEFAULT '{}',
  products JSONB NOT NULL DEFAULT '{"products":[]}',
  tone_profile JSONB NOT NULL DEFAULT '{}',
  funnels JSONB NOT NULL DEFAULT '{}',
  ai_behavior JSONB NOT NULL DEFAULT '{}',
  custom_instructions JSONB NOT NULL DEFAULT '{}',
  ai_pitch_deck JSONB NOT NULL DEFAULT '{"slides":[]}',
  ai_messages JSONB NOT NULL DEFAULT '{}',
  pipeline JSONB NOT NULL DEFAULT '{}',
  ai_sequences JSONB NOT NULL DEFAULT '{}',
  ai_selling_personas JSONB NOT NULL DEFAULT '{}',
  business_opportunity JSONB NOT NULL DEFAULT '{}',
  compensation JSONB NOT NULL DEFAULT '{}',
  recruiting_flow JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

```sql
-- Users can only read their own workspace config
CREATE POLICY "Users can read own workspace config"
  ON workspace_configs FOR SELECT
  TO authenticated
  USING (workspace_id = auth.uid());

-- Users can insert their own workspace config
CREATE POLICY "Users can insert own workspace config"
  ON workspace_configs FOR INSERT
  TO authenticated
  WITH CHECK (workspace_id = auth.uid());

-- Users can update their own workspace config
CREATE POLICY "Users can update own workspace config"
  ON workspace_configs FOR UPDATE
  TO authenticated
  USING (workspace_id = auth.uid())
  WITH CHECK (workspace_id = auth.uid());
```

## API Integration

### Edge Functions

The workspace config can be used in Supabase Edge Functions:

```typescript
import { createClient } from '@supabase/supabase-js';
import { loadWorkspaceConfig } from '../services/workspaceConfig.service';

Deno.serve(async (req) => {
  const { workspaceId, message } = await req.json();

  const config = await loadWorkspaceConfig(workspaceId);

  const systemInstruction = await buildSystemInstruction({
    workspaceId,
    channelType: 'web'
  });

  // Call OpenAI or other LLM
  const response = await callLLM(systemInstruction, message);

  return new Response(JSON.stringify({ response }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Benefits

### For Developers

1. **Single Source of Truth**: All AI configuration in one place
2. **Type Safety**: Full TypeScript support with interfaces
3. **Flexibility**: JSONB columns for schema evolution
4. **Performance**: Optimized with RLS and indexes
5. **Modularity**: Update sections independently

### For Users

1. **Brand Isolation**: Each workspace completely separate
2. **Customization**: Control every aspect of AI behavior
3. **Consistency**: Same AI personality across all channels
4. **Progressive Enhancement**: Start simple, add complexity over time
5. **Template System**: Clone from successful configurations

### For AI Quality

1. **Context-Aware**: AI knows company, products, tone
2. **Personalized**: Adapts to brand voice and audience
3. **Consistent**: Same instructions across web, Facebook, WhatsApp, etc.
4. **Priority-Based**: Custom instructions override defaults
5. **Safety-First**: Compliance rules always enforced

## Migration Path

### From Legacy System

1. Existing users automatically get default config
2. Company profile syncs to workspace config
3. Products sync to workspace config
4. Custom AI settings merge into workspace config
5. Legacy systems continue working during migration

### New Users

1. Guided onboarding creates initial workspace config
2. Smart defaults based on industry
3. Progressive disclosure of advanced features
4. Templates from successful companies in same industry

## Testing

### Unit Tests

```typescript
describe('Workspace Config Service', () => {
  it('should load workspace config', async () => {
    const config = await loadWorkspaceConfig('test-user-id');
    expect(config.workspaceId).toBe('test-user-id');
  });

  it('should save workspace config', async () => {
    const config = getDefaultWorkspaceConfig('test-user-id', 'Test Company');
    config.company.name = 'Updated Company';

    const result = await saveWorkspaceConfig(config);
    expect(result.success).toBe(true);
  });

  it('should update specific section', async () => {
    const result = await updateWorkspaceConfigSection(
      'test-user-id',
      'toneProfile',
      { brandVoice: 'energetic' }
    );
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('System Instruction Builder', () => {
  it('should build complete system instruction', async () => {
    const result = await buildSystemInstruction({
      workspaceId: 'test-user-id',
      channelType: 'web'
    });

    expect(result.systemInstruction).toContain('IDENTITY & ROLE');
    expect(result.systemInstruction).toContain('COMPANY & BRAND CONTEXT');
    expect(result.systemInstruction).toContain('SAFETY & COMPLIANCE');
  });

  it('should include channel-specific rules', async () => {
    const result = await buildSystemInstruction({
      workspaceId: 'test-user-id',
      channelType: 'sms'
    });

    expect(result.systemInstruction).toContain('VERY SHORT (under 160 characters ideal)');
  });
});
```

## Future Enhancements

1. **Template Marketplace**: Share successful configs
2. **Version Control**: Track config changes over time
3. **A/B Testing**: Test different configurations
4. **Analytics**: Track performance by config section
5. **AI Recommendations**: Suggest config improvements
6. **Multi-Language**: Full i18n support
7. **Industry Presets**: Pre-configured for common industries
8. **Collaboration**: Team-based config management

## Status

✅ **COMPLETE** - Multi-Tenant AI System is fully implemented and integrated.

### What's Working

- Workspace config types and interfaces
- Database schema with RLS policies
- Service layer with CRUD operations
- System instruction builder with priority stack
- Integration with messaging engine V4
- Integration with public chatbot engine
- Channel-specific instruction generation
- Fallback to defaults when config missing

### Next Steps

1. Admin UI for managing workspace configs
2. Visual config builder for non-technical users
3. Import/export configuration
4. Config validation and testing tools
5. Performance monitoring and optimization

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
**Status**: Production Ready
